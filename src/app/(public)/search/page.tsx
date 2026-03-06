import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { desc, like, or, eq } from "drizzle-orm";
import { PostCard } from "@/components/public/PostCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const revalidate = 30;

async function searchPosts(query: string) {
    if (!query) return [];
    try {
        return await db
            .select({
                slug: posts.slug,
                title: posts.title,
                excerpt: posts.excerpt,
                featuredImage: posts.featuredImage,
                publishedAt: posts.publishedAt,
                readingTime: posts.readingTime,
                authorName: users.name,
                authorAvatar: users.avatarUrl,
            })
            .from(posts)
            .leftJoin(users, eq(posts.authorId, users.id))
            .where(
                or(
                    like(posts.title, `%${query}%`),
                    like(posts.excerpt, `%${query}%`)
                )
            )
            .orderBy(desc(posts.publishedAt))
            .limit(20);
    } catch {
        return [];
    }
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q = "" } = await searchParams;
    const results = await searchPosts(q);

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-2xl mx-auto mb-10 text-center space-y-4">
                <h1 className="text-3xl font-bold">Search</h1>
                <form action="/search" method="get" className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        name="q"
                        defaultValue={q}
                        placeholder="Search posts..."
                        className="pl-10 h-12 text-lg"
                        autoFocus
                    />
                </form>
            </div>

            {q && (
                <p className="text-muted-foreground mb-6">
                    {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{q}&quot;
                </p>
            )}

            {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((post) => (
                        <PostCard
                            key={post.slug}
                            post={{
                                ...post,
                                author: post.authorName ? { name: post.authorName, avatarUrl: post.authorAvatar } : null,
                                categories: [],
                            }}
                        />
                    ))}
                </div>
            ) : q ? (
                <div className="text-center py-16 space-y-3">
                    <p className="text-4xl">🔍</p>
                    <p className="text-muted-foreground">No posts found for &quot;{q}&quot;</p>
                </div>
            ) : null}
        </div>
    );
}
