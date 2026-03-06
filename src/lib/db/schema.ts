import { pgTable, text, timestamp, boolean, varchar, uuid, integer, jsonb, index } from "drizzle-orm/pg-core";

// Organizations - multi-tenant support
export const organizations = pgTable("organizations", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organization memberships - user roles within organizations
export const organizationMemberships = pgTable("organization_memberships", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(), // 'owner', 'admin', 'editor', 'member'
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
    orgUserIdx: index("org_user_idx").on(table.organizationId, table.userId),
    userOrgIdx: index("user_org_idx").on(table.userId),
}));

export const users = pgTable("users", {
    id: text("id").primaryKey(), // Using text because NextAuth/Stack Auth usually returns string IDs
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    role: varchar("role", { length: 50 }).default("user").notNull(), // 'admin', 'editor', 'user' - global role
    currentOrganizationId: uuid("current_organization_id").references(() => organizations.id, { onDelete: "set null" }),
    activeThreadId: uuid("active_thread_id"), // Currently active chat thread
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agent chat threads - multiple conversations per user
export const chatThreads = pgTable("chat_threads", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    threadId: uuid("thread_id").notNull(), // LangGraph checkpoint thread UUID
    title: varchar("title", { length: 255 }).default("New conversation").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    userIdx: index("chat_threads_user_idx").on(table.userId),
}));

export const apiKeys = pgTable("api_keys", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    keyPrefix: varchar("key_prefix", { length: 50 }).notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: text("scopes").notNull(), // Comma-separated or JSON
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    revoked: boolean("revoked").default(false).notNull(),
});

export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: text("excerpt"),
    content: jsonb("content"), // TipTap rich text JSON
    featuredImage: text("featured_image"),
    status: varchar("status", { length: 50 }).default("draft").notNull(), // 'draft', 'published', 'scheduled'
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    readingTime: integer("reading_time"),
    views: integer("views").default(0).notNull(),
}, (table) => ({
    orgIdx: index("posts_org_idx").on(table.organizationId),
    slugIdx: index("posts_slug_idx").on(table.organizationId, table.slug),
}));

export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
}, (table) => ({
    orgIdx: index("categories_org_idx").on(table.organizationId),
    slugIdx: index("categories_slug_idx").on(table.organizationId, table.slug),
}));

export const postCategories = pgTable("post_categories", {
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
});

export const tags = pgTable("tags", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
}, (table) => ({
    orgIdx: index("tags_org_idx").on(table.organizationId),
    slugIdx: index("tags_slug_idx").on(table.organizationId, table.slug),
}));

export const postTags = pgTable("post_tags", {
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
    tagId: uuid("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
});

export const comments = pgTable("comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    parentId: uuid("parent_id"), // Self-referencing for nested replies
    content: text("content").notNull(),
    status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'approved', 'spam', 'trash'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    orgIdx: index("comments_org_idx").on(table.organizationId),
}));

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    confirmed: boolean("confirmed").default(false).notNull(),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
}, (table) => ({
    orgIdx: index("newsletter_org_idx").on(table.organizationId),
    orgEmailIdx: index("newsletter_org_email_idx").on(table.organizationId, table.email),
}));

export const media = pgTable("media", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    url: text("url").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'image', 'document', etc.
    fileName: varchar("file_name", { length: 255 }),
    mimeType: varchar("mime_type", { length: 100 }),
    size: integer("size"),
    uploaderId: text("uploader_id").references(() => users.id, { onDelete: "set null" }),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => ({
    orgIdx: index("media_org_idx").on(table.organizationId),
}));

export const siteSettings = pgTable("site_settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    siteName: varchar("site_name", { length: 255 }).notNull(),
    siteDescription: text("site_description"),
    logoUrl: text("logo_url"),
    socialLinks: jsonb("social_links"), // E.g., { twitter: '...', github: '...' }
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    orgIdx: index("settings_org_idx").on(table.organizationId),
}));
