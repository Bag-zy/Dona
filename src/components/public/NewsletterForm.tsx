"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Sparkles } from "lucide-react";

export function NewsletterForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                toast.success("Subscribed! Check your inbox to confirm.");
                setEmail("");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to subscribe");
            }
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-rose-600 py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-white/80" />
                        <h2 className="text-3xl sm:text-4xl font-bold text-white">
                            Stay in the loop
                        </h2>
                    </div>
                    <p className="text-lg text-white/80">
                        Get the latest articles, tutorials, and insights delivered to your
                        inbox. No spam, unsubscribe anytime.
                    </p>
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                    >
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm focus:bg-white/30"
                        />
                        <Button
                            type="submit"
                            disabled={loading}
                            size="lg"
                            className="h-12 bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg"
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            {loading ? "Subscribing..." : "Subscribe"}
                        </Button>
                    </form>
                    <p className="text-xs text-white/60">
                        We respect your inbox. Unsubscribe anytime.
                    </p>
                </div>
            </div>
            {/* Decorative */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </section>
    );
}
