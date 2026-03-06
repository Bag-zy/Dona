import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { eq, desc, like, or, and } from "drizzle-orm";
import { requireOrgRole } from "@/lib/auth/api";

export async function GET(request: NextRequest) {
    const auth = await requireOrgRole("member");
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status") || "published";
        const search = searchParams.get("search");
        const offset = (page - 1) * limit;

        let query = db
            .select({
                id: posts.id,
                title: posts.title,
                slug: posts.slug,
                excerpt: posts.excerpt,
                featuredImage: posts.featuredImage,
                status: posts.status,
                publishedAt: posts.publishedAt,
                readingTime: posts.readingTime,
                views: posts.views,
                createdAt: posts.createdAt,
                authorName: users.name,
                authorId: posts.authorId,
            })
            .from(posts)
            .leftJoin(users, eq(posts.authorId, users.id))
            .where(
                and(
                    eq(posts.organizationId, organizationId),
                    search
                        ? or(
                            like(posts.title, `%${search}%`),
                            like(posts.excerpt, `%${search}%`)
                        )
                        : eq(posts.status, status)
                )
            )
            .orderBy(desc(posts.createdAt))
            .limit(limit)
            .offset(offset);

        const result = await query;

        return NextResponse.json({
            posts: result,
            page,
            limit,
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { title, slug, excerpt, content, featuredImage, status, publishedAt } = body;

        if (!title || !slug) {
            return NextResponse.json(
                { error: "Title and slug are required" },
                { status: 400 }
            );
        }

        const [newPost] = await db
            .insert(posts)
            .values({
                title,
                slug,
                excerpt: excerpt || null,
                content: content || null,
                featuredImage: featuredImage || null,
                authorId: user.id,
                organizationId,
                status: status || "draft",
                publishedAt: publishedAt ? new Date(publishedAt) : null,
            })
            .returning();

        console.log(`Post "${title}" created by ${user.email} in org ${organizationId}`);
        return NextResponse.json({ post: newPost }, { status: 201 });
    } catch (error: any) {
        if (error?.code === "23505") {
            return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
        }
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
