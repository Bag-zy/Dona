from typing import Optional
from langchain.tools import tool
import os
import psycopg2

def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL", ""))

# Organization tools
@tool
def get_organizations() -> str:
    """Get all organizations."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name, slug FROM organizations ORDER BY name")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return "\n".join([f"- ID: {r[0]} | Name: {r[1]} | Slug: {r[2]}" for r in rows]) if rows else "No organizations found."
    except Exception as e:
        return f"Database error: {str(e)}"

@tool
def create_organization(name: str, slug: str, owner_user_id: str) -> str:
    """Create a new organization with an owner."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO organizations (name, slug) VALUES (%s, %s) RETURNING id", (name, slug))
        org_id = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO organization_memberships (organization_id, user_id, role) VALUES (%s, %s, 'owner')",
            (org_id, owner_user_id)
        )
        cur.execute("UPDATE users SET current_organization_id = %s WHERE id = %s", (org_id, owner_user_id))
        conn.commit()
        cur.close()
        conn.close()
        return f"Organization '{name}' created with ID {org_id}."
    except Exception as e:
        return f"Error creating organization: {str(e)}"

@tool
def get_organization_members(organization_id: str) -> str:
    """Get all members of an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT u.name, u.email, om.role 
            FROM organization_memberships om 
            JOIN users u ON om.user_id = u.id 
            WHERE om.organization_id = %s 
            ORDER BY om.role, u.name
        """, (organization_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return "\n".join([f"- {r[0]} ({r[1]}) - Role: {r[2]}" for r in rows]) if rows else "No members found."
    except Exception as e:
        return f"Database error: {str(e)}"

@tool
def add_organization_member(organization_id: str, user_id: str, role: str = "member") -> str:
    """Add a user to an organization with a role (owner, admin, editor, member)."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO organization_memberships (organization_id, user_id, role) VALUES (%s, %s, %s)",
            (organization_id, user_id, role)
        )
        conn.commit()
        cur.close()
        conn.close()
        return f"User {user_id} added to organization {organization_id} as {role}."
    except Exception as e:
        if "duplicate" in str(e).lower():
            return f"User {user_id} is already a member of this organization."
        return f"Error adding member: {str(e)}"

@tool
def update_organization_member_role(organization_id: str, user_id: str, role: str) -> str:
    """Update a member's role in an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE organization_memberships SET role = %s WHERE organization_id = %s AND user_id = %s",
            (role, organization_id, user_id)
        )
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Member role updated to {role}." if rows > 0 else "Member not found in organization."
    except Exception as e:
        return f"Error updating member role: {str(e)}"

@tool
def remove_organization_member(organization_id: str, user_id: str) -> str:
    """Remove a user from an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM organization_memberships WHERE organization_id = %s AND user_id = %s",
            (organization_id, user_id)
        )
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Member removed from organization." if rows > 0 else "Member not found."
    except Exception as e:
        return f"Error removing member: {str(e)}"

# Category tools - updated for organizations
@tool
def create_category(organization_id: str, name: str, slug: str, description: Optional[str] = None) -> str:
    """Create a new blog category within an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO categories (organization_id, name, slug, description) VALUES (%s, %s, %s, %s)",
            (organization_id, name, slug, description)
        )
        conn.commit()
        cur.close()
        conn.close()
        return f"Category '{name}' created successfully."
    except Exception as e:
        return f"Error creating category: {str(e)}"

@tool
def update_category(organization_id: str, slug: str, name: Optional[str] = None, description: Optional[str] = None) -> str:
    """Update an existing category within an organization. Only provided fields will be updated."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        updates = []
        values = []
        if name:
            updates.append("name = %s")
            values.append(name)
        if description is not None:
            updates.append("description = %s")
            values.append(description)
        if not updates:
            return "No fields to update."
        values.extend([slug, organization_id])
        cur.execute(f"UPDATE categories SET {', '.join(updates)} WHERE slug = %s AND organization_id = %s", values)
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Category '{slug}' updated successfully ({rows} row(s) affected)."
    except Exception as e:
        return f"Error updating category: {str(e)}"

@tool
def delete_category(organization_id: str, slug: str) -> str:
    """Delete a blog category by slug within an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM categories WHERE slug = %s AND organization_id = %s", (slug, organization_id))
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Category '{slug}' deleted successfully." if rows > 0 else f"Category '{slug}' not found."
    except Exception as e:
        return f"Error deleting category: {str(e)}"

# Tag tools - updated for organizations
@tool
def create_tag(organization_id: str, name: str, slug: str) -> str:
    """Create a new blog tag within an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO tags (organization_id, name, slug) VALUES (%s, %s, %s)", (organization_id, name, slug))
        conn.commit()
        cur.close()
        conn.close()
        return f"Tag '{name}' created successfully."
    except Exception as e:
        return f"Error creating tag: {str(e)}"

@tool
def update_tag(organization_id: str, slug: str, name: Optional[str] = None, new_slug: Optional[str] = None) -> str:
    """Update an existing tag within an organization. Only provided fields will be updated."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        updates = []
        values = []
        if name:
            updates.append("name = %s")
            values.append(name)
        if new_slug:
            updates.append("slug = %s")
            values.append(new_slug)
        if not updates:
            return "No fields to update."
        values.extend([slug, organization_id])
        cur.execute(f"UPDATE tags SET {', '.join(updates)} WHERE slug = %s AND organization_id = %s", values)
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Tag '{slug}' updated successfully ({rows} row(s) affected)."
    except Exception as e:
        return f"Error updating tag: {str(e)}"

@tool
def delete_tag(organization_id: str, slug: str) -> str:
    """Delete a blog tag by slug within an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM tags WHERE slug = %s AND organization_id = %s", (slug, organization_id))
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Tag '{slug}' deleted." if rows > 0 else f"Tag '{slug}' not found."
    except Exception as e:
        return f"Error deleting tag: {str(e)}"

@tool
def get_users() -> str:
    """Get a list of all users and their roles."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, role FROM users")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return "\n".join([f"- ID: {r[0]} | {r[1]} ({r[2]}) - Role: {r[3]}" for r in rows]) if rows else "No users found."
    except Exception as e:
        return f"Database error: {str(e)}"

@tool
def update_user_role(email: str, role: str) -> str:
    """Update a user's global role (admin, editor, user)."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE users SET role = %s WHERE email = %s", (role, email))
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"User '{email}' role updated to {role}." if rows > 0 else f"User '{email}' not found."
    except Exception as e:
        return f"Error updating user role: {str(e)}"

@tool
def delete_user(email: str) -> str:
    """Delete a user by email address."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM users WHERE email = %s", (email,))
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"User '{email}' deleted successfully." if rows > 0 else f"User '{email}' not found."
    except Exception as e:
        return f"Error deleting user: {str(e)}"

@tool
def get_comments(organization_id: str, status: Optional[str] = "pending", limit: int = 10) -> str:
    """Get latest comments for an organization, filtered by status (pending, approved, spam)."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, content, status FROM comments WHERE organization_id = %s AND status = %s ORDER BY created_at DESC LIMIT %s",
            (organization_id, status, limit)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return "\n".join([f"- ID: {r[0]} | Status: {r[2]} | Content: {r[1]}" for r in rows]) if rows else f"No {status} comments."
    except Exception as e:
        return f"Database error: {str(e)}"

@tool
def update_comment_status(organization_id: str, comment_id: str, status: str) -> str:
    """Update a comment's status (approved, spam, trash) within an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE comments SET status = %s WHERE id = %s AND organization_id = %s",
            (status, comment_id, organization_id)
        )
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Comment {comment_id} status updated to {status}." if rows > 0 else "Comment not found."
    except Exception as e:
        return f"Error updating comment: {str(e)}"

@tool
def delete_comment(organization_id: str, comment_id: str) -> str:
    """Delete a comment by ID within an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM comments WHERE id = %s AND organization_id = %s", (comment_id, organization_id))
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Comment {comment_id} deleted successfully." if rows > 0 else f"Comment {comment_id} not found."
    except Exception as e:
        return f"Error deleting comment: {str(e)}"

@tool
def get_subscribers(organization_id: str, limit: int = 20) -> str:
    """Get recent newsletter subscribers for an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT email, confirmed FROM newsletter_subscribers WHERE organization_id = %s ORDER BY subscribed_at DESC LIMIT %s",
            (organization_id, limit)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return "\n".join([f"- {r[0]} (Confirmed: {r[1]})" for r in rows]) if rows else "No subscribers."
    except Exception as e:
        return f"Database error: {str(e)}"

@tool
def add_subscriber(organization_id: str, email: str) -> str:
    """Add a new newsletter subscriber to an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO newsletter_subscribers (organization_id, email, confirmed) VALUES (%s, %s, %s)",
            (organization_id, email.lower(), False)
        )
        conn.commit()
        cur.close()
        conn.close()
        return f"Subscriber '{email}' added successfully."
    except Exception as e:
        if "duplicate" in str(e).lower():
            return f"Subscriber '{email}' already exists."
        return f"Error adding subscriber: {str(e)}"

@tool
def confirm_subscriber(organization_id: str, email: str) -> str:
    """Confirm a newsletter subscriber's email within an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE newsletter_subscribers SET confirmed = TRUE WHERE email = %s AND organization_id = %s",
            (email.lower(), organization_id)
        )
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Subscriber '{email}' confirmed." if rows > 0 else f"Subscriber '{email}' not found."
    except Exception as e:
        return f"Error confirming subscriber: {str(e)}"

@tool
def delete_subscriber(organization_id: str, email: str) -> str:
    """Remove a newsletter subscriber from an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM newsletter_subscribers WHERE email = %s AND organization_id = %s",
            (email.lower(), organization_id)
        )
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Subscriber '{email}' removed." if rows > 0 else f"Subscriber '{email}' not found."
    except Exception as e:
        return f"Error removing subscriber: {str(e)}"

@tool
def get_api_keys(organization_id: str) -> str:
    """Get developer API keys for an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT name, key_prefix, scopes, revoked FROM api_keys WHERE organization_id = %s",
            (organization_id,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return "\n".join([f"- {r[0]} ({r[1]}***): Scopes={r[2]} Revoked={r[3]}" for r in rows]) if rows else "No keys found."
    except Exception as e:
        return f"Database error: {str(e)}"

@tool
def revoke_api_key(organization_id: str, key_prefix: str) -> str:
    """Revoke a developer API key within an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE api_keys SET revoked = TRUE WHERE key_prefix = %s AND organization_id = %s",
            (key_prefix, organization_id)
        )
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"API key '{key_prefix}' revoked." if rows > 0 else "Key not found."
    except Exception as e:
        return f"Error revoking API key: {str(e)}"

@tool
def get_settings(organization_id: str) -> str:
    """Get site settings for an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT site_name, site_description FROM site_settings WHERE organization_id = %s LIMIT 1",
            (organization_id,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        return f"Site Name: {row[0]}\nDescription: {row[1]}" if row else "No settings found."
    except Exception as e:
        return f"Database error: {str(e)}"

@tool
def update_settings(organization_id: str, site_name: Optional[str] = None, site_description: Optional[str] = None) -> str:
    """Update site settings for an organization."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM site_settings WHERE organization_id = %s LIMIT 1", (organization_id,))
        row = cur.fetchone()
        updates = []
        values = []
        if site_name: updates.append("site_name = %s"); values.append(site_name)
        if site_description is not None: updates.append("site_description = %s"); values.append(site_description)
        if not updates: return "No fields to update."
        updates.append("updated_at = NOW()")
        
        if row:
            values.extend([row[0], organization_id])
            cur.execute(f"UPDATE site_settings SET {', '.join(updates)} WHERE id = %s AND organization_id = %s", values)
        else:
            values.append(organization_id)
            cur.execute(
                f"INSERT INTO site_settings (site_name, site_description, organization_id) VALUES (%s, %s, %s)",
                (site_name or "New Site", site_description or "", organization_id)
            )
        conn.commit()
        cur.close()
        conn.close()
        return "Site settings updated successfully."
    except Exception as e:
        return f"Error updating settings: {str(e)}"

@tool
def get_media(organization_id: str, limit: int = 10) -> str:
    """Get the latest uploaded media items from an organization's media library."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, file_name, type, url FROM media WHERE organization_id = %s ORDER BY uploaded_at DESC LIMIT %s",
            (organization_id, limit)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return "\n".join([f"- ID: {r[0]} | File: {r[1]} [{r[2]}] | URL: {r[3]}" for r in rows]) if rows else "No media found."
    except Exception as e:
        return f"Database error: {str(e)}"

@tool
def delete_media(organization_id: str, media_id: str) -> str:
    """Delete a media item by ID from an organization's database."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM media WHERE id = %s AND organization_id = %s", (media_id, organization_id))
        conn.commit()
        rows = cur.rowcount
        cur.close()
        conn.close()
        return f"Media {media_id} deleted from database." if rows > 0 else "Media not found."
    except Exception as e:
        return f"Error deleting media: {str(e)}"

extended_tools = [
    # Organization tools
    get_organizations, create_organization, get_organization_members,
    add_organization_member, update_organization_member_role, remove_organization_member,
    # Category tools
    create_category, update_category, delete_category,
    # Tag tools
    create_tag, update_tag, delete_tag,
    # User tools
    get_users, update_user_role, delete_user,
    # Comment tools
    get_comments, update_comment_status, delete_comment,
    # Subscriber tools
    get_subscribers, add_subscriber, confirm_subscriber, delete_subscriber,
    # API key tools
    get_api_keys, revoke_api_key,
    # Settings tools
    get_settings, update_settings,
    # Media tools
    get_media, delete_media
]
