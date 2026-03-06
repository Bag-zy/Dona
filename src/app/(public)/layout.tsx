import { Topbar } from "@/components/layout/Topbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Topbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
