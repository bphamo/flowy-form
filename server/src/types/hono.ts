import type { User, Session } from '../db/schema';

declare module 'hono' {
  interface ContextVariableMap {
    user: User | null;
    session: Session | null;
  }
}