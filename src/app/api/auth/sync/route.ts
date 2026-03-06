import { NextRequest, NextResponse } from 'next/server';
import { syncUserToDatabase } from '@/lib/auth/rbac';
import { auth } from '@/lib/auth/server';

// This endpoint syncs the authenticated user to the local database
// Called after successful sign-in
export async function POST(request: NextRequest) {
    try {
        const { data: session } = await auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const user = await syncUserToDatabase({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.name,
        });

        if (!user) {
            return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error in auth callback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
