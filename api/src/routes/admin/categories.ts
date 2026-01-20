import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../../db";
import {
    Bindings,
    Variables,
    createCategorySchema,
    updateCategorySchema,
    paginationSchema,
} from "../../types";
import { success, successWithMeta, errors } from "../../utils/response";
import { adminMiddleware } from "../../middleware/admin";

const categories = new Hono<{ Bindings: Bindings; Variables: Variables }>();

categories.use("/*", adminMiddleware);

// GET /admin/categories
categories.get("/", zValidator("query", paginationSchema), async (c) => {
    const { page, limit } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    const categoriesData = await db.query.categories.findMany({
        orderBy: [schema.categories.displayOrder, schema.categories.name],
        limit,
        offset,
    });

    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.categories);

    return successWithMeta(c, categoriesData, {
        page,
        limit,
        total: countResult[0]?.count || 0,
    });
});

// GET /admin/categories/:id
categories.get("/:id", async (c) => {
    const categoryId = c.req.param("id");
    const db = createDb(c.env.DB);

    const category = await db.query.categories.findFirst({
        where: eq(schema.categories.id, categoryId),
    });

    if (!category) return errors.notFound(c, "Category");

    return success(c, category);
});

// POST /admin/categories
categories.post("/", zValidator("json", createCategorySchema), async (c) => {
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    const existing = await db.query.categories.findFirst({
        where: eq(schema.categories.slug, data.slug),
    });

    if (existing) return errors.conflict(c, "Category with this slug already exists");

    const categoryId = nanoid();
    await db.insert(schema.categories).values({ id: categoryId, ...data });

    const category = await db.query.categories.findFirst({
        where: eq(schema.categories.id, categoryId),
    });

    return success(c, category, 201);
});

// PUT /admin/categories/:id
categories.put("/:id", zValidator("json", updateCategorySchema), async (c) => {
    const categoryId = c.req.param("id");
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    const existing = await db.query.categories.findFirst({
        where: eq(schema.categories.id, categoryId),
    });

    if (!existing) return errors.notFound(c, "Category");

    await db
        .update(schema.categories)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(schema.categories.id, categoryId));

    const category = await db.query.categories.findFirst({
        where: eq(schema.categories.id, categoryId),
    });

    return success(c, category);
});

// DELETE /admin/categories/:id - Hard delete
categories.delete("/:id", async (c) => {
    const categoryId = c.req.param("id");
    const db = createDb(c.env.DB);

    const existing = await db.query.categories.findFirst({
        where: eq(schema.categories.id, categoryId),
    });

    if (!existing) return errors.notFound(c, "Category");

    // Check if category has products
    const productsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products)
        .where(eq(schema.products.categoryId, categoryId));

    if (productsCount[0]?.count > 0) {
        return errors.badRequest(c, "Cannot delete category with products. Remove products first or use suspend.");
    }

    // Hard delete - actually remove from database
    await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));

    return success(c, { message: "Category permanently deleted" });
});

// PATCH /admin/categories/:id/toggle-status - Suspend/Activate
categories.patch("/:id/toggle-status", async (c) => {
    const categoryId = c.req.param("id");
    const db = createDb(c.env.DB);

    const existing = await db.query.categories.findFirst({
        where: eq(schema.categories.id, categoryId),
    });

    if (!existing) return errors.notFound(c, "Category");

    const newStatus = !existing.isActive;

    await db
        .update(schema.categories)
        .set({ isActive: newStatus, updatedAt: new Date().toISOString() })
        .where(eq(schema.categories.id, categoryId));

    return success(c, {
        message: newStatus ? "Category activated" : "Category suspended",
        isActive: newStatus
    });
});

export default categories;
