import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/index';
import { forms, formVersions, submissions, users } from '../db/schema';
import { createVersion } from './versions';

/**
 * Retrieves all forms created by a specific user
 * Returns basic form metadata without schema for performance
 */
export const getUserForms = async (db: Database, userId: string) => {
  return await db
    .select({
      id: forms.id,
      name: forms.name,
      description: forms.description,
      isPublic: forms.isPublic,
      createdAt: forms.createdAt,
      updatedAt: forms.updatedAt,
    })
    .from(forms)
    .where(eq(forms.createdBy, userId));
};

/**
 * Retrieves a form with creator information by ID
 * Used for form display and access control validation
 */
export const getFormById = async (db: Database, formId: number) => {
  return await db.select().from(forms).leftJoin(users, eq(forms.createdBy, users.id)).where(eq(forms.id, formId)).limit(1);
};

/**
 * Retrieves form data needed for public submission with live version schema
 * Returns form info with current published version schema and SHA
 */
export const getFormForSubmission = async (db: Database, formId: number) => {
  return await db
    .select({
      id: forms.id,
      name: forms.name,
      isPublic: forms.isPublic,
      liveVersionId: forms.liveVersionId,
      liveVersion: {
        id: formVersions.id,
        versionSha: formVersions.versionSha,
        schema: formVersions.schema,
      },
    })
    .from(forms)
    .leftJoin(formVersions, eq(forms.liveVersionId, formVersions.id))
    .where(eq(forms.id, formId))
    .limit(1);
};

/**
 * Creates a new form with the authenticated user as owner and initial version
 * Sets both createdBy and updatedBy to current user ID, creates first version
 */
export const createForm = async (
  db: Database,
  formData: {
    name: string;
    description?: string;
    isPublic?: boolean;
    schema?: unknown;
  },
  userId: string,
) => {
  return await db.transaction(async (tx) => {
    // Create the form without schema (stored in versions)
    const newForm = await tx
      .insert(forms)
      .values({
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (newForm.length === 0) {
      throw new Error('Failed to create form');
    }

    // Create initial version if schema is provided
    if (formData.schema) {
      const initialVersion = await createVersion(
        tx,
        {
          formId: newForm[0].id,
          description: 'Initial version',
          schema: formData.schema,
          isPublished: true,
        },
        userId,
      );

      // Update form with live version reference
      await tx
        .update(forms)
        .set({
          liveVersionId: initialVersion[0].id,
          updatedAt: new Date(),
        })
        .where(eq(forms.id, newForm[0].id));

      return newForm;
    }

    return newForm;
  });
};

/**
 * Retrieves a form only if the user is the owner
 * Used for ownership verification before updates or deletions
 */
export const getFormByIdAndOwner = async (db: Database, formId: number, userId: string) => {
  return await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), eq(forms.createdBy, userId)))
    .limit(1);
};

/**
 * Updates form metadata (name, description, visibility)
 * Updates the updatedBy field and timestamp automatically
 */
export const updateForm = async (
  db: Database,
  formId: number,
  userId: string,
  updateData: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    schema?: unknown;
  },
) => {
  return await db
    .update(forms)
    .set({
      ...updateData,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(forms.id, formId))
    .returning();
};

/**
 * Creates a new version with updated schema
 * Schema updates now create new versions instead of modifying forms directly
 */
export const updateFormSchema = async (db: Database, formId: number, userId: string, schema: unknown, description?: string, publish = false) => {
  return await createVersion(
    db,
    {
      formId,
      description: description || 'Schema update',
      schema,
      isPublished: publish,
    },
    userId,
  );
};

/**
 * Permanently deletes a form
 * Cascading deletes will remove associated submissions and tokens
 */
export const deleteForm = async (db: Database, formId: number) => {
  return await db.delete(forms).where(eq(forms.id, formId));
};

/**
 * Retrieves all submissions for a specific form
 * Includes submitter information when available (for authenticated submissions)
 */
export const getFormSubmissions = async (db: Database, formId: number) => {
  return await db
    .select({
      id: submissions.id,
      data: submissions.data,
      createdAt: submissions.createdAt,
      creator: users,
    })
    .from(submissions)
    .leftJoin(users, eq(submissions.createdBy, users.id))
    .where(eq(submissions.formId, formId));
};
