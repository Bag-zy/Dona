import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "Dona - Modern Blog Platform",
    description:
        "Dona is an AI-powered blog platform with rich content management, Dona AI assistant, and beautiful responsive design.",
    keywords: ["blog", "AI", "content management", "Dona"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
