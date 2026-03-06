import { db } from "@/lib/db";
import { posts, users, comments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

async function getPost(slug: string) {
    try {
        const [post] = await db
            .select({
                id: posts.id,
                title: posts.title,
                slug: posts.slug,
                excerpt: posts.excerpt,
                content: posts.content,
                featuredImage: posts.featuredImage,
                publishedAt: posts.publishedAt,
                readingTime: posts.readingTime,
                views: posts.views,
                authorName: users.name,
                authorBio: users.bio,
                authorAvatar: users.avatarUrl,
                authorId: posts.authorId,
            })
            .from(posts)
            .leftJoin(users, eq(posts.authorId, users.id))
            .where(eq(posts.slug, slug))
            .limit(1);

        return post || null;
    } catch {
        return null;
    }
}

async function getComments(postId: string) {
    try {
        return await db
            .select({
                id: comments.id,
                content: comments.content,
                createdAt: comments.createdAt,
                parentId: comments.parentId,
                userName: users.name,
                userAvatar: users.avatarUrl,
            })
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .where(eq(comments.postId, postId))
            .orderBy(desc(comments.createdAt));
    } catch {
        return [];
    }
}

function renderContent(content: any): string {
    if (!content) return "";
    if (typeof content === "string") return content;
    // Basic TipTap JSON → text (full HTML rendering TBD)
    if (content.content && Array.isArray(content.content)) {
        return content.content
            .map((node: any) => {
                if (node.type === "paragraph" && node.content) {
                    return `<p>${node.content.map((c: any) => c.text || "").join("")}</p>`;
                }
                if (node.type === "heading" && node.content) {
                    const level = node.attrs?.level || 2;
                    return `<h${level}>${node.content.map((c: any) => c.text || "").join("")}</h${level}>`;
                }
                return "";
            })
            .join("");
    }
    return JSON.stringify(content);
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = await getPost(slug);
    if (!post) notFound();

    const postComments = await getComments(post.id);
    const htmlContent = renderContent(post.content);

    return (
        <article className="min-h-screen">
            {/* Reading progress bar placeholder */}
            <div className="fixed top-0 left-0 z-[60] h-1 bg-gradient-to-r from-orange-500 to-rose-600 transition-all" style={{ width: "0%" }} />

            {/* Featured Image */}
            {post.featuredImage && (
                <div className="w-full aspect-[21/9] max-h-[500px] overflow-hidden bg-muted">
                    <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
                {/* Back */}
                <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="h-4 w-4" /> Back to Home
                </Link>

                {/* Header */}
                <header className="space-y-4 mb-10">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                        {post.title}
                    </h1>

                    {post.excerpt && (
                        <p className="text-xl text-muted-foreground">{post.excerpt}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {post.authorName && (
                            <Link href={`/author/${post.authorId}`} className="flex items-center gap-2 hover:text-foreground">
                                {post.authorAvatar ? (
                                    <img src={post.authorAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                                        {post.authorName[0]}
                                    </div>
                                )}
                                <span className="font-medium">{post.authorName}</span>
                            </Link>
                        )}
                        {post.publishedAt && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(post.publishedAt)}
                            </span>
                        )}
                        {post.readingTime && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {post.readingTime} min read
                            </span>
                        )}
                    </div>
                </header>

                <Separator className="mb-10" />

                {/* Content */}
                <div
                    className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-lg"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />

                <Separator className="my-10" />

                {/* Author bio */}
                {post.authorName && (
                    <div className="rounded-xl border border-border/50 bg-card p-6 flex items-start gap-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                            {post.authorName[0]}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Written by</p>
                            <p className="text-lg font-semibold">{post.authorName}</p>
                            {post.authorBio && (
                                <p className="text-sm text-muted-foreground mt-1">{post.authorBio}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Comments */}
                <section className="mt-12 space-y-6">
                    <h2 className="text-2xl font-bold">
                        Comments ({postComments.length})
                    </h2>
                    {postComments.length > 0 ? (
                        <div className="space-y-4">
                            {postComments.map((comment) => (
                                <div key={comment.id} className="rounded-lg border border-border/50 p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                            {(comment.userName || "?")[0]}
                                        </div>
                                        <span className="font-medium text-sm">{comment.userName || "Anonymous"}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80">{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No comments yet. Be the first!</p>
                    )}
                </section>
            </div>
        </article>
    );
}
