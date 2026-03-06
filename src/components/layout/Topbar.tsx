"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Search,
    Menu,
    X,
    Sun,
    Moon,
    Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { UserButton } from "@neondatabase/auth/react";

type NavLink = { href: string; label: string };

const defaultNavLinks: NavLink[] = [
    { href: "/", label: "Home" },
];

export function Topbar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { data: session } = authClient.useSession();
    const [navLinks, setNavLinks] = useState<NavLink[]>(defaultNavLinks);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.categories)) {
                        const categoryLinks = data.categories.map((cat: { name: string; slug: string }) => ({
                            href: `/category/${cat.slug}`,
                            label: cat.name,
                        }));
                        setNavLinks([{ href: "/", label: "Home" }, ...categoryLinks]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch topbar categories:", error);
            }
        };

        fetchCategories();
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 shadow-lg shadow-orange-500/25 transition-shadow group-hover:shadow-orange-500/40">
                        <Flame className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-rose-600 bg-clip-text text-transparent">
                        Dona
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                                ? "text-foreground bg-accent"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-2">
                    {/* Search toggle */}
                    {searchOpen ? (
                        <div className="hidden sm:flex items-center gap-2 animate-in slide-in-from-right-2">
                            <form action="/search" method="get">
                                <Input
                                    name="q"
                                    placeholder="Search posts..."
                                    className="w-48 lg:w-64 h-9"
                                    autoFocus
                                />
                            </form>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => setSearchOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 hidden sm:flex"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    )}

                    {/* Theme toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* Admin link */}
                    {session && (
                        <Link href="/admin">
                            <Button variant="outline" size="sm" className="hidden sm:inline-flex h-9">
                                Dashboard
                            </Button>
                        </Link>
                    )}

                    {session && (
                        <div className="hidden sm:flex">
                            <UserButton size="icon" />
                        </div>
                    )}

                    {/* Mobile menu toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background animate-in slide-in-from-top-2">
                    <div className="px-4 py-3 space-y-1">
                        {/* Mobile search */}
                        <form action="/search" method="get" className="pb-2">
                            <Input name="q" placeholder="Search posts..." className="h-10" />
                        </form>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                                    ? "text-foreground bg-accent"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {session && (
                            <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="outline" size="sm" className="w-full mt-2">
                                    Dashboard
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
