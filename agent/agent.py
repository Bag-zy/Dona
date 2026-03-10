"""
Agent Dona - AI Writing Assistant for Blog Platform

This is the main entry point for the Dona blog assistant agent.
It helps users write blog posts, generate titles, create SEO metadata,
and manage their blog content.
"""

# Apply patch for CopilotKit import issue before any other imports
# This fixes the incorrect import path in copilotkit.langgraph_agent (bug in v0.1.63)
import sys

# Only apply the patch if the module doesn't already exist
if 'langgraph.graph.graph' not in sys.modules:
    class _MockModule:
        pass

    import langgraph
    import langgraph.graph
    import langgraph.graph.state

    from langgraph.graph.state import CompiledStateGraph

    _mock_graph_module = _MockModule()
    _mock_graph_module.CompiledGraph = CompiledStateGraph

    sys.modules['langgraph.graph.graph'] = _mock_graph_module

from typing import Any, List, Optional, Dict
from typing_extensions import Literal
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, BaseMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from copilotkit import CopilotKitState
from langgraph.prebuilt import ToolNode
from langchain_tavily import TavilySearch
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class AgentState(CopilotKitState):
    """
    State for the Dona blog assistant agent.
    
    Inherits from CopilotKitState and adds blog-specific fields for
    tracking the current post being edited and content state.
    """
    # Current post being edited (if any)
    currentPostId: Optional[str] = None
    currentPostTitle: str = ""
    currentPostContent: str = ""
    currentPostExcerpt: str = ""
    currentPostStatus: str = "draft"
    
    # Blog statistics for context
    totalPosts: int = 0
    totalCategories: int = 0
    totalTags: int = 0
    totalComments: int = 0
    pendingComments: int = 0


# ============================================================================
# Backend Tools - These run on the Python backend
# ============================================================================

@tool
def generate_slug(title: str) -> str:
    """
    Generate a URL-friendly slug from a title.
    Converts to lowercase, replaces spaces with hyphens, removes special characters.
    """
    import re
    slug = title.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    slug = slug.strip('-')
    return {"slug": slug, "title": title}


@tool
def calculate_reading_time(content: str) -> Dict[str, Any]:
    """
    Calculate estimated reading time for content.
    Assumes average reading speed of 200 words per minute.
    """
    words = len(content.split())
    minutes = max(1, round(words / 200))
    return {"words": words, "readingTime": minutes}


@tool
def generate_seo_metadata(title: str, content: str, max_title_length: int = 60, max_description_length: int = 160) -> Dict[str, Any]:
    """
    Generate SEO-optimized title and meta description from post content.
    Returns suggestions for SEO title and meta description.
    """
    # Extract key themes from content (first 500 chars for summary)
    content_preview = content[:500] if content else ""
    
    return {
        "suggested_seo_title": title[:max_title_length] if len(title) <= max_title_length else title[:max_title_length-3] + "...",
        "suggested_meta_description": content_preview[:max_description_length].rsplit(' ', 1)[0] + "..." if len(content_preview) > max_description_length else content_preview,
        "title_length": len(title),
        "content_length": len(content),
    }


@tool
def suggest_tags_from_content(content: str, max_tags: int = 5) -> Dict[str, Any]:
    """
    Suggest relevant tags based on content analysis.
    Extracts key topics and themes from the content.
    """
    # Simple keyword extraction (in production, could use NLP)
    common_tech_terms = [
        "javascript", "typescript", "python", "react", "node", "api", "database",
        "css", "html", "web", "mobile", "devops", "cloud", "security", "testing",
        "ai", "machine-learning", "data", "performance", "architecture", "design"
    ]
    
    content_lower = content.lower()
    suggested = [term for term in common_tech_terms if term in content_lower][:max_tags]
    
    return {"suggested_tags": suggested, "count": len(suggested)}


# Initialize Tavily search tool for web research
def get_tavily_search_tool():
    """Get Tavily search tool if API key is configured."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if tavily_api_key:
        return TavilySearch(
            max_results=5,
            search_depth="advanced",
            include_answer=True,
            include_raw_content=False,
        )
    return None


backend_tools = [
    generate_slug,
    calculate_reading_time,
    generate_seo_metadata,
    suggest_tags_from_content,
]

# Add Tavily search tool if available
tavily_tool = get_tavily_search_tool()
if tavily_tool:
    backend_tools.append(tavily_tool)

backend_tool_names = [tool.name for tool in backend_tools]


# ============================================================================
# Frontend Tool Allowlist - Tools that run on the client side
# ============================================================================

FRONTEND_TOOL_ALLOWLIST = set([
    # Navigation actions
    "navigateToPage",
    "navigateToPostEditor",
    "navigateToDashboard",
    "navigateToSettings",
    "navigateToComments",
    "navigateToCategories",
    "navigateToTags",
    "navigateToUsers",
    "navigateToMedia",
    "navigateToNewsletter",
    "navigateToDeveloper",
    "navigateToPosts",
    "refreshPage",
    
    # Post editing actions (to be implemented in frontend)
    "setPostTitle",
    "setPostContent",
    "setPostExcerpt",
    "setPostSlug",
    "setPostStatus",
    "setPostFeaturedImage",
    "appendPostContent",
    
    # Category/Tag actions
    "createCategory",
    "updateCategory",
    "deleteCategory",
    "createTag",
    "updateTag",
    "deleteTag",
    
    # Comment moderation
    "approveComment",
    "rejectComment",
    "markCommentSpam",
    "replyToComment",
])


async def chat_node(state: AgentState, config: RunnableConfig) -> Command[Literal["tool_node", "__end__"]]:
    """
    Main chat node for Agent Dona.
    Handles conversation with the user and coordinates tool calls for blog operations.
    """
    print(f"Dona agent state: {state}")

    # 1. Define the model - Using Groq with Llama 3.3 70B
    model = ChatGroq(model="llama-3.3-70b-versatile")

    # 2. Extract and dedupe frontend tools
    def _extract_tool_name(tool: Any) -> Optional[str]:
        try:
            if isinstance(tool, dict):
                fn = tool.get("function", {}) if isinstance(tool.get("function", {}), dict) else {}
                name = fn.get("name") or tool.get("name")
                if isinstance(name, str) and name.strip():
                    return name
                return None
            name = getattr(tool, "name", None)
            if isinstance(name, str) and name.strip():
                return name
            return None
        except Exception:
            return None

    # Collect frontend tools from state
    raw_tools = (state.get("tools", []) or [])
    try:
        ck = state.get("copilotkit", {}) or {}
        raw_actions = ck.get("actions", []) or []
        if isinstance(raw_actions, list) and raw_actions:
            raw_tools = [*raw_tools, *raw_actions]
    except Exception:
        pass

    deduped_frontend_tools: List[Any] = []
    seen: set[str] = set()
    for t in raw_tools:
        name = _extract_tool_name(t)
        if not name:
            continue
        if name not in FRONTEND_TOOL_ALLOWLIST:
            continue
        if name in seen:
            continue
        seen.add(name)
        deduped_frontend_tools.append(t)

    # Cap frontend tools
    MAX_FRONTEND_TOOLS = 110
    if len(deduped_frontend_tools) > MAX_FRONTEND_TOOLS:
        deduped_frontend_tools = deduped_frontend_tools[:MAX_FRONTEND_TOOLS]

    model_with_tools = model.bind_tools(
        [*deduped_frontend_tools, *backend_tools],
        parallel_tool_calls=False,
    )

    # 3. Build system message for blog assistant
    current_post_id = state.get("currentPostId", "")
    current_post_title = state.get("currentPostTitle", "")
    current_post_content = state.get("currentPostContent", "")
    current_post_excerpt = state.get("currentPostExcerpt", "")
    current_post_status = state.get("currentPostStatus", "draft")
    
    total_posts = state.get("totalPosts", 0)
    total_categories = state.get("totalCategories", 0)
    total_tags = state.get("totalTags", 0)
    total_comments = state.get("totalComments", 0)
    pending_comments = state.get("pendingComments", 0)

    system_message = SystemMessage(
        content=(
            "You are Agent Dona, an AI writing assistant for a blog platform.\n\n"
            
            "## Your Capabilities\n"
            "- Help write and edit blog posts\n"
            "- Generate catchy titles and headlines\n"
            "- Create SEO-optimized metadata (titles, meta descriptions)\n"
            "- Suggest relevant tags and categories\n"
            "- Calculate reading time for content\n"
            "- Help moderate comments\n"
            "- Navigate the blog admin interface\n\n"
            
            "## Current Context\n"
            f"- Total posts: {total_posts}\n"
            f"- Total categories: {total_categories}\n"
            f"- Total tags: {total_tags}\n"
            f"- Total comments: {total_comments} ({pending_comments} pending moderation)\n\n"
            
            "## Current Post Being Edited\n"
            f"- Post ID: {current_post_id or '(none)'}\n"
            f"- Title: {current_post_title or '(untitled)'}\n"
            f"- Status: {current_post_status}\n"
            f"- Excerpt: {current_post_excerpt[:100] + '...' if current_post_excerpt and len(current_post_excerpt) > 100 else current_post_excerpt or '(no excerpt)'}\n"
            f"- Content length: {len(current_post_content)} characters\n\n"
            
            "## Blog Data Model\n"
            "- **Posts**: id, title, slug, excerpt, content (TipTap JSON), featuredImage, status (draft/published/scheduled), authorId, publishedAt, readingTime, views\n"
            "- **Categories**: id, name, slug, description (many-to-many with posts)\n"
            "- **Tags**: id, name, slug (many-to-many with posts)\n"
            "- **Comments**: id, postId, userId, parentId (for replies), content, status (pending/approved/spam/trash)\n"
            "- **Media**: id, url, type, fileName, mimeType, size\n\n"
            
            "## Guidelines\n"
            "1. **Writing Assistance**: When helping write content, be creative but professional. Match the user's tone.\n"
            "2. **SEO**: Keep SEO titles under 60 characters and meta descriptions under 160 characters.\n"
            "3. **Slugs**: Generate URL-friendly slugs from titles (lowercase, hyphens, no special chars).\n"
            "4. **Tags**: Suggest relevant tags based on content topics. Max 5-7 tags per post.\n"
            "5. **Navigation**: Use navigation tools to help users move between admin pages.\n"
            "6. **Comments**: Help moderate comments politely. Draft replies when requested.\n\n"
            
            "## Tool Usage\n"
            "- Use `generate_slug` to create URL slugs from titles\n"
            "- Use `calculate_reading_time` to estimate reading duration\n"
            "- Use `generate_seo_metadata` for SEO suggestions\n"
            "- Use `suggest_tags_from_content` to recommend tags\n"
            "- Use navigation tools (navigateToPage, etc.) to help users move around\n"
            "- Use refreshPage after database changes to update the UI\n\n"
            
            "## Important Rules\n"
            "- Always be helpful and professional\n"
            "- If you don't know something, say so\n"
            "- Never make up data or statistics\n"
            "- Respect the user's writing style and preferences\n"
            "- When editing content, preserve the user's voice"
        )
    )

    # 4. Handle frontend tool calls (wait for client execution)
    full_messages = state.get("messages", []) or []
    
    try:
        if full_messages:
            last_msg = full_messages[-1]
            if isinstance(last_msg, AIMessage):
                pending_frontend_call = False
                for tc in getattr(last_msg, "tool_calls", []) or []:
                    name = tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", None)
                    if name and name not in backend_tool_names:
                        pending_frontend_call = True
                        break
                if pending_frontend_call:
                    return Command(
                        goto=END,
                        update={
                            "currentPostId": state.get("currentPostId"),
                            "currentPostTitle": state.get("currentPostTitle", ""),
                            "currentPostContent": state.get("currentPostContent", ""),
                            "currentPostExcerpt": state.get("currentPostExcerpt", ""),
                            "currentPostStatus": state.get("currentPostStatus", "draft"),
                            "totalPosts": state.get("totalPosts", 0),
                            "totalCategories": state.get("totalCategories", 0),
                            "totalTags": state.get("totalTags", 0),
                            "totalComments": state.get("totalComments", 0),
                            "pendingComments": state.get("pendingComments", 0),
                        },
                    )
    except Exception:
        pass

    # 5. Trim history and invoke model
    trimmed_messages = full_messages[-12:]
    
    response = await model_with_tools.ainvoke([
        system_message,
        *trimmed_messages,
    ], config)

    # 6. Route to tool node if backend tools need execution
    if route_to_tool_node(response):
        print("Routing to tool node for backend tool execution")
        return Command(
            goto="tool_node",
            update={
                "messages": [response],
                "currentPostId": state.get("currentPostId"),
                "currentPostTitle": state.get("currentPostTitle", ""),
                "currentPostContent": state.get("currentPostContent", ""),
                "currentPostExcerpt": state.get("currentPostExcerpt", ""),
                "currentPostStatus": state.get("currentPostStatus", "draft"),
                "totalPosts": state.get("totalPosts", 0),
                "totalCategories": state.get("totalCategories", 0),
                "totalTags": state.get("totalTags", 0),
                "totalComments": state.get("totalComments", 0),
                "pendingComments": state.get("pendingComments", 0),
            }
        )

    # 7. Check for frontend tool calls
    try:
        tool_calls = getattr(response, "tool_calls", []) or []
    except Exception:
        tool_calls = []
    
    has_frontend_tool_calls = False
    for tc in tool_calls:
        name = tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", None)
        if name and name not in backend_tool_names:
            has_frontend_tool_calls = True
            break

    # 8. Return response
    return Command(
        goto=END,
        update={
            "messages": [response],
            "currentPostId": state.get("currentPostId"),
            "currentPostTitle": state.get("currentPostTitle", ""),
            "currentPostContent": state.get("currentPostContent", ""),
            "currentPostExcerpt": state.get("currentPostExcerpt", ""),
            "currentPostStatus": state.get("currentPostStatus", "draft"),
            "totalPosts": state.get("totalPosts", 0),
            "totalCategories": state.get("totalCategories", 0),
            "totalTags": state.get("totalTags", 0),
            "totalComments": state.get("totalComments", 0),
            "pendingComments": state.get("pendingComments", 0),
        },
    )


def route_to_tool_node(response: BaseMessage) -> bool:
    """
    Route to tool node if any tool call matches a backend tool name.
    """
    tool_calls = getattr(response, "tool_calls", None)
    if not tool_calls:
        return False

    for tool_call in tool_calls:
        name = tool_call.get("name")
        if name in backend_tool_names:
            return True
    return False


# ============================================================================
# Workflow Graph Definition
# ============================================================================

workflow = StateGraph(AgentState)
workflow.add_node("chat_node", chat_node)
workflow.add_node("tool_node", ToolNode(tools=backend_tools))
workflow.add_edge("tool_node", "chat_node")
workflow.set_entry_point("chat_node")

graph = workflow.compile()
