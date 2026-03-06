"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCopilotAction } from "@copilotkit/react-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Send } from "lucide-react";
import Link from "next/link";
import { slugify } from "@/lib/utils";

export default function NewPostPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        featuredImage: "",
        status: "draft" as "draft" | "published" | "scheduled",
        metaTitle: "",
        metaDescription: "",
    });

    function handleTitleChange(title: string) {
        setForm((prev: typeof form) => ({
            ...prev,
            title,
            slug: prev.slug || slugify(title),
        }));
    }

    useCopilotAction({
        name: "setDraftTitle",
        description: "Sets the title of the blog post draft.",
        available: "remote",
        parameters: [{ name: "title", type: "string", description: "The title.", required: true }],
        handler: async ({ title }) => {
            handleTitleChange(title);
            return "Title set.";
        }
    });

    useCopilotAction({
        name: "setDraftSlug",
        description: "Sets the URL slug of the draft.",
        available: "remote",
        parameters: [{ name: "slug", type: "string", description: "The slug.", required: true }],
        handler: async ({ slug }) => {
            setForm((prev: typeof form) => ({ ...prev, slug }));
            return "Slug set.";
        }
    });

    useCopilotAction({
        name: "setDraftExcerpt",
        description: "Sets the excerpt / summary.",
        available: "remote",
        parameters: [{ name: "excerpt", type: "string", description: "The excerpt.", required: true }],
        handler: async ({ excerpt }) => {
            setForm((prev: typeof form) => ({ ...prev, excerpt }));
            return "Excerpt set.";
        }
    });

    useCopilotAction({
        name: "setDraftContent",
        description: "Sets the main HTML/text content of the post.",
        available: "remote",
        parameters: [{ name: "content", type: "string", description: "The markdown or text content.", required: true }],
        handler: async ({ content }) => {
            setForm((prev: typeof form) => ({ ...prev, content }));
            return "Content set.";
        }
    });

    useCopilotAction({
        name: "setDraftFeaturedImage",
        description: "Sets the featured image URL.",
        available: "remote",
        parameters: [{ name: "url", type: "string", description: "The image URL.", required: true }],
        handler: async ({ url }) => {
            setForm((prev: typeof form) => ({ ...prev, featuredImage: url }));
            return "Featured image set.";
        }
    });

    useCopilotAction({
        name: "setDraftStatus",
        description: "Sets the publish status (draft, published, scheduled).",
        available: "remote",
        parameters: [{ name: "status", type: "string", description: "The status.", required: true }],
        handler: async ({ status }) => {
            if (["draft", "published", "scheduled"].includes(status)) {
                setForm((prev: typeof form) => ({ ...prev, status: status as any }));
                return "Status set.";
            }
        }
    });

    useCopilotAction({
        name: "setDraftSeoMeta",
        description: "Sets the SEO meta title and description.",
        available: "remote",
        parameters: [
            { name: "title", type: "string", description: "Meta title.", required: true },
            { name: "description", type: "string", description: "Meta description.", required: true }
        ],
        handler: async ({ title, description }) => {
            setForm((prev: typeof form) => ({ ...prev, metaTitle: title, metaDescription: description }));
            return "SEO meta set.";
        }
    });

    useCopilotAction({
        name: "saveDraft",
        description: "Saves the current form as a draft to the database.",
        available: "remote",
        handler: async () => {
            handleSave("draft");
            return "Draft saving initiated.";
        }
    });

    useCopilotAction({
        name: "publishDraft",
        description: "Publishes the current draft immediately.",
        available: "remote",
        handler: async () => {
            handleSave("published");
            return "Publish initiated.";
        }
    });

    async function handleSave(status?: string) {
        if (!form.title.trim()) {
            toast.error("Title is required");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    slug: form.slug || slugify(form.title),
                    excerpt: form.excerpt || null,
                    content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: form.content }] }] },
                    featuredImage: form.featuredImage || null,
                    authorId: "admin", // TODO: use real auth user ID
                    status: status || form.status,
                    publishedAt: status === "published" ? new Date().toISOString() : null,
                }),
            });

            if (res.ok) {
                toast.success(status === "published" ? "Post published!" : "Draft saved!");
                router.push("/admin/posts");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save post");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/posts">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">New Post</h1>
                        <p className="text-sm text-muted-foreground">Create a new blog post</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                    </Button>
                    <Button
                        onClick={() => handleSave("published")}
                        disabled={saving}
                        className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white border-0"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Publish
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main editor */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter post title..."
                                    value={form.title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    className="text-lg font-semibold h-12"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    placeholder="post-slug"
                                    value={form.slug}
                                    onChange={(e) => setForm((prev: typeof form) => ({ ...prev, slug: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea
                                    id="excerpt"
                                    placeholder="Short summary of the post..."
                                    value={form.excerpt}
                                    onChange={(e) => setForm((prev: typeof form) => ({ ...prev, excerpt: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea
                                    id="content"
                                    placeholder="Write your post content here... (Rich text editor coming with TipTap)"
                                    value={form.content}
                                    onChange={(e) => setForm((prev: typeof form) => ({ ...prev, content: e.target.value }))}
                                    rows={16}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={form.status}
                                onValueChange={(v) => setForm((prev: typeof form) => ({ ...prev, status: v as any }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Featured Image */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Featured Image</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                placeholder="Image URL or upload..."
                                value={form.featuredImage}
                                onChange={(e) => setForm((prev: typeof form) => ({ ...prev, featuredImage: e.target.value }))}
                            />
                            {form.featuredImage && (
                                <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-muted">
                                    <img
                                        src={form.featuredImage}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* SEO */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">SEO</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Meta Title</Label>
                                <Input
                                    placeholder={form.title || "Meta title..."}
                                    value={form.metaTitle}
                                    onChange={(e) => setForm((prev: typeof form) => ({ ...prev, metaTitle: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Meta Description</Label>
                                <Textarea
                                    placeholder={form.excerpt || "Meta description..."}
                                    value={form.metaDescription}
                                    onChange={(e) => setForm((prev: typeof form) => ({ ...prev, metaDescription: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
