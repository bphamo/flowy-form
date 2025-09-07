import { jest } from '@jest/globals';
import { Hono } from 'hono';
import { MockContext, MockUser } from './types';

// Create test app factory
export const createTestApp = () => {
  const app = new Hono();

  // Add test middleware
  app.use('*', (c, next) => {
    // Mock logger to prevent console output during tests
    return next();
  });

  return app;
};

// Mock BetterAuth session middleware
export const mockAuthMiddleware = (user?: MockUser) => {
  return jest.fn(async (c, next) => {
    if (user) {
      // Mock BetterAuth session data structure
      c.set('session', {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
        },
        session: {
          id: 'mock-session-id',
          userId: user.id.toString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });
    } else {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });
};

// Mock optional authentication middleware
export const mockOptionalAuthMiddleware = (user?: MockUser) => {
  return jest.fn(async (c, next) => {
    if (user) {
      // Mock BetterAuth session data structure
      c.set('session', {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
        },
        session: {
          id: 'mock-session-id',
          userId: user.id.toString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });
    } else {
      c.set('session', null);
    }
    await next();
  });
};

// Mock form write check middleware
export const mockFormWriteCheckMiddleware = (shouldPass = true) => {
  return jest.fn(async (c, next) => {
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
      if (key === 'session') return options.session;
      return undefined;
    }),
    set: jest.fn(),
  };

  return context;
};

// Helper to create mock BetterAuth session
export const createMockSession = (user?: MockUser) => {
  if (!user) return null;
  
  return {
    user: {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      image: user.avatarUrl,
    },
    session: {
      id: 'mock-session-id',
      userId: user.id.toString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
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
    session: options.user ? createMockSession(options.user) : null,
  });

  const result = await handler(context);
  return result;
};
