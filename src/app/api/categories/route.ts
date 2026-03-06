import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOrgRole } from "@/lib/auth/api";

// GET - List all categories for current organization
export async function GET() {
    const auth = await requireOrgRole("member");
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    try {
        const list = await db
            .select()
            .from(categories)
            .where(eq(categories.organizationId, organizationId))
            .orderBy(categories.name);
        return NextResponse.json({ categories: list });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

// POST - Create a new category (admin/editor only)
export async function POST(request: NextRequest) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { name, slug, description } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: "Name and slug are required" },
                { status: 400 }
            );
        }

        const [newCategory] = await db
            .insert(categories)
            .values({
                name,
                slug,
                description: description || null,
                organizationId,
            })
            .returning();

        console.log(`Category "${name}" created by ${user.email}`);
        return NextResponse.json({ category: newCategory }, { status: 201 });
    } catch (error: any) {
        if (error?.code === "23505") {
            return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
        }
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}

// PUT - Update a category (admin/editor only)
export async function PUT(request: NextRequest) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { id, name, slug, description } = body;

        if (!id) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (description !== undefined) updateData.description = description;

        const [updated] = await db
            .update(categories)
            .set(updateData)
            .where(and(eq(categories.id, id), eq(categories.organizationId, organizationId)))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        console.log(`Category "${updated.name}" updated by ${user.email}`);
        return NextResponse.json({ category: updated });
    } catch (error: any) {
        if (error?.code === "23505") {
            return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
        }
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

// DELETE - Delete a category (admin only)
export async function DELETE(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        const [deleted] = await db
            .delete(categories)
            .where(and(eq(categories.id, id), eq(categories.organizationId, organizationId)))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        console.log(`Category "${deleted.name}" deleted by ${user.email}`);
        return NextResponse.json({ success: true, category: deleted });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
