import { getCurrentUser } from "@/lib/auth/rbac";
import { OrganizationSetupWizard } from "@/components/organization/OrganizationSetupWizard";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default async function SetupOrganizationPage() {
    const user = await getCurrentUser();
    
    return (
        <AuthGuard>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
                <div className="w-full max-w-lg">
                    {user && <OrganizationSetupWizard user={user} />}
                </div>
            </div>
        </AuthGuard>
    );
}
