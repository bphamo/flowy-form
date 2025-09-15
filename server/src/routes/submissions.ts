import { randomBytes } from 'crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { formWriteCheckMiddleware, submissionStatusUpdateCheckMiddleware } from '../middleware/role';
import * as submissionsService from '../services/submissions';

const submissionRoutes = new Hono();

// Validation schema for new submissions
const createSubmissionSchema = z.object({
  formId: z.number(),
  versionSha: z.string(),
  data: z.any(),
});

// Validation schema for status updates
const updateStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'REVIEWING', 'PENDING_UPDATES', 'COMPLETED']),
});

/**
 * GET /api/submissions/:id
 *
 * Retrieves detailed submission data with access control
 * Allows access to form owners, submission creators, or via anonymous token
 *
 * Access: Form owner, submission creator, or anonymous with token
 * Auth Required: Optional (depends on access method)
 *
 * Query: ?token=<string> (for anonymous access)
 * Response: SubmissionDetail with form schema and submission data
 */
submissionRoutes.get('/:id', optionalAuthMiddleware, async (c) => {
  try {
    const submissionId = parseInt(c.req.param('id'));
    const token = c.req.query('token');
    const isEmbedded = c.req.query('embed') === 'true';
    const user = c.get('user');

    if (isNaN(submissionId)) {
      return c.json({ error: 'Invalid submission ID' }, 400);
    }

    const submission = await submissionsService.getSubmissionById(db, submissionId);

    if (submission.length === 0) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    const data = submission[0];

    // Embedded access is only allowed for public forms
    if (isEmbedded && !data.form?.isPublic) {
      return c.json({ error: 'Embedding is only available for public forms' }, 403);
    }

    // Check access permissions
    let hasAccess = false;

    // Form owner can always access
    if (user && data.form?.createdBy === user.id) {
      hasAccess = true;
    }
    // Submission creator can access their own submission
    else if (user && data.submission.createdBy === user.id) {
      hasAccess = true;
    }
    // Anonymous submissions can be accessed with token
    else if (!data.submission.createdBy && token) {
      const submissionToken = await submissionsService.getSubmissionToken(db, submissionId, token);

      if (submissionToken.length > 0) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    return c.json({
      data: {
        id: data.submission.id,
        formId: data.submission.formId,
        formName: data.form?.name,
        data: data.submission.data,
        status: data.submission.status,
        schema: data.version?.schema || data.form?.schema,
        versionSha: data.submission.versionSha,
        version: data.version
          ? {
              sha: data.version.versionSha,
              description: data.version.description,
            }
          : null,
        createdAt: data.submission.createdAt,
        isFormOwner: user?.id === data.form?.createdBy,
        submitterInformation: data.creator
          ? {
              name: data.creator.name,
              email: data.creator.email,
            }
          : null,
        token: !data.submission.createdBy ? token : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return c.json({ error: 'Failed to fetch submission' }, 500);
  }
});

/**
 * Retrieves all submissions for a specific form (owner access only)
 * Returns submission data with creator information for analysis
 */
submissionRoutes.get('/form/:formId', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const formSubmissions = await submissionsService.getFormSubmissionsByOwner(db, formId);

    const submissionsData = formSubmissions.map((sub) => ({
      id: sub.id,
      data: sub.data,
      status: sub.status,
      createdAt: sub.createdAt,
      submitterInformation: sub.creator
        ? {
            name: sub.creator.name,
            email: sub.creator.email,
          }
        : null,
      isAnonymous: !sub.creator,
    }));

    return c.json({ data: submissionsData });
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    return c.json({ error: 'Failed to fetch submissions' }, 500);
  }
});

/**
 * GET /api/submissions
 *
 * Retrieves all submissions made by the authenticated user
 * Shows submissions TO any forms, not submissions FROM forms owned by the user
 *
 * Access: Authenticated user (their own submissions only)
 * Auth Required: Yes
 *
 * Response: Array of submissions with form information
 */
submissionRoutes.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const userSubmissions = await submissionsService.getSubmissionsByUser(db, user.id);

    const submissionsData = userSubmissions.map((sub) => ({
      id: sub.id,
      formId: sub.formId,
      formName: sub.formName,
      formDescription: sub.formDescription,
      data: sub.data,
      status: sub.status,
      createdAt: sub.createdAt,
      versionSha: sub.versionSha,
      formOwner: sub.formOwner,
    }));

    return c.json({ data: submissionsData });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return c.json({ error: 'Failed to fetch submissions' }, 500);
  }
});

/**
 * POST /api/submissions/form/:formId
 *
 * Creates a new submission for a form (public endpoint)
 * Supports both authenticated and anonymous submissions with token generation
 *
 * Access: Anyone for public forms, authenticated users for private forms
 * Auth Required: Optional (required for private forms)
 *
 * Body: { formId, versionSha, data }
 * Response: { id, token?, formId, submittedAt }
 */
submissionRoutes.post('/form/:formId', optionalAuthMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const user = c.get('user');
    const body = await c.req.json();

    const validatedData = createSubmissionSchema.parse(body);

    // Check if form exists and user can submit
    const form = await submissionsService.getFormByIdForSubmission(db, formId);

    if (form.length === 0) {
      return c.json({ error: 'Form not found' }, 404);
    }

    const formData = form[0];

    // Check access permissions
    if (!formData.isPublic && !user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Create submission
    const newSubmission = await submissionsService.createSubmission(db, {
      formId: formId,
      versionSha: validatedData.versionSha,
      data: validatedData.data,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
    });

    const submission = newSubmission[0];

    // Generate token for anonymous submissions
    let token = null;
    if (!user) {
      const tokenValue = randomBytes(32).toString('hex');
      await submissionsService.createSubmissionToken(db, {
        submissionId: submission.id,
        token: tokenValue,
      });
      token = tokenValue;
    }

    return c.json(
      {
        data: {
          id: submission.id,
          token,
          formId: submission.formId,
          submittedAt: submission.createdAt,
        },
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', errors: error.issues }, 400);
    }
    console.error('Error creating submission:', error);
    return c.json({ error: 'Failed to create submission' }, 500);
  }
});

/**
 * PUT /api/submissions/:id/status
 *
 * Updates the status of a submission (form owner only)
 * Allows form owners to manage submission workflow states
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Body: { status: 'SUBMITTED' | 'REVIEWING' | 'PENDING_UPDATES' | 'COMPLETED' }
 * Response: { id, status, updatedAt }
 */
submissionRoutes.put('/:id/status', authMiddleware, submissionStatusUpdateCheckMiddleware, async (c) => {
  try {
    const submissionId = parseInt(c.req.param('id'));
    const user = c.get('user');
    const body = await c.req.json();

    const validatedData = updateStatusSchema.parse(body);

    // Update submission status
    const updatedSubmission = await submissionsService.updateSubmissionStatus(
      db,
      submissionId,
      validatedData.status,
      user.id,
    );

    if (updatedSubmission.length === 0) {
      return c.json({ error: 'Failed to update submission status' }, 500);
    }

    return c.json({
      data: {
        id: updatedSubmission[0].id,
        status: updatedSubmission[0].status,
        updatedAt: updatedSubmission[0].updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', errors: error.issues }, 400);
    }
    console.error('Error updating submission status:', error);
    return c.json({ error: 'Failed to update submission status' }, 500);
  }
});

export default submissionRoutes;
