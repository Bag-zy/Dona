import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { TagsClient } from "@/components/admin/TagsClient";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
    const list = await db.select().from(tags).orderBy(tags.name);

    return <TagsClient initialTags={list} />;
}
