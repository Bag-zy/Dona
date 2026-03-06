import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AIAssistantSidebar } from "@/components/ai/AIAssistantSidebar";
import { getCurrentUser } from "@/lib/auth/rbac";
import { getUserOrganizations } from "@/lib/auth/organization";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    noStore();
    const user = await getCurrentUser();

    // Redirect to home if not authenticated
    if (!user) {
        redirect("/");
    }

    // Fetch user's organizations
    const organizations = await getUserOrganizations(user.id);

    // Redirect new users without an organization to onboarding wizard
    if (organizations.length === 0) {
        redirect("/setup/organization");
    }

    return (
        <div className="flex min-h-screen">
            <AdminSidebar user={user} organizations={organizations} isMini />
            <div className="flex-1 flex flex-col min-w-0">
                <AIAssistantSidebar>
                    <AdminTopbar user={user} organizations={organizations} />
                    <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
                </AIAssistantSidebar>
            </div>
        </div>
    );
}
