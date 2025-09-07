import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  credentials: 'include', // Enable cookies for cross-origin requests
});

export const { useSession, signIn, signOut, signUp } = authClient;
