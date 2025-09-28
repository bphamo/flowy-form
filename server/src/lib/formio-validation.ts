/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// FormIO schema validation using FormType from @formio/react
import type { FormType } from '@formio/react';

// Use FormType from @formio/react directly
export type FormioSchema = FormType;

// Validation function for FormIO schemas using the official FormType
export const validateFormioSchema = (schema: unknown): { valid: boolean; errors?: string[]; data?: FormioSchema } => {
  try {
    // Basic validation to ensure it's an object with components
    if (!schema || typeof schema !== 'object' || !('components' in schema)) {
      return { valid: false, errors: ['Schema must be an object with a components array'] };
    }

    const schemaObj = schema as any;
    if (!Array.isArray(schemaObj.components)) {
      return { valid: false, errors: ['Schema components must be an array'] };
    }

    // Additional FormType-specific validation
    if (schemaObj.type && schemaObj.type !== 'form' && schemaObj.type !== 'wizard') {
      return { valid: false, errors: ['Schema type must be "form" or "wizard"'] };
    }

    if (schemaObj.display && schemaObj.display !== 'form' && schemaObj.display !== 'wizard') {
      return { valid: false, errors: ['Schema display must be "form" or "wizard"'] };
    }

    return { valid: true, data: schemaObj as FormioSchema };
  } catch (error) {
    return { valid: false, errors: ['Schema validation failed'] };
  }
};

// Calculate schema complexity (for size limits)
export const calculateSchemaComplexity = (schema: FormioSchema): number => {
  const countComponents = (components: any[]): number => {
    let count = components.length;
    for (const component of components) {
      if (component.components) {
        count += countComponents(component.components);
      }
      if (component.columns) {
        for (const column of component.columns) {
          if (column.components) {
            count += countComponents(column.components);
          }
        }
      }
      if (component.rows) {
        for (const row of component.rows) {
          for (const cell of row) {
            if (cell.components) {
              count += countComponents(cell.components);
            }
          }
        }
      }
    }
    return count;
  };

  return countComponents(schema.components || []);
};

// Maximum number of components allowed for AI assistance
export const MAX_SCHEMA_COMPLEXITY_FOR_AI = 50;
