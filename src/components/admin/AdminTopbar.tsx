"use client";

import { Menu, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";
import { OrganizationSwitcher } from "@daveyplate/better-auth-ui";
import type { AuthUser } from "@/lib/auth/rbac";
import type { OrganizationWithRole } from "@/lib/auth/organization";

interface AdminTopbarProps {
    user: AuthUser;
    organizations: OrganizationWithRole[];
}

export function AdminTopbar({ user, organizations }: AdminTopbarProps) {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-4 lg:px-6 justify-between">
                <div className="flex items-center">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-2">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64 border-none">
                            <SheetTitle className="sr-only">Admin Navigation Drawer</SheetTitle>
                            <AdminSidebar user={user} organizations={organizations} isDrawer />
                        </SheetContent>
                    </Sheet>

                    <div className="flex items-center gap-3 ml-2 lg:ml-4">
                        <span className="text-sm font-medium text-muted-foreground hidden sm:flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Organization
                        </span>
                        <div className="dark">
                            <OrganizationSwitcher
                                hidePersonal={true}
                                localization={{ ORGANIZATION: "Select or Create an Organisation" }}
                                classNames={{
                                    trigger: {
                                        base: "bg-transparent border-0 hover:bg-white/10 text-foreground dark:text-gray-100",
                                    },
                                    content: {
                                        base: "border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60",
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Placeholder for future top right actions */}
                </div>
            </div>
        </header>
    );
}
