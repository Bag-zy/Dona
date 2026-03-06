import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOrgRole } from "@/lib/auth/api";

// GET - Get site settings for current organization
export async function GET() {
    const auth = await requireOrgRole("member");
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    try {
        const settings = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.organizationId, organizationId))
            .limit(1);
        return NextResponse.json({ settings: settings[0] || null });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// POST - Create initial settings (admin only)
export async function POST(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { siteName, siteDescription, logoUrl, socialLinks } = body;

        if (!siteName) {
            return NextResponse.json({ error: "Site name is required" }, { status: 400 });
        }

        const [newSettings] = await db
            .insert(siteSettings)
            .values({
                siteName,
                siteDescription: siteDescription || null,
                logoUrl: logoUrl || null,
                socialLinks: socialLinks || null,
                organizationId,
            })
            .returning();

        console.log(`Site settings created by ${user.email}`);
        return NextResponse.json({ settings: newSettings }, { status: 201 });
    } catch (error) {
        console.error("Error creating settings:", error);
        return NextResponse.json({ error: "Failed to create settings" }, { status: 500 });
    }
}

// PUT - Update settings (admin only)
export async function PUT(request: NextRequest) {
    const auth = await requireOrgRole("admin");
    if ("error" in auth) return auth.error;
    const { user, organizationId } = auth;

    try {
        const body = await request.json();
        const { id, siteName, siteDescription, logoUrl, socialLinks } = body;

        if (!id) {
            return NextResponse.json({ error: "Settings ID is required" }, { status: 400 });
        }

        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (siteName !== undefined) updateData.siteName = siteName;
        if (siteDescription !== undefined) updateData.siteDescription = siteDescription;
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
        if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

        const [updated] = await db
            .update(siteSettings)
            .set(updateData)
            .where(and(eq(siteSettings.id, id), eq(siteSettings.organizationId, organizationId)))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Settings not found" }, { status: 404 });
        }

        console.log(`Site settings updated by ${user.email}`);
        return NextResponse.json({ settings: updated });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
