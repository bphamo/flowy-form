import { Context, Next } from 'hono';
import { db } from '../db';
import * as formsService from '../services/forms';
import * as submissionsService from '../services/submissions';

export const formWriteCheckMiddleware = async (c: Context, next: Next) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    if (isNaN(formId)) {
      throw new Error('Invalid form ID');
    }
    // Check if form exists and user owns it
    const existingForm = await formsService.getFormByIdAndOwner(db, formId, user.id);
    if (existingForm.length === 0) {
      throw new Error('Form not found or access denied');
    }

    await next();
  } catch (error) {
    console.error('Form role check error:', error);
    return c.json({ error: (error as Error).message }, 404);
  }
};

export const submissionStatusUpdateCheckMiddleware = async (c: Context, next: Next) => {
  try {
    const submissionId = parseInt(c.req.param('id'));
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    if (isNaN(submissionId)) {
      return c.json({ error: 'Invalid submission ID' }, 400);
    }

    // Get submission and verify ownership
    const submission = await submissionsService.getSubmissionById(db, submissionId);

    if (submission.length === 0) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    const data = submission[0];

    // Only form owner can update status
    if (data.form?.createdBy !== user.id) {
      return c.json({ error: 'Access denied. Only form owners can update submission status.' }, 403);
    }

    // Store submission data for use in the handler
    c.set('submissionData', data);

    await next();
  } catch (error) {
    console.error('Submission status access check error:', error);
    return c.json({ error: 'Failed to verify submission access' }, 500);
  }
};
