'use client';

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import { useAuthenticate } from "@neondatabase/auth/react";
import { useState, useEffect } from "react";
import { AuthView } from "@neondatabase/auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface HeroPost {
    slug: string;
    title: string;
    excerpt?: string | null;
    featuredImage?: string | null;
    publishedAt?: Date | string | null;
    readingTime?: number | null;
    author?: { name: string } | null;
    categories?: { name: string; slug: string }[];
}

export function HeroSection({ post }: { post?: HeroPost | null }) {
    const { data: session, isPending: loading } = authClient.useSession();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const router = useRouter();

    // Redirect to dashboard automatically when session is detected
    useEffect(() => {
        if (session && showAuthModal) {
            setShowAuthModal(false);
            router.push('/admin');
        }
    }, [session, showAuthModal, router]);

    const handleGetStarted = () => {
        if (!session) {
            setShowAuthModal(true);
        }
    };

    const AuthModal = () => (
        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
            <DialogContent className="sm:max-w-[450px] p-0 border-none bg-transparent shadow-none">
                <div className="bg-card rounded-xl border shadow-2xl p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold text-center">Welcome to Dona</DialogTitle>
                    </DialogHeader>
                    <div className="neon-auth-container">
                        <AuthView path="sign-in" />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    if (!post) {
        return (
            <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 dark:from-orange-950/20 dark:via-rose-950/20 dark:to-amber-950/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
                    <div className="text-center max-w-3xl mx-auto space-y-6">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                            Welcome to{" "}
                            <span className="bg-gradient-to-r from-orange-500 to-rose-600 bg-clip-text text-transparent">
                                Dona
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                            An AI-powered blog platform for modern creators. Write, publish,
                            and grow your audience with the help of Dona AI assistant.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            {loading ? (
                                <Button size="lg" disabled>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </Button>
                            ) : session ? (
                                <Button
                                    size="lg"
                                    onClick={() => router.push('/admin')}
                                    className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white border-0 shadow-lg shadow-orange-500/25"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={handleGetStarted}
                                    className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white border-0 shadow-lg shadow-orange-500/25"
                                >
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                            <Link href="/docs">
                                <Button variant="outline" size="lg">
                                    API Docs
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
                {/* Decorative gradient blobs */}
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl" />
                <AuthModal />
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Text */}
                    <div className="space-y-5">
                        {post.categories && post.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {post.categories.map((cat) => (
                                    <Badge
                                        key={cat.slug}
                                        className="bg-gradient-to-r from-orange-500 to-rose-600 text-white border-0"
                                    >
                                        {cat.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                            {post.title}
                        </h1>
                        {post.excerpt && (
                            <p className="text-lg text-muted-foreground line-clamp-3">
                                {post.excerpt}
                            </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {post.author && <span>By {post.author.name}</span>}
                            {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                            {post.readingTime && <span>{post.readingTime} min read</span>}
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href={`/blog/${post.slug}`}>
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white border-0 shadow-lg shadow-orange-500/25"
                                >
                                    Read Article
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            {!loading && !session && (
                                <Button variant="outline" size="lg" onClick={() => setShowAuthModal(true)}>
                                    Sign In
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Image */}
                    <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-2xl">
                        {post.featuredImage ? (
                            <img
                                src={post.featuredImage}
                                alt={post.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-950/30 dark:to-rose-950/30 flex items-center justify-center">
                                <span className="text-6xl opacity-30">📝</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <AuthModal />
        </section>
    );
}
