"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MessageSquare,
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
} from "lucide-react";

export interface ChatThread {
    id: string;
    threadId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

interface ChatThreadPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    threads: ChatThread[];
    activeThreadId: string | null;
    onSwitchThread: (threadId: string) => void;
    onNewThread: () => void;
    onDeleteThread: (threadId: string) => void;
    onRenameThread: (threadId: string, title: string) => void;
}

function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function ChatThreadPanel({
    open,
    onOpenChange,
    threads,
    activeThreadId,
    onSwitchThread,
    onNewThread,
    onDeleteThread,
    onRenameThread,
}: ChatThreadPanelProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const startEditing = (thread: ChatThread) => {
        setEditingId(thread.id);
        setEditTitle(thread.title);
    };

    const confirmEdit = () => {
        if (editingId && editTitle.trim()) {
            onRenameThread(editingId, editTitle.trim());
        }
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle("");
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="w-80 sm:max-w-80 p-0 flex flex-col"
            >
                <SheetHeader className="p-4 pb-2 border-b border-border/50">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <MessageSquare className="h-4 w-4" />
                        Chat History
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                        Your past conversations with Agent Dona
                    </SheetDescription>
                    <Button
                        onClick={() => {
                            onNewThread();
                            onOpenChange(false);
                        }}
                        size="sm"
                        className="w-full mt-2 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Conversation
                    </Button>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {threads.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8">
                            No conversations yet
                        </div>
                    ) : (
                        threads.map((thread) => {
                            const isActive = thread.id === activeThreadId;
                            const isEditing = editingId === thread.id;

                            return (
                                <div
                                    key={thread.id}
                                    className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${isActive
                                            ? "bg-primary/10 border border-primary/20"
                                            : "hover:bg-muted/50 border border-transparent"
                                        }`}
                                    onClick={() => {
                                        if (!isEditing) {
                                            onSwitchThread(thread.id);
                                            onOpenChange(false);
                                        }
                                    }}
                                >
                                    {isEditing ? (
                                        <div className="flex items-center gap-1">
                                            <Input
                                                value={editTitle}
                                                onChange={(e) =>
                                                    setEditTitle(e.target.value)
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") confirmEdit();
                                                    if (e.key === "Escape") cancelEdit();
                                                }}
                                                className="h-7 text-sm"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirmEdit();
                                                }}
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    cancelEdit();
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    <span className="text-sm font-medium truncate">
                                                        {thread.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditing(thread);
                                                        }}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteThread(thread.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 pl-5.5">
                                                {formatRelativeTime(thread.updatedAt)}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
