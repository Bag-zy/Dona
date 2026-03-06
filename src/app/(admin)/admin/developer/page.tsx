import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { DeveloperSettingsClient } from "@/components/admin/DeveloperSettingsClient";

export const revalidate = 0; // Don't cache API keys

async function getApiKeys(userId: string) {
    try {
        return await db
            .select({
                id: apiKeys.id,
                name: apiKeys.name,
                keyPrefix: apiKeys.keyPrefix,
                scopes: apiKeys.scopes,
                createdAt: apiKeys.createdAt,
                lastUsedAt: apiKeys.lastUsedAt,
                expiresAt: apiKeys.expiresAt,
                revoked: apiKeys.revoked,
            })
            .from(apiKeys)
            .where(eq(apiKeys.userId, userId))
            .orderBy(desc(apiKeys.createdAt));
    } catch (error) {
        console.error("Error fetching API keys:", error);
        return [];
    }
}

export default async function DeveloperSettingsPage() {
    const userId = "admin"; // TODO: get from auth session
    const keys = await getApiKeys(userId);

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-2xl font-bold">Developer Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage API keys for accessing the Dona REST API programmatically.
                </p>
            </div>

            {/* Client component handles modals, copying, and API calls */}
            <DeveloperSettingsClient initialKeys={keys} userId={userId} />
        </div>
    );
}
