import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/index';
import { forms, formVersions, submissions, submissionTokens, users } from '../db/schema';

/**
 * Retrieves a submission with associated form, version, and creator data
 * Used for displaying submission details with full context including version info
 */
export const getSubmissionById = async (db: Database, submissionId: number) => {
  return await db
    .select({
      submission: submissions,
      form: forms,
      creator: users,
      version: {
        id: formVersions.id,
        versionSha: formVersions.versionSha,
        description: formVersions.description,
        schema: formVersions.schema,
      },
    })
    .from(submissions)
    .leftJoin(forms, eq(submissions.formId, forms.id))
    .leftJoin(users, eq(submissions.createdBy, users.id))
    .leftJoin(formVersions, eq(submissions.versionSha, formVersions.versionSha))
    .where(eq(submissions.id, submissionId))
    .limit(1);
};

/**
 * Validates an access token for anonymous submission viewing
 * Returns token record if valid, empty array if invalid
 */
export const getSubmissionToken = async (db: Database, submissionId: number, token: string) => {
  return await db
    .select()
    .from(submissionTokens)
    .where(and(eq(submissionTokens.submissionId, submissionId), eq(submissionTokens.token, token)))
    .limit(1);
};

/**
 * Retrieves all submissions for a form
 * Includes submitter information for analysis and management
 */
export const getFormSubmissionsByOwner = async (db: Database, formId: number) => {
  return await db
    .select({
      id: submissions.id,
      data: submissions.data,
      status: submissions.status,
      createdAt: submissions.createdAt,
      creator: users,
    })
    .from(submissions)
    .leftJoin(users, eq(submissions.createdBy, users.id))
    .where(eq(submissions.formId, formId));
};

/**
 * Retrieves basic form data for submission validation
 * Used to check form existence and public access settings
 */
export const getFormByIdForSubmission = async (db: Database, formId: number) => {
  return await db.select().from(forms).where(eq(forms.id, formId)).limit(1);
};

/**
 * Creates a new form submission with version tracking
 * Links to user if authenticated, requires version SHA for audit trail
 */
export const createSubmission = async (
  db: Database,
  submissionData: {
    formId: number;
    versionSha: string;
    data: unknown;
    createdBy?: string | null;
    updatedBy?: string | null;
  },
) => {
  return await db.insert(submissions).values(submissionData).returning();
};

/**
 * Creates an access token for anonymous submissions
 * Allows anonymous users to view their submissions later
 */
export const createSubmissionToken = async (
  db: Database,
  tokenData: {
    submissionId: number;
    token: string;
  },
) => {
  return await db.insert(submissionTokens).values(tokenData);
};

/**
 * Retrieves all submissions made by a specific user
 * Includes form information and submission data for user's own submissions
 */
export const getSubmissionsByUser = async (db: Database, userId: string) => {
  return await db
    .select({
      id: submissions.id,
      formId: submissions.formId,
      formName: forms.name,
      formDescription: forms.description,
      data: submissions.data,
      status: submissions.status,
      createdAt: submissions.createdAt,
      versionSha: submissions.versionSha,
      formOwner: {
        id: forms.createdBy,
        name: users.name,
        email: users.email,
      },
    })
    .from(submissions)
    .innerJoin(forms, eq(submissions.formId, forms.id))
    .leftJoin(users, eq(forms.createdBy, users.id))
    .where(eq(submissions.createdBy, userId))
    .orderBy(desc(submissions.createdAt));
};

/**
 * Updates the status of a submission
 * Used by form owners to manage the submission workflow
 */
export const updateSubmissionStatus = async (
  db: Database,
  submissionId: number,
  status: 'SUBMITTED' | 'REVIEWING' | 'PENDING_UPDATES' | 'COMPLETED',
  updatedBy: string,
) => {
  return await db
    .update(submissions)
    .set({
      status,
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, submissionId))
    .returning();
};
