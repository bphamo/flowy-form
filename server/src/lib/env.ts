// Environment variables validation using Zod
import { z } from 'zod';

// Define the environment schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  BASE_URL: z.string().url().default('http://localhost:3001'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  BETTER_AUTH_SECRET: z.string().min(32, 'Better Auth secret must be at least 32 characters'),
  GITHUB_CLIENT_ID: z.string().min(1, 'GitHub Client ID is required'),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GitHub Client Secret is required'),

  // AI Configuration (Optional)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),

  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM_ADDRESS: z.string().email().optional(),
  MAIL_FROM_NAME: z.string().optional(),

  // AWS (Optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_DEFAULT_REGION: z.string().optional(),
  AWS_BUCKET: z.string().optional(),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Type for the validated environment
export type Env = z.infer<typeof envSchema>;

// Helper functions
export const isAiEnabled = (): boolean => {
  return !!env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 0;
};

export const isDevelopment = (): boolean => {
  return env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return env.NODE_ENV === 'production';
};

export const isTest = (): boolean => {
  return env.NODE_ENV === 'test';
};