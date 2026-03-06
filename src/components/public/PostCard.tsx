import Link from "next/link";
import { Calendar, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, truncate } from "@/lib/utils";

interface PostCardProps {
    post: {
        slug: string;
        title: string;
        excerpt?: string | null;
        featuredImage?: string | null;
        publishedAt?: Date | string | null;
        readingTime?: number | null;
        author?: { name: string; avatarUrl?: string | null } | null;
        categories?: { name: string; slug: string }[];
    };
}

export function PostCard({ post }: PostCardProps) {
    return (
        <Link href={`/blog/${post.slug}`} className="group block">
            <article className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
                {/* Image */}
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {post.featuredImage ? (
                        <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-950/30 dark:to-rose-950/30 flex items-center justify-center">
                            <span className="text-4xl opacity-30">📝</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                    {/* Categories */}
                    {post.categories && post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {post.categories.map((cat) => (
                                <Badge
                                    key={cat.slug}
                                    variant="secondary"
                                    className="text-xs font-medium"
                                >
                                    {cat.name}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {truncate(post.excerpt, 120)}
                        </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        {post.author && (
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {post.author.name}
                            </span>
                        )}
                        {post.publishedAt && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(post.publishedAt)}
                            </span>
                        )}
                        {post.readingTime && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.readingTime} min read
                            </span>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
}
