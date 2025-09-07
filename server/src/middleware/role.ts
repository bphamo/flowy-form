import { Context, Next } from 'hono';
import { db } from '../db';
import * as formsService from '../services/forms';

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
