import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
import uvicorn
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit import CopilotKitRemoteEndpoint, LangGraphAGUIAgent
from agent import graph # Import the compiled graph from agent.py

app = FastAPI()

# Initialize the CopilotKit SDK
sdk = CopilotKitRemoteEndpoint(
    agents=[
        LangGraphAGUIAgent(
            name="dona_agent",
            description="Dona AI blog assistant agent.",
            graph=graph,
        )
    ],
)

# Add the CopilotKit endpoint to your FastAPI app
add_fastapi_endpoint(app, sdk, "/copilotkit")

def main():
    """Run the uvicorn server."""
    port = int(os.getenv("PORT", "8123"))
    uvicorn.run("serve:app", host="0.0.0.0", port=port, reload=True)

if __name__ == "__main__":
    main()
