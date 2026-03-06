import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { CategoriesClient } from "@/components/admin/CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
    const list = await db.select().from(categories).orderBy(categories.name);

    return <CategoriesClient initialCategories={list} />;
}
