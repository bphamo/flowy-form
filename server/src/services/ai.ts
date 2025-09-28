/* eslint-disable @typescript-eslint/no-explicit-any */
// AI service for form development assistance using Vercel AI SDK and OpenAI with tool calling
import { createOpenAI } from '@ai-sdk/openai';
import type { FormType } from '@formio/react';
import { generateText } from 'ai';
import { aiAssistRequestSchema, aiAssistResponseSchema } from '../lib/ai/schemas';
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

    // Generate the AI response using Vercel AI SDK with tool calling
    const { text, toolResults } = await generateText({
      model: client('gpt-4o-mini'),
      temperature: 0.3,
      system: FORMIO_EXPERT_SYSTEM_PROMPT(currentComplexity),
      prompt: createUserPrompt(request.message, currentComponents),
      tools: aiTools,
    });

    // Parse the AI response to extract the schema
    let updatedSchema: FormType;
    let explanation = text;
    let warnings: string[] = [];

    try {
      // The AI should provide a JSON response with the updated schema
      // Look for JSON in the response
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[1]);
        updatedSchema = {
          ...request.currentSchema,
          components: jsonResponse.components || request.currentSchema.components,
        };
        explanation = jsonResponse.explanation || text;
        warnings = jsonResponse.warnings || [];
      } else {
        // Fallback: use original schema if no valid JSON found
        console.warn('AI did not provide valid JSON response, using original schema');
        updatedSchema = request.currentSchema;
        warnings.push('AI response did not contain valid schema updates');
      }
    } catch (parseError) {
      console.warn('Failed to parse AI JSON response:', parseError);
      updatedSchema = request.currentSchema;
      warnings.push('AI response parsing failed, no changes applied');
    }

    // Collect tool usage information
    const toolUsage: string[] = [];
    if (toolResults) {
      for (const result of toolResults) {
        if (result.toolName === 'validateSchema') {
          toolUsage.push(`Schema validation: ${(result.output as any)?.summary || 'completed'}`);
        } else if (result.toolName === 'reduceComplexity') {
          toolUsage.push(`Complexity analysis: ${(result.output as any)?.summary || 'completed'}`);
        }
      }
    }

    // Final validation using our internal validation
    const validation = validateAISolution(request.currentSchema, updatedSchema);
    if (!validation.valid && validation.issues) {
      // If final validation fails, add to warnings but don't fail completely
      console.warn('AI generated solution failed final validation:', validation.issues);
      warnings.push(`Validation issues: ${validation.issues.join(', ')}`);
    }

    // Format the markdown response with tool usage information
    const markdown = formatMarkdownResponse(explanation, calculateSchemaComplexity(updatedSchema), warnings);

    // Add tool usage information to response
    const enhancedMarkdown = toolUsage.length > 0 ? `${markdown}\n\n### Tool Usage:\n${toolUsage.map((usage) => `- ${usage}`).join('\n')}` : markdown;

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
