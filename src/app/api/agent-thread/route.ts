import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api";
import { db } from "@/lib/db";
import { chatThreads, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

// GET - List all threads for current user + ensure at least one exists
export async function GET() {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    try {
        let threads = await db
            .select()
            .from(chatThreads)
            .where(eq(chatThreads.userId, auth.user.id))
            .orderBy(desc(chatThreads.updatedAt));

        // If no threads exist, create a default one
        if (threads.length === 0) {
            const threadId = randomUUID();
            const [newThread] = await db
                .insert(chatThreads)
                .values({
                    userId: auth.user.id,
                    threadId,
                    title: "New conversation",
                })
                .returning();

            // Set as active
            await db
                .update(users)
                .set({ activeThreadId: newThread.id })
                .where(eq(users.id, auth.user.id));

            threads = [newThread];
        }

        // Get active thread ID from user
        const [user] = await db
            .select({ activeThreadId: users.activeThreadId })
            .from(users)
            .where(eq(users.id, auth.user.id))
            .limit(1);

        const activeId = user?.activeThreadId || threads[0].id;

        return NextResponse.json({
            threads,
            activeThreadId: activeId,
        });
    } catch (error) {
        console.error("Error listing threads:", error);
        return NextResponse.json({ error: "Failed to list threads" }, { status: 500 });
    }
}

// POST - Create a new thread and set it as active
export async function POST() {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    try {
        const threadId = randomUUID();
        const [newThread] = await db
            .insert(chatThreads)
            .values({
                userId: auth.user.id,
                threadId,
                title: "New conversation",
            })
            .returning();

        // Set as active thread
        await db
            .update(users)
            .set({ activeThreadId: newThread.id })
            .where(eq(users.id, auth.user.id));

        return NextResponse.json(newThread);
    } catch (error) {
        console.error("Error creating thread:", error);
        return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
    }
}

// PUT - Switch to a different thread (set active)
export async function PUT(req: Request) {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    try {
        const { threadId } = await req.json();
        if (!threadId) {
            return NextResponse.json({ error: "threadId required" }, { status: 400 });
        }

        // Verify thread belongs to user
        const [thread] = await db
            .select()
            .from(chatThreads)
            .where(eq(chatThreads.id, threadId))
            .limit(1);

        if (!thread || thread.userId !== auth.user.id) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        await db
            .update(users)
            .set({ activeThreadId: threadId })
            .where(eq(users.id, auth.user.id));

        return NextResponse.json({ success: true, thread });
    } catch (error) {
        console.error("Error switching thread:", error);
        return NextResponse.json({ error: "Failed to switch thread" }, { status: 500 });
    }
}

// DELETE - Delete a thread
export async function DELETE(req: Request) {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const threadId = searchParams.get("id");

        if (!threadId) {
            return NextResponse.json({ error: "Thread id required" }, { status: 400 });
        }

        // Verify thread belongs to user
        const [thread] = await db
            .select()
            .from(chatThreads)
            .where(eq(chatThreads.id, threadId))
            .limit(1);

        if (!thread || thread.userId !== auth.user.id) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        await db.delete(chatThreads).where(eq(chatThreads.id, threadId));

        // If deleted thread was active, switch to the most recent one
        const [user] = await db
            .select({ activeThreadId: users.activeThreadId })
            .from(users)
            .where(eq(users.id, auth.user.id))
            .limit(1);

        if (user?.activeThreadId === threadId) {
            const [nextThread] = await db
                .select()
                .from(chatThreads)
                .where(eq(chatThreads.userId, auth.user.id))
                .orderBy(desc(chatThreads.updatedAt))
                .limit(1);

            await db
                .update(users)
                .set({ activeThreadId: nextThread?.id || null })
                .where(eq(users.id, auth.user.id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting thread:", error);
        return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
    }
}
