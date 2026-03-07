import {
    CopilotRuntime,
    ExperimentalEmptyAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest } from "next/server";

// 1. Use the empty adapter since we have a single LangGraph agent
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime and connect to the Dona LangGraph agent
const runtime = new CopilotRuntime({
    agents: {
        default: new LangGraphAgent({
            deploymentUrl:
                process.env.DONA_AGENT_URL || "http://127.0.0.1:8123",
            graphId: "dona_agent",
            langsmithApiKey: process.env.LANGSMITH_API_KEY || "",
        }),
    },
});

// 3. Build a Next.js API route that handles the CopilotKit runtime requests
export const POST = async (req: NextRequest) => {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        runtime,
        serviceAdapter,
        endpoint: "/api/copilotkit",
    });

    return handleRequest(req);
};
