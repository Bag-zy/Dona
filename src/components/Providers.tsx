'use client';

import { NeonAuthUIProvider } from '@neondatabase/auth/react/ui';
import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { authClient } from '@/lib/auth/client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NeonAuthUIProvider
            authClient={authClient as any}
            hooks={{
                useSession: authClient.useSession
            }}
            redirectTo="/admin"
            emailOTP
            social={{
                providers: ['google']
            }}
            credentials={{ forgotPassword: true }}
            organization
        >
            <AuthUIProvider
                authClient={authClient as any}
                organization={{
                    logo: true,
                    viewPaths: { SETTINGS: "/admin/settings" }
                }}
                teams={{ enabled: true }}
                account={{
                    viewPaths: { SETTINGS: "/admin/settings" }
                }}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster richColors position="top-right" />
                </ThemeProvider>
            </AuthUIProvider>
        </NeonAuthUIProvider>
    );
}
