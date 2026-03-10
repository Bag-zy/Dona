"""
Dona Agent - AI-powered blog assistant
Uses Groq (llama-3.3-70b-versatile) + Tavily for research + NeonDB for blog data
Mirrors the assistant-demo ReAct pattern: chat_node → tool_node → chat_node
"""

import sys
import os
from dotenv import load_dotenv

# First load the agent's .env for GROQ_API_KEY and TAVILY_API_KEY
load_dotenv()

# Then load the root .env.local to get the true DATABASE_URL
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
load_dotenv(env_path, override=True)

# Patch for CopilotKit import issue (same as assistant-demo)
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
from langchain_core.messages import SystemMessage, BaseMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from copilotkit import CopilotKitState
from langgraph.prebuilt import ToolNode

# Tavily for web research
from tavily import TavilyClient

tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY", ""))

# Database connection
import psycopg2
import json

def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL", ""))


class DonaAgentState(CopilotKitState):
    """Dona agent state - extends CopilotKit state with blog-specific fields."""
    tools: List[Any] = []
    # Blog state synced with frontend
    currentDraft: Dict[str, Any] = {}
    blogContext: Dict[str, Any] = {}
    # Planning state (same as assistant-demo)
    planSteps: List[Dict[str, Any]] = []
    currentStepIndex: int = -1
    planStatus: str = ""


# ============== Backend Tools ==============

@tool
def search_web(query: str) -> str:
    """Search the web using Tavily for research, fact-checking, or finding information for blog posts."""
    try:
        results = tavily_client.search(query, max_results=5)
        output = []
        for r in results.get("results", []):
            output.append(f"**{r.get('title', '')}**\n{r.get('content', '')}\nURL: {r.get('url', '')}\n")
        return "\n---\n".join(output) if output else "No results found."
    except Exception as e:
        return f"Search error: {str(e)}"


@tool
def get_posts(limit: int = 10, status: str = "published") -> str:
    """Fetch blog posts from the database. Use this to get context about existing content."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT title, slug, excerpt, status, created_at FROM posts WHERE status = %s ORDER BY created_at DESC LIMIT %s",
            (status, limit)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        if not rows:
            return "No posts found."
        lines = []
        for r in rows:
            lines.append(f"- **{r[0]}** (/{r[1]}) - {r[3]} - {r[2] or 'No excerpt'}")
        return "\n".join(lines)
    except Exception as e:
        return f"Database error: {str(e)}"


@tool
def get_post_by_slug(slug: str) -> str:
    """Fetch a single blog post by its slug for detailed context."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT title, slug, excerpt, content, status FROM posts WHERE slug = %s", (slug,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return f"No post found with slug '{slug}'."
        return f"Title: {row[0]}\nSlug: {row[1]}\nExcerpt: {row[2]}\nStatus: {row[4]}\nContent: {json.dumps(row[3]) if row[3] else 'Empty'}"
    except Exception as e:
        return f"Database error: {str(e)}"


@tool
def get_categories() -> str:
    """Fetch all blog categories from the database."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT name, slug, description FROM categories ORDER BY name")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        if not rows:
            return "No categories found."
        return "\n".join([f"- {r[0]} (/{r[1]}): {r[2] or 'No description'}" for r in rows])
    except Exception as e:
        return f"Database error: {str(e)}"


@tool
def get_tags() -> str:
    """Fetch all blog tags from the database."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT name, slug FROM tags ORDER BY name")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        if not rows:
            return "No tags found."
        return ", ".join([r[0] for r in rows])
    except Exception as e:
        return f"Database error: {str(e)}"


@tool
def set_plan(steps: List[str]):
    """Initialize a plan consisting of step descriptions."""
    return {"initialized": True, "steps": steps}


@tool
def update_plan_progress(step_index: int, status: Literal["pending", "in_progress", "completed", "failed"], note: Optional[str] = None):
    """Update a single plan step's status."""
    return {"updated": True, "index": step_index, "status": status, "note": note}


@tool
def complete_plan():
    """Mark the plan as completed."""
    return {"completed": True}


@tool
def create_draft(title: str, slug: str, excerpt: str, content: str, category_slug: Optional[str] = None) -> str:
    """Create a new draft blog post in the database and return its slug."""
    try:
        import uuid
        conn = get_db_connection()
        cur = conn.cursor()
        # Build TipTap JSON content
        tiptap_content = json.dumps({
            "type": "doc",
            "content": [{"type": "paragraph", "content": [{"type": "text", "text": p}]} for p in content.split("\n\n") if p.strip()]
        })
        cur.execute(
            "INSERT INTO posts (title, slug, excerpt, content, status, author_id, created_at, updated_at) VALUES (%s, %s, %s, %s, 'draft', 'admin', NOW(), NOW()) RETURNING slug",
            (title, slug, excerpt, tiptap_content)
        )
        result_slug = cur.fetchone()[0]
        # Attach category if provided
        if category_slug:
            cur.execute("SELECT id FROM categories WHERE slug = %s", (category_slug,))
            cat = cur.fetchone()
            if cat:
                cur.execute("SELECT id FROM posts WHERE slug = %s", (result_slug,))
                post = cur.fetchone()
                if post:
                    cur.execute("INSERT INTO post_categories (post_id, category_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (post[0], cat[0]))
        conn.commit()
        cur.close()
        conn.close()
        return f"Draft created successfully with slug: {result_slug}"
    except Exception as e:
        return f"Error creating draft: {str(e)}"


@tool
def update_post(slug: str, title: Optional[str] = None, excerpt: Optional[str] = None, content: Optional[str] = None, status: Optional[str] = None) -> str:
    """Update an existing blog post by slug. Only provided fields will be updated."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        updates = []
        values = []
        if title:
            updates.append("title = %s")
            values.append(title)
        if excerpt:
            updates.append("excerpt = %s")
            values.append(excerpt)
        if content:
            tiptap_content = json.dumps({
                "type": "doc",
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": p}]} for p in content.split("\n\n") if p.strip()]
            })
            updates.append("content = %s")
            values.append(tiptap_content)
        if status and status in ["draft", "published", "scheduled"]:
            updates.append("status = %s")
            values.append(status)
            if status == "published":
                updates.append("published_at = NOW()")
        if not updates:
            return "No fields to update."
        updates.append("updated_at = NOW()")
        values.append(slug)
        cur.execute(f"UPDATE posts SET {', '.join(updates)} WHERE slug = %s", values)
        conn.commit()
        rows_affected = cur.rowcount
        cur.close()
        conn.close()
        return f"Post '{slug}' updated successfully ({rows_affected} row(s) affected)."
    except Exception as e:
        return f"Error updating post: {str(e)}"


@tool
def delete_post(slug: str) -> str:
    """Delete a blog post by slug."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM posts WHERE slug = %s", (slug,))
        conn.commit()
        rows_affected = cur.rowcount
        cur.close()
        conn.close()
        if rows_affected == 0:
            return f"No post found with slug '{slug}'."
        return f"Post '{slug}' deleted successfully."
    except Exception as e:
        return f"Error deleting post: {str(e)}"


@tool
def get_dashboard_stats() -> str:
    """Get blog dashboard statistics: total posts, published posts, draft posts, total comments, total subscribers."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM posts")
        total_posts = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM posts WHERE status = 'published'")
        published = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM posts WHERE status = 'draft'")
        drafts = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM comments")
        total_comments = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM newsletter_subscribers")
        total_subs = cur.fetchone()[0]
        cur.close()
        conn.close()
        return f"Total Posts: {total_posts} | Published: {published} | Drafts: {drafts} | Comments: {total_comments} | Subscribers: {total_subs}"
    except Exception as e:
        return f"Error getting stats: {str(e)}"


from tools_extended import extended_tools

backend_tools = [
    search_web,
    get_posts,
    get_post_by_slug,
    get_categories,
    get_tags,
    create_draft,
    update_post,
    delete_post,
    get_dashboard_stats,
    set_plan,
    update_plan_progress,
    complete_plan,
] + extended_tools

backend_tool_names = [t.name for t in backend_tools]

# Frontend tool allowlist — all admin panel actions the agent can trigger
FRONTEND_TOOL_ALLOWLIST = {
    # Post editor actions
    "setDraftTitle",
    "setDraftSlug",
    "setDraftContent",
    "setDraftExcerpt",
    "setDraftTags",
    "setDraftCategories",
    "setDraftSeoMeta",
    "setDraftFeaturedImage",
    "setDraftStatus",
    "publishDraft",
    "saveDraft",
    # Navigation actions
    "navigateToPage",
    "navigateToPostEditor",
    "navigateToPosts",
    "navigateToDashboard",
    "navigateToSettings",
    "navigateToComments",
    "navigateToCategories",
    "navigateToTags",
    "navigateToUsers",
    "navigateToMedia",
    "navigateToNewsletter",
    "navigateToDeveloper",
    # Dashboard actions
    "refreshDashboard",
    "refreshPage",
    "showRelatedPosts",
    # Comment moderation
    "approveComment",
    "deleteComment",
    "markCommentSpam",
}


async def chat_node(state: DonaAgentState, config: RunnableConfig) -> Command[Literal["tool_node", "__end__"]]:
    """Dona chat node - ReAct pattern with Groq LLM."""

    # 1. Model
    model = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY", ""),
        temperature=0.7,
    )

    # 2. Prepare tools (dedupe frontend tools + backend tools)
    raw_tools = list(state.get("tools", []) or [])
    try:
        ck = state.get("copilotkit", {}) or {}
        raw_actions = ck.get("actions", []) or []
        if isinstance(raw_actions, list):
            raw_tools.extend(raw_actions)
    except Exception:
        pass

    deduped_frontend: list = []
    seen: set = set()
    for t in raw_tools:
        name = None
        if isinstance(t, dict):
            fn = t.get("function", {})
            name = fn.get("name") if isinstance(fn, dict) else t.get("name")
        else:
            name = getattr(t, "name", None)
        if not name or name in seen:
            continue
        if name not in FRONTEND_TOOL_ALLOWLIST and not name.startswith("copilotkit"):
            continue
        seen.add(name)
        deduped_frontend.append(t)

    model_with_tools = model.bind_tools(
        [*deduped_frontend, *backend_tools],
        parallel_tool_calls=False,
    )

    # 3. System message
    plan_steps = state.get("planSteps", []) or []
    plan_status = state.get("planStatus", "")
    current_draft = state.get("currentDraft", {}) or {}

    system_message = SystemMessage(
        content=(
            "You are Agent Dona, the AI-powered blog assistant for the Dona Blog Platform.\n"
            "You are FULLY INTEGRATED into the admin panel. You can:\n\n"
            "CONTENT CREATION & EDITING:\n"
            "- Draft new blog posts using setDraftTitle, setDraftContent, setDraftExcerpt, setDraftSlug\n"
            "- Set tags and categories using setDraftTags, setDraftCategories\n"
            "- Set SEO metadata using setDraftSeoMeta\n"
            "- Set featured images using setDraftFeaturedImage\n"
            "- Publish drafts using publishDraft or saveDraft\n"
            "- Create posts directly in the database using create_draft\n"
            "- Update existing posts using update_post\n"
            "- Delete posts using delete_post\n\n"
            "RESEARCH & INTELLIGENCE:\n"
            "- Research any topic with search_web (Tavily)\n"
            "- Read existing blog posts with get_posts, get_post_by_slug\n"
            "- Browse categories (get_categories) and tags (get_tags)\n"
            "- Get dashboard stats with get_dashboard_stats\n\n"
            "NAVIGATION:\n"
            "- Use specific navigation actions for admin pages:\n"
            "  * navigateToDashboard → /admin\n"
            "  * navigateToPosts → /admin/posts\n"
            "  * navigateToPostEditor → /admin/posts/new\n"
            "  * navigateToCategories → /admin/categories (NOTE: Categories are created via a popup on this page, there is no /new route)\n"
            "  * navigateToTags → /admin/tags\n"
            "  * navigateToUsers → /admin/users\n"
            "  * navigateToMedia → /admin/media\n"
            "  * navigateToComments → /admin/comments\n"
            "  * navigateToNewsletter → /admin/newsletter\n"
            "  * navigateToDeveloper → /admin/developer\n"
            "  * navigateToSettings → /admin/settings\n"
            "- Use navigateToPage only for custom paths not listed above\n"
            "- Use refreshPage after any database mutation to update the UI\n\n"
            "TAXONOMY & MEDIA:\n"
            "- Create, update, or delete categories and tags using the create/update/delete tools\n"
            "- IMPORTANT: Managing categories and tags occurs on their respective main pages (/admin/categories or /admin/tags) via popup dialogs. Never try to navigate to a /new subpage for them.\n"
            "- View media gallery (get_media) and delete media (delete_media)\n\n"
            "USERS & DEVELOPER:\n"
            "- View users (get_users) and update roles (update_user_role)\n"
            "- Manage API keys: get_api_keys, revoke_api_key\n\n"
            "SETTINGS & COMMENTS:\n"
            "- View and update site settings (get_settings, update_settings)\n"
            "- Read comments (get_comments) and moderate them (update_comment_status)\n\n"
            "PLANNING:\n"
            "- For complex tasks (e.g. 'write 3 blog posts about AI'), create a multi-step plan with set_plan\n"
            "- Track progress with update_plan_progress and complete with complete_plan\n"
            "- Proceed automatically between steps without waiting for user confirmation\n\n"
            f"Current draft state: {json.dumps(current_draft) if current_draft else '(no active draft)'}\n"
            f"Plan status: {plan_status}\n"
            f"Plan steps: {[s.get('title', s) for s in plan_steps]}\n\n"
            "RULES:\n"
            "1. When asked to create content, ALWAYS use the frontend tools (setDraftTitle etc.) to populate the editor in real-time.\n"
            "2. For research, use search_web to find accurate, up-to-date information.\n"
            "3. For multi-step tasks, create a plan first, then execute each step.\n"
            "4. Be creative, professional, and SEO-aware in your writing.\n"
            "5. After mutations (create/update/delete any record), ALWAYS call refreshPage so the user's screen updates.\n"
            "6. After mutations, confirm what changed. Never claim a change you didn't make.\n"
            "7. Keep responses concise but informative.\n"
        )
    )

    # 4. Trim history and invoke
    messages = (state.get("messages", []) or [])[-12:]

    response = await model_with_tools.ainvoke(
        [system_message, *messages],
        config,
    )

    # 5. Route
    tool_calls = getattr(response, "tool_calls", []) or []
    has_backend = any(
        (tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", None)) in backend_tool_names
        for tc in tool_calls
    )

    if has_backend:
        return Command(
            goto="tool_node",
            update={"messages": [response]},
        )

    return Command(
        goto=END,
        update={"messages": [response]},
    )


def route_to_tool_node(response: BaseMessage):
    tool_calls = getattr(response, "tool_calls", None)
    if not tool_calls:
        return False
    return any(tc.get("name") in backend_tool_names for tc in tool_calls)


# Build the graph
workflow = StateGraph(DonaAgentState)
workflow.add_node("chat_node", chat_node)
workflow.add_node("tool_node", ToolNode(tools=backend_tools))
workflow.add_edge("tool_node", "chat_node")
workflow.set_entry_point("chat_node")
# Compile the workflow without manual checkpointer 
# (LangGraph API handles persistence automatically using POSTGRES_URI)
graph = workflow.compile()
