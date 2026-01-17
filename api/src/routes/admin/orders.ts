import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, like, or } from "drizzle-orm";
import { createDb, schema } from "../../db";
import {
    Bindings,
    Variables,
    updateOrderStatusSchema,
    paginationSchema,
} from "../../types";
import { success, successWithMeta, errors } from "../../utils/response";
import { adminMiddleware } from "../../middleware/admin";
import { z } from "zod";

const orders = new Hono<{ Bindings: Bindings; Variables: Variables }>();

orders.use("/*", adminMiddleware);

const orderQuerySchema = paginationSchema.extend({
    status: z.enum(["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]).optional(),
    search: z.string().optional(),
});

// GET /admin/orders
orders.get("/", zValidator("query", orderQuerySchema), async (c) => {
    const { page, limit, status, search } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    const conditions: any[] = [];
    if (status) conditions.push(eq(schema.orders.status, status));
    if (search) conditions.push(like(schema.orders.orderNumber, `%${search}%`));

    const ordersData = await db.query.orders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(schema.orders.createdAt),
        limit,
        offset,
    });

    const ordersWithUser = await Promise.all(
        ordersData.map(async (order) => {
            let user = null;
            if (order.userId) {
                user = await db.query.users.findFirst({
                    where: eq(schema.users.id, order.userId),
                    columns: { id: true, name: true, email: true, phone: true },
                });
            }
            return { ...order, user };
        })
    );

    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    return successWithMeta(c, ordersWithUser, {
        page,
        limit,
        total: countResult[0]?.count || 0,
    });
});

// GET /admin/orders/:id
orders.get("/:id", async (c) => {
    const orderId = c.req.param("id");
    const db = createDb(c.env.DB);

    const order = await db.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
    });

    if (!order) return errors.notFound(c, "Order");

    const items = await db.query.orderItems.findMany({
        where: eq(schema.orderItems.orderId, orderId),
    });

    let user = null;
    if (order.userId) {
        user = await db.query.users.findFirst({
            where: eq(schema.users.id, order.userId),
        });
    }

    return success(c, { ...order, items, user });
});

// PUT /admin/orders/:id/status
orders.put("/:id/status", zValidator("json", updateOrderStatusSchema), async (c) => {
    const orderId = c.req.param("id");
    const { status, notes } = c.req.valid("json");
    const db = createDb(c.env.DB);

    const order = await db.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
    });

    if (!order) return errors.notFound(c, "Order");

    const updates: any = {
        status,
        updatedAt: new Date().toISOString(),
    };

    if (status === "shipped") updates.shippedAt = new Date().toISOString();
    if (status === "delivered") updates.deliveredAt = new Date().toISOString();
    if (status === "cancelled") updates.cancelledAt = new Date().toISOString();
    if (notes) updates.notes = notes;

    await db.update(schema.orders).set(updates).where(eq(schema.orders.id, orderId));

    const updatedOrder = await db.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
    });

    return success(c, updatedOrder);
});

export default orders;
