import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, like, or } from "drizzle-orm";
import { createDb, schema } from "../../db";
import { Bindings, Variables, paginationSchema } from "../../types";
import { success, successWithMeta, errors } from "../../utils/response";
import { adminMiddleware } from "../../middleware/admin";
import { z } from "zod";

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>();

users.use("/*", adminMiddleware);

const userQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
    isGuest: z.coerce.boolean().optional(),
    isActive: z.coerce.boolean().optional(),
});

// GET /admin/users
users.get("/", zValidator("query", userQuerySchema), async (c) => {
    const { page, limit, search, isGuest, isActive } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    const conditions: any[] = [];
    if (search) {
        conditions.push(
            or(
                like(schema.users.name, `%${search}%`),
                like(schema.users.email, `%${search}%`),
                like(schema.users.phone, `%${search}%`)
            )
        );
    }
    if (isGuest !== undefined) conditions.push(eq(schema.users.isGuest, isGuest));
    if (isActive !== undefined) conditions.push(eq(schema.users.isActive, isActive));

    const usersData = await db.query.users.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(schema.users.createdAt),
        limit,
        offset,
        columns: {
            id: true,
            email: true,
            name: true,
            phone: true,
            profileImage: true,
            isGuest: true,
            isActive: true,
            createdAt: true,
        },
    });

    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    return successWithMeta(c, usersData, {
        page,
        limit,
        total: countResult[0]?.count || 0,
    });
});

// GET /admin/users/:id
users.get("/:id", async (c) => {
    const userId = c.req.param("id");
    const db = createDb(c.env.DB);

    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
    });

    if (!user) return errors.notFound(c, "User");

    const ordersCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders)
        .where(eq(schema.orders.userId, userId));

    const addresses = await db.query.addresses.findMany({
        where: eq(schema.addresses.userId, userId),
    });

    return success(c, {
        ...user,
        ordersCount: ordersCount[0]?.count || 0,
        addresses,
    });
});

// PUT /admin/users/:id/status
users.put("/:id/status", async (c) => {
    const userId = c.req.param("id");
    const { isActive } = await c.req.json();
    const db = createDb(c.env.DB);

    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
    });

    if (!user) return errors.notFound(c, "User");

    await db
        .update(schema.users)
        .set({ isActive, updatedAt: new Date().toISOString() })
        .where(eq(schema.users.id, userId));

    return success(c, { message: `User ${isActive ? "activated" : "deactivated"}` });
});

// GET /admin/users/:id/orders
users.get("/:id/orders", zValidator("query", paginationSchema), async (c) => {
    const userId = c.req.param("id");
    const { page, limit } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    const ordersData = await db.query.orders.findMany({
        where: eq(schema.orders.userId, userId),
        orderBy: desc(schema.orders.createdAt),
        limit,
        offset,
    });

    return success(c, ordersData);
});

export default users;
