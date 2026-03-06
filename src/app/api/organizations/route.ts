import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api";
import { createOrganization, getUserOrganizations } from "@/lib/auth/organization";

// GET - List user's organizations
export async function GET() {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    try {
        const organizations = await getUserOrganizations(auth.user.id);
        return NextResponse.json({ organizations });
    } catch (error) {
        console.error("Error fetching organizations:", error);
        return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
    }
}

// POST - Create new organization
export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    try {
        const { name, slug } = await request.json();

        if (!name || !slug) {
            return NextResponse.json(
                { error: "Name and slug are required" },
                { status: 400 }
            );
        }

        const org = await createOrganization(auth.user.id, name, slug);
        if (!org) {
            return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
        }

        console.log(`Organization "${name}" created by ${auth.user.email}`);
        return NextResponse.json({ organization: org }, { status: 201 });
    } catch (error: any) {
        if (error?.code === "23505") {
            return NextResponse.json(
                { error: "An organization with this slug already exists" },
                { status: 409 }
            );
        }
        console.error("Error creating organization:", error);
        return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }
}
