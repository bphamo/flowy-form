import { jest } from '@jest/globals';
import { Context, Next } from 'hono';
import { MockContext, MockUser } from './types';

// Create test app factory
export const createTestApp = () => {
  const { Hono } = require('hono');
  const app = new Hono();

  // Add test middleware
  app.use('*', (c: Context, next: Next) => {
    // Mock logger to prevent console output during tests
    return next();
  });

  return app;
};

// Mock BetterAuth session middleware
export const mockAuthMiddleware = (user?: MockUser) => {
  return jest.fn(async (c: Context, next: Next) => {
    if (user) {
      // Set user and session separately as per the new auth middleware
      c.set('user', {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      });
      c.set('session', {
        id: 'mock-session-id',
        userId: user.id.toString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        token: 'mock-token',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });
};

// Mock optional authentication middleware
export const mockOptionalAuthMiddleware = (user?: MockUser) => {
  return jest.fn(async (c: Context, next: Next) => {
    if (user) {
      // Set user and session separately as per the new auth middleware
      c.set('user', {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      });
      c.set('session', {
        id: 'mock-session-id',
        userId: user.id.toString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        token: 'mock-token',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      c.set('user', null);
      c.set('session', null);
    }
    await next();
  });
};

// Mock form write check middleware
export const mockFormWriteCheckMiddleware = (shouldPass = true) => {
  return jest.fn(async (c: Context, next: Next) => {
    if (!shouldPass) {
      return c.json({ error: 'Form not found or access denied' }, 404);
    }
    await next();
  });
};

// Helper to mock request context
export const createMockContext = (
  options: {
    params?: Record<string, string>;
    body?: unknown;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    user?: unknown;
    session?: unknown;
  } = {},
): MockContext => {
  const context = {
    req: {
      param: jest.fn((key: string) => options.params?.[key]),
      json: jest.fn(() => Promise.resolve(options.body)),
      header: jest.fn((key: string) => options.headers?.[key]),
    },
    json: jest.fn((data: unknown, status?: number) => ({
      status: status || 200,
      data,
    })),
    get: jest.fn((key: string) => {
      if (key === 'user') return options.user;
      if (key === 'session') return options.session;
      return undefined;
    }),
    set: jest.fn(),
  };

  return context as MockContext;
};

// Helper to create mock BetterAuth user
export const createMockUser = (user?: MockUser) => {
  if (!user) return null;

  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
  };
};

// Helper to create mock BetterAuth session
export const createMockSession = (user?: MockUser) => {
  if (!user) return null;

  return {
    id: 'mock-session-id',
    userId: user.id.toString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    token: 'mock-token',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Helper to test route handlers
export const testRouteHandler = async (
  handler: Function,
  options: {
    params?: Record<string, string>;
    body?: unknown;
    headers?: Record<string, string>;
    user?: MockUser;
  } = {},
) => {
  const context = createMockContext({
    params: options.params,
    body: options.body,
    headers: options.headers,
    user: options.user ? createMockUser(options.user) : null,
    session: options.user ? createMockSession(options.user) : null,
  });

  const result = await handler(context);
  return result;
};
