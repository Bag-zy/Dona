import {
    CopilotRuntime,
    ExperimentalEmptyAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest } from "next/server";

// 1. Use the empty adapter since we have a LangGraph agent
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime and connect to the Dona LangGraph agent
const runtime = new CopilotRuntime({
    agents: {
        default: new LangGraphHttpAgent({
            agentId: "default",
            description: "Dona AI blog assistant default agent.",
            url: `${process.env.DONA_AGENT_URL || "http://127.0.0.1:8123"}/copilotkit`,
        }),
    },
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
