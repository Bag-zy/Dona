import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { UsersClient } from "@/components/admin/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
    const list = await db.select().from(users).orderBy(users.createdAt);

    return <UsersClient initialUsers={list} />;
}
