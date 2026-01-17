import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, sql } from "drizzle-orm";
import { createDb, schema } from "../db";
import { Bindings, Variables, paginationSchema } from "../types";
import { success, successWithMeta, errors } from "../utils/response";

const categories = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// GET /categories - List All Categories
// ============================================================================
categories.get("/", async (c) => {
    const db = createDb(c.env.DB);

    const categoriesData = await db.query.categories.findMany({
        where: eq(schema.categories.isActive, true),
        orderBy: [schema.categories.displayOrder, schema.categories.name],
    });

    // Build hierarchical structure
    const rootCategories = categoriesData.filter((cat) => !cat.parentId);
    const childCategories = categoriesData.filter((cat) => cat.parentId);

    const hierarchy = rootCategories.map((parent) => ({
        ...parent,
        children: childCategories.filter((child) => child.parentId === parent.id),
    }));

    return success(c, hierarchy);
});

// ============================================================================
// GET /categories/flat - List All Categories (Flat)
// ============================================================================
categories.get("/flat", async (c) => {
    const db = createDb(c.env.DB);

    const categoriesData = await db.query.categories.findMany({
        where: eq(schema.categories.isActive, true),
        orderBy: [schema.categories.displayOrder, schema.categories.name],
    });

    return success(c, categoriesData);
});

// ============================================================================
// GET /categories/:id - Get Category Details
// ============================================================================
categories.get("/:id", async (c) => {
    const categoryId = c.req.param("id");
    const db = createDb(c.env.DB);

    const category = await db.query.categories.findFirst({
        where: eq(schema.categories.id, categoryId),
    });

    if (!category) {
        return errors.notFound(c, "Category");
    }

    // Get subcategories
    const subcategories = await db.query.categories.findMany({
        where: and(
            eq(schema.categories.parentId, categoryId),
            eq(schema.categories.isActive, true)
        ),
        orderBy: schema.categories.displayOrder,
    });

    // Get parent category if exists
    let parentCategory = null;
    if (category.parentId) {
        parentCategory = await db.query.categories.findFirst({
            where: eq(schema.categories.id, category.parentId),
        });
    }

    return success(c, {
        ...category,
        subcategories,
        parent: parentCategory,
    });
});

// ============================================================================
// GET /categories/:id/products - Get Products in Category
// ============================================================================
categories.get(
    "/:id/products",
    zValidator("query", paginationSchema),
    async (c) => {
        const categoryId = c.req.param("id");
        const { page, limit } = c.req.valid("query");
        const offset = (page - 1) * limit;
        const db = createDb(c.env.DB);

        // Check if category exists
        const category = await db.query.categories.findFirst({
            where: eq(schema.categories.id, categoryId),
        });

        if (!category) {
            return errors.notFound(c, "Category");
        }

        // Get subcategory IDs to include products from them too
        const subcategories = await db.query.categories.findMany({
            where: eq(schema.categories.parentId, categoryId),
            columns: { id: true },
        });

        const categoryIds = [categoryId, ...subcategories.map((sc) => sc.id)];

        const products = await db.query.products.findMany({
            where: and(
                eq(schema.products.isActive, true),
                sql`${schema.products.categoryId} IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)})`
            ),
            orderBy: desc(schema.products.createdAt),
            limit,
            offset,
        });

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.products)
            .where(
                and(
                    eq(schema.products.isActive, true),
                    sql`${schema.products.categoryId} IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)})`
                )
            );

        return successWithMeta(c, products, {
            page,
            limit,
            total: countResult[0]?.count || 0,
            totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
        });
    }
);

export default categories;
