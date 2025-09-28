// AI hooks using a simpler approach that works with the existing backend
import { useState, useCallback } from 'react';
import type { FormType } from '@formio/react';

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

/**
 * Hook for AI form assistance using traditional fetch with improved state management
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
      const res = await fetch(`/api/ai/form-assist/${formId}/${versionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get AI assistance');
      }

      const data = await res.json();
      setResponse(data.data);
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
      const response = await fetch('/api/ai/limits', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load AI limits');
      }

      const data = await response.json();
      setLimits(data.data);
    } catch (error) {
      console.error('Failed to load AI limits:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { limits, loadLimits, isLoading };
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