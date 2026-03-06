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
import { Trash2, Eye, ExternalLink, Upload } from "lucide-react";

type MediaItem = {
    id: string;
    url: string;
    type: string;
    fileName: string | null;
    mimeType: string | null;
    size: number | null;
    uploadedAt: Date;
};

export function MediaClient({ initialMedia }: { initialMedia: MediaItem[] }) {
    const [media, setMedia] = useState<MediaItem[]>(initialMedia);
    const [loading, setLoading] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
    const [deletingMedia, setDeletingMedia] = useState<MediaItem | null>(null);
    const [uploadUrl, setUploadUrl] = useState("");
    const [uploadName, setUploadName] = useState("");

    const handleDelete = async () => {
        if (!deletingMedia) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/media?id=${deletingMedia.id}`, { method: "DELETE" });

            if (res.ok) {
                setMedia((prev) => prev.filter((m) => m.id !== deletingMedia.id));
                toast.success("Media deleted");
                setDeleteDialogOpen(false);
                setDeletingMedia(null);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete media");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleAddByUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadUrl.trim()) {
            toast.error("URL is required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/media", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: uploadUrl,
                    type: uploadUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image" : "document",
                    fileName: uploadName || uploadUrl.split("/").pop() || "unknown",
                }),
            });

            if (res.ok) {
                const { media: newMedia } = await res.json();
                setMedia((prev) => [newMedia, ...prev]);
                toast.success("Media added");
                setUploadUrl("");
                setUploadName("");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to add media");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number | null) => {
        if (!bytes) return "-";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Media Library</h1>
                    <p className="text-sm text-muted-foreground">Manage your uploaded files</p>
                </div>
            </div>

            {/* Add by URL form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Add Media by URL</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddByUrl} className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="https://example.com/image.jpg"
                                value={uploadUrl}
                                onChange={(e) => setUploadUrl(e.target.value)}
                            />
                        </div>
                        <div className="w-48">
                            <Input
                                placeholder="File name (optional)"
                                value={uploadName}
                                onChange={(e) => setUploadName(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            <Upload className="h-4 w-4 mr-2" /> Add
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                    {!media.length ? (
                        <p className="text-muted-foreground text-center py-8">No media found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Preview</TableHead>
                                    <TableHead>File</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Uploaded</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {media.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell>
                                            {m.type === "image" ? (
                                                <img
                                                    src={m.url}
                                                    alt={m.fileName || "Media"}
                                                    className="w-12 h-12 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs">
                                                    {m.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[200px] truncate">
                                            {m.fileName || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{m.type}</Badge>
                                        </TableCell>
                                        <TableCell>{formatSize(m.size)}</TableCell>
                                        <TableCell>{new Date(m.uploadedAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setViewingMedia(m); setViewDialogOpen(true); }}
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => window.open(m.url, "_blank")}
                                                    title="Open"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setDeletingMedia(m); setDeleteDialogOpen(true); }}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Media Details</DialogTitle>
                    </DialogHeader>
                    {viewingMedia && (
                        <div className="space-y-4">
                            {viewingMedia.type === "image" && (
                                <img
                                    src={viewingMedia.url}
                                    alt={viewingMedia.fileName || "Media"}
                                    className="w-full rounded-lg"
                                />
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">File Name</Label>
                                    <p>{viewingMedia.fileName || "Unknown"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Type</Label>
                                    <p>{viewingMedia.type}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">MIME Type</Label>
                                    <p>{viewingMedia.mimeType || "Unknown"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Size</Label>
                                    <p>{formatSize(viewingMedia.size)}</p>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-muted-foreground">URL</Label>
                                    <p className="text-sm break-all">{viewingMedia.url}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                        <Button onClick={() => window.open(viewingMedia?.url, "_blank")}>Open in New Tab</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Media</DialogTitle>
                    </DialogHeader>
                    <p>
                        Are you sure you want to delete <strong>{deletingMedia?.fileName}</strong>? This action cannot be undone.
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
