import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api";
import { db } from "@/lib/db";
import { chatThreads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH - Rename a thread
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const { title } = await req.json();

        if (!title || typeof title !== "string") {
            return NextResponse.json({ error: "Title required" }, { status: 400 });
        }

        // Verify thread belongs to user
        const [thread] = await db
            .select()
            .from(chatThreads)
            .where(eq(chatThreads.id, id))
            .limit(1);

        if (!thread || thread.userId !== auth.user.id) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        const [updated] = await db
            .update(chatThreads)
            .set({ title, updatedAt: new Date() })
            .where(eq(chatThreads.id, id))
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error renaming thread:", error);
        return NextResponse.json({ error: "Failed to rename thread" }, { status: 500 });
    }
}
