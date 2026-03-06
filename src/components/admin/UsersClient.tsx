"use client";

import { useState } from "react";
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
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

type User = {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    role: string;
    createdAt: Date;
};

export function UsersClient({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [form, setForm] = useState({ name: "", role: "user", bio: "", avatarUrl: "" });

    const resetForm = () => {
        setForm({ name: "", role: "user", bio: "", avatarUrl: "" });
        setEditingUser(null);
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setForm({
            name: user.name || "",
            role: user.role,
            bio: user.bio || "",
            avatarUrl: user.avatarUrl || "",
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setLoading(true);
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingUser.id,
                    name: form.name || null,
                    role: form.role,
                    bio: form.bio || null,
                    avatarUrl: form.avatarUrl || null,
                }),
            });

            if (res.ok) {
                const { user } = await res.json();
                setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
                toast.success("User updated");
                setDialogOpen(false);
                resetForm();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update user");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingUser) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/users?id=${deletingUser.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
                toast.success("User deleted");
                setDeleteDialogOpen(false);
                setDeletingUser(null);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete user");
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
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-sm text-muted-foreground">Manage user roles and access</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    {!users.length ? (
                        <p className="text-muted-foreground text-center py-8">No users found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">{u.name || "Unknown"}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                                {u.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setViewingUser(u);
                                                        setViewDialogOpen(true);
                                                    }}
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(u)}
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setDeletingUser(u);
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

            {/* Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="User name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={form.role} onValueChange={(v) => setForm((prev) => ({ ...prev, role: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={form.bio}
                                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                                placeholder="User bio"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="avatarUrl">Avatar URL</Label>
                            <Input
                                id="avatarUrl"
                                value={form.avatarUrl}
                                onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Update"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {viewingUser && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Name</Label>
                                <p className="font-medium">{viewingUser.name || "Not set"}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Email</Label>
                                <p>{viewingUser.email}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Role</Label>
                                <p>
                                    <Badge variant={viewingUser.role === "admin" ? "default" : "secondary"}>
                                        {viewingUser.role}
                                    </Badge>
                                </p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Bio</Label>
                                <p>{viewingUser.bio || "No bio"}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Joined</Label>
                                <p>{new Date(viewingUser.createdAt).toLocaleString()}</p>
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
                                if (viewingUser) openEditDialog(viewingUser);
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
                        <DialogTitle>Delete User</DialogTitle>
                    </DialogHeader>
                    <p>
                        Are you sure you want to delete <strong>{deletingUser?.name || deletingUser?.email}</strong>? This action cannot be undone.
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
