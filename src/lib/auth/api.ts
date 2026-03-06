import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { users, organizationMemberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type Role = 'admin' | 'editor' | 'user';
export type OrganizationRole = 'owner' | 'admin' | 'editor' | 'member';

export interface ApiUser {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    currentOrganizationId: string | null;
    organizationRole: OrganizationRole | null;
}

/**
 * Get the current authenticated user for API routes
 * Returns null if not authenticated
 */
export async function getApiUser(): Promise<ApiUser | null> {
    try {
        const { data: session } = await auth.getSession();
        if (!session?.user?.id) return null;

        const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!dbUser) return null;

        // Get organization role if user has a current organization
        let organizationRole: OrganizationRole | null = null;
        if (dbUser.currentOrganizationId) {
            const [membership] = await db
                .select({ role: organizationMemberships.role })
                .from(organizationMemberships)
                .where(
                    and(
                        eq(organizationMemberships.userId, dbUser.id),
                        eq(organizationMemberships.organizationId, dbUser.currentOrganizationId)
                    )
                )
                .limit(1);
            organizationRole = (membership?.role as OrganizationRole) || null;
        }

        return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role as Role,
            currentOrganizationId: dbUser.currentOrganizationId,
            organizationRole,
        };
    } catch {
        return null;
    }
}

/**
 * Require authentication for API routes
 * Returns user if authenticated, or error response if not
 */
export async function requireAuth(): Promise<{ user: ApiUser } | { error: NextResponse }> {
    const user = await getApiUser();
    if (!user) {
        return {
            error: NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            ),
        };
    }
    return { user };
}

/**
 * Require specific role for API routes
 * Returns user if authorized, or error response if not
 */
export async function requireRole(requiredRole: Role): Promise<{ user: ApiUser } | { error: NextResponse }> {
    const result = await requireAuth();
    if ('error' in result) return result;

    const roleHierarchy: Record<Role, number> = {
        admin: 3,
        editor: 2,
        user: 1,
    };

    if (roleHierarchy[result.user.role] < roleHierarchy[requiredRole]) {
        return {
            error: NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            ),
        };
    }

    return result;
}

/**
 * Require user to have an active organization
 * Returns user with organization context, or error if no organization
 */
export async function requireOrganization(): Promise<{ user: ApiUser; organizationId: string } | { error: NextResponse }> {
    const result = await requireAuth();
    if ('error' in result) return result;

    if (!result.user.currentOrganizationId) {
        return {
            error: NextResponse.json(
                { error: 'No active organization. Please select or create an organization.' },
                { status: 400 }
            ),
        };
    }

    return { user: result.user, organizationId: result.user.currentOrganizationId };
}

/**
 * Require organization role (checks within the current organization)
 * Returns user with organization context, or error if insufficient permissions
 */
export async function requireOrgRole(requiredRole: OrganizationRole): Promise<{ user: ApiUser; organizationId: string } | { error: NextResponse }> {
    const result = await requireOrganization();
    if ('error' in result) return result;

    const roleHierarchy: Record<OrganizationRole, number> = {
        owner: 4,
        admin: 3,
        editor: 2,
        member: 1,
    };

    const userRole = result.user.organizationRole;
    if (!userRole || roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
        return {
            error: NextResponse.json(
                { error: 'Insufficient organization permissions' },
                { status: 403 }
            ),
        };
    }

    return result;
}
