import * as dotenv from "dotenv";
import { resolve } from "path";

// Load env before importing db
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "./src/lib/db";
import { users, posts, categories, tags, postCategories, postTags } from "./src/lib/db/schema";

async function seed() {
    console.log("Seeding database...");

    // 1. Create a User
    const [user] = await db
        .insert(users)
        .values({
            id: "admin", // Using 'admin' as ID to match hardcoded value in some admin components for now
            email: "admin@example.com",
            name: "Dona Admin",
            role: "admin",
            bio: "Creator of Dona Blog Platform",
        })
        .onConflictDoNothing()
        .returning();

    const authorId = user?.id || "admin";
    console.log(`User created/exists with ID: ${authorId}`);

    // 2. Create Categories
    const categoryValues = [
        { slug: "technology", name: "Technology", description: "Tech news and tutorials", organizationId: "org-1" },
        { slug: "design", name: "Design", description: "UI/UX design trends", organizationId: "org-1" },
        { slug: "business", name: "Business", description: "Entrepreneurship and startup tips", organizationId: "org-1" },
    ];

    await db.insert(categories).values(categoryValues).onConflictDoNothing();

    const insertedCategories = await db.select().from(categories);
    console.log(`Created/Fetched ${insertedCategories.length} categories.`);

    // 3. Create Tags
    const tagValues = [
        { slug: "nextjs", name: "Next.js", organizationId: "org-1" },
        { slug: "ai", name: "AI AI AI", organizationId: "org-1" },
        { slug: "react", name: "React", organizationId: "org-1" },
    ];

    await db.insert(tags).values(tagValues).onConflictDoNothing();

    const insertedTags = await db.select().from(tags);
    console.log(`Created/Fetched ${insertedTags.length} tags.`);

    // 4. Create a featured post
    const [post] = await db
        .insert(posts)
        .values({
            title: "Welcome to Dona: The AI-Powered Blog Platform",
            slug: "welcome-to-dona",
            excerpt: "Discover how Dona platform utilizes AI to help you write faster, better, and with more confidence.",
            content: {
                type: "doc",
                content: [
                    {
                        type: "paragraph",
                        content: [{ type: "text", text: "This is Dona. It is an AI-powered blog platform built with Next.js 15, NeonDB, and LangGraph." }],
                    },
                ],
            },
            featuredImage: "https://images.unsplash.com/photo-1620121478247-ec786ac330df?q=80&w=1932&auto=format&fit=crop",
            status: "published",
            authorId: authorId,
            organizationId: "org-1",
            publishedAt: new Date(),
            readingTime: 3,
        })
        .onConflictDoNothing()
        .returning();

    if (post && insertedCategories.length > 0) {
        await db.insert(postCategories).values({
            postId: post.id,
            categoryId: insertedCategories[0].id,
        }).onConflictDoNothing();
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
