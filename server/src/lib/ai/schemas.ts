/* eslint-disable @typescript-eslint/no-explicit-any */
// Zod schemas for AI service requests and responses
import { z } from 'zod';

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

// FormIO component schema for AI generation
export const formioComponentSchema = z.object({
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
  properties: z.record(z.string(), z.any()).optional(),
}).passthrough(); // Allow additional properties

// Schema for AI-generated FormIO responses
export const formioSchemaResponseSchema = z.object({
  explanation: z.string().describe('A clear explanation of what changes were made and why'),
  components: z.array(formioComponentSchema).describe('The updated FormIO components array'),
  warnings: z.array(z.string()).optional().describe('Any warnings or considerations for the user'),
});