/* eslint-disable @typescript-eslint/no-explicit-any */
// AI service for form development assistance using Vercel AI SDK and OpenAI with structured output
import { createOpenAI } from '@ai-sdk/openai';
import type { FormType } from '@formio/react';
import { generateObject } from 'ai';
import { aiAssistRequestSchema, aiAssistResponseSchema, formioSchemaResponseSchema } from '../lib/ai/schemas';
import { FORMIO_EXPERT_SYSTEM_PROMPT, createUserPrompt, formatMarkdownResponse } from '../lib/ai/templates';
import { aiTools } from '../lib/ai/tools';
import { isSchemaTooBigForAI, validateAISolution } from '../lib/ai/utils';
import { env, isAiEnabled } from '../lib/env';
import { calculateSchemaComplexity } from '../lib/formio-validation';

export type AiAssistRequest = {
  message: string;
  currentSchema: FormType;
};

export type AiAssistResponse = {
  markdown: string;
  schema: FormType;
};

// Export schemas for use in routes
export { aiAssistRequestSchema, aiAssistResponseSchema, formioSchemaResponseSchema };

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

// Generate AI assistance response using OpenAI with structured output and tools
export const generateAIAssistance = async (request: AiAssistRequest): Promise<AiAssistResponse> => {
  // Check if current schema is too complex
  if (isSchemaTooBigForAI(request.currentSchema)) {
    throw new Error(`Form is too complex for AI assistance. AI assistance is limited to forms with up to 50 components.`);
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

    // Generate the AI response using Vercel AI SDK with structured output and tools
    const { object, usage, warnings } = await generateObject({
      model: client('gpt-4o-mini'),
      temperature: 0.3,
      maxTokens: 3000,
      schema: formioSchemaResponseSchema,
      system: FORMIO_EXPERT_SYSTEM_PROMPT(currentComplexity),
      prompt: createUserPrompt(request.message, currentComponents),
      tools: aiTools,
    });

    // Create the updated schema from the AI response
    const updatedSchema: FormType = {
      ...request.currentSchema,
      components: object.components || request.currentSchema.components,
    };

    // Final validation using our internal validation
    const validation = validateAISolution(request.currentSchema, updatedSchema);
    const validationWarnings: string[] = [];
    
    if (!validation.valid && validation.issues) {
      console.warn('AI generated solution failed final validation:', validation.issues);
      validationWarnings.push(`Validation issues: ${validation.issues.join(', ')}`);
    }

    // Combine warnings from AI response and validation
    const allWarnings = [...(object.warnings || []), ...validationWarnings];

    // Format the markdown response
    const markdown = formatMarkdownResponse(
      object.explanation, 
      calculateSchemaComplexity(updatedSchema), 
      allWarnings.length > 0 ? allWarnings : undefined
    );

    // Add tool usage information if available
    const enhancedMarkdown = usage ? 
      `${markdown}\n\n### API Usage:\n- Tokens used: ${usage.totalTokens}\n- Model: GPT-4o-mini with structured output` : 
      markdown;

    return {
      markdown: enhancedMarkdown,
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
