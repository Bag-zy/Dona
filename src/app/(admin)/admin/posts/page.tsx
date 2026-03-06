import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { PostsClient } from "@/components/admin/PostsClient";

export const revalidate = 10;

async function getAllPosts() {
    try {
        return await db
            .select({
                id: posts.id,
                title: posts.title,
                slug: posts.slug,
                status: posts.status,
                views: posts.views,
                publishedAt: posts.publishedAt,
                createdAt: posts.createdAt,
                authorName: users.name,
            })
            .from(posts)
            .leftJoin(users, eq(posts.authorId, users.id))
            .orderBy(desc(posts.createdAt));
    } catch {
        return [];
    }
}

export default async function PostsListPage() {
    const allPosts = await getAllPosts();

    return <PostsClient initialPosts={allPosts} />;
}
