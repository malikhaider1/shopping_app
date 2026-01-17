import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, like } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../../db";
import {
    Bindings,
    Variables,
    createCouponSchema,
    updateCouponSchema,
    paginationSchema,
} from "../../types";
import { success, successWithMeta, errors } from "../../utils/response";
import { adminMiddleware } from "../../middleware/admin";
import { z } from "zod";

const coupons = new Hono<{ Bindings: Bindings; Variables: Variables }>();

coupons.use("/*", adminMiddleware);

const couponQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
});

// GET /admin/coupons
coupons.get("/", zValidator("query", couponQuerySchema), async (c) => {
    const { page, limit, search, isActive } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    const conditions: any[] = [];
    if (search) conditions.push(like(schema.coupons.code, `%${search.toUpperCase()}%`));
    if (isActive !== undefined) conditions.push(eq(schema.coupons.isActive, isActive));

    const couponsData = await db.query.coupons.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(schema.coupons.createdAt),
        limit,
        offset,
    });

    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.coupons)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    return successWithMeta(c, couponsData, { page, limit, total: countResult[0]?.count || 0 });
});

// GET /admin/coupons/:id
coupons.get("/:id", async (c) => {
    const couponId = c.req.param("id");
    const db = createDb(c.env.DB);

    const coupon = await db.query.coupons.findFirst({
        where: eq(schema.coupons.id, couponId),
    });

    if (!coupon) return errors.notFound(c, "Coupon");

    const usages = await db.query.couponUsages.findMany({
        where: eq(schema.couponUsages.couponId, couponId),
    });

    return success(c, { ...coupon, usageHistory: usages });
});

// POST /admin/coupons
coupons.post("/", zValidator("json", createCouponSchema), async (c) => {
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    const existing = await db.query.coupons.findFirst({
        where: eq(schema.coupons.code, data.code),
    });

    if (existing) return errors.conflict(c, "Coupon code already exists");

    const couponId = nanoid();
    await db.insert(schema.coupons).values({ id: couponId, ...data });

    const coupon = await db.query.coupons.findFirst({
        where: eq(schema.coupons.id, couponId),
    });

    return success(c, coupon, 201);
});

// PUT /admin/coupons/:id
coupons.put("/:id", zValidator("json", updateCouponSchema), async (c) => {
    const couponId = c.req.param("id");
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    const existing = await db.query.coupons.findFirst({
        where: eq(schema.coupons.id, couponId),
    });

    if (!existing) return errors.notFound(c, "Coupon");

    await db
        .update(schema.coupons)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(schema.coupons.id, couponId));

    const coupon = await db.query.coupons.findFirst({
        where: eq(schema.coupons.id, couponId),
    });

    return success(c, coupon);
});

// DELETE /admin/coupons/:id
coupons.delete("/:id", async (c) => {
    const couponId = c.req.param("id");
    const db = createDb(c.env.DB);

    const existing = await db.query.coupons.findFirst({
        where: eq(schema.coupons.id, couponId),
    });

    if (!existing) return errors.notFound(c, "Coupon");

    await db.delete(schema.coupons).where(eq(schema.coupons.id, couponId));

    return success(c, { message: "Coupon deleted" });
});

export default coupons;
