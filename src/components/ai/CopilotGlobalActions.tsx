"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useRouter, usePathname } from "next/navigation";

export function CopilotGlobalActions() {
    const router = useRouter();
    const pathname = usePathname();

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

    // We keep the generic navigation but add specific ones if needed, or rely on navigateToPage
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
        description: "Navigates the user to the categories management page. NOTE: Creating categories is done via a popup here, there is no /new page for categories.",
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

    return null;
}
