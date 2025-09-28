// AI assistance routes
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { formWriteCheckMiddleware } from '../middleware/role';
import { 
  generateAIAssistance, 
  validateAISolution, 
  aiAssistRequestSchema,
  isSchemaTooBigForAI 
} from '../services/ai';
import { validateFormioSchema, calculateSchemaComplexity, MAX_SCHEMA_COMPLEXITY_FOR_AI } from '../lib/formio-validation';
import { asyncHandler, validateBody, validateNumericParam } from '../utils/error-handler';
import { env, isAiEnabled } from '../lib/env';
import * as versionsService from '../services/versions';
import { db } from '../db/index';

const aiRoutes = new Hono();

/**
 * POST /api/ai/form-assist/:formId/:versionId
 * 
 * Generate AI assistance for form development
 * Requires write access to the form and enforces schema size limits
 * 
 * Access: Form owner only
 * Auth Required: Yes
 * 
 * Body: { message: string, currentSchema: FormioSchema }
 * Response: { data: { markdown: string, schema: FormioSchema, previewId: string } }
 */
aiRoutes.post('/form-assist/:formId/:versionId', 
  authMiddleware, 
  formWriteCheckMiddleware,
  asyncHandler(async (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    const formId = validateNumericParam(c.req.param('formId'), 'form ID');
    const versionId = c.req.param('versionId');

    // Validate request body
    const requestData = await validateBody(c, aiAssistRequestSchema);

    // Check if OpenAI API key is configured
    if (!isAiEnabled()) {
      return c.json({ error: 'AI assistance is not configured. Please contact your administrator.' }, 503);
    }

    // Verify the version exists and user has access
    const version = await versionsService.getVersionBySha(db, formId, versionId);
    if (!version || version.length === 0) {
      return c.json({ error: 'Version not found' }, 404);
    }

    // Check schema complexity before processing
    if (isSchemaTooBigForAI(requestData.currentSchema)) {
      const complexity = calculateSchemaComplexity(requestData.currentSchema);
      return c.json({ 
        error: `Form is too complex for AI assistance. Current form has ${complexity} components, but AI assistance is limited to forms with up to ${MAX_SCHEMA_COMPLEXITY_FOR_AI} components. Please simplify your form or request assistance for specific sections.` 
      }, 400);
    }

    try {
      // Generate AI assistance
      const aiResponse = await generateAIAssistance(requestData);

      // Validate the AI solution
      const validation = validateAISolution(requestData.currentSchema, aiResponse.schema);
      if (!validation.valid) {
        console.warn('AI generated invalid solution:', validation.issues);
        // Still try to return the response, but with warnings
        return c.json({
          data: {
            markdown: aiResponse.markdown + '\n\n⚠️ **Warning**: This solution may have issues:\n' + validation.issues?.map(issue => `- ${issue}`).join('\n'),
            schema: aiResponse.schema,
            warnings: validation.issues
          }
        });
      }

      // Create a temporary preview ID for the session
      const previewId = `ai_preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return c.json({
        data: {
          markdown: aiResponse.markdown,
          schema: aiResponse.schema,
          previewId
        }
      });

    } catch (error) {
      console.error('AI assistance failed:', error);
      return c.json({ 
        error: error instanceof Error ? error.message : 'Failed to generate AI assistance. Please try again or rephrase your request.' 
      }, 500);
    }
  }, 'generate AI form assistance')
);

/**
 * POST /api/ai/validate-schema
 * 
 * Validate a FormIO schema for correctness and complexity
 * Useful for client-side validation before submitting
 * 
 * Access: Authenticated users only
 * Auth Required: Yes
 * 
 * Body: { schema: FormioSchema }
 * Response: { data: { valid: boolean, errors?: string[], complexity: number } }
 */
aiRoutes.post('/validate-schema',
  authMiddleware,
  asyncHandler(async (c) => {
    const body = await c.req.json();
    
    if (!body.schema) {
      return c.json({ error: 'Schema is required' }, 400);
    }

    const validation = validateFormioSchema(body.schema);
    const complexity = validation.data ? calculateSchemaComplexity(validation.data) : 0;
    
    return c.json({
      data: {
        valid: validation.valid,
        errors: validation.errors,
        complexity,
        exceedsAILimit: complexity > MAX_SCHEMA_COMPLEXITY_FOR_AI
      }
    });
  }, 'validate FormIO schema')
);

/**
 * GET /api/ai/limits
 * 
 * Get AI assistance limits and configuration
 * 
 * Access: Authenticated users only
 * Auth Required: Yes
 * 
 * Response: { data: { maxComplexity: number, aiEnabled: boolean } }
 */
aiRoutes.get('/limits',
  authMiddleware,
  asyncHandler(async (c) => {
    return c.json({
      data: {
        maxComplexity: MAX_SCHEMA_COMPLEXITY_FOR_AI,
        aiEnabled: isAiEnabled()
      }
    });
  }, 'get AI limits')
);

export default aiRoutes;