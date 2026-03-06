import Link from "next/link";
import { Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
    Platform: [
        { href: "/", label: "Home" },
        { href: "/search", label: "Search" },
        { href: "/docs", label: "API Docs" },
    ],
    Categories: [
        { href: "/category/technology", label: "Technology" },
        { href: "/category/design", label: "Design" },
        { href: "/category/business", label: "Business" },
        { href: "/category/lifestyle", label: "Lifestyle" },
    ],
    Company: [
        { href: "/about", label: "About" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
    ],
};

export function Footer() {
    return (
        <footer className="border-t border-border/40 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Brand + Newsletter */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 shadow-lg shadow-orange-500/25">
                                <Flame className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-rose-600 bg-clip-text text-transparent">
                                Dona
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            An AI-powered blog platform for modern creators. Write, publish,
                            and grow your audience with the help of Dona AI.
                        </p>
                        {/* Mini newsletter */}
                        <form className="flex gap-2 max-w-sm">
                            <Input
                                type="email"
                                placeholder="your@email.com"
                                className="h-9 flex-1"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                className="h-9 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white border-0"
                            >
                                Subscribe
                            </Button>
                        </form>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="text-sm font-semibold text-foreground mb-3">
                                {title}
                            </h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Dona. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Powered by Dona AI · Built with Next.js
                    </p>
                </div>
            </div>
        </footer>
    );
}
