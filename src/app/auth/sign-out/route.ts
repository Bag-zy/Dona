import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const redirectResponse = NextResponse.redirect(new URL("/", req.url));

    try {
        const session = await auth.getSession();
        if (!session) {
            return redirectResponse;
        }

        const origin = new URL(req.url).origin;
        const res = await fetch(`${origin}/api/auth/sign-out`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                cookie: req.headers.get("cookie") ?? "",
            },
            body: "{}",
        });

        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            redirectResponse.headers.set("set-cookie", setCookie);
        }
    } catch (error) {
        console.error("Sign out error:", error);
    }

    return redirectResponse;
}
