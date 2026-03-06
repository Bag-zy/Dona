import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOrgRole } from "@/lib/auth/api";

// GET - List all tags for current organization
export async function GET() {
    const auth = await requireOrgRole("member");
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    try {
        const list = await db
            .select()
            .from(tags)
            .where(eq(tags.organizationId, organizationId))
            .orderBy(tags.name);
        return NextResponse.json({ tags: list });
    } catch (error) {
        console.error("Error fetching tags:", error);
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
}

// POST - Create a new tag (admin/editor only)
export async function POST(request: NextRequest) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { name, slug } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: "Name and slug are required" },
                { status: 400 }
            );
        }

        const [newTag] = await db
            .insert(tags)
            .values({ name, slug, organizationId })
            .returning();

        console.log(`Tag "${name}" created by ${user.email}`);
        return NextResponse.json({ tag: newTag }, { status: 201 });
    } catch (error: any) {
        if (error?.code === "23505") {
            return NextResponse.json({ error: "A tag with this slug already exists" }, { status: 409 });
        }
        console.error("Error creating tag:", error);
        return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    }
}

// PUT - Update a tag (admin/editor only)
export async function PUT(request: NextRequest) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { id, name, slug } = body;

        if (!id) {
            return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;

        const [updated] = await db
            .update(tags)
            .set(updateData)
            .where(and(eq(tags.id, id), eq(tags.organizationId, organizationId)))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        console.log(`Tag "${updated.name}" updated by ${user.email}`);
        return NextResponse.json({ tag: updated });
    } catch (error: any) {
        if (error?.code === "23505") {
            return NextResponse.json({ error: "A tag with this slug already exists" }, { status: 409 });
        }
        console.error("Error updating tag:", error);
        return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
    }
}

// DELETE - Delete a tag (admin only)
export async function DELETE(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
        }

        const [deleted] = await db
            .delete(tags)
            .where(and(eq(tags.id, id), eq(tags.organizationId, organizationId)))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        console.log(`Tag "${deleted.name}" deleted by ${user.email}`);
        return NextResponse.json({ success: true, tag: deleted });
    } catch (error) {
        console.error("Error deleting tag:", error);
        return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
    }
}
