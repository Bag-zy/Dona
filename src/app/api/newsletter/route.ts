import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireOrgRole } from "@/lib/auth/api";

// GET - List all subscribers for current organization (admin/editor only)
export async function GET() {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    try {
        const list = await db
            .select()
            .from(newsletterSubscribers)
            .where(eq(newsletterSubscribers.organizationId, organizationId))
            .orderBy(desc(newsletterSubscribers.subscribedAt));
        return NextResponse.json({ subscribers: list });
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
    }
}

// POST - Subscribe (public - requires organization context in body)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, organizationId } = body;

        if (!organizationId) {
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Please provide a valid email address" },
                { status: 400 }
            );
        }

        // Check if already subscribed
        const existing = await db
            .select()
            .from(newsletterSubscribers)
            .where(and(
                eq(newsletterSubscribers.email, email.toLowerCase()),
                eq(newsletterSubscribers.organizationId, organizationId)
            ))
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json(
                { error: "This email is already subscribed" },
                { status: 409 }
            );
        }

        await db.insert(newsletterSubscribers).values({
            email: email.toLowerCase(),
            confirmed: false,
            organizationId,
        });

        // TODO: Send confirmation email via SMTP

        return NextResponse.json({ message: "Subscribed successfully" });
    } catch (error) {
        console.error("Newsletter signup error:", error);
        return NextResponse.json(
            { error: "Failed to subscribe" },
            { status: 500 }
        );
    }
}

// PUT - Update subscriber (confirm/unconfirm) - admin/editor only
export async function PUT(request: NextRequest) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { id, confirmed } = body;

        if (!id) {
            return NextResponse.json({ error: "Subscriber ID is required" }, { status: 400 });
        }

        const [updated] = await db
            .update(newsletterSubscribers)
            .set({ confirmed })
            .where(and(
                eq(newsletterSubscribers.id, id),
                eq(newsletterSubscribers.organizationId, organizationId)
            ))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
        }

        console.log(`Subscriber ${updated.email} updated by ${user.email}`);
        return NextResponse.json({ subscriber: updated });
    } catch (error) {
        console.error("Error updating subscriber:", error);
        return NextResponse.json({ error: "Failed to update subscriber" }, { status: 500 });
    }
}

// DELETE - Remove subscriber - admin only
export async function DELETE(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Subscriber ID is required" }, { status: 400 });
        }

        const [deleted] = await db
            .delete(newsletterSubscribers)
            .where(and(
                eq(newsletterSubscribers.id, id),
                eq(newsletterSubscribers.organizationId, organizationId)
            ))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
        }

        console.log(`Subscriber ${deleted.email} deleted by ${user.email}`);
        return NextResponse.json({ success: true, subscriber: deleted });
    } catch (error) {
        console.error("Error deleting subscriber:", error);
        return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
    }
}
