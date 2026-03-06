import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, users, posts } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireOrgRole } from "@/lib/auth/api";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get("postId");
        const status = searchParams.get("status") || "all";
        const admin = searchParams.get("admin") === "true";

        // Admin mode - get all comments for organization
        if (admin) {
            const auth = await requireOrgRole("editor");
            if ("error" in auth) return auth.error;
            const { organizationId } = auth;

            const result = await db
                .select({
                    id: comments.id,
                    content: comments.content,
                    status: comments.status,
                    createdAt: comments.createdAt,
                    parentId: comments.parentId,
                    userName: users.name,
                    userEmail: users.email,
                    userAvatar: users.avatarUrl,
                    userId: comments.userId,
                    postId: comments.postId,
                    postTitle: posts.title,
                })
                .from(comments)
                .leftJoin(users, eq(comments.userId, users.id))
                .leftJoin(posts, eq(comments.postId, posts.id))
                .where(eq(comments.organizationId, organizationId))
                .orderBy(desc(comments.createdAt));

            const filtered = status === "all" ? result : result.filter((c) => c.status === status);
            return NextResponse.json({ comments: filtered });
        }

        // Public mode - requires postId
        if (!postId) {
            return NextResponse.json({ error: "postId is required" }, { status: 400 });
        }

        const result = await db
            .select({
                id: comments.id,
                content: comments.content,
                status: comments.status,
                createdAt: comments.createdAt,
                parentId: comments.parentId,
                userName: users.name,
                userAvatar: users.avatarUrl,
                userId: comments.userId,
            })
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .where(eq(comments.postId, postId))
            .orderBy(desc(comments.createdAt));

        const filtered = status === "all" ? result : result.filter((c) => c.status === status);
        return NextResponse.json({ comments: filtered });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    try {
        const { postId, content, parentId, organizationId } = await request.json();

        if (!postId || !content?.trim() || !organizationId) {
            return NextResponse.json(
                { error: "postId, organizationId, and content are required" },
                { status: 400 }
            );
        }

        const [newComment] = await db
            .insert(comments)
            .values({
                postId,
                userId: auth.user.id,
                content: content.trim(),
                parentId: parentId || null,
                status: "pending",
                organizationId,
            })
            .returning();

        console.log(`Comment created by ${auth.user.email} on post ${postId}`);
        return NextResponse.json({ comment: newComment }, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { id, status, content } = body;

        if (!id) {
            return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        if (status !== undefined) updateData.status = status;
        if (content !== undefined) updateData.content = content;

        const [updated] = await db
            .update(comments)
            .set(updateData)
            .where(and(eq(comments.id, id), eq(comments.organizationId, organizationId)))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        console.log(`Comment ${id} updated by ${user.email}`);
        return NextResponse.json({ comment: updated });
    } catch (error) {
        console.error("Error updating comment:", error);
        return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
        }

        const [deleted] = await db
            .delete(comments)
            .where(and(eq(comments.id, id), eq(comments.organizationId, organizationId)))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        console.log(`Comment ${id} deleted by ${user.email}`);
        return NextResponse.json({ success: true, comment: deleted });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
}
