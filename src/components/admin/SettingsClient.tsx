"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Eye } from "lucide-react";

export type Settings = {
    id: string;
    siteName: string;
    siteDescription: string | null;
    logoUrl: string | null;
    socialLinks: Record<string, string> | null;
    updatedAt: Date;
} | null;

export function SettingsClient({ initialSettings }: { initialSettings: Settings }) {
    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        siteName: initialSettings?.siteName || "",
        siteDescription: initialSettings?.siteDescription || "",
        logoUrl: initialSettings?.logoUrl || "",
        twitter: initialSettings?.socialLinks?.twitter || "",
        github: initialSettings?.socialLinks?.github || "",
        linkedin: initialSettings?.socialLinks?.linkedin || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.siteName.trim()) {
            toast.error("Site name is required");
            return;
        }

        setLoading(true);
        try {
            const socialLinks: Record<string, string> = {};
            if (form.twitter) socialLinks.twitter = form.twitter;
            if (form.github) socialLinks.github = form.github;
            if (form.linkedin) socialLinks.linkedin = form.linkedin;

            const body: Record<string, any> = {
                siteName: form.siteName,
                siteDescription: form.siteDescription || null,
                logoUrl: form.logoUrl || null,
                socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
            };

            let res;
            if (settings?.id) {
                body.id = settings.id;
                res = await fetch("/api/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                res = await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }

            if (res.ok) {
                const { settings: updated } = await res.json();
                setSettings(updated);
                toast.success("Settings saved");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save settings");
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
                    <h1 className="text-2xl font-bold">Site Settings</h1>
                    <p className="text-sm text-muted-foreground">General configuration for your blog</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="siteName">Site Name</Label>
                            <Input
                                id="siteName"
                                value={form.siteName}
                                onChange={(e) => setForm((prev) => ({ ...prev, siteName: e.target.value }))}
                                placeholder="My Blog"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="siteDescription">Site Description</Label>
                            <Textarea
                                id="siteDescription"
                                value={form.siteDescription}
                                onChange={(e) => setForm((prev) => ({ ...prev, siteDescription: e.target.value }))}
                                placeholder="A blog about..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <Input
                                id="logoUrl"
                                value={form.logoUrl}
                                onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                                placeholder="https://example.com/logo.png"
                            />
                            {form.logoUrl && (
                                <div className="mt-2">
                                    <img src={form.logoUrl} alt="Logo preview" className="h-12 object-contain" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Social Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="twitter">Twitter</Label>
                                <Input
                                    id="twitter"
                                    value={form.twitter}
                                    onChange={(e) => setForm((prev) => ({ ...prev, twitter: e.target.value }))}
                                    placeholder="https://twitter.com/username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="github">GitHub</Label>
                                <Input
                                    id="github"
                                    value={form.github}
                                    onChange={(e) => setForm((prev) => ({ ...prev, github: e.target.value }))}
                                    placeholder="https://github.com/username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn</Label>
                                <Input
                                    id="linkedin"
                                    value={form.linkedin}
                                    onChange={(e) => setForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </form>

            {settings && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Last Updated</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{new Date(settings.updatedAt).toLocaleString()}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
