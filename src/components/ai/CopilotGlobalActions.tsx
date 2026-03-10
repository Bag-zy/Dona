"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// Types for blog state
interface PostState {
    id: string | null;
    title: string;
    content: string;
    excerpt: string;
    status: "draft" | "published" | "scheduled";
    slug: string;
}

interface BlogStats {
    totalPosts: number;
    totalCategories: number;
    totalTags: number;
    totalComments: number;
    pendingComments: number;
}

export function CopilotGlobalActions() {
    const router = useRouter();
    const pathname = usePathname();
    
    // Track current post state for the agent
    const [currentPost, setCurrentPost] = useState<PostState>({
        id: null,
        title: "",
        content: "",
        excerpt: "",
        status: "draft",
        slug: "",
    });
    
    const [blogStats, setBlogStats] = useState<BlogStats>({
        totalPosts: 0,
        totalCategories: 0,
        totalTags: 0,
        totalComments: 0,
        pendingComments: 0,
    });

    // Make blog state readable to the agent
    useCopilotReadable({
        description: "Current post being edited",
        value: currentPost,
    });
    
    useCopilotReadable({
        description: "Blog statistics",
        value: blogStats,
    });

    // Fetch blog stats on mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [postsRes, categoriesRes, tagsRes, commentsRes] = await Promise.all([
                    fetch("/api/posts?limit=1"),
                    fetch("/api/categories"),
                    fetch("/api/tags"),
                    fetch("/api/comments"),
                ]);
                
                const postsData = await postsRes.json();
                const categoriesData = await categoriesRes.json();
                const tagsData = await tagsRes.json();
                const commentsData = await commentsRes.json();
                
                setBlogStats({
                    totalPosts: postsData.posts?.length || 0,
                    totalCategories: categoriesData.categories?.length || 0,
                    totalTags: tagsData.tags?.length || 0,
                    totalComments: commentsData.comments?.length || 0,
                    pendingComments: commentsData.comments?.filter((c: any) => c.status === "pending").length || 0,
                });
            } catch (error) {
                console.error("Failed to fetch blog stats:", error);
            }
        };
        
        fetchStats();
    }, []);

    // =========================================================================
    // Navigation Actions
    // =========================================================================

    useCopilotAction({
        name: "navigateToPage",
        description: "Navigates the user to a specific page.",
        available: "remote",
        parameters: [
            {
                name: "path",
                type: "string",
                description: "The URL path to navigate to (e.g., /admin, /admin/posts)",
                required: true,
            },
        ],
        handler: async ({ path }) => {
            router.push(path);
            return `Successfully navigated to ${path}`;
        },
    });

    useCopilotAction({
        name: "navigateToPostEditor",
        description: "Navigates the user to the post editor to create a new post.",
        available: "remote",
        handler: async () => {
            router.push("/admin/posts/new");
            return "Successfully navigated to the new post editor.";
        },
    });

    useCopilotAction({
        name: "navigateToDashboard",
        description: "Navigates the user to the admin dashboard.",
        available: "remote",
        handler: async () => {
            router.push("/admin");
            return "Successfully navigated to the dashboard.";
        },
    });

    useCopilotAction({
        name: "refreshPage",
        description: "Refreshes the current page. Call this after making changes to the database so the UI updates.",
        available: "remote",
        handler: async () => {
            router.refresh();
            return "Page refreshed successfully.";
        },
    });

    useCopilotAction({
        name: "navigateToSettings",
        description: "Navigates the user to the site settings page.",
        available: "remote",
        handler: async () => {
            router.push("/admin/settings");
            return "Navigated to settings.";
        },
    });

    useCopilotAction({
        name: "navigateToComments",
        description: "Navigates the user to the comments moderation page.",
        available: "remote",
        handler: async () => {
            router.push("/admin/comments");
            return "Navigated to comments.";
        },
    });

    useCopilotAction({
        name: "navigateToCategories",
        description: "Navigates the user to the categories management page.",
        available: "remote",
        handler: async () => {
            router.push("/admin/categories");
            return "Navigated to categories.";
        },
    });

    useCopilotAction({
        name: "navigateToTags",
        description: "Navigates the user to the tags management page.",
        available: "remote",
        handler: async () => {
            router.push("/admin/tags");
            return "Navigated to tags.";
        },
    });

    useCopilotAction({
        name: "navigateToUsers",
        description: "Navigates the user to the users management page.",
        available: "remote",
        handler: async () => {
            router.push("/admin/users");
            return "Navigated to users.";
        },
    });

    useCopilotAction({
        name: "navigateToMedia",
        description: "Navigates the user to the media library page.",
        available: "remote",
        handler: async () => {
            router.push("/admin/media");
            return "Navigated to media library.";
        },
    });

    useCopilotAction({
        name: "navigateToNewsletter",
        description: "Navigates the user to the newsletter subscribers page.",
        available: "remote",
        handler: async () => {
            router.push("/admin/newsletter");
            return "Navigated to newsletter.";
        },
    });

    useCopilotAction({
        name: "navigateToDeveloper",
        description: "Navigates the user to the developer API keys page.",
        available: "remote",
        handler: async () => {
            router.push("/admin/developer");
            return "Navigated to developer settings.";
        },
    });

    useCopilotAction({
        name: "navigateToPosts",
        description: "Navigates the user to the posts list page.",
        available: "remote",
        handler: async () => {
            router.push("/admin/posts");
            return "Navigated to posts.";
        },
    });

    // =========================================================================
    // Post Content Actions
    // =========================================================================

    useCopilotAction({
        name: "setPostTitle",
        description: "Sets the title of the current post being edited.",
        available: "remote",
        parameters: [
            {
                name: "title",
                type: "string",
                description: "The new title for the post",
                required: true,
            },
        ],
        handler: async ({ title }) => {
            setCurrentPost(prev => ({ ...prev, title }));
            return `Post title set to: "${title}"`;
        },
    });

    useCopilotAction({
        name: "setPostContent",
        description: "Sets the main content of the current post being edited.",
        available: "remote",
        parameters: [
            {
                name: "content",
                type: "string",
                description: "The new content for the post",
                required: true,
            },
        ],
        handler: async ({ content }) => {
            setCurrentPost(prev => ({ ...prev, content }));
            return `Post content updated (${content.length} characters)`;
        },
    });

    useCopilotAction({
        name: "appendPostContent",
        description: "Appends text to the end of the current post content.",
        available: "remote",
        parameters: [
            {
                name: "content",
                type: "string",
                description: "The content to append to the post",
                required: true,
            },
        ],
        handler: async ({ content }) => {
            setCurrentPost(prev => ({ 
                ...prev, 
                content: prev.content + "\n\n" + content 
            }));
            return `Content appended to post`;
        },
    });

    useCopilotAction({
        name: "setPostExcerpt",
        description: "Sets the excerpt/summary of the current post.",
        available: "remote",
        parameters: [
            {
                name: "excerpt",
                type: "string",
                description: "The excerpt for the post (short summary)",
                required: true,
            },
        ],
        handler: async ({ excerpt }) => {
            setCurrentPost(prev => ({ ...prev, excerpt }));
            return `Post excerpt set to: "${excerpt}"`;
        },
    });

    useCopilotAction({
        name: "setPostSlug",
        description: "Sets the URL slug of the current post.",
        available: "remote",
        parameters: [
            {
                name: "slug",
                type: "string",
                description: "The URL slug for the post (lowercase, hyphens, no spaces)",
                required: true,
            },
        ],
        handler: async ({ slug }) => {
            setCurrentPost(prev => ({ ...prev, slug }));
            return `Post slug set to: "${slug}"`;
        },
    });

    useCopilotAction({
        name: "setPostStatus",
        description: "Sets the status of the current post (draft, published, or scheduled).",
        available: "remote",
        parameters: [
            {
                name: "status",
                type: "string",
                description: "The status to set: 'draft', 'published', or 'scheduled'",
                required: true,
            },
        ],
        handler: async ({ status }) => {
            if (!["draft", "published", "scheduled"].includes(status)) {
                return `Invalid status: ${status}. Must be 'draft', 'published', or 'scheduled'.`;
            }
            setCurrentPost(prev => ({ 
                ...prev, 
                status: status as "draft" | "published" | "scheduled" 
            }));
            return `Post status set to: ${status}`;
        },
    });

    // =========================================================================
    // Category Actions
    // =========================================================================

    useCopilotAction({
        name: "createCategory",
        description: "Creates a new category via the API.",
        available: "remote",
        parameters: [
            {
                name: "name",
                type: "string",
                description: "The name of the category",
                required: true,
            },
            {
                name: "slug",
                type: "string",
                description: "The URL slug for the category",
                required: true,
            },
            {
                name: "description",
                type: "string",
                description: "Optional description for the category",
                required: false,
            },
        ],
        handler: async ({ name, slug, description }) => {
            try {
                const res = await fetch("/api/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, slug, description }),
                });
                
                if (!res.ok) {
                    const error = await res.json();
                    return `Failed to create category: ${error.error}`;
                }
                
                const data = await res.json();
                router.refresh();
                return `Category "${data.category.name}" created successfully`;
            } catch (error) {
                return `Error creating category: ${error}`;
            }
        },
    });

    useCopilotAction({
        name: "deleteCategory",
        description: "Deletes a category by ID.",
        available: "remote",
        parameters: [
            {
                name: "id",
                type: "string",
                description: "The ID of the category to delete",
                required: true,
            },
        ],
        handler: async ({ id }) => {
            try {
                const res = await fetch(`/api/categories?id=${id}`, {
                    method: "DELETE",
                });
                
                if (!res.ok) {
                    const error = await res.json();
                    return `Failed to delete category: ${error.error}`;
                }
                
                router.refresh();
                return `Category deleted successfully`;
            } catch (error) {
                return `Error deleting category: ${error}`;
            }
        },
    });

    // =========================================================================
    // Tag Actions
    // =========================================================================

    useCopilotAction({
        name: "createTag",
        description: "Creates a new tag via the API.",
        available: "remote",
        parameters: [
            {
                name: "name",
                type: "string",
                description: "The name of the tag",
                required: true,
            },
            {
                name: "slug",
                type: "string",
                description: "The URL slug for the tag",
                required: true,
            },
        ],
        handler: async ({ name, slug }) => {
            try {
                const res = await fetch("/api/tags", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, slug }),
                });
                
                if (!res.ok) {
                    const error = await res.json();
                    return `Failed to create tag: ${error.error}`;
                }
                
                const data = await res.json();
                router.refresh();
                return `Tag "${data.tag.name}" created successfully`;
            } catch (error) {
                return `Error creating tag: ${error}`;
            }
        },
    });

    useCopilotAction({
        name: "deleteTag",
        description: "Deletes a tag by ID.",
        available: "remote",
        parameters: [
            {
                name: "id",
                type: "string",
                description: "The ID of the tag to delete",
                required: true,
            },
        ],
        handler: async ({ id }) => {
            try {
                const res = await fetch(`/api/tags?id=${id}`, {
                    method: "DELETE",
                });
                
                if (!res.ok) {
                    const error = await res.json();
                    return `Failed to delete tag: ${error.error}`;
                }
                
                router.refresh();
                return `Tag deleted successfully`;
            } catch (error) {
                return `Error deleting tag: ${error}`;
            }
        },
    });

    // =========================================================================
    // Comment Moderation Actions
    // =========================================================================

    useCopilotAction({
        name: "approveComment",
        description: "Approves a pending comment.",
        available: "remote",
        parameters: [
            {
                name: "commentId",
                type: "string",
                description: "The ID of the comment to approve",
                required: true,
            },
        ],
        handler: async ({ commentId }) => {
            try {
                const res = await fetch("/api/comments", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: commentId, status: "approved" }),
                });
                
                if (!res.ok) {
                    return `Failed to approve comment`;
                }
                
                router.refresh();
                return `Comment approved successfully`;
            } catch (error) {
                return `Error approving comment: ${error}`;
            }
        },
    });

    useCopilotAction({
        name: "rejectComment",
        description: "Rejects a comment by moving it to trash.",
        available: "remote",
        parameters: [
            {
                name: "commentId",
                type: "string",
                description: "The ID of the comment to reject",
                required: true,
            },
        ],
        handler: async ({ commentId }) => {
            try {
                const res = await fetch("/api/comments", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: commentId, status: "trash" }),
                });
                
                if (!res.ok) {
                    return `Failed to reject comment`;
                }
                
                router.refresh();
                return `Comment rejected and moved to trash`;
            } catch (error) {
                return `Error rejecting comment: ${error}`;
            }
        },
    });

    useCopilotAction({
        name: "markCommentSpam",
        description: "Marks a comment as spam.",
        available: "remote",
        parameters: [
            {
                name: "commentId",
                type: "string",
                description: "The ID of the comment to mark as spam",
                required: true,
            },
        ],
        handler: async ({ commentId }) => {
            try {
                const res = await fetch("/api/comments", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: commentId, status: "spam" }),
                });
                
                if (!res.ok) {
                    return `Failed to mark comment as spam`;
                }
                
                router.refresh();
                return `Comment marked as spam`;
            } catch (error) {
                return `Error marking comment as spam: ${error}`;
            }
        },
    });

    return null;
}
