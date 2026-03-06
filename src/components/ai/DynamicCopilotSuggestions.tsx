"use client";

import { useCopilotChatSuggestions } from "@copilotkit/react-core";
import { usePathname } from "next/navigation";

export function DynamicCopilotSuggestions() {
    const pathname = usePathname();

    let instructions = "";

    if (pathname.startsWith("/admin/posts")) {
        instructions = `
Provide the following exact suggestions to the user to help them manage posts:
1. "Draft a Post" (Navigate to the post editor and help me write a new blog post)
2. "Research On a Topic" (Use your search tool to gather information for my next post)
3. "Edit a Post" (Help me refine the draft or published post I am currently viewing)
4. "Schedule a Post" (Help me schedule this post for future publication)
        `;
    } else if (pathname.startsWith("/admin/categories")) {
        instructions = `
Provide the following exact suggestions to the user for managing categories:
1. "Create a Category" (Trigger the popup to create a new category)
2. "Explain Categories vs Tags" (Briefly explain to me how I should organize my content)
3. "Generate SEO Descriptions" (Look at my categories and suggest better SEO descriptions for them)
        `;
    } else if (pathname.startsWith("/admin/comments")) {
        instructions = `
Provide the following exact suggestions to the user for managing comments:
1. "Review Pending Comments" (Show me all comments awaiting moderation)
2. "Bulk Delete Spam" (Help me identify and delete spam comments)
        `;
    } else if (pathname.startsWith("/admin/settings")) {
        instructions = `
Provide the following exact suggestions to the user for site settings:
1. "Update Site Description" (Help me write a better SEO description for my blog)
2. "Check Missing Social Links" (Tell me which social links I haven't configured yet)
        `;
    } else {
        // Dashboard or default fallback dynamic suggestions
        instructions = `
Provide generic blog management suggestions:
1. "Analyze Dashboard Stats" (Tell me how my blog is performing based on the stats)
2. "Brainstorm Content Ideas" (Give me 5 trending topics in my niche)
        `;
    }

    useCopilotChatSuggestions({
        instructions,
        minSuggestions: 2,
        maxSuggestions: 4,
    }, [pathname]);

    return null;
}
