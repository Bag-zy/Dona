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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Eye, Check, X, Plus } from "lucide-react";

type Subscriber = {
    id: string;
    email: string;
    confirmed: boolean;
    subscribedAt: Date;
};

export function NewsletterClient({ initialSubscribers }: { initialSubscribers: Subscriber[] }) {
    const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
    const [loading, setLoading] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [viewingSubscriber, setViewingSubscriber] = useState<Subscriber | null>(null);
    const [deletingSubscriber, setDeletingSubscriber] = useState<Subscriber | null>(null);
    const [newEmail, setNewEmail] = useState("");

    const handleToggleConfirm = async (subscriber: Subscriber) => {
        setLoading(true);
        try {
            const res = await fetch("/api/newsletter", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: subscriber.id, confirmed: !subscriber.confirmed }),
            });

            if (res.ok) {
                const { subscriber: updated } = await res.json();
                setSubscribers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                toast.success(updated.confirmed ? "Subscriber confirmed" : "Subscriber unconfirmed");
            } else {
                toast.error("Failed to update subscriber");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            toast.error("Please enter a valid email");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newEmail }),
            });

            if (res.ok) {
                // Refetch to get the new subscriber
                const listRes = await fetch("/api/newsletter");
                if (listRes.ok) {
                    const { subscribers } = await listRes.json();
                    setSubscribers(subscribers);
                }
                toast.success("Subscriber added");
                setAddDialogOpen(false);
                setNewEmail("");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to add subscriber");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingSubscriber) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/newsletter?id=${deletingSubscriber.id}`, { method: "DELETE" });

            if (res.ok) {
                setSubscribers((prev) => prev.filter((s) => s.id !== deletingSubscriber.id));
                toast.success("Subscriber removed");
                setDeleteDialogOpen(false);
                setDeletingSubscriber(null);
            } else {
                toast.error("Failed to remove subscriber");
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
                    <h1 className="text-2xl font-bold">Newsletter</h1>
                    <p className="text-sm text-muted-foreground">Manage your newsletter subscribers</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Subscriber
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subscribers ({subscribers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {!subscribers.length ? (
                        <p className="text-muted-foreground text-center py-8">No subscribers found yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Subscribed</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscribers.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">{s.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={s.confirmed ? "default" : "secondary"}>
                                                {s.confirmed ? "Confirmed" : "Pending"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(s.subscribedAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setViewingSubscriber(s); setViewDialogOpen(true); }}
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleConfirm(s)}
                                                    title={s.confirmed ? "Unconfirm" : "Confirm"}
                                                    disabled={loading}
                                                >
                                                    {s.confirmed ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setDeletingSubscriber(s); setDeleteDialogOpen(true); }}
                                                    title="Remove"
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

            {/* Add Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Subscriber</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="subscriber@example.com"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Subscriber Details</DialogTitle>
                    </DialogHeader>
                    {viewingSubscriber && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="font-medium">{viewingSubscriber.email}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Status</Label>
                                <p>
                                    <Badge variant={viewingSubscriber.confirmed ? "default" : "secondary"}>
                                        {viewingSubscriber.confirmed ? "Confirmed" : "Pending"}
                                    </Badge>
                                </p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Subscribed</Label>
                                <p>{new Date(viewingSubscriber.subscribedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                        <Button onClick={() => { setViewDialogOpen(false); if (viewingSubscriber) handleToggleConfirm(viewingSubscriber); }}>
                            {viewingSubscriber?.confirmed ? "Unconfirm" : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Subscriber</DialogTitle>
                    </DialogHeader>
                    <p>
                        Are you sure you want to remove <strong>{deletingSubscriber?.email}</strong> from the newsletter?
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? "Removing..." : "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
