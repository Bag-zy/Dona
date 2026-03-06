import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { SettingsClient, type Settings } from "@/components/admin/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const settings = await db.select().from(siteSettings).limit(1);
    const config = (settings[0] as unknown as Settings) || null;

    return <SettingsClient initialSettings={config} />;
}
