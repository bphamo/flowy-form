import { Link } from '@tanstack/react-router';
import { Layers } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
  title?: string;
  description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0 relative grid h-dvh flex-col items-center justify-center">
      <div className="bg-muted p-10 text-white lg:flex relative hidden h-full flex-col dark:border-r">
        <div className="inset-0 bg-zinc-900 absolute" />
        <Link to="/" className="text-lg font-medium relative z-20 flex items-center">
          <Layers className="mr-2 size-8 text-white" />
          Flowy Form
        </Link>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">&ldquo;Build beautiful forms with ease&rdquo;</p>
            <footer className="text-sm text-neutral-300">Flowy Form Team</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8 w-full">
        <div className="space-y-6 sm:w-[350px] mx-auto flex w-full flex-col justify-center">
          <Link to="/" className="lg:hidden relative z-20 flex items-center justify-center">
            <Layers className="h-10 text-black sm:h-12" />
          </Link>
          <div className="gap-2 sm:items-center sm:text-center flex flex-col items-start text-left">
            <h1 className="text-xl font-medium">{title}</h1>
            <p className="text-sm text-muted-foreground text-balance">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
