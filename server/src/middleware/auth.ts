import type { Context, Next } from 'hono';
import { auth } from '../lib/auth';

// Required authentication middleware - returns 401 if not authenticated
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Set user and session data in context for use in routes
    c.set('user', session.user as any); // BetterAuth user type differs from our DB schema
    c.set('session', session.session as any); // BetterAuth session type differs from our DB schema
    
    await next();
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
};

// Optional authentication middleware - continues even if not authenticated
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session) {
      c.set('user', session.user as any); // BetterAuth user type differs from our DB schema
      c.set('session', session.session as any); // BetterAuth session type differs from our DB schema
    } else {
      c.set('user', null);
      c.set('session', null);
    }
    
    await next();
  } catch (error) {
    console.error('Auth error:', error);
    c.set('user', null);
    c.set('session', null);
    await next();
  }
};
