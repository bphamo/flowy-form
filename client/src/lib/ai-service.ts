// AI service for client-side communication with AI endpoints
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

export interface SchemaValidation {
  valid: boolean;
  errors?: string[];
  complexity: number;
  exceedsAILimit: boolean;
}

class AiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL + '/api' || 'http://localhost:3001/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Request AI assistance for form development
   */
  async requestAssistance(
    formId: number,
    versionId: string,
    request: AiAssistRequest
  ): Promise<AiAssistResponse> {
    const data = await this.request<{ data: AiAssistResponse }>(`/ai/form-assist/${formId}/${versionId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    return data.data;
  }

  /**
   * Validate a FormIO schema
   */
  async validateSchema(schema: FormType): Promise<SchemaValidation> {
    const data = await this.request<{ data: SchemaValidation }>('/ai/validate-schema', {
      method: 'POST',
      body: JSON.stringify({ schema }),
    });
    
    return data.data;
  }

  /**
   * Get AI assistance limits and configuration
   */
  async getLimits(): Promise<AiLimits> {
    const data = await this.request<{ data: AiLimits }>('/ai/limits');
    return data.data;
  }

  /**
   * Calculate approximate schema complexity client-side
   * This provides a quick estimate without server roundtrip
   */
  calculateSchemaComplexity(schema: FormType): number {
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
}

export const aiService = new AiService();