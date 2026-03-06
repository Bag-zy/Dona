"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Check,
    ChevronsUpDown,
    Building2,
    Plus,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { OrganizationWithRole } from "@/lib/auth/organization";

interface OrganizationSwitcherProps {
    currentOrganizationId: string | null;
    organizations: OrganizationWithRole[];
}

export function OrganizationSwitcher({
    currentOrganizationId,
    organizations,
}: OrganizationSwitcherProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [switching, setSwitching] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState("");
    const [newOrgSlug, setNewOrgSlug] = useState("");
    const [creating, setCreating] = useState(false);

    const currentOrg = organizations.find((org) => org.id === currentOrganizationId);

    const handleSwitch = async (organizationId: string) => {
        if (organizationId === currentOrganizationId) {
            setOpen(false);
            return;
        }

        setSwitching(organizationId);
        try {
            const response = await fetch("/api/organizations/switch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ organizationId }),
            });

            if (!response.ok) throw new Error("Failed to switch organization");

            toast.success("Organization switched successfully");
            router.refresh();
            setOpen(false);
        } catch (error) {
            toast.error("Failed to switch organization");
        } finally {
            setSwitching(null);
        }
    };

    const handleCreate = async () => {
        if (!newOrgName.trim() || !newOrgSlug.trim()) {
            toast.error("Name and slug are required");
            return;
        }

        setCreating(true);
        try {
            const response = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newOrgName.trim(),
                    slug: newOrgSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create organization");
            }

            toast.success("Organization created successfully");
            setCreateDialogOpen(false);
            setNewOrgName("");
            setNewOrgSlug("");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to create organization");
        } finally {
            setCreating(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select organization"
                    className="w-[200px] justify-between"
                >
                    {currentOrg ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                            {currentOrg.logoUrl ? (
                                <img
                                    src={currentOrg.logoUrl}
                                    alt={currentOrg.name}
                                    className="h-4 w-4 rounded"
                                />
                            ) : (
                                <Building2 className="h-4 w-4 shrink-0" />
                            )}
                            <span className="truncate">{currentOrg.name}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>Select organization</span>
                        </div>
                    )}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search organization..." />
                    <CommandList>
                        <CommandEmpty>No organization found.</CommandEmpty>
                        <CommandGroup heading="Organizations">
                            {organizations.map((org) => (
                                <CommandItem
                                    key={org.id}
                                    onSelect={() => handleSwitch(org.id)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        {org.logoUrl ? (
                                            <img
                                                src={org.logoUrl}
                                                alt={org.name}
                                                className="h-4 w-4 rounded"
                                            />
                                        ) : (
                                            <Building2 className="h-4 w-4" />
                                        )}
                                        <span className="flex-1 truncate">{org.name}</span>
                                        {switching === org.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            org.isCurrent && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false);
                                    setCreateDialogOpen(true);
                                }}
                                className="cursor-pointer"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Organization
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>

            {/* Create Organization Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Organization</DialogTitle>
                        <DialogDescription>
                            Create a new organization to manage your content and team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                                id="name"
                                placeholder="My Organization"
                                value={newOrgName}
                                onChange={(e) => {
                                    setNewOrgName(e.target.value);
                                    if (!newOrgSlug) {
                                        setNewOrgSlug(generateSlug(e.target.value));
                                    }
                                }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                placeholder="my-organization"
                                value={newOrgSlug}
                                onChange={(e) => setNewOrgSlug(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Used in URLs: /blog/{newOrgSlug || "slug"}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={creating}>
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Popover>
    );
}
