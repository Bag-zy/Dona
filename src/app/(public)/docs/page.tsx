"use client";

import { useEffect, useRef } from "react";

export default function ApiDocsPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load Scalar API reference
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.min.js";
        script.onload = () => {
            if ((window as any).Scalar && containerRef.current) {
                (window as any).Scalar.createApiReference(containerRef.current, {
                    spec: { url: "/api/openapi.json" },
                    theme: "default",
                });
            }
        };
        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, []);

    return (
        <div className="min-h-screen">
            <div ref={containerRef} className="w-full" />
        </div>
    );
}
