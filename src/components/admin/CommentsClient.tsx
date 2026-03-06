"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Eye, Check, X, AlertTriangle } from "lucide-react";

type Comment = {
    id: string;
    content: string;
    status: string;
    createdAt: Date;
    userName: string | null;
    userEmail: string | null;
    postTitle: string | null;
    postId: string;
};

export function CommentsClient() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewingComment, setViewingComment] = useState<Comment | null>(null);
    const [editingComment, setEditingComment] = useState<Comment | null>(null);
    const [deletingComment, setDeletingComment] = useState<Comment | null>(null);
    const [editForm, setEditForm] = useState({ content: "", status: "" });
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            const res = await fetch("/api/comments?admin=true");
            if (res.ok) {
                const { comments: data } = await res.json();
                setComments(data);
            }
        } catch {
            toast.error("Failed to fetch comments");
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = (comment: Comment) => {
        setEditingComment(comment);
        setEditForm({ content: comment.content, status: comment.status });
        setEditDialogOpen(true);
    };

    const handleStatusChange = async (comment: Comment, newStatus: string) => {
        setActionLoading(true);
        try {
            const res = await fetch("/api/comments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: comment.id, status: newStatus }),
            });

            if (res.ok) {
                const { comment: updated } = await res.json();
                setComments((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
                toast.success(`Comment ${newStatus}`);
            } else {
                toast.error("Failed to update comment");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingComment) return;

        setActionLoading(true);
        try {
            const res = await fetch("/api/comments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingComment.id,
                    content: editForm.content,
                    status: editForm.status,
                }),
            });

            if (res.ok) {
                const { comment: updated } = await res.json();
                setComments((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
                toast.success("Comment updated");
                setEditDialogOpen(false);
            } else {
                toast.error("Failed to update comment");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingComment) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/comments?id=${deletingComment.id}`, { method: "DELETE" });

            if (res.ok) {
                setComments((prev) => prev.filter((c) => c.id !== deletingComment.id));
                toast.success("Comment deleted");
                setDeleteDialogOpen(false);
                setDeletingComment(null);
            } else {
                toast.error("Failed to delete comment");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredComments = statusFilter === "all" ? comments : comments.filter((c) => c.status === statusFilter);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive"> = {
            approved: "default",
            pending: "secondary",
            spam: "destructive",
            trash: "destructive",
        };
        return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Comments</h1>
                    <p className="text-sm text-muted-foreground">Moderate your blog comments</p>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="spam">Spam</SelectItem>
                        <SelectItem value="trash">Trash</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Comments ({filteredComments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-muted-foreground text-center py-8">Loading...</p>
                    ) : !filteredComments.length ? (
                        <p className="text-muted-foreground text-center py-8">No comments found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Comment</TableHead>
                                    <TableHead>Post</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredComments.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="max-w-[200px] truncate">{c.content}</TableCell>
                                        <TableCell className="max-w-[150px] truncate">{c.postTitle || "Unknown"}</TableCell>
                                        <TableCell>{c.userName || c.userEmail || "Unknown"}</TableCell>
                                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                                        <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setViewingComment(c); setViewDialogOpen(true); }}
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {c.status === "pending" && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleStatusChange(c, "approved")}
                                                            title="Approve"
                                                            className="text-green-600"
                                                            disabled={actionLoading}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleStatusChange(c, "spam")}
                                                            title="Mark Spam"
                                                            className="text-orange-600"
                                                            disabled={actionLoading}
                                                        >
                                                            <AlertTriangle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(c)}
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setDeletingComment(c); setDeleteDialogOpen(true); }}
                                                    title="Delete"
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Comment Details</DialogTitle>
                    </DialogHeader>
                    {viewingComment && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Content</Label>
                                <p className="mt-1 p-3 bg-muted rounded-md">{viewingComment.content}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Post</Label>
                                    <p>{viewingComment.postTitle || "Unknown"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">User</Label>
                                    <p>{viewingComment.userName || viewingComment.userEmail || "Unknown"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <p>{getStatusBadge(viewingComment.status)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Date</Label>
                                    <p>{new Date(viewingComment.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                        {viewingComment?.status === "pending" && (
                            <Button onClick={() => { setViewDialogOpen(false); handleStatusChange(viewingComment, "approved"); }}>
                                Approve
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Comment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea
                                value={editForm.content}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editForm.status} onValueChange={(v) => setEditForm((prev) => ({ ...prev, status: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="spam">Spam</SelectItem>
                                    <SelectItem value="trash">Trash</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={actionLoading}>{actionLoading ? "Saving..." : "Save"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Comment</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                            {actionLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
