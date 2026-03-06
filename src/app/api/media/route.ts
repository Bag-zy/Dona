import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireOrgRole } from "@/lib/auth/api";

// GET - List all media for current organization (editor/admin only)
export async function GET() {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    try {
        const list = await db
            .select()
            .from(media)
            .where(eq(media.organizationId, organizationId))
            .orderBy(desc(media.uploadedAt));
        return NextResponse.json({ media: list });
    } catch (error) {
        console.error("Error fetching media:", error);
        return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
    }
}

// POST - Add media by URL (editor/admin only)
export async function POST(request: NextRequest) {
    const auth = await requireOrgRole("editor");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { url, type, fileName, mimeType, size } = body;

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const [newMedia] = await db
            .insert(media)
            .values({
                url,
                type: type || "document",
                fileName: fileName || null,
                mimeType: mimeType || null,
                size: size || null,
                uploaderId: user.id,
                organizationId,
            })
            .returning();

        console.log(`Media "${fileName || url}" uploaded by ${user.email}`);
        return NextResponse.json({ media: newMedia }, { status: 201 });
    } catch (error) {
        console.error("Error creating media:", error);
        return NextResponse.json({ error: "Failed to create media" }, { status: 500 });
    }
}

// DELETE - Delete media (admin only)
export async function DELETE(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
        }

        const [deleted] = await db
            .delete(media)
            .where(and(eq(media.id, id), eq(media.organizationId, organizationId)))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Media not found" }, { status: 404 });
        }

        console.log(`Media "${deleted.fileName || deleted.url}" deleted by ${user.email}`);
        return NextResponse.json({ success: true, media: deleted });
    } catch (error) {
        console.error("Error deleting media:", error);
        return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
    }
}
