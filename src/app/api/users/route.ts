import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/api";

// GET - List all users (admin only)
export async function GET() {
    const auth = await requireRole("admin");
    if ("error" in auth) return auth.error;

    try {
        const list = await db.select().from(users).orderBy(users.createdAt);
        return NextResponse.json({ users: list });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// PUT - Update a user (admin only for role changes)
export async function PUT(request: NextRequest) {
    const auth = await requireRole("admin");
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const { id, name, role, bio, avatarUrl } = body;

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (role !== undefined) updateData.role = role;
        if (bio !== undefined) updateData.bio = bio;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

        const [updated] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`User "${updated.email}" updated by ${auth.user.email}`);
        return NextResponse.json({ user: updated });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

// DELETE - Delete a user (admin only)
export async function DELETE(request: NextRequest) {
    const auth = await requireRole("admin");
    if ("error" in auth) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Prevent self-deletion
        if (id === auth.user.id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        const [deleted] = await db
            .delete(users)
            .where(eq(users.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`User "${deleted.email}" deleted by ${auth.user.email}`);
        return NextResponse.json({ success: true, user: deleted });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
