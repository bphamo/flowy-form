import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import aiRoutes from '../../routes/ai';
import { mockAuthMiddleware, mockFormWriteCheckMiddleware } from '../helpers';

// Mock the AI service
jest.mock('../../services/ai', () => ({
  generateAIAssistance: jest.fn(),
  validateAISolution: jest.fn(),
  isSchemaTooBigForAI: jest.fn(),
  aiAssistRequestSchema: {
    parse: jest.fn()
  }
}));

// Mock the validation utilities
jest.mock('../../lib/formio-validation', () => ({
  validateFormioSchema: jest.fn(),
  calculateSchemaComplexity: jest.fn(),
  MAX_SCHEMA_COMPLEXITY_FOR_AI: 50
}));

// Mock versions service
jest.mock('../../services/versions', () => ({
  getVersionBySha: jest.fn()
}));

// Mock environment variables
const originalEnv = process.env;

interface TestResponse {
  data?: any;
  error?: string;
  errors?: any;
  message?: string;
}

const createTestAIApp = () => {
  const app = new Hono();

  // Mock middlewares
  app.use('*', mockAuthMiddleware({ 
    id: 1, 
    name: 'Test User', 
    email: 'test@example.com',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  app.use('*', mockFormWriteCheckMiddleware(true));

  // Add AI routes
  app.route('/', aiRoutes);

  return app;
};

describe('AI Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestAIApp();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /form-assist/:formId/:versionId', () => {
    const mockSchema = {
      title: 'Test Form',
      type: 'form' as const,
      display: 'form' as const,
      components: [
        {
          type: 'textfield',
          key: 'name',
          label: 'Name',
          input: true
        }
      ]
    };

    it('should return error when OpenAI API key is not configured', async () => {
      // Remove API key
      delete process.env.OPENAI_API_KEY;

      const res = await app.request('/form-assist/1/version1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Add an email field',
          currentSchema: mockSchema
        })
      });

      const data = await res.json() as TestResponse;
      expect(res.status).toBe(503);
      expect(data.error).toContain('AI assistance is not configured');
    });

    it('should return error for non-existent version', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      const { getVersionBySha } = require('../../services/versions');
      getVersionBySha.mockResolvedValue([]);

      const res = await app.request('/form-assist/1/version1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Add an email field',
          currentSchema: mockSchema
        })
      });

      const data = await res.json() as TestResponse;
      expect(res.status).toBe(404);
      expect(data.error).toBe('Version not found');
    });

    it('should return error for complex schemas', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      const { getVersionById } = require('../../services/versions');
      const { isSchemaTooBigForAI, calculateSchemaComplexity } = require('../../services/ai');
      
      getVersionById.mockResolvedValue([{ id: 1 }]);
      isSchemaTooBigForAI.mockReturnValue(true);
      calculateSchemaComplexity.mockReturnValue(100);

      const res = await app.request('/form-assist/1/version1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Add an email field',
          currentSchema: mockSchema
        })
      });

      const data = await res.json() as TestResponse;
      expect(res.status).toBe(400);
      expect(data.error).toContain('too complex for AI assistance');
    });

    it('should successfully generate AI assistance', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      const { getVersionBySha } = require('../../services/versions');
      const { generateAIAssistance, validateAISolution, isSchemaTooBigForAI } = require('../../services/ai');
      const { aiAssistRequestSchema } = require('../../services/ai');
      
      getVersionBySha.mockResolvedValue([{ id: 1 }]);
      isSchemaTooBigForAI.mockReturnValue(false);
      aiAssistRequestSchema.parse.mockReturnValue({
        message: 'Add an email field',
        currentSchema: mockSchema
      });
      
      const mockAIResponse = {
        markdown: 'Added an email field to your form.',
        schema: {
          ...mockSchema,
          components: [
            ...mockSchema.components,
            {
              type: 'email',
              key: 'email',
              label: 'Email',
              input: true
            }
          ]
        }
      };
      
      generateAIAssistance.mockResolvedValue(mockAIResponse);
      validateAISolution.mockReturnValue({ valid: true });

      const res = await app.request('/form-assist/1/version1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Add an email field',
          currentSchema: mockSchema
        })
      });

      const data = await res.json() as TestResponse;
      expect(res.status).toBe(200);
      expect(data.data.markdown).toBe('Added an email field to your form.');
      expect(data.data.schema).toBeDefined();
      expect(data.data.previewId).toBeDefined();
    });
  });

  describe('POST /validate-schema', () => {
    it('should validate a correct schema', async () => {
      const { validateFormioSchema, calculateSchemaComplexity } = require('../../lib/formio-validation');
      
      validateFormioSchema.mockReturnValue({ 
        valid: true, 
        data: { components: [] } 
      });
      calculateSchemaComplexity.mockReturnValue(5);

      const res = await app.request('/validate-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema: {
            type: 'form',
            components: []
          }
        })
      });

      const data = await res.json() as TestResponse;
      expect(res.status).toBe(200);
      expect(data.data.valid).toBe(true);
      expect(data.data.complexity).toBe(5);
      expect(data.data.exceedsAILimit).toBe(false);
    });

    it('should return error for missing schema', async () => {
      const res = await app.request('/validate-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const data = await res.json() as TestResponse;
      expect(res.status).toBe(400);
      expect(data.error).toBe('Schema is required');
    });
  });

  describe('GET /limits', () => {
    it('should return AI limits with API key configured', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const res = await app.request('/limits');
      const data = await res.json() as TestResponse;

      expect(res.status).toBe(200);
      expect(data.data.maxComplexity).toBe(50);
      expect(data.data.aiEnabled).toBe(true);
    });

    it('should return AI limits without API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const res = await app.request('/limits');
      const data = await res.json() as TestResponse;

      expect(res.status).toBe(200);
      expect(data.data.maxComplexity).toBe(50);
      expect(data.data.aiEnabled).toBe(false);
    });
  });
});