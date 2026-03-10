import {
    CopilotRuntime,
    ExperimentalEmptyAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// 1. Use the empty adapter since we have a remote agent endpoint
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime and connect to the self-hosted Dona agent
//    via its CopilotKit remote endpoint (served by serve.py on Render)
const runtime = new CopilotRuntime({
    remoteEndpoints: [
        {
            url: `${process.env.DONA_AGENT_URL || "http://127.0.0.1:8123"}/copilotkit`,
        },
    ],
});

// 3. Build a Next.js API route that handles the CopilotKit runtime requests
const handler = async (req: NextRequest) => {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        runtime,
        serviceAdapter,
        endpoint: "/api/copilotkit",
    });

    return handleRequest(req);
};

export const POST = handler;
export const GET = handler;
