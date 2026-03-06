import { NextRequest, NextResponse } from "next/server";
import { requireOrgRole } from "@/lib/auth/api";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PUT - Update organization details (admin/owner only)
export async function PUT(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { id, name, slug, logoUrl } = body;

        if (!id) {
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
        }

        // Verify the organization matches the current one
        if (id !== organizationId) {
            return NextResponse.json({ error: "Cannot update this organization" }, { status: 403 });
        }

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const [updated] = await db
            .update(organizations)
            .set(updateData)
            .where(eq(organizations.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        console.log(`Organization "${updated.name}" updated by ${user.email}`);
        return NextResponse.json({ organization: updated });
    } catch (error: any) {
        if (error?.code === "23505") {
            return NextResponse.json({ error: "An organization with this slug already exists" }, { status: 409 });
        }
        console.error("Error updating organization:", error);
        return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
    }
}
