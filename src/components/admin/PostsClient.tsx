"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Pencil, Trash2, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Post = {
    id: string;
    title: string;
    slug: string;
    status: string;
    views: number | null;
    publishedAt: Date | null;
    createdAt: Date;
    authorName: string | null;
};

const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export function PostsClient({ initialPosts }: { initialPosts: Post[] }) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [loading, setLoading] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewingPost, setViewingPost] = useState<Post | null>(null);
    const [deletingPost, setDeletingPost] = useState<Post | null>(null);

    const handleDelete = async () => {
        if (!deletingPost) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/posts/${deletingPost.id}`, { method: "DELETE" });

            if (res.ok) {
                setPosts((prev) => prev.filter((p) => p.id !== deletingPost.id));
                toast.success("Post deleted");
                setDeleteDialogOpen(false);
                setDeletingPost(null);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete post");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Posts</h1>
                    <p className="text-sm text-muted-foreground">Manage your blog posts</p>
                </div>
                <Link href="/admin/posts/new">
                    <Button className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white border-0">
                        <Plus className="h-4 w-4 mr-2" /> New Post
                    </Button>
                </Link>
            </div>

            <Card className="border-border/50">
                <CardContent className="p-0">
                    {posts.length > 0 ? (
                        <div className="divide-y divide-border/50">
                            {posts.map((post) => (
                                <div key={post.id} className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <Link href={`/admin/posts/${post.slug}`} className="font-medium hover:text-primary truncate block">
                                                {post.title}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">
                                                {post.authorName || "Unknown"} · {formatDate(post.createdAt)}
                                                {post.views ? ` · ${post.views} views` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={statusColors[post.status] || ""} variant="secondary">
                                            {post.status}
                                        </Badge>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setViewingPost(post); setViewDialogOpen(true); }}
                                                title="View details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Link href={`/admin/posts/${post.slug}`}>
                                                <Button variant="ghost" size="icon" title="Edit">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setDeletingPost(post); setDeleteDialogOpen(true); }}
                                                title="Delete"
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 space-y-3">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground">No posts yet</p>
                            <Link href="/admin/posts/new">
                                <Button size="sm">Create your first post</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Post Details</DialogTitle>
                    </DialogHeader>
                    {viewingPost && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Title</p>
                                <p className="font-medium text-lg">{viewingPost.title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Slug</p>
                                <p className="font-mono text-sm">/{viewingPost.slug}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className={statusColors[viewingPost.status] || ""} variant="secondary">
                                        {viewingPost.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Views</p>
                                    <p>{viewingPost.views || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Author</p>
                                    <p>{viewingPost.authorName || "Unknown"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Created</p>
                                    <p>{new Date(viewingPost.createdAt).toLocaleString()}</p>
                                </div>
                                {viewingPost.publishedAt && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-muted-foreground">Published</p>
                                        <p>{new Date(viewingPost.publishedAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                        <Link href={`/admin/posts/${viewingPost?.slug}`}>
                            <Button onClick={() => setViewDialogOpen(false)}>Edit Post</Button>
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Post</DialogTitle>
                    </DialogHeader>
                    <p>
                        Are you sure you want to delete <strong>{deletingPost?.title}</strong>? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
