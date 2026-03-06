import { db } from '@/lib/db';
import { organizations, organizationMemberships, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';

export type OrganizationRole = 'owner' | 'admin' | 'editor' | 'member';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    createdAt: Date;
}

export interface OrganizationWithRole extends Organization {
    role: OrganizationRole;
    isCurrent: boolean;
}

/**
 * Get all organizations a user belongs to
 */
export async function getUserOrganizations(userId: string): Promise<OrganizationWithRole[]> {
    const memberships = await db
        .select({
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
            logoUrl: organizations.logoUrl,
            createdAt: organizations.createdAt,
            role: organizationMemberships.role,
        })
        .from(organizationMemberships)
        .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
        .where(eq(organizationMemberships.userId, userId));

    // Get user's current organization
    const [user] = await db
        .select({ currentOrganizationId: users.currentOrganizationId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    const currentOrgId = user?.currentOrganizationId;

    return memberships.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        logoUrl: m.logoUrl,
        createdAt: m.createdAt,
        role: m.role as OrganizationRole,
        isCurrent: m.id === currentOrgId,
    }));
}

/**
 * Get the user's current active organization
 */
export async function getCurrentOrganization(userId: string): Promise<Organization | null> {
    const [user] = await db
        .select({ currentOrganizationId: users.currentOrganizationId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user?.currentOrganizationId) {
        // Get first organization user belongs to
        const [membership] = await db
            .select({
                id: organizations.id,
                name: organizations.name,
                slug: organizations.slug,
                logoUrl: organizations.logoUrl,
                createdAt: organizations.createdAt,
            })
            .from(organizationMemberships)
            .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
            .where(eq(organizationMemberships.userId, userId))
            .limit(1);

        return membership || null;
    }

    const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.currentOrganizationId))
        .limit(1);

    return org || null;
}

/**
 * Get user's role in a specific organization
 */
export async function getOrganizationRole(userId: string, organizationId: string): Promise<OrganizationRole | null> {
    const [membership] = await db
        .select({ role: organizationMemberships.role })
        .from(organizationMemberships)
        .where(
            and(
                eq(organizationMemberships.userId, userId),
                eq(organizationMemberships.organizationId, organizationId)
            )
        )
        .limit(1);

    return (membership?.role as OrganizationRole) || null;
}

/**
 * Switch user's current organization
 */
export async function switchOrganization(userId: string, organizationId: string): Promise<boolean> {
    // Verify user belongs to this organization
    const membership = await db
        .select()
        .from(organizationMemberships)
        .where(
            and(
                eq(organizationMemberships.userId, userId),
                eq(organizationMemberships.organizationId, organizationId)
            )
        )
        .limit(1);

    if (!membership.length) return false;

    await db
        .update(users)
        .set({ currentOrganizationId: organizationId })
        .where(eq(users.id, userId));

    return true;
}

/**
 * Create a new organization with the user as owner
 */
export async function createOrganization(
    userId: string,
    name: string,
    slug: string
): Promise<Organization | null> {
    try {
        const [org] = await db
            .insert(organizations)
            .values({ name, slug })
            .returning();

        // Add creator as owner
        await db.insert(organizationMemberships).values({
            organizationId: org.id,
            userId,
            role: 'owner',
        });

        // Set as current organization
        await db
            .update(users)
            .set({ currentOrganizationId: org.id })
            .where(eq(users.id, userId));

        return org;
    } catch (error) {
        console.error('Error creating organization:', error);
        return null;
    }
}

/**
 * Check if user can perform action in organization
 * Owner/Admin: full access
 * Editor: create/edit content
 * Member: read only
 */
export function hasOrganizationPermission(
    role: OrganizationRole,
    requiredRole: 'owner' | 'admin' | 'editor' | 'member'
): boolean {
    const roleHierarchy: Record<OrganizationRole, number> = {
        owner: 4,
        admin: 3,
        editor: 2,
        member: 1,
    };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
    return org || null;
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string): Promise<Organization | null> {
    const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);
    return org || null;
}
