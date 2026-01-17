import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../../db";
import {
    Bindings,
    Variables,
    createBannerSchema,
    updateBannerSchema,
    paginationSchema,
} from "../../types";
import { success, successWithMeta, errors } from "../../utils/response";
import { adminMiddleware } from "../../middleware/admin";

const banners = new Hono<{ Bindings: Bindings; Variables: Variables }>();

banners.use("/*", adminMiddleware);

// GET /admin/banners
banners.get("/", zValidator("query", paginationSchema), async (c) => {
    const { page, limit } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    const bannersData = await db.query.banners.findMany({
        orderBy: [schema.banners.displayOrder, desc(schema.banners.createdAt)],
        limit,
        offset,
    });

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(schema.banners);

    return successWithMeta(c, bannersData, { page, limit, total: countResult[0]?.count || 0 });
});

// GET /admin/banners/:id
banners.get("/:id", async (c) => {
    const bannerId = c.req.param("id");
    const db = createDb(c.env.DB);

    const banner = await db.query.banners.findFirst({
        where: eq(schema.banners.id, bannerId),
    });

    if (!banner) return errors.notFound(c, "Banner");
    return success(c, banner);
});

// POST /admin/banners
banners.post("/", zValidator("json", createBannerSchema), async (c) => {
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    const bannerId = nanoid();
    await db.insert(schema.banners).values({ id: bannerId, ...data });

    const banner = await db.query.banners.findFirst({
        where: eq(schema.banners.id, bannerId),
    });

    return success(c, banner, 201);
});

// PUT /admin/banners/:id
banners.put("/:id", zValidator("json", updateBannerSchema), async (c) => {
    const bannerId = c.req.param("id");
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    const existing = await db.query.banners.findFirst({
        where: eq(schema.banners.id, bannerId),
    });

    if (!existing) return errors.notFound(c, "Banner");

    await db
        .update(schema.banners)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(schema.banners.id, bannerId));

    const banner = await db.query.banners.findFirst({
        where: eq(schema.banners.id, bannerId),
    });

    return success(c, banner);
});

// DELETE /admin/banners/:id
banners.delete("/:id", async (c) => {
    const bannerId = c.req.param("id");
    const db = createDb(c.env.DB);

    const existing = await db.query.banners.findFirst({
        where: eq(schema.banners.id, bannerId),
    });

    if (!existing) return errors.notFound(c, "Banner");

    await db.delete(schema.banners).where(eq(schema.banners.id, bannerId));

    return success(c, { message: "Banner deleted" });
});

export default banners;
