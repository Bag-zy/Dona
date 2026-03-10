"""
Dona Agent Server - Serves the LangGraph agent via the CopilotKit SDK.
Exposes the /copilotkit endpoint for the CopilotKit runtime to connect to.

For deployment on Render, this uses uvicorn directly.
For local development, use `langgraph dev` instead (which provides LangGraph Studio).
"""
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit import CopilotKitRemoteEndpoint, LangGraphAGUIAgent
from agent import graph  # Import the compiled graph from agent.py

# --- FIX: Monkey-patch CopilotKit SDK bug ---
# LangGraphAGUIAgent misses dict_repr required by CopilotKitRemoteEndpoint
if not hasattr(LangGraphAGUIAgent, "dict_repr"):
    def dict_repr(self):
        return {
            'name': self.name,
            'description': getattr(self, "description", "") or ""
        }
    LangGraphAGUIAgent.dict_repr = dict_repr
# --------------------------------------------

app = FastAPI()

# Enable CORS for frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the CopilotKit SDK
sdk = CopilotKitRemoteEndpoint(
    agents=[
        LangGraphAGUIAgent(
            name="default",
            description="Dona AI blog assistant agent.",
            graph=graph,
        )
    ],
)

# Add the CopilotKit endpoint to your FastAPI app
add_fastapi_endpoint(app, sdk, "/copilotkit")

# Also add a health check endpoint
@app.get("/")
def health():
    return {"status": "ok", "agent": "dona_agent"}

def main():
    """Run the uvicorn server."""
    port = int(os.getenv("PORT", "8123"))
    uvicorn.run("serve:app", host="0.0.0.0", port=port, reload=True)

if __name__ == "__main__":
    main()
