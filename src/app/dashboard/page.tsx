import { getCurrentUser } from "@/lib/auth/rbac";
import { SubscriberDashboard } from "@/components/dashboard/SubscriberDashboard";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default async function DashboardPage() {
    const user = await getCurrentUser();

    return (
        <AuthGuard>
            {user && <SubscriberDashboard user={user} />}
        </AuthGuard>
    );
}
