/* eslint-disable @typescript-eslint/no-explicit-any */
// AI service for form development assistance using Vercel AI SDK and OpenAI with tool calling
import type { FormType } from '@formio/react';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { env, isAiEnabled } from '../lib/env';
import { calculateSchemaComplexity } from '../lib/formio-validation';
import {
  aiAssistRequestSchema,
  aiAssistResponseSchema,
  formioSchemaResponseSchema,
} from '../lib/ai/schemas';
import {
  FORMIO_EXPERT_SYSTEM_PROMPT,
  createUserPrompt,
  formatMarkdownResponse,
} from '../lib/ai/templates';
import {
  isSchemaTooBigForAI,
  validateAISolution,
} from '../lib/ai/utils';

export type AiAssistRequest = {
  message: string;
  currentSchema: FormType;
};

export type AiAssistResponse = {
  markdown: string;
  schema: FormType;
};

// Export schemas for use in routes
export { aiAssistRequestSchema, aiAssistResponseSchema };

// OpenAI client configuration
const getOpenAIClient = () => {
  if (!isAiEnabled()) {
    throw new Error('OpenAI API key not configured');
  }
  
  return createOpenAI({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: env.OPENAI_BASE_URL,
  });
};

// Generate AI assistance response using OpenAI with tool calling
export const generateAIAssistance = async (request: AiAssistRequest): Promise<AiAssistResponse> => {
  // Check if current schema is too complex
  if (isSchemaTooBigForAI(request.currentSchema)) {
    throw new Error(
      `Form is too complex for AI assistance. AI assistance is limited to forms with up to 50 components.`,
    );
  }

  // Ensure AI is enabled
  if (!isAiEnabled()) {
    throw new Error('AI assistance is not configured. Please set OPENAI_API_KEY environment variable.');
  }

  try {
    const client = getOpenAIClient();
    
    // Prepare context about the current form
    const currentComplexity = calculateSchemaComplexity(request.currentSchema);
    const currentComponents = request.currentSchema.components || [];
    
    // Generate the AI response using Vercel AI SDK
    const { object } = await generateObject({
      model: client.languageModel('gpt-4o-mini'), // Use a more capable model for form generation
      temperature: 0.3, // Lower temperature for more consistent results
      schema: formioSchemaResponseSchema as any, // Cast to any to resolve version mismatch
      system: FORMIO_EXPERT_SYSTEM_PROMPT(currentComplexity),
      prompt: createUserPrompt(request.message, currentComponents),
    });

    // Construct the updated schema
    const updatedSchema: FormType = {
      ...request.currentSchema,
      components: object.components,
    };

    // Final validation using our internal validation
    const validation = validateAISolution(request.currentSchema, updatedSchema);
    if (!validation.valid && validation.issues) {
      // If final validation fails, throw error with details
      console.warn('AI generated solution failed final validation:', validation.issues);
      throw new Error(`AI solution validation failed: ${validation.issues.join(', ')}`);
    }

    // Format the markdown response
    const markdown = formatMarkdownResponse(
      object.explanation,
      calculateSchemaComplexity(updatedSchema),
      object.warnings
    );

    return {
      markdown,
      schema: updatedSchema,
    };

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Re-throw the error for proper handling at the API level
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('AI service encountered an unexpected error');
  }
};

// Check if a schema is too complex for AI assistance - re-export from lib
export { isSchemaTooBigForAI, validateAISolution } from '../lib/ai/utils';
