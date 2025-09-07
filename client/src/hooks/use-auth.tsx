import { useSession, signIn, signOut } from '../lib/auth-client';

// Re-export BetterAuth hooks and utilities for easy access throughout the app
export { signIn, signOut, useSession } from '../lib/auth-client';

// Helper hook that provides the same interface as the old useAuth for easy migration
export function useAuth() {
  const { data: session, isPending: loading } = useSession();

  return {
    user: session?.user || null,
    loading,
    login: (redirectUrl?: string) => {
      signIn.social({
        provider: 'github',
        callbackURL: redirectUrl || window.location.origin + '/dashboard',
      });
    },
    logout: async () => {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = '/';
          },
        },
      });
    },
    refetchUser: async () => {
      // BetterAuth handles session refetching automatically
      window.location.reload();
    },
  };
}
