"use client";

import { useState, useEffect, useCallback } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { CopilotGlobalActions } from "@/components/ai/CopilotGlobalActions";
import { DynamicCopilotSuggestions } from "@/components/ai/DynamicCopilotSuggestions";
import { ChatThreadPanel, type ChatThread } from "@/components/ai/ChatThreadPanel";
import { Button } from "@/components/ui/button";
import { History, Plus } from "lucide-react";
import { usePathname } from "next/navigation";

export function AIAssistantSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || "";
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [activeThreadUUID, setActiveThreadUUID] = useState<string | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [key, setKey] = useState(0); // Force re-mount CopilotKit on thread switch

    const loadThreads = useCallback(async () => {
        try {
            const res = await fetch("/api/agent-thread");
            const data = await res.json();
            if (data.threads) {
                setThreads(data.threads);
                setActiveThreadId(data.activeThreadId);
                // Find the LangGraph threadId (UUID) for the active thread
                const active = data.threads.find(
                    (t: ChatThread) => t.id === data.activeThreadId
                );
                if (active) {
                    setActiveThreadUUID(active.threadId);
                }
            }
        } catch (err) {
            console.error("Failed to load threads:", err);
        }
    }, []);

    useEffect(() => {
        loadThreads();
    }, [loadThreads]);

    const handleNewThread = async () => {
        try {
            const res = await fetch("/api/agent-thread", { method: "POST" });
            const newThread = await res.json();
            if (newThread.id) {
                setActiveThreadId(newThread.id);
                setActiveThreadUUID(newThread.threadId);
                setKey((k) => k + 1); // Force re-mount
                await loadThreads();
            }
        } catch (err) {
            console.error("Failed to create thread:", err);
        }
    };

    const handleSwitchThread = async (threadId: string) => {
        try {
            await fetch("/api/agent-thread", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ threadId }),
            });
            const thread = threads.find((t) => t.id === threadId);
            if (thread) {
                setActiveThreadId(threadId);
                setActiveThreadUUID(thread.threadId);
                setKey((k) => k + 1); // Force re-mount
            }
        } catch (err) {
            console.error("Failed to switch thread:", err);
        }
    };

    const handleDeleteThread = async (threadId: string) => {
        try {
            await fetch(`/api/agent-thread?id=${threadId}`, { method: "DELETE" });
            await loadThreads();
            // If we deleted the active thread, force re-mount
            if (threadId === activeThreadId) {
                setKey((k) => k + 1);
            }
        } catch (err) {
            console.error("Failed to delete thread:", err);
        }
    };

    const handleRenameThread = async (threadId: string, title: string) => {
        try {
            await fetch(`/api/agent-thread/${threadId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });
            await loadThreads();
        } catch (err) {
            console.error("Failed to rename thread:", err);
        }
    };

    if (!activeThreadUUID) return <>{children}</>;

    return (
        <>
            <CopilotKit
                key={key}
                runtimeUrl="/api/copilotkit"
                agent="default"
                threadId={activeThreadUUID}
            >
                <CopilotGlobalActions />
                <DynamicCopilotSuggestions />
                <CopilotSidebar
                    labels={{
                        title: "Agent Dona",
                        initial: "Hi! I'm Agent Dona, your AI writing assistant. I can help you write blog posts, generate titles, create SEO metadata, and manage your blog content. What would you like to work on?",
                    }}
                    suggestions={(() => {
                        if (pathname.includes('/admin/posts/new') || pathname.includes('/admin/posts/edit')) {
                            return [
                                { title: "Draft a Post", message: "Help me draft a new blog post." },
                                { title: "Suggest Titles", message: "Suggest some catchy titles for this post." },
                                { title: "SEO Metadata", message: "Generate SEO title and meta description for this post based on its content." },
                                { title: "Summarize", message: "Summarize the current content into a short excerpt." },
                            ];
                        }
                        if (pathname.includes('/admin/posts')) {
                            return [
                                { title: "New Post Ideas", message: "Suggest 3 ideas for my next blog post." },
                                { title: "Categories", message: "Navigate to the categories page to manage categories." },
                            ];
                        }
                        if (pathname.includes('/admin/comments')) {
                            return [
                                { title: "Review Pending", message: "Show me pending comments to moderate." },
                                { title: "Reply to Comment", message: "Draft a polite reply to a comment." },
                            ];
                        }
                        if (pathname.includes('/admin/categories')) {
                            return [
                                { title: "Create New Category", message: "Help me create a new category." },
                                { title: "List Categories", message: "List all my current categories." },
                                { title: "Suggest Categories", message: "Suggest some top-level categories I should add to my blog." },
                            ];
                        }
                        if (pathname.includes('/admin/tags')) {
                            return [
                                { title: "Suggest Tags", message: "Suggest 10 popular tags used in tech blogs." },
                                { title: "Tag SEO", message: "Explain the SEO value of using tags on my posts." },
                            ];
                        }
                        if (pathname.includes('/admin/settings')) {
                            return [
                                { title: "Update Profile", message: "Help me write a new bio for my profile." },
                            ];
                        }
                        // Default dashboard / global suggestions
                        return [
                            { title: "Draft a Post", message: "Help me draft a new blog post." },
                            { title: "Posts", message: "Navigate to the posts page to view and manage all blog posts." },
                            { title: "Review Comments", message: "Navigate to the comments page and show me any pending comments to moderate." },
                            { title: "Manage Media", message: "Navigate to the media library to manage files." },
                        ];
                    })()}
                    defaultOpen={true}
                    clickOutsideToClose={false}
                    Header={() => (
                        <div className="flex items-center justify-between w-full px-4 py-2 border-b border-border/30">
                            <span className="text-sm font-semibold">Agent Dona</span>
                            <div className="flex items-center gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={handleNewThread}
                                    title="New conversation"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => setHistoryOpen(true)}
                                    title="Chat history"
                                >
                                    <History className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                >
                    {children}
                </CopilotSidebar>
            </CopilotKit>

            <ChatThreadPanel
                open={historyOpen}
                onOpenChange={setHistoryOpen}
                threads={threads}
                activeThreadId={activeThreadId}
                onSwitchThread={handleSwitchThread}
                onNewThread={handleNewThread}
                onDeleteThread={handleDeleteThread}
                onRenameThread={handleRenameThread}
            />
        </>
    );
}
