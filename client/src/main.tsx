import { Formio } from '@formio/js';
import '@formio/js/dist/formio.full.min.css';
import { FormioProvider } from '@formio/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import { signIn, signOut, useSession } from './lib/auth-client';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Initialize theme
initializeTheme();

// Create a query client
const queryClient = new QueryClient();

// Router component that has access to auth context
function RouterWithAuth() {
  const { data: session, isPending: loading } = useSession();

  // Create auth context compatible with the router
  const auth = {
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

  // Create a new router instance with auth context
  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      auth,
    },
  });

  return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FormioProvider projectUrl={Formio.projectUrl}>
        <RouterWithAuth />
      </FormioProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
