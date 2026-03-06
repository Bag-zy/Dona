import { NextRequest, NextResponse } from "next/server";
import { requireOrgRole } from "@/lib/auth/api";
import { db } from "@/lib/db";
import { users, organizationMemberships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Get organization members
export async function GET(request: NextRequest) {
    const auth = await requireOrgRole("member");
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    try {
        const members = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                avatarUrl: users.avatarUrl,
                role: organizationMemberships.role,
                joinedAt: organizationMemberships.joinedAt,
            })
            .from(organizationMemberships)
            .innerJoin(users, eq(organizationMemberships.userId, users.id))
            .where(eq(organizationMemberships.organizationId, organizationId))
            .orderBy(organizationMemberships.joinedAt);

        return NextResponse.json({ members });
    } catch (error) {
        console.error("Error fetching members:", error);
        return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }
}

// POST - Add member to organization (admin/owner only)
export async function POST(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user: currentUser, organizationId } = auth;

    try {
        const body = await request.json();
        const { email, role } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Find user by email
        const [targetUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already a member
        const [existing] = await db
            .select()
            .from(organizationMemberships)
            .where(
                and(
                    eq(organizationMemberships.organizationId, organizationId),
                    eq(organizationMemberships.userId, targetUser.id)
                )
            )
            .limit(1);

        if (existing) {
            return NextResponse.json({ error: "User is already a member" }, { status: 409 });
        }

        // Add member
        const [membership] = await db
            .insert(organizationMemberships)
            .values({
                organizationId,
                userId: targetUser.id,
                role: role || "member",
            })
            .returning();

        console.log(`Member ${email} added to organization by ${currentUser.email}`);

        return NextResponse.json({
            member: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
                avatarUrl: targetUser.avatarUrl,
                role: membership.role,
                joinedAt: membership.joinedAt,
            },
        }, { status: 201 });
    } catch (error) {
        console.error("Error adding member:", error);
        return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
    }
}

// PUT - Update member role (admin/owner only)
export async function PUT(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user: currentUser, organizationId } = auth;

    try {
        const body = await request.json();
        const { userId, role } = body;

        if (!userId || !role) {
            return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
        }

        // Check if target member is owner
        const [targetMembership] = await db
            .select()
            .from(organizationMemberships)
            .where(
                and(
                    eq(organizationMemberships.organizationId, organizationId),
                    eq(organizationMemberships.userId, userId)
                )
            )
            .limit(1);

        if (!targetMembership) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        if (targetMembership.role === "owner") {
            return NextResponse.json({ error: "Cannot modify owner's role" }, { status: 403 });
        }

        // Update role
        const [updated] = await db
            .update(organizationMemberships)
            .set({ role })
            .where(
                and(
                    eq(organizationMemberships.organizationId, organizationId),
                    eq(organizationMemberships.userId, userId)
                )
            )
            .returning();

        console.log(`Member role updated to ${role} by ${currentUser.email}`);
        return NextResponse.json({ membership: updated });
    } catch (error) {
        console.error("Error updating member role:", error);
        return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
    }
}

// DELETE - Remove member from organization (admin/owner only)
export async function DELETE(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user: currentUser, organizationId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Check if target member is owner
        const [targetMembership] = await db
            .select()
            .from(organizationMemberships)
            .where(
                and(
                    eq(organizationMemberships.organizationId, organizationId),
                    eq(organizationMemberships.userId, userId)
                )
            )
            .limit(1);

        if (!targetMembership) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        if (targetMembership.role === "owner") {
            return NextResponse.json({ error: "Cannot remove owner from organization" }, { status: 403 });
        }

        // Remove member
        await db
            .delete(organizationMemberships)
            .where(
                and(
                    eq(organizationMemberships.organizationId, organizationId),
                    eq(organizationMemberships.userId, userId)
                )
            );

        console.log(`Member removed from organization by ${currentUser.email}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }
}
