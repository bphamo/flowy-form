/* eslint-disable @typescript-eslint/no-explicit-any */
// Utility functions for AI assistance
import type { FormType } from '@formio/react';
import { calculateSchemaComplexity, FormioSchema, MAX_SCHEMA_COMPLEXITY_FOR_AI, validateFormioSchema } from '../formio-validation';

// Check if a schema is too complex for AI assistance
export const isSchemaTooBigForAI = (schema: FormioSchema): boolean => {
  const complexity = calculateSchemaComplexity(schema);
  return complexity > MAX_SCHEMA_COMPLEXITY_FOR_AI;
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
export const extractAllComponentKeys = (schema: FormioSchema): string[] => {
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
export const findDuplicateKeys = (schema: FormioSchema): string[] => {
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