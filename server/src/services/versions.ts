import { createId } from '@paralleldrive/cuid2';
import { and, desc, eq, gt, inArray, not } from 'drizzle-orm';
import type { Database } from '../db/index';
import { formVersions, forms, submissions, users } from '../db/schema';

// Type for transaction or regular database
type DatabaseOrTransaction = Database | Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Retrieves all versions for a specific form ordered by creation date
 * Returns version metadata with author information for display
 */
export const getFormVersions = async (db: Database, formId: number) => {
  return await db
    .select({
      id: formVersions.id,
      versionSha: formVersions.versionSha,
      description: formVersions.description,
      isPublished: formVersions.isPublished,
      publishedAt: formVersions.publishedAt,
      metadata: formVersions.metadata,
      createdAt: formVersions.createdAt,
      updatedAt: formVersions.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(formVersions)
    .leftJoin(users, eq(formVersions.createdBy, users.id))
    .where(eq(formVersions.formId, formId))
    .orderBy(desc(formVersions.createdAt));
};

/**
 * Retrieves a specific version by SHA with full schema
 * Used for version comparison and revert operations
 */
export const getVersionBySha = async (db: Database, formId: number, versionSha: string) => {
  return await db
    .select()
    .from(formVersions)
    .where(and(eq(formVersions.formId, formId), eq(formVersions.versionSha, versionSha)))
    .limit(1);
};

/**
 * Retrieves the currently published version for a form
 * Returns null if no version is published
 */
export const getPublishedVersion = async (db: Database, formId: number) => {
  return await db
    .select()
    .from(formVersions)
    .where(and(eq(formVersions.formId, formId), eq(formVersions.isPublished, true)))
    .limit(1);
};

/**
 * Creates a new form version with generated SHA
 * Automatically sets creation metadata and returns the new version
 */
export const createVersion = async (
  db: DatabaseOrTransaction,
  versionData: {
    formId: number;
    description?: string;
    schema: unknown;
    isPublished?: boolean;
    baseVersionSha?: string;
    auditDescription?: string;
  },
  userId: string,
) => {
  const versionSha = createId();

  // Prepare metadata with version tracking and audit info
  const metadata = {
    baseVersionSha: versionData.baseVersionSha || null,
    auditDescription: versionData.auditDescription || null,
    createdAt: new Date().toISOString(),
    operation: versionData.baseVersionSha ? 'derived' : 'initial',
  };

  return await db
    .insert(formVersions)
    .values({
      ...versionData,
      versionSha,
      metadata,
      createdBy: userId,
      publishedAt: versionData.isPublished ? new Date() : null,
    })
    .returning();
};

/**
 * Updates description or schema
 */
export const updateVersion = async (
  db: Database,
  formId: number,
  versionSha: string,
  updateData: {
    description?: string;
    schema?: unknown;
  },
) => {
  return await db
    .update(formVersions)
    .set({
      description: updateData.description,
      schema: updateData.schema,
      updatedAt: new Date(),
    })
    .where(and(eq(formVersions.formId, formId), eq(formVersions.versionSha, versionSha), eq(formVersions.isPublished, false)))
    .returning();
};

/**
 * Publishes a version and unpublishes others
 * Ensures only one published version per form at a time
 */
export const publishVersion = async (db: DatabaseOrTransaction, formId: number, versionSha: string) => {
  // Unpublish all other versions
  await db
    .update(formVersions)
    .set({
      isPublished: false,
      updatedAt: new Date(),
    })
    .where(and(eq(formVersions.formId, formId), eq(formVersions.isPublished, true)));

  // Publish the target version
  const publishedVersion = await db
    .update(formVersions)
    .set({
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(formVersions.formId, formId), eq(formVersions.versionSha, versionSha)))
    .returning();

  // Update form's live version reference
  if (publishedVersion.length > 0) {
    await db
      .update(forms)
      .set({
        liveVersionId: publishedVersion[0].id,
        updatedAt: new Date(),
      })
      .where(eq(forms.id, formId));
  }

  return publishedVersion;
};

/**
 * Deletes a version (only if not published)
 * Published versions cannot be deleted for data integrity
 */
export const deleteVersion = async (db: Database, formId: number, versionSha: string) => {
  return await db
    .delete(formVersions)
    .where(and(eq(formVersions.formId, formId), eq(formVersions.versionSha, versionSha), eq(formVersions.isPublished, false)))
    .returning();
};

/**
 * Force reset to a specific version
 * Deletes all versions created after the target version and reassigns
 * submissions from deleted versions to the target version to preserve data integrity
 */
export const forceResetToVersion = async (db: Database, formId: number, targetSha: string) => {
  return await db.transaction(async (tx) => {
    // Get the target version
    const targetVersion = await tx
      .select()
      .from(formVersions)
      .where(and(eq(formVersions.formId, formId), eq(formVersions.versionSha, targetSha)))
      .limit(1);

    if (targetVersion.length === 0) {
      throw new Error('Target version not found');
    }

    const target = targetVersion[0];

    if (!target.createdAt) {
      throw new Error('Target version has no creation date');
    }

    // Get all versions that will be deleted (created after target, excluding target)
    const versionsToDelete = await tx
      .select({ versionSha: formVersions.versionSha })
      .from(formVersions)
      .where(and(eq(formVersions.formId, formId), gt(formVersions.createdAt, target.createdAt), not(eq(formVersions.versionSha, targetSha))));

    // Reassign submissions from deleted versions to the target version
    // This preserves submission data while maintaining referential integrity
    if (versionsToDelete.length > 0) {
      const deletedVersionShas = versionsToDelete.map((v) => v.versionSha);

      await tx
        .update(submissions)
        .set({ versionSha: targetSha })
        .where(and(eq(submissions.formId, formId), inArray(submissions.versionSha, deletedVersionShas)));
    }

    // Now safe to delete the versions since no submissions reference them
    await tx.delete(formVersions).where(
      and(
        eq(formVersions.formId, formId),
        gt(formVersions.createdAt, target.createdAt),
        not(eq(formVersions.versionSha, targetSha)), // Explicitly exclude target version
      ),
    );

    // Update metadata for the target version before publishing
    const existingMetadata = (target.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...existingMetadata,
      auditDescription: `Force reset operation: Made this version live and deleted all newer versions`,
      lastOperation: 'force_reset',
      lastOperationAt: new Date().toISOString(),
    };

    await tx
      .update(formVersions)
      .set({ metadata: updatedMetadata })
      .where(and(eq(formVersions.formId, formId), eq(formVersions.versionSha, targetSha)));

    // Publish the target version
    return await publishVersion(tx, formId, targetSha);
  });
};

/**
 * Make an old version live without deleting history
 * Simply changes which version is published
 */
export const makeVersionLive = async (db: Database, formId: number, targetSha: string) => {
  return await db.transaction(async (tx) => {
    // Get the target version
    const targetVersion = await tx
      .select()
      .from(formVersions)
      .where(and(eq(formVersions.formId, formId), eq(formVersions.versionSha, targetSha)))
      .limit(1);

    if (targetVersion.length === 0) {
      throw new Error('Target version not found');
    }

    const target = targetVersion[0];

    // Unpublish all other versions
    await tx
      .update(formVersions)
      .set({ isPublished: false, publishedAt: null })
      .where(and(eq(formVersions.formId, formId), not(eq(formVersions.versionSha, targetSha))));

    // Update metadata for the target version
    const existingMetadata = (target.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...existingMetadata,
      auditDescription: `Make live operation: Set this version as the live version without affecting history`,
      lastOperation: 'make_live',
      lastOperationAt: new Date().toISOString(),
    };

    // Publish the target version with updated metadata
    await tx
      .update(formVersions)
      .set({
        isPublished: true,
        publishedAt: new Date(),
        metadata: updatedMetadata,
      })
      .where(and(eq(formVersions.formId, formId), eq(formVersions.versionSha, targetSha)));

    // Update the form's live version reference
    await tx.update(forms).set({ liveVersionId: target.id }).where(eq(forms.id, formId));

    return targetVersion;
  });
};

/**
 * Create a new latest version based on an old version
 * Duplicates the old schema as a new version
 */
export const makeVersionLatest = async (db: Database, formId: number, targetSha: string, userId: string, description?: string) => {
  return await db.transaction(async (tx) => {
    // Get the target version schema
    const targetVersion = await tx
      .select()
      .from(formVersions)
      .where(and(eq(formVersions.formId, formId), eq(formVersions.versionSha, targetSha)))
      .limit(1);

    if (targetVersion.length === 0) {
      throw new Error('Target version not found');
    }

    // Create new version with old schema as draft (not published) and metadata tracking
    const newVersion = await createVersion(
      tx,
      {
        formId,
        description: description || `New version based on ${targetSha.slice(0, 8)}`,
        schema: targetVersion[0].schema,
        isPublished: false, // Create as draft for editing
        baseVersionSha: targetSha,
        auditDescription: `Created from version ${targetSha.slice(0, 8)} using "Create Version from Previous" operation`,
      },
      userId,
    );

    return newVersion;
  });
};
