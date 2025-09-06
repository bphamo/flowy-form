import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string | null;
  githubId: string | null;
  avatarUrl: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContext {
  user: User | null;
  loading: boolean;
  login: (redirectUrl?: string) => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export interface RouterContext {
  queryClient: QueryClient;
  auth: AuthContext;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        title: 'Flowy Forms - Create and Share Forms Easily',
      },
      {
        name: 'description',
        content: 'Create and share forms easily with Flowy Forms.',
      },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Toaster richColors duration={3000} position="top-right" />
      <HeadContent />
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
