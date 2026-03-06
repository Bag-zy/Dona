import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, postCategories, postTags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOrgRole } from "@/lib/auth/api";

// GET - Get a single post by ID (public within organization)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireOrgRole("member");
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    try {
        const { id } = await params;
        
        const [post] = await db
            .select()
            .from(posts)
            .where(and(eq(posts.id, id), eq(posts.organizationId, organizationId)))
            .limit(1);

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json({ post });
    } catch (error) {
        console.error("Error fetching post:", error);
        return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    }
}

// PUT - Update a post (editor/admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const { id } = await params;
        const body = await request.json();
        
        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (body.title !== undefined) updateData.title = body.title;
        if (body.slug !== undefined) updateData.slug = body.slug;
        if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;

        const [updated] = await db
            .update(posts)
            .set(updateData)
            .where(and(eq(posts.id, id), eq(posts.organizationId, organizationId)))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        console.log(`Post "${updated.title}" updated by ${user.email}`);
        return NextResponse.json({ post: updated });
    } catch (error: any) {
        if (error?.code === "23505") {
            return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
        }
        console.error("Error updating post:", error);
        return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }
}

// DELETE - Delete a post (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const { id } = await params;

        // Delete associated records first
        await db.delete(postCategories).where(eq(postCategories.postId, id));
        await db.delete(postTags).where(eq(postTags.postId, id));

        const [deleted] = await db
            .delete(posts)
            .where(and(eq(posts.id, id), eq(posts.organizationId, organizationId)))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        console.log(`Post "${deleted.title}" deleted by ${user.email}`);
        return NextResponse.json({ success: true, post: deleted });
    } catch (error) {
        console.error("Error deleting post:", error);
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}
