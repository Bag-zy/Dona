import { NextResponse } from "next/server";

const spec = {
    openapi: "3.1.0",
    info: {
        title: "Dona API",
        version: "1.0.0",
        description:
            "The Dona Blog Platform external REST API. Use Bearer token authentication with your API key (dona_xxx) to access resources.",
        contact: { name: "Dona Team" },
    },
    servers: [
        { url: "http://localhost:3000", description: "Development" },
    ],
    security: [{ BearerAuth: [] }],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "dona_<token>",
                description: "Generate an API key from Admin → Developer Settings. Include as: Authorization: Bearer dona_<your-key>",
            },
        },
        schemas: {
            Post: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    slug: { type: "string" },
                    excerpt: { type: "string", nullable: true },
                    featuredImage: { type: "string", nullable: true },
                    publishedAt: { type: "string", format: "date-time", nullable: true },
                    readingTime: { type: "integer", nullable: true },
                    views: { type: "integer" },
                    authorName: { type: "string", nullable: true },
                },
            },
            Category: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    description: { type: "string", nullable: true },
                },
            },
            Tag: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    slug: { type: "string" },
                },
            },
            Error: {
                type: "object",
                properties: {
                    error: { type: "string" },
                },
            },
        },
    },
    paths: {
        "/api/v1/posts": {
            get: {
                summary: "List published posts",
                tags: ["Posts"],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
                ],
                responses: {
                    "200": {
                        description: "List of published posts",
                        content: { "application/json": { schema: { type: "object", properties: { posts: { type: "array", items: { $ref: "#/components/schemas/Post" } }, page: { type: "integer" }, limit: { type: "integer" } } } } },
                    },
                    "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
                },
            },
            post: {
                summary: "Create a new post draft",
                tags: ["Posts"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title", "slug"],
                                properties: {
                                    title: { type: "string" },
                                    slug: { type: "string" },
                                    excerpt: { type: "string" },
                                    content: { type: "object" },
                                    featuredImage: { type: "string" },
                                    status: { type: "string", enum: ["draft", "published", "scheduled"] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": { description: "Post created" },
                    "400": { description: "Validation error" },
                    "401": { description: "Unauthorized" },
                    "409": { description: "Slug already exists" },
                },
            },
        },
        "/api/v1/categories": {
            get: {
                summary: "List all categories",
                tags: ["Categories"],
                responses: {
                    "200": {
                        description: "List of categories",
                        content: { "application/json": { schema: { type: "object", properties: { categories: { type: "array", items: { $ref: "#/components/schemas/Category" } } } } } },
                    },
                },
            },
        },
        "/api/v1/tags": {
            get: {
                summary: "List all tags",
                tags: ["Tags"],
                responses: {
                    "200": {
                        description: "List of tags",
                        content: { "application/json": { schema: { type: "object", properties: { tags: { type: "array", items: { $ref: "#/components/schemas/Tag" } } } } } },
                    },
                },
            },
        },
    },
    tags: [
        { name: "Posts", description: "Blog post operations" },
        { name: "Categories", description: "Category management" },
        { name: "Tags", description: "Tag management" },
    ],
};

export async function GET() {
    return NextResponse.json(spec, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
