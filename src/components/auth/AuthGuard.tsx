'use client';

import { authClient } from '@/lib/auth/client';
import { AuthView } from '@neondatabase/auth/react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-4">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Please sign in</h2>
          <p className="text-muted-foreground">
            You need to be authenticated to view this content.
          </p>
        </div>
        <div className="w-full max-w-[400px] rounded-lg border bg-card p-8 shadow-sm neon-auth-container">
          <AuthView path="sign-in" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
