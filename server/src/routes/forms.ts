import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { formWriteCheckMiddleware } from '../middleware/role';
import * as formsService from '../services/forms';

const formRoutes = new Hono();

// Validation schemas for form operations
const createFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  schema: z.any().optional(),
});

const updateFormSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  schema: z.any().optional(),
});

/**
 * GET /api/forms
 *
 * Retrieves all forms created by the authenticated user
 * Returns form metadata without schemas for performance
 *
 * Access: Authenticated users only
 * Auth Required: Yes
 *
 * Response: Array of FormSummary objects with basic form info
 */
formRoutes.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    const userForms = await formsService.getUserForms(db, user.id);

    return c.json({ data: userForms });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return c.json({ error: 'Failed to fetch forms' }, 500);
  }
});

/**
 * GET /api/forms/:id
 *
 * Retrieves a single form by ID with creator information
 * Public forms accessible to all, private forms only to owners
 *
 * Access: Public forms - Anyone, Private forms - Owner only
 * Auth Required: Optional (required for private forms)
 *
 * Response: FormWithCreator object including form data and owner info
 */
formRoutes.get('/:id', optionalAuthMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const form = await formsService.getFormById(db, formId);

    if (form.length === 0) {
      return c.json({ error: 'Form not found' }, 404);
    }

    const formData = form[0];

    // Check if user can access this form
    if (!formData.forms.isPublic && (!user || user.id !== formData.forms.createdBy)) {
      return c.json({ error: 'Access denied' }, 403);
    }

    return c.json({
      data: {
        ...formData.forms,
        creator: formData.users
          ? {
              id: formData.users.id,
              name: formData.users.name,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    return c.json({ error: 'Failed to fetch form' }, 500);
  }
});

/**
 * Retrieves form schema for public submission interface
 * Checks form visibility and authentication requirements
 */
formRoutes.get('/:id/submit', optionalAuthMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('id'));
    const user = c.get('user');
    const isEmbedded = c.req.query('embed') === 'true';

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const form = await formsService.getFormForSubmission(db, formId);

    if (form.length === 0) {
      return c.json({ error: 'Form not found' }, 404);
    }

    const formData = form[0];

    // Check access permissions
    if (!formData.isPublic && !user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Embedded forms are only allowed for public forms
    if (isEmbedded && !formData.isPublic) {
      return c.json({ error: 'Embedding is only available for public forms' }, 403);
    }

    return c.json({
      data: {
        id: formData.id,
        name: formData.name,
        schema: formData.liveVersion?.schema || null,
        versionSha: formData.liveVersion?.versionSha || null,
      },
    });
  } catch (error) {
    console.error('Error fetching form schema:', error);
    return c.json({ error: 'Failed to fetch form schema' }, 500);
  }
});

/**
 * POST /api/forms
 *
 * Creates a new form with the authenticated user as owner
 * Validates form data and sets initial ownership
 *
 * Access: Authenticated users only
 * Auth Required: Yes
 *
 * Body: { name, description?, isPublic?, schema? }
 * Response: Created form object
 */
formRoutes.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    const body = await c.req.json();

    const validatedData = createFormSchema.parse(body);

    const newForm = await formsService.createForm(db, validatedData, user.id);

    return c.json({ data: newForm[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', errors: error.issues }, 400);
    }
    console.error('Error creating form:', error);
    return c.json({ error: 'Failed to create form' }, 500);
  }
});

/**
 * PATCH /api/forms/:id
 *
 * Updates form metadata (name, description, visibility)
 * Verifies ownership before allowing updates
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Body: { name?, description?, isPublic? }
 * Response: Updated form object
 */
formRoutes.patch('/:id', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('id'));
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    const body = await c.req.json();

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const validatedData = updateFormSchema.parse(body);

    const updatedForm = await formsService.updateForm(db, formId, user.id, validatedData);

    return c.json({ data: updatedForm[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', errors: error.issues }, 400);
    }
    console.error('Error updating form:', error);
    return c.json({ error: 'Failed to update form' }, 500);
  }
});

/**
 * Permanently deletes a form and all associated data
 * Verifies ownership and handles cascading deletions
 */
formRoutes.delete('/:id', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('id'));

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    await formsService.deleteForm(db, formId);

    return c.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    return c.json({ error: 'Failed to delete form' }, 500);
  }
});

/**
 * Retrieves all submissions for a form (owner access only)
 * Returns submission data with submitter information when available
 */
formRoutes.get('/:id/submissions', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('id'));

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    // Get submissions for this form
    const formSubmissions = await formsService.getFormSubmissions(db, formId);

    const submissionsData = formSubmissions.map((sub) => ({
      id: sub.id,
      data: sub.data,
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
    return c.json({ error: 'Failed to fetch form submissions' }, 500);
  }
});

export default formRoutes;
