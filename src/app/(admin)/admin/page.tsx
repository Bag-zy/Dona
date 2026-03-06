import { db } from "@/lib/db";
import { posts, comments, newsletterSubscribers, users } from "@/lib/db/schema";
import { eq, count, sql, desc } from "drizzle-orm";
import { FileText, MessageSquare, Mail, Users, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 30;

async function getStats() {
    try {
        const [postCount] = await db.select({ count: count() }).from(posts);
        const [publishedCount] = await db.select({ count: count() }).from(posts).where(eq(posts.status, "published"));
        const [commentCount] = await db.select({ count: count() }).from(comments);
        const [subscriberCount] = await db.select({ count: count() }).from(newsletterSubscribers);
        const [userCount] = await db.select({ count: count() }).from(users);
        const [viewsResult] = await db.select({ total: sql<number>`COALESCE(SUM(${posts.views}), 0)` }).from(posts);

        return {
            totalPosts: postCount.count,
            publishedPosts: publishedCount.count,
            totalComments: commentCount.count,
            totalSubscribers: subscriberCount.count,
            totalUsers: userCount.count,
            totalViews: viewsResult.total || 0,
        };
    } catch {
        return {
            totalPosts: 0, publishedPosts: 0, totalComments: 0,
            totalSubscribers: 0, totalUsers: 0, totalViews: 0,
        };
    }
}

async function getRecentPosts() {
    try {
        return await db
            .select({ id: posts.id, title: posts.title, slug: posts.slug, status: posts.status, createdAt: posts.createdAt })
            .from(posts)
            .orderBy(desc(posts.createdAt))
            .limit(5);
    } catch { return []; }
}

export default async function AdminDashboard() {
    const stats = await getStats();
    const recentPosts = await getRecentPosts();

    const statCards = [
        { label: "Total Posts", value: stats.totalPosts, icon: FileText, color: "text-blue-500" },
        { label: "Published", value: stats.publishedPosts, icon: TrendingUp, color: "text-green-500" },
        { label: "Comments", value: stats.totalComments, icon: MessageSquare, color: "text-purple-500" },
        { label: "Subscribers", value: stats.totalSubscribers, icon: Mail, color: "text-orange-500" },
        { label: "Users", value: stats.totalUsers, icon: Users, color: "text-rose-500" },
        { label: "Total Views", value: stats.totalViews, icon: Eye, color: "text-cyan-500" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome to Dona Admin</p>
                </div>
                <Link href="/admin/posts/new">
                    <Button className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white border-0">
                        + New Post
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="border-border/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Posts */}
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>Recent Posts</CardTitle>
                    <CardDescription>Your latest drafted and published content</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentPosts.length > 0 ? (
                        <div className="space-y-3">
                            {recentPosts.map((post) => (
                                <div
                                    key={post.id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div>
                                        <Link
                                            href={`/admin/posts/${post.slug}`}
                                            className="font-medium hover:text-primary"
                                        >
                                            {post.title}
                                        </Link>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${post.status === "published"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : post.status === "scheduled"
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            }`}
                                    >
                                        {post.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">
                            No posts yet. Create your first post to get started!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
