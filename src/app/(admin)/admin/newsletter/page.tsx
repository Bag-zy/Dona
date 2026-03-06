import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { NewsletterClient } from "@/components/admin/NewsletterClient";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
    const list = await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));

    return <NewsletterClient initialSubscribers={list} />;
}
