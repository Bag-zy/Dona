import { db } from "@/lib/db";
import { posts, postCategories, categories, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { HeroSection } from "@/components/public/HeroSection";
import { PostCard } from "@/components/public/PostCard";
import { NewsletterForm } from "@/components/public/NewsletterForm";

export const revalidate = 60; // ISR: revalidate every 60s

async function getPublishedPosts() {
    try {
        const result = await db
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
            .where(eq(posts.status, "published"))
            .orderBy(desc(posts.publishedAt))
            .limit(12);

        return result.map((r) => ({
            slug: r.slug,
            title: r.title,
            excerpt: r.excerpt,
            featuredImage: r.featuredImage,
            publishedAt: r.publishedAt,
            readingTime: r.readingTime,
            author: r.authorName ? { name: r.authorName, avatarUrl: r.authorAvatar } : null,
            categories: [] as { name: string; slug: string }[],
        }));
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const allPosts = await getPublishedPosts();
    const featuredPost = allPosts[0] || null;
    const recentPosts = allPosts.slice(1);

    return (
        <>
            {/* Hero */}
            <HeroSection post={featuredPost} />

            {/* Recent Posts */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold">Latest Articles</h2>
                        <p className="text-muted-foreground mt-1">
                            Fresh insights and stories from our community
                        </p>
                    </div>
                </div>

                {recentPosts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentPosts.map((post) => (
                            <PostCard key={post.slug} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 space-y-4">
                        <p className="text-4xl">📝</p>
                        <h3 className="text-xl font-semibold">No posts yet</h3>
                        <p className="text-muted-foreground">
                            Head to the admin dashboard to create your first post, or ask Dona AI to help you write one!
                        </p>
                    </div>
                )}
            </section>

            {/* Newsletter */}
            <NewsletterForm />
        </>
    );
}
