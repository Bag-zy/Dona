"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { slugify } from "@/lib/utils";

type Tag = {
    id: string;
    name: string;
    slug: string;
};

export function TagsClient({ initialTags }: { initialTags: Tag[] }) {
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [viewingTag, setViewingTag] = useState<Tag | null>(null);
    const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
    const [form, setForm] = useState({ name: "", slug: "" });

    const resetForm = () => {
        setForm({ name: "", slug: "" });
        setEditingTag(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEditDialog = (tag: Tag) => {
        setEditingTag(tag);
        setForm({ name: tag.name, slug: tag.slug });
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error("Name is required");
            return;
        }

        setLoading(true);
        try {
            if (editingTag) {
                const res = await fetch("/api/tags", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editingTag.id,
                        name: form.name,
                        slug: form.slug || slugify(form.name),
                    }),
                });

                if (res.ok) {
                    const { tag } = await res.json();
                    setTags((prev) => prev.map((t) => (t.id === tag.id ? tag : t)));
                    toast.success("Tag updated");
                    setDialogOpen(false);
                    resetForm();
                } else {
                    const data = await res.json();
                    toast.error(data.error || "Failed to update tag");
                }
            } else {
                const res = await fetch("/api/tags", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: form.name,
                        slug: form.slug || slugify(form.name),
                    }),
                });

                if (res.ok) {
                    const { tag } = await res.json();
                    setTags((prev) => [...prev, tag]);
                    toast.success("Tag created");
                    setDialogOpen(false);
                    resetForm();
                } else {
                    const data = await res.json();
                    toast.error(data.error || "Failed to create tag");
                }
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingTag) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/tags?id=${deletingTag.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setTags((prev) => prev.filter((t) => t.id !== deletingTag.id));
                toast.success("Tag deleted");
                setDeleteDialogOpen(false);
                setDeletingTag(null);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete tag");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Tags</h1>
                    <p className="text-sm text-muted-foreground">Manage your blog tags</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog}>
                            <Plus className="h-4 w-4 mr-2" /> New Tag
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                            slug: prev.slug || slugify(e.target.value),
                                        }))
                                    }
                                    placeholder="Tag name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={form.slug}
                                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                                    placeholder="tag-slug"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Saving..." : editingTag ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Tags</CardTitle>
                </CardHeader>
                <CardContent>
                    {!tags.length ? (
                        <p className="text-muted-foreground text-center py-8">
                            No tags found. Create one to get started!
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tags.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.name}</TableCell>
                                        <TableCell>/{t.slug}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setViewingTag(t);
                                                        setViewDialogOpen(true);
                                                    }}
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(t)}
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setDeletingTag(t);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    title="Delete"
                                                    className="text-destructive hover:text-destructive"
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tag Details</DialogTitle>
                    </DialogHeader>
                    {viewingTag && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Name</Label>
                                <p className="font-medium">{viewingTag.name}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Slug</Label>
                                <p>/{viewingTag.slug}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                setViewDialogOpen(false);
                                if (viewingTag) openEditDialog(viewingTag);
                            }}
                        >
                            Edit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tag</DialogTitle>
                    </DialogHeader>
                    <p>
                        Are you sure you want to delete <strong>{deletingTag?.name}</strong>? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
