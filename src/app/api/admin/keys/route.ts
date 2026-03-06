import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { userId, name, scopes, expiresInDays, organizationId } = await req.json();

        if (!userId || !name || !scopes || !organizationId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Generate secure random token
        const rawToken = crypto.randomBytes(32).toString("base64url");
        const fullKey = `dona_${rawToken}`;
        const keyPrefix = fullKey.substring(0, 8); // dona_xxx

        // 2. Hash token for storage
        const keyHash = await bcrypt.hash(fullKey, 10);

        // 3. Calculate expiry
        let expiresAt: Date | null = null;
        if (expiresInDays && expiresInDays > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        // 4. Update DB
        const [newKey] = await db
            .insert(apiKeys)
            .values({
                userId,
                organizationId,
                name,
                keyPrefix,
                keyHash,
                scopes,
                expiresAt,
            })
            .returning({
                id: apiKeys.id,
                name: apiKeys.name,
                keyPrefix: apiKeys.keyPrefix,
                scopes: apiKeys.scopes,
                createdAt: apiKeys.createdAt,
                expiresAt: apiKeys.expiresAt,
                revoked: apiKeys.revoked,
            });

        // RETURN THE RAW KEY ONLY ONCE!
        return NextResponse.json({ key: newKey, rawKey: fullKey }, { status: 201 });
    } catch (error) {
        console.error("API key creation error:", error);
        return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { keyId, action } = await req.json();

        if (!keyId || action !== "revoke") {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        await db
            .update(apiKeys)
            .set({ revoked: true })
            .where(eq(apiKeys.id, keyId));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const keyId = searchParams.get("keyId");

        if (!keyId) {
            return NextResponse.json({ error: "Missing keyId" }, { status: 400 });
        }

        await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
    }
}
