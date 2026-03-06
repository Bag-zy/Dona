import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface ApiAuthResult {
    userId: string;
    keyId: string;
    scopes: string;
}

export async function withApiAuth(
    req: NextRequest,
    requiredScope: "read" | "write"
): Promise<{ user?: ApiAuthResult; error?: NextResponse }> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return {
            error: NextResponse.json(
                { error: "Missing or invalid Authorization header. Use: Bearer dona_<token>" },
                { status: 401 }
            ),
        };
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token.startsWith("dona_")) {
        return {
            error: NextResponse.json(
                { error: "Invalid API key format. Keys must start with dona_" },
                { status: 401 }
            ),
        };
    }

    try {
        // Fetch all active (non-revoked) keys and compare hashes
        const keys = await db
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.revoked, false));

        for (const key of keys) {
            const match = await bcrypt.compare(token, key.keyHash);
            if (!match) continue;

            // Check expiry
            if (key.expiresAt && key.expiresAt < new Date()) {
                return {
                    error: NextResponse.json({ error: "API key has expired" }, { status: 401 }),
                };
            }

            // Check scope
            if (requiredScope === "write" && !key.scopes.includes("write")) {
                return {
                    error: NextResponse.json(
                        { error: "Insufficient permissions. This key only has read access." },
                        { status: 403 }
                    ),
                };
            }

            // Update last_used_at
            await db
                .update(apiKeys)
                .set({ lastUsedAt: new Date() })
                .where(eq(apiKeys.id, key.id));

            return {
                user: { userId: key.userId, keyId: key.id, scopes: key.scopes },
            };
        }

        return {
            error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
        };
    } catch (error) {
        console.error("API auth error:", error);
        return {
            error: NextResponse.json({ error: "Authentication failed" }, { status: 500 }),
        };
    }
}
