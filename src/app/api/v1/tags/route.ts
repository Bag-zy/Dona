import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
    const auth = await withApiAuth(request, "read");
    if (auth.error) return auth.error;

    try {
        const result = await db.select().from(tags).orderBy(tags.name);
        return NextResponse.json({ tags: result });
    } catch {
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
}
