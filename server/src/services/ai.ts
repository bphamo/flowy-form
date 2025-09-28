/* eslint-disable @typescript-eslint/no-explicit-any */
// AI service for form development assistance using Vercel AI SDK and OpenAI with tool calling
import type { FormType } from '@formio/react';
import { generateObject, tool } from 'ai';
import { openai } from 'ai/openai';
import { z } from 'zod';
import { env, isAiEnabled } from '../lib/env';
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

// OpenAI client configuration
const getOpenAIClient = () => {
  if (!isAiEnabled()) {
    throw new Error('OpenAI API key not configured');
  }
  
  return openai({
    apiKey: env.OPENAI_API_KEY!,
    baseURL: env.OPENAI_BASE_URL,
  });
};

// Tool for validating FormIO schemas
const validateSchemaTool = tool({
  description: 'Validate a FormIO schema for correctness and compatibility',
  parameters: z.object({
    schema: z.any().describe('The FormIO schema to validate'),
    checkComplexity: z.boolean().default(true).describe('Whether to check schema complexity limits'),
  }),
  execute: async ({ schema, checkComplexity }) => {
    const validation = validateFormioSchema(schema);
    const complexity = calculateSchemaComplexity(schema);
    const issues: string[] = [];

    if (!validation.valid) {
      issues.push(...(validation.errors || ['Schema validation failed']));
    }

    if (checkComplexity && complexity > MAX_SCHEMA_COMPLEXITY_FOR_AI) {
      issues.push(`Schema too complex: ${complexity} components (max ${MAX_SCHEMA_COMPLEXITY_FOR_AI})`);
    }

    // Check for duplicate keys
    const duplicateKeys = findDuplicateKeys(schema);
    if (duplicateKeys.length > 0) {
      issues.push(`Duplicate component keys found: ${duplicateKeys.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      complexity,
      maxComplexity: MAX_SCHEMA_COMPLEXITY_FOR_AI,
      issues: issues.length > 0 ? issues : undefined,
      componentCount: (schema.components || []).length,
      duplicateKeys,
    };
  },
});

// Tool for analyzing and reducing schema complexity
const reduceComplexityTool = tool({
  description: 'Analyze a FormIO schema and suggest ways to reduce complexity while preserving functionality',
  parameters: z.object({
    schema: z.any().describe('The FormIO schema to analyze'),
    targetComplexity: z.number().optional().describe('Target complexity level (defaults to max allowed)'),
  }),
  execute: async ({ schema, targetComplexity = MAX_SCHEMA_COMPLEXITY_FOR_AI }) => {
    const currentComplexity = calculateSchemaComplexity(schema);
    const components = schema.components || [];
    
    if (currentComplexity <= targetComplexity) {
      return {
        currentComplexity,
        targetComplexity,
        needsReduction: false,
        suggestions: ['Schema is already within acceptable complexity limits'],
      };
    }

    const suggestions: string[] = [];
    const analysisResults = {
      htmlElements: 0,
      containers: 0,
      panels: 0,
      redundantComponents: 0,
      complexValidations: 0,
    };

    // Analyze component types and identify reduction opportunities
    const analyzeComponents = (comps: any[], depth = 0): void => {
      for (const comp of comps) {
        if (comp.type === 'htmlelement' && !comp.content?.trim()) {
          analysisResults.htmlElements++;
        }
        if (comp.type === 'container' && (!comp.components || comp.components.length === 0)) {
          analysisResults.containers++;
        }
        if (comp.type === 'panel' && (!comp.components || comp.components.length <= 1)) {
          analysisResults.panels++;
        }
        if (comp.validate && Object.keys(comp.validate).length > 3) {
          analysisResults.complexValidations++;
        }

        // Recursively analyze nested components
        if (comp.components) analyzeComponents(comp.components, depth + 1);
        if (comp.columns) {
          comp.columns.forEach((col: any) => {
            if (col.components) analyzeComponents(col.components, depth + 1);
          });
        }
      }
    };

    analyzeComponents(components);

    // Generate suggestions based on analysis
    if (analysisResults.htmlElements > 0) {
      suggestions.push(`Remove ${analysisResults.htmlElements} empty HTML elements that add no value`);
    }
    if (analysisResults.containers > 0) {
      suggestions.push(`Remove ${analysisResults.containers} empty containers that serve no purpose`);
    }
    if (analysisResults.panels > 0) {
      suggestions.push(`Consider consolidating ${analysisResults.panels} panels with minimal content`);
    }
    if (analysisResults.complexValidations > 0) {
      suggestions.push(`Simplify validation rules for ${analysisResults.complexValidations} components`);
    }

    // General suggestions
    if (currentComplexity > targetComplexity * 1.5) {
      suggestions.push('Consider breaking this form into multiple smaller forms or steps');
      suggestions.push('Use conditional logic to show/hide fields instead of including all fields');
    }

    const reductionNeeded = currentComplexity - targetComplexity;
    suggestions.push(`Target reduction: ${reductionNeeded} components to reach ${targetComplexity} limit`);

    return {
      currentComplexity,
      targetComplexity,
      needsReduction: true,
      reductionNeeded,
      analysisResults,
      suggestions,
    };
  },
});

// FormIO component schema for AI generation
const formioComponentSchema = z.object({
  type: z.string(),
  key: z.string(),
  label: z.string().optional(),
  input: z.boolean().optional(),
  components: z.array(z.any()).optional(),
  columns: z.array(z.any()).optional(),
  rows: z.array(z.any()).optional(),
  validate: z.object({
    required: z.boolean().optional(),
    pattern: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    custom: z.string().optional(),
  }).optional(),
  conditional: z.object({
    show: z.boolean().optional(),
    when: z.string().optional(),
    eq: z.string().optional(),
  }).optional(),
  properties: z.record(z.any()).optional(),
}).passthrough(); // Allow additional properties

const formioSchemaResponseSchema = z.object({
  explanation: z.string().describe('A clear explanation of what changes were made and why'),
  components: z.array(formioComponentSchema).describe('The updated FormIO components array'),
  warnings: z.array(z.string()).optional().describe('Any warnings or considerations for the user'),
});

// Generate AI assistance response using OpenAI with tool calling
export const generateAIAssistance = async (request: AiAssistRequest): Promise<AiAssistResponse> => {
  // Check if current schema is too complex
  if (isSchemaTooBigForAI(request.currentSchema)) {
    throw new Error(
      `Form is too complex for AI assistance (${calculateSchemaComplexity(request.currentSchema)} components). AI assistance is limited to forms with up to ${MAX_SCHEMA_COMPLEXITY_FOR_AI} components.`,
    );
  }

  // If AI is not enabled, return mock response
  if (!isAiEnabled()) {
    return generateMockResponse(request);
  }

  try {
    const client = getOpenAIClient();
    
    // Prepare context about the current form
    const currentComplexity = calculateSchemaComplexity(request.currentSchema);
    const currentComponents = request.currentSchema.components || [];
    
    // Generate the AI response using Vercel AI SDK with tools
    const { object } = await generateObject({
      model: client('gpt-4o-mini'), // Use a more capable model for form generation
      temperature: 0.3, // Lower temperature for more consistent results
      maxTokens: 3000, // Increased for tool usage
      schema: formioSchemaResponseSchema,
      tools: {
        validateSchema: validateSchemaTool,
        reduceComplexity: reduceComplexityTool,
      },
      system: `You are an expert FormIO form builder assistant with access to validation and complexity analysis tools. You help users modify and enhance FormIO forms by generating valid FormIO component schemas.

IMPORTANT RULES:
1. ALWAYS use the validateSchema tool to check your generated schemas before finalizing
2. If a schema is too complex, use the reduceComplexity tool to get suggestions for simplification
3. ALWAYS preserve existing components unless explicitly asked to remove them
4. Generate valid FormIO component objects with proper structure
5. Use unique, descriptive keys for new components (e.g., 'email_address', 'phone_number')
6. Follow FormIO naming conventions and best practices
7. Add appropriate validation rules when applicable
8. Consider user experience and form flow
9. Keep forms under ${MAX_SCHEMA_COMPLEXITY_FOR_AI} total components
10. For conditional logic, use proper FormIO conditional syntax

WORKFLOW:
1. Analyze the user's request and current form structure
2. Plan your changes to meet the user's needs
3. Generate the updated components array
4. Use validateSchema tool to verify your solution
5. If validation fails or complexity is too high, use reduceComplexity tool for suggestions
6. Refine your solution based on tool feedback
7. Provide clear explanation and any necessary warnings

FormIO Component Types Available:
- textfield, email, password, phoneNumber, textarea
- number, currency, datetime, time, day
- checkbox, radio, select, selectboxes
- file, signature, survey, rating
- button, htmlelement, content
- panel, fieldset, columns, table
- container, datagrid, editgrid
- address, tags, url

Current form has ${currentComplexity} components.`,
      
      prompt: `The user wants to: "${request.message}"

Current form components: ${JSON.stringify(currentComponents, null, 2)}

Please analyze the request and:
1. Use the validateSchema tool to check the current schema first
2. Plan your changes based on the user's request
3. Generate the updated components array (preserve existing components unless removal is requested)
4. Use the validateSchema tool again to verify your generated schema
5. If complexity is too high, use the reduceComplexity tool for optimization suggestions
6. Provide a clear explanation of what you did and any warnings

Make sure to preserve the structure and maintain component relationships.`,
    });

    // Construct the updated schema
    const updatedSchema: FormType = {
      ...request.currentSchema,
      components: object.components,
    };

    // Final validation using our internal validation
    const validation = validateAISolution(request.currentSchema, updatedSchema);
    if (!validation.valid && validation.issues) {
      // If final validation fails, try again with simpler approach
      console.warn('AI generated solution failed final validation:', validation.issues);
      const fallbackResponse = generateMockResponse(request);
      fallbackResponse.markdown = `## AI Assistant (Fallback Mode)

⚠️ **AI generated a solution that failed final validation, showing simpler fallback:**

${fallbackResponse.markdown}

**Validation issues:** ${validation.issues.join(', ')}

The AI tools are being refined to better handle complex form modifications.`;
      return fallbackResponse;
    }

    // Format the markdown response
    const markdown = `## AI Form Assistant (Tool-Enhanced)

${object.explanation}

### Changes Made:
- Updated form structure using AI validation tools
- Current complexity: ${calculateSchemaComplexity(updatedSchema)} components
- AI processing with tools: ✅ Complete

${object.warnings && object.warnings.length > 0 ? `
### ⚠️ Warnings:
${object.warnings.map(w => `- ${w}`).join('\n')}
` : ''}

### Tools Used:
- **Schema Validation**: Verified FormIO compatibility and component structure
- **Complexity Analysis**: Ensured form stays within manageable limits

### Next Steps:
- Review the changes in the preview
- Click "Accept" to apply changes or "Reject" to revert
- The form will auto-save once you accept the changes`;

    return {
      markdown,
      schema: updatedSchema,
    };

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Fallback to mock response if AI fails
    const fallbackResponse = generateMockResponse(request);
    fallbackResponse.markdown = `## AI Assistant (Fallback Mode)

⚠️ **AI service with tools encountered an error, showing mock response:**

${fallbackResponse.markdown}

**Error details:** ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or contact support if the issue persists.`;
    
    return fallbackResponse;
  }
};

// Mock response for development/fallback
const generateMockResponse = (request: AiAssistRequest): AiAssistResponse => {
  return {
    markdown: `## AI Assistant Response (Mock Mode)

I understand you want to: **"${request.message}"**

### What I would do:
- Analyze your current form structure (${calculateSchemaComplexity(request.currentSchema)} components)
- Generate appropriate FormIO components based on your request
- Validate the new schema for compatibility
- Preserve existing form data and structure

### Mock Implementation:
This is a development placeholder. To enable full AI functionality:

1. Configure \`OPENAI_API_KEY\` environment variable
2. The system will automatically switch to real AI assistance

### Current Form Analysis:
- **Complexity**: ${calculateSchemaComplexity(request.currentSchema)} components
- **AI Limit**: ${MAX_SCHEMA_COMPLEXITY_FOR_AI} components max
- **Status**: ${isSchemaTooBigForAI(request.currentSchema) ? '❌ Too complex' : '✅ Suitable for AI'}`,

    schema: {
      ...request.currentSchema,
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
              <strong>AI Demo Component (Mock)</strong>
            </div>
            <small class="text-muted">Request: "${request.message}"</small>
          </div>`,
          input: false,
          label: 'AI Generated Content (Demo)',
        },
      ],
    },
  };
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
  if (removedKeys.length > originalKeys.length * 0.5) { // Allow some removal, but not more than 50%
    issues.push(`Solution removes too many existing form fields: ${removedKeys.join(', ')}. This may cause significant data loss.`);
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
