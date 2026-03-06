import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { users, organizationMemberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type Role = 'admin' | 'editor' | 'user';
export type OrganizationRole = 'owner' | 'admin' | 'editor' | 'member';

export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: Role;
    currentOrganizationId: string | null;
    organizationRole: OrganizationRole | null;
}

/**
 * Get the current authenticated user with role from database
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const { data: session } = await auth.getSession();
        if (!session?.user?.id) return null;

        const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!dbUser) {
            const synced = await syncUserToDatabase({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.name || undefined,
            });
            if (!synced) {
                console.error('getCurrentUser: failed to sync user to database', {
                    userId: session.user.id,
                    email: session.user.email,
                });
            }
            return synced;
        }

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
            avatarUrl: dbUser.avatarUrl,
            role: dbUser.role as Role,
            currentOrganizationId: dbUser.currentOrganizationId,
            organizationRole,
        };
    } catch (error) {
        console.error('getCurrentUser error:', error);
        return null;
    }
}

/**
 * Check if user has required role or higher
 * Admin > Editor > User
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
        admin: 3,
        editor: 2,
        user: 1,
    };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user can access admin panel (admin or editor)
 */
export function canAccessAdmin(user: AuthUser | null): boolean {
    if (!user) return false;
    return hasRole(user.role, 'editor');
}

/**
 * Check if user can manage users (admin only)
 */
export function canManageUsers(user: AuthUser | null): boolean {
    if (!user) return false;
    return hasRole(user.role, 'admin');
}

/**
 * Sync user from Neon Auth to local database
 * Call this after sign-up/sign-in to ensure user exists in DB
 */
export async function syncUserToDatabase(authUser: { id: string; email: string; name?: string }): Promise<AuthUser | null> {
    try {
        // Check if user exists
        const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.id, authUser.id))
            .limit(1);

        if (existing) {
            // Get organization role if user has a current organization
            let organizationRole: OrganizationRole | null = null;
            if (existing.currentOrganizationId) {
                const [membership] = await db
                    .select({ role: organizationMemberships.role })
                    .from(organizationMemberships)
                    .where(
                        and(
                            eq(organizationMemberships.userId, existing.id),
                            eq(organizationMemberships.organizationId, existing.currentOrganizationId)
                        )
                    )
                    .limit(1);
                organizationRole = (membership?.role as OrganizationRole) || null;
            }

            return {
                id: existing.id,
                email: existing.email,
                name: existing.name,
                avatarUrl: existing.avatarUrl,
                role: existing.role as Role,
                currentOrganizationId: existing.currentOrganizationId,
                organizationRole,
            };
        }

        // Create new user with default role
        const [newUser] = await db
            .insert(users)
            .values({
                id: authUser.id,
                email: authUser.email,
                name: authUser.name || null,
                role: 'user',
                currentOrganizationId: null,
            })
            .returning();

        return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            avatarUrl: newUser.avatarUrl,
            role: newUser.role as Role,
            currentOrganizationId: null,
            organizationRole: null,
        };
    } catch (error) {
        console.error('Error syncing user to database:', error);
        return null;
    }
}
