// AI hooks using the centralized API service
import { useState, useCallback } from 'react';
import type { FormType } from '@formio/react';
import { aiService, type AiAssistRequest, type AiAssistResponse, type AiLimits } from './ai-service';

// Re-export types for convenience
export type { AiAssistRequest, AiAssistResponse, AiLimits };

/**
 * Hook for AI form assistance using the centralized API service
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
      const result = await aiService.requestAssistance(formId, versionId, request);
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
      const result = await aiService.getLimits();
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
 * Calculate approximate schema complexity client-side
 */
export function calculateSchemaComplexity(schema: FormType): number {
  return aiService.calculateSchemaComplexity(schema);
}