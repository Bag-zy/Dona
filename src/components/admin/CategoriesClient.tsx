"use client";

import { useState } from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Category = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
};

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [form, setForm] = useState({ name: "", slug: "", description: "" });

    const resetForm = () => {
        setForm({ name: "", slug: "", description: "" });
        setEditingCategory(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setDialogOpen(true);
    };

    useCopilotAction({
        name: "openNewCategoryForm",
        description: "Opens the dialog form to create a new category.",
        available: "remote",
        handler: async () => {
            openCreateDialog();
            return "New category form opened.";
        }
    });

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setForm({
            name: category.name,
            slug: category.slug,
            description: category.description || "",
        });
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
            if (editingCategory) {
                // Update
                const res = await fetch("/api/categories", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editingCategory.id,
                        name: form.name,
                        slug: form.slug || slugify(form.name),
                        description: form.description || null,
                    }),
                });

                if (res.ok) {
                    const { category } = await res.json();
                    setCategories((prev) =>
                        prev.map((c) => (c.id === category.id ? category : c))
                    );
                    toast.success("Category updated");
                    setDialogOpen(false);
                    resetForm();
                } else {
                    const data = await res.json();
                    toast.error(data.error || "Failed to update category");
                }
            } else {
                // Create
                const res = await fetch("/api/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: form.name,
                        slug: form.slug || slugify(form.name),
                        description: form.description || null,
                    }),
                });

                if (res.ok) {
                    const { category } = await res.json();
                    setCategories((prev) => [...prev, category]);
                    toast.success("Category created");
                    setDialogOpen(false);
                    resetForm();
                } else {
                    const data = await res.json();
                    toast.error(data.error || "Failed to create category");
                }
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingCategory) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/categories?id=${deletingCategory.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
                toast.success("Category deleted");
                setDeleteDialogOpen(false);
                setDeletingCategory(null);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete category");
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
                    <h1 className="text-2xl font-bold">Categories</h1>
                    <p className="text-sm text-muted-foreground">Manage your blog categories</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog}>
                            <Plus className="h-4 w-4 mr-2" /> New Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory ? "Edit Category" : "Create Category"}
                            </DialogTitle>
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
                                    placeholder="Category name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={form.slug}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, slug: e.target.value }))
                                    }
                                    placeholder="category-slug"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                    placeholder="Optional description"
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Saving..." : editingCategory ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    {!categories.length ? (
                        <p className="text-muted-foreground text-center py-8">
                            No categories found. Create one to get started!
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell>/{c.slug}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {c.description || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setViewingCategory(c);
                                                        setViewDialogOpen(true);
                                                    }}
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
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
                                                    onClick={() => {
                                                        setDeletingCategory(c);
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
                        <DialogTitle>Category Details</DialogTitle>
                    </DialogHeader>
                    {viewingCategory && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Name</Label>
                                <p className="font-medium">{viewingCategory.name}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Slug</Label>
                                <p>/{viewingCategory.slug}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Description</Label>
                                <p>{viewingCategory.description || "No description"}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setViewDialogOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                setViewDialogOpen(false);
                                if (viewingCategory) openEditDialog(viewingCategory);
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
                        <DialogTitle>Delete Category</DialogTitle>
                    </DialogHeader>
                    <p>
                        Are you sure you want to delete{" "}
                        <strong>{deletingCategory?.name}</strong>? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
