// AI hooks using the main API service
import { useState, useCallback } from 'react';
import type { FormType } from '@formio/react';
import { api } from '../lib/api';

export interface AiAssistRequest {
  message: string;
  currentSchema: FormType;
}

export interface AiAssistResponse {
  markdown: string;
  schema: FormType;
  previewId: string;
  warnings?: string[];
}

export interface AiLimits {
  maxComplexity: number;
  aiEnabled: boolean;
}

export interface SchemaValidation {
  valid: boolean;
  errors?: string[];
  complexity: number;
  exceedsAILimit: boolean;
}

/**
 * Hook for AI form assistance using the main API service
 */
export function useAiFormAssist(formId: number, versionId: string) {
  const [response, setResponse] = useState<AiAssistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestAssistance = useCallback(async (request: AiAssistRequest) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await api.ai.requestAssistance(formId, versionId, request);
      setResponse(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI assistance';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formId, versionId]);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    requestAssistance,
    response,
    error,
    isLoading,
    clearResponse,
  };
}

/**
 * Hook for AI limits
 */
export function useAiLimits() {
  const [limits, setLimits] = useState<AiLimits | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadLimits = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.ai.getLimits();
      setLimits(result);
    } catch (error) {
      console.error('Failed to load AI limits:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { limits, loadLimits, isLoading };
}

/**
 * Hook for schema validation
 */
export function useSchemaValidation() {
  const [isValidating, setIsValidating] = useState(false);
  
  const validateSchema = useCallback(async (schema: FormType) => {
    setIsValidating(true);
    try {
      const result = await api.ai.validateSchema(schema);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return { validateSchema, isValidating };
}

/**
 * Calculate approximate schema complexity client-side
 */
export function calculateSchemaComplexity(schema: FormType): number {
  const countComponents = (components: any[]): number => {
    if (!components || !Array.isArray(components)) return 0;
    
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
}