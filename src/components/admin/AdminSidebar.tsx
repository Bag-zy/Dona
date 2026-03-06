"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    FolderOpen,
    Tags,
    Users,
    Image,
    MessageSquare,
    Mail,
    Settings,
    Code,
    Flame,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/client";
import { OrganizationSwitcher } from "@daveyplate/better-auth-ui";
import type { AuthUser } from "@/lib/auth/rbac";
import type { OrganizationWithRole } from "@/lib/auth/organization";

const sidebarItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/posts", icon: FileText, label: "Posts" },
    { href: "/admin/categories", icon: FolderOpen, label: "Categories" },
    { href: "/admin/tags", icon: Tags, label: "Tags" },
    { href: "/admin/users", icon: Users, label: "Users", adminOnly: true },
    { href: "/admin/media", icon: Image, label: "Media" },
    { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
    { href: "/admin/newsletter", icon: Mail, label: "Newsletter" },
    { href: "/admin/developer", icon: Code, label: "Developer" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
];

interface AdminSidebarProps {
    user: AuthUser;
    organizations: OrganizationWithRole[];
    isDrawer?: boolean;
    isMini?: boolean;
}

export function AdminSidebar({ user, organizations, isDrawer, isMini }: AdminSidebarProps) {
    const pathname = usePathname();
    const [collapsedState, setCollapsed] = useState(false);
    const collapsed = isMini ? true : (isDrawer ? false : collapsedState);

    const handleSignOut = async () => {
        await authClient.signOut();
        window.location.href = "/";
    };

    const filteredItems = sidebarItems.filter(
        (item) => !item.adminOnly || user.role === "admin"
    );

    return (
        <aside
            className={cn(
                "h-full flex flex-col bg-card transition-all duration-300 z-30",
                isDrawer ? "w-full border-0" : [collapsed ? "w-16 hidden sm:flex" : "w-64", "h-screen sticky top-0 border-r border-border/40"]
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-2 h-16 px-4 border-b border-border/40">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-600">
                    <Flame className="h-5 w-5 text-white" />
                </div>
                {!collapsed && (
                    <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-rose-600 bg-clip-text text-transparent">
                        Dona Admin
                    </span>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {filteredItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-gradient-to-r from-orange-500/10 to-rose-600/10 text-foreground border border-orange-500/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-orange-500")} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <Separator />

            {/* Organization Switcher & User Actions */}
            <div className={cn("p-3 flex items-center justify-center")}>
                {!collapsed ? (
                    <div className="flex w-full items-center gap-2 overflow-hidden">
                        <div className="flex-1 min-w-0">
                            <OrganizationSwitcher hidePersonal={false} />
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out" className="shrink-0">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
                        <LogOut className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Separator />

            {/* Collapse toggle */}
            {!isDrawer && !isMini && (
                <div className="p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => setCollapsed(!collapsedState)}
                    >
                        {collapsedState ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                <span>Collapse</span>
                            </>
                        )}
                    </Button>
                </div>
            )}
        </aside>
    );
}
