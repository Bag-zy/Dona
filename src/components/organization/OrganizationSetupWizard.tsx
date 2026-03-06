"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Loader2, ArrowRight, CheckCircle2, ImagePlus, X } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import type { AuthUser } from "@/lib/auth/rbac";

interface OrganizationSetupWizardProps {
    user: AuthUser;
}

export function OrganizationSetupWizard({ user }: OrganizationSetupWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleNameChange = (value: string) => {
        setName(value);
        if (!slug || slug === generateSlug(name)) {
            setSlug(generateSlug(value));
        }
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image must be less than 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setLogoPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeLogo = () => {
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCreateOrganization = async () => {
        if (!name.trim()) {
            toast.error("Organization name is required");
            return;
        }

        if (!slug.trim()) {
            toast.error("Organization slug is required");
            return;
        }

        setCreating(true);
        try {
            const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

            // Create via Better Auth API (powers the OrganizationSwitcher)
            const result = await (authClient as any).organization.create({
                name: name.trim(),
                slug: cleanSlug,
                logo: logoPreview || undefined,
            });

            if (result?.error) {
                throw new Error(result.error.message || "Failed to create organization");
            }

            // Also sync to custom Drizzle tables for admin features
            await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    slug: cleanSlug,
                }),
            }).catch(() => { });

            setStep(2);

            setTimeout(() => {
                router.push("/admin");
                router.refresh();
            }, 2000);
        } catch (error: any) {
            toast.error(error.message || "Failed to create organization");
        } finally {
            setCreating(false);
        }
    };

    return (
        <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-600">
                    <Building2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Welcome to Dona!</CardTitle>
                <CardDescription>
                    Let&apos;s set up your organization to get started.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">
                                Hi <span className="font-medium text-foreground">{user.name || user.email}</span>!
                                An organization is required to manage your content.
                                Everything in Dona belongs to an organization.
                            </p>
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <Label>Organization Logo</Label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50 overflow-hidden group"
                                >
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ImagePlus className="h-6 w-6 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                                    )}
                                </button>
                                <div className="space-y-1">
                                    {logoPreview ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={removeLogo}
                                            className="text-destructive hover:text-destructive h-auto px-2 py-1"
                                        >
                                            <X className="mr-1 h-3 w-3" />
                                            Remove
                                        </Button>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            Click to upload a logo.<br />
                                            PNG, JPG or SVG. Max 2MB.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoSelect}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="org-name">Organization Name</Label>
                                <Input
                                    id="org-name"
                                    placeholder="e.g., My Company, Personal Blog"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    disabled={creating}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="org-slug">URL Slug</Label>
                                <Input
                                    id="org-slug"
                                    placeholder="my-company"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                    disabled={creating}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Used in URLs: /blog/{slug || "slug"}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handleCreateOrganization}
                                disabled={creating || !name.trim() || !slug.trim()}
                                className="w-full"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create Organization
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                You&apos;ll be the owner of this organization
                            </p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="text-center space-y-4 py-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Organization Created!</h3>
                            <p className="text-muted-foreground">
                                &quot;{name}&quot; is ready to use.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Redirecting to dashboard...
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
