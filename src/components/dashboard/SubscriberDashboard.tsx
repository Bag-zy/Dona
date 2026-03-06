"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Mail, FileText, Bookmark, Bell, Settings } from "lucide-react";
import Link from "next/link";
import type { AuthUser } from "@/lib/auth/rbac";

interface SubscriberDashboardProps {
    user: AuthUser;
}

export function SubscriberDashboard({ user }: SubscriberDashboardProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
            {/* Header */}
            <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-600">
                            <Flame className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-rose-600 bg-clip-text text-transparent">
                            Dona
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                        <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Welcome, {user.name || user.email}!</h1>
                    <p className="text-muted-foreground mt-1">Your personal dashboard</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Subscribed</CardTitle>
                            <Mail className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">Yes</p>
                            <p className="text-xs text-muted-foreground">Newsletter active</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Bookmarks</CardTitle>
                            <Bookmark className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-muted-foreground">Saved posts</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Comments</CardTitle>
                            <FileText className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-muted-foreground">Your comments</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                            <Link href="/blog">
                                <FileText className="h-5 w-5" />
                                <span>Browse Posts</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                            <Link href="/newsletter">
                                <Mail className="h-5 w-5" />
                                <span>Newsletter</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                            <Link href="/notifications">
                                <Bell className="h-5 w-5" />
                                <span>Notifications</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                            <Link href="/account">
                                <Settings className="h-5 w-5" />
                                <span>Settings</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
