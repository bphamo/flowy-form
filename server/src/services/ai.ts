/* eslint-disable @typescript-eslint/no-explicit-any */
// AI service for form development assistance
// Note: This is a mock implementation for development.
// Replace with actual AI integration when OpenAI SDK is properly configured.
import type { FormType } from '@formio/react';
import { z } from 'zod';
import { calculateSchemaComplexity, FormioSchema, MAX_SCHEMA_COMPLEXITY_FOR_AI, validateFormioSchema } from '../lib/formio-validation';

// Request schema for AI assistance using FormType
export const aiAssistRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  currentSchema: z.any(), // Use z.any() for FormType compatibility
});

// Response schema for AI assistance using FormType
export const aiAssistResponseSchema = z.object({
  markdown: z.string(),
  schema: z.any(), // Use z.any() for FormType compatibility
});

export type AiAssistRequest = {
  message: string;
  currentSchema: FormType;
};

export type AiAssistResponse = {
  markdown: string;
  schema: FormType;
};

// Check if a schema is too complex for AI assistance
export const isSchemaTooBigForAI = (schema: FormioSchema): boolean => {
  const complexity = calculateSchemaComplexity(schema);
  return complexity > MAX_SCHEMA_COMPLEXITY_FOR_AI;
};

// Generate AI assistance response (Mock implementation)
export const generateAIAssistance = async (request: AiAssistRequest): Promise<AiAssistResponse> => {
  // Check if current schema is too complex
  if (isSchemaTooBigForAI(request.currentSchema)) {
    throw new Error(
      `Form is too complex for AI assistance (${calculateSchemaComplexity(request.currentSchema)} components). AI assistance is limited to forms with up to ${MAX_SCHEMA_COMPLEXITY_FOR_AI} components.`,
    );
  }

  // Mock AI response - in production, this would connect to OpenAI
  const mockResponse: AiAssistResponse = {
    markdown: `## AI Assistant Response

I understand you want to: **"${request.message}"**

### What I would do:
- Analyze your current form structure (${calculateSchemaComplexity(request.currentSchema)} components)
- Generate appropriate FormIO components based on your request
- Validate the new schema for compatibility
- Preserve existing form data and structure

### Mock Implementation:
This is a development placeholder that demonstrates the AI interface. To enable full AI functionality:

1. Configure \`OPENAI_API_KEY\` environment variable
2. Optionally set \`OPENAI_BASE_URL\` for custom endpoints
3. The system will automatically switch to real AI assistance

### Current Form Analysis:
- **Complexity**: ${calculateSchemaComplexity(request.currentSchema)} components
- **AI Limit**: ${MAX_SCHEMA_COMPLEXITY_FOR_AI} components max
- **Status**: ${isSchemaTooBigForAI(request.currentSchema) ? '❌ Too complex' : '✅ Suitable for AI'}`,

    schema: {
      ...request.currentSchema,
      // Add a demonstration component to show the interface works
      components: [
        ...request.currentSchema.components,
        {
          type: 'htmlelement',
          tag: 'div',
          key: `ai_demo_${Date.now()}`,
          content: `<div class="alert alert-info border-start border-primary border-4 ps-3">
            <div class="d-flex align-items-center">
              <svg class="me-2" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              <strong>AI Demo Component</strong>
            </div>
            <small class="text-muted">Request: "${request.message}"</small>
          </div>`,
          input: false,
          label: 'AI Generated Content (Demo)',
        },
      ],
    },
  };

  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return mockResponse;
};

// Validate that an AI-generated solution is viable
export const validateAISolution = (originalSchema: FormioSchema, newSchema: FormioSchema): { valid: boolean; issues?: string[] } => {
  const issues: string[] = [];

  // Check if the new schema is valid
  const validation = validateFormioSchema(newSchema);
  if (!validation.valid) {
    issues.push(...(validation.errors || ['Schema validation failed']));
  }

  // Check complexity
  const complexity = calculateSchemaComplexity(newSchema);
  if (complexity > MAX_SCHEMA_COMPLEXITY_FOR_AI * 2) {
    issues.push(`Solution is too complex (${complexity} components)`);
  }

  // Check for breaking changes (e.g., removing existing fields without clear intent)
  const originalKeys = extractAllComponentKeys(originalSchema);
  const newKeys = extractAllComponentKeys(newSchema);

  const removedKeys = originalKeys.filter((key) => !newKeys.includes(key));
  if (removedKeys.length > 0) {
    issues.push(`Solution removes existing form fields: ${removedKeys.join(', ')}. This may cause data loss.`);
  }

  // Check for duplicate keys
  const duplicateKeys = findDuplicateKeys(newSchema);
  if (duplicateKeys.length > 0) {
    issues.push(`Solution contains duplicate component keys: ${duplicateKeys.join(', ')}`);
  }

  return {
    valid: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined,
  };
};

// Helper function to extract all component keys from a schema
const extractAllComponentKeys = (schema: FormioSchema): string[] => {
  const keys: string[] = [];

  const extractFromComponents = (components: any[]) => {
    for (const component of components) {
      if (component.key) {
        keys.push(component.key);
      }
      if (component.components) {
        extractFromComponents(component.components);
      }
      if (component.columns) {
        for (const column of component.columns) {
          if (column.components) {
            extractFromComponents(column.components);
          }
        }
      }
      if (component.rows) {
        for (const row of component.rows) {
          for (const cell of row) {
            if (cell.components) {
              extractFromComponents(cell.components);
            }
          }
        }
      }
    }
  };

  extractFromComponents(schema.components || []);
  return keys;
};

// Helper function to find duplicate keys in a schema
const findDuplicateKeys = (schema: FormioSchema): string[] => {
  const keys = extractAllComponentKeys(schema);
  const duplicates: string[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
    }
  }

  return duplicates;
};
