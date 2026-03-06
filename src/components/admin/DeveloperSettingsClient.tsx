"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Key, Plus, Copy, AlertTriangle, Trash2, Ban } from "lucide-react";
import { formatDate } from "@/lib/utils";

type ApiKey = {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string;
    createdAt: Date;
    lastUsedAt?: Date | null;
    expiresAt?: Date | null;
    revoked: boolean;
};

export function DeveloperSettingsClient({ initialKeys, userId }: { initialKeys: ApiKey[], userId: string }) {
    const router = useRouter();
    const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
    const [modalOpen, setModalOpen] = useState(false);
    const [revealKey, setRevealKey] = useState<string | null>(null);

    // New key form state
    const [name, setName] = useState("");
    const [scopeRead, setScopeRead] = useState(true);
    const [scopeWrite, setScopeWrite] = useState(false);
    const [expiresIn, setExpiresIn] = useState("never");
    const [creating, setCreating] = useState(false);

    const resetForm = () => {
        setName("");
        setScopeRead(true);
        setScopeWrite(false);
        setExpiresIn("never");
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please provide a name for the key");
            return;
        }

        const scopes = [];
        if (scopeRead) scopes.push("read");
        if (scopeWrite) scopes.push("write");

        if (scopes.length === 0) {
            toast.error("Select at least one scope");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/admin/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    name,
                    scopes: scopes.join(","),
                    expiresInDays: expiresIn === "never" ? 0 : parseInt(expiresIn),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setKeys([data.key, ...keys]);
                setRevealKey(data.rawKey);
                setModalOpen(false);
                resetForm();
                toast.success("API key created");
            } else {
                const data = await res.json();
                toast.error(data.error);
            }
        } catch {
            toast.error("Network error");
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (id: string) => {
        try {
            const res = await fetch("/api/admin/keys", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyId: id, action: "revoke" }),
            });
            if (res.ok) {
                setKeys(keys.map(k => k.id === id ? { ...k, revoked: true } : k));
                toast.success("Key revoked");
            }
        } catch {
            toast.error("Failed to revoke key");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            const res = await fetch(`/api/admin/keys?keyId=${id}`, { method: "DELETE" });
            if (res.ok) {
                setKeys(keys.filter(k => k.id !== id));
                toast.success("Key deleted");
            }
        } catch {
            toast.error("Failed to delete key");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div>
                        <CardTitle>Active API Keys</CardTitle>
                        <CardDescription>Keys you have generated to access the API</CardDescription>
                    </div>
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Generate New Key
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {keys.length > 0 ? (
                        <div className="divide-y divide-border/50">
                            {keys.map((key) => (
                                <div key={key.id} className={`p-4 flex items-center justify-between ${key.revoked ? "opacity-60 bg-muted/30" : ""}`}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{key.name}</span>
                                            <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{key.keyPrefix}...</code>
                                            {key.revoked && <Badge variant="destructive">Revoked</Badge>}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>Created {formatDate(key.createdAt)}</span>
                                            <span>·</span>
                                            <span className="flex items-center gap-1">
                                                Scopes:
                                                {key.scopes.split(",").map(s => (
                                                    <Badge key={s} variant="outline" className="text-[10px] h-4 py-0 px-1 uppercase">{s}</Badge>
                                                ))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!key.revoked && (
                                            <Button variant="outline" size="sm" onClick={() => handleRevoke(key.id)}>
                                                <Ban className="h-4 w-4 mr-2" /> Revoke
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => handleDelete(key.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 space-y-3">
                            <Key className="h-10 w-10 mx-auto text-muted-foreground/30" />
                            <p className="text-muted-foreground">No API keys generated yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Generate Key Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate API Key</DialogTitle>
                        <DialogDescription>
                            Create a new key to access the Dona REST API.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Key Name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Zapier Integration" />
                        </div>

                        <div className="space-y-3">
                            <Label>Permissions / Scopes</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="read" checked={scopeRead} onCheckedChange={(c) => setScopeRead(c as boolean)} />
                                <label htmlFor="read" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Read (GET requests for posts, categories, etc.)
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="write" checked={scopeWrite} onCheckedChange={(c) => setScopeWrite(c as boolean)} />
                                <label htmlFor="write" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Write (POST/PATCH requests to create/edit content)
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Expiration</Label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={expiresIn}
                                onChange={e => setExpiresIn(e.target.value)}
                            >
                                <option value="never">Never expire</option>
                                <option value="30">30 Days</option>
                                <option value="90">90 Days</option>
                                <option value="365">1 Year</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating}>{creating ? "Generating..." : "Generate Key"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reveal Key Modal (One time show) */}
            <Dialog open={!!revealKey} onOpenChange={() => setRevealKey(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-500">
                            <AlertTriangle className="h-5 w-5" /> Copy your API Key
                        </DialogTitle>
                        <DialogDescription>
                            Please copy this key and save it somewhere safe. For security reasons, <strong>we will never show it to you again.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 my-4">
                        <div className="grid flex-1 gap-2">
                            <Input readOnly value={revealKey || ""} className="font-mono text-sm" />
                        </div>
                        <Button size="icon" onClick={() => copyToClipboard(revealKey || "")}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button type="button" variant="secondary" onClick={() => setRevealKey(null)}>
                            I copied it safely
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
