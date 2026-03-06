import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api";
import { switchOrganization } from "@/lib/auth/organization";

// POST - Switch current organization
export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    try {
        const { organizationId } = await request.json();

        if (!organizationId) {
            return NextResponse.json(
                { error: "Organization ID is required" },
                { status: 400 }
            );
        }

        const success = await switchOrganization(auth.user.id, organizationId);
        if (!success) {
            return NextResponse.json(
                { error: "You don't have access to this organization" },
                { status: 403 }
            );
        }

        console.log(`User ${auth.user.email} switched to organization ${organizationId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error switching organization:", error);
        return NextResponse.json({ error: "Failed to switch organization" }, { status: 500 });
    }
}
