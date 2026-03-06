import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { MediaClient } from "@/components/admin/MediaClient";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
    const list = await db.select().from(media).orderBy(desc(media.uploadedAt));

    return <MediaClient initialMedia={list} />;
}
