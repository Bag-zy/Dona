import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const auth = await withApiAuth(request, "read");
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
        const offset = (page - 1) * limit;

        const result = await db
            .select({
                title: posts.title,
                slug: posts.slug,
                excerpt: posts.excerpt,
                featuredImage: posts.featuredImage,
                publishedAt: posts.publishedAt,
                readingTime: posts.readingTime,
                views: posts.views,
                authorName: users.name,
            })
            .from(posts)
            .leftJoin(users, eq(posts.authorId, users.id))
            .where(eq(posts.status, "published"))
            .orderBy(desc(posts.publishedAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({ posts: result, page, limit });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await withApiAuth(request, "write");
    if (auth.error) return auth.error;

    try {
        const body = await request.json();
        const { title, slug, excerpt, content, featuredImage, status, organizationId } = body;

        if (!title || !slug || !organizationId) {
            return NextResponse.json({ error: "title, slug, and organizationId are required" }, { status: 400 });
        }

        const [newPost] = await db
            .insert(posts)
            .values({
                title,
                slug,
                organizationId,
                excerpt: excerpt || null,
                content: content || null,
                featuredImage: featuredImage || null,
                authorId: auth.user!.userId,
                status: status || "draft",
            })
            .returning();

        return NextResponse.json({ post: newPost }, { status: 201 });
    } catch (error: any) {
        if (error?.code === "23505") {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
