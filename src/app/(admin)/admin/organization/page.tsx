import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { OrganizationSettingsCards, OrganizationMembersCard } from "@daveyplate/better-auth-ui";

export default async function OrganizationPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    if (!user.currentOrganizationId) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Organization Settings</h1>
                    <p className="text-muted-foreground">
                        Create or select an organization to manage settings.
                    </p>
                </div>
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">
                        No organization selected. Use the organization switcher above to create or select an organization.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold">Organization Settings</h1>
                <p className="text-muted-foreground">
                    Manage your organization details and team members.
                </p>
            </div>

            <div className="grid gap-6">
                <OrganizationSettingsCards />
                <OrganizationMembersCard />
            </div>
        </div>
    );
}
