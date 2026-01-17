import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { createDb, schema } from "../../db";
import { Bindings, Variables } from "../../types";
import { success, errors } from "../../utils/response";
import { adminMiddleware } from "../../middleware/admin";

const dashboard = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require admin authentication
dashboard.use("/*", adminMiddleware);

// ============================================================================
// GET /admin/dashboard/stats - Get Dashboard Statistics
// ============================================================================
dashboard.get("/stats", async (c) => {
    const db = createDb(c.env.DB);

    // Total orders
    const totalOrders = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders);

    // Total revenue
    const totalRevenue = await db
        .select({ sum: sql<number>`COALESCE(sum(${schema.orders.totalAmount}), 0)` })
        .from(schema.orders)
        .where(eq(schema.orders.paymentStatus, "paid"));

    // Total users
    const totalUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(eq(schema.users.isGuest, false));

    // Total guests
    const totalGuests = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(eq(schema.users.isGuest, true));

    // Total products
    const totalProducts = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products);

    // Orders by status
    const ordersByStatus = await db
        .select({
            status: schema.orders.status,
            count: sql<number>`count(*)`,
        })
        .from(schema.orders)
        .groupBy(schema.orders.status);

    // Low stock products (stock < 10)
    const lowStockProducts = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products)
        .where(and(
            eq(schema.products.isActive, true),
            lte(schema.products.stockQuantity, 10)
        ));

    // Pending reviews
    const pendingReviews = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.reviews)
        .where(eq(schema.reviews.isApproved, false));

    return success(c, {
        totalOrders: totalOrders[0]?.count || 0,
        totalRevenue: totalRevenue[0]?.sum || 0,
        totalUsers: totalUsers[0]?.count || 0,
        totalGuests: totalGuests[0]?.count || 0,
        totalProducts: totalProducts[0]?.count || 0,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
        }, {} as Record<string, number>),
        lowStockProducts: lowStockProducts[0]?.count || 0,
        pendingReviews: pendingReviews[0]?.count || 0,
    });
});

// ============================================================================
// GET /admin/dashboard/sales - Get Sales Data
// ============================================================================
dashboard.get("/sales", async (c) => {
    const db = createDb(c.env.DB);
    const period = c.req.query("period") || "week"; // week, month, year

    let daysBack = 7;
    if (period === "month") daysBack = 30;
    if (period === "year") daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const orders = await db.query.orders.findMany({
        where: and(
            gte(schema.orders.createdAt, startDate.toISOString()),
            eq(schema.orders.paymentStatus, "paid")
        ),
        columns: {
            totalAmount: true,
            createdAt: true,
        },
    });

    // Group by date
    const salesByDate = orders.reduce((acc, order) => {
        const date = order.createdAt.split("T")[0];
        if (!acc[date]) {
            acc[date] = { date, total: 0, count: 0 };
        }
        acc[date].total += order.totalAmount;
        acc[date].count += 1;
        return acc;
    }, {} as Record<string, { date: string; total: number; count: number }>);

    return success(c, {
        period,
        data: Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date)),
        totalSales: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        totalOrders: orders.length,
    });
});

// ============================================================================
// GET /admin/dashboard/orders - Get Recent Orders
// ============================================================================
dashboard.get("/orders", async (c) => {
    const db = createDb(c.env.DB);

    const recentOrders = await db.query.orders.findMany({
        orderBy: desc(schema.orders.createdAt),
        limit: 10,
    });

    // Get user info for each order
    const ordersWithUser = await Promise.all(
        recentOrders.map(async (order) => {
            let user = null;
            if (order.userId) {
                user = await db.query.users.findFirst({
                    where: eq(schema.users.id, order.userId),
                    columns: { id: true, name: true, email: true },
                });
            }
            return { ...order, user };
        })
    );

    return success(c, ordersWithUser);
});

// ============================================================================
// GET /admin/dashboard/products/low-stock - Get Low Stock Products
// ============================================================================
dashboard.get("/products/low-stock", async (c) => {
    const db = createDb(c.env.DB);

    const lowStockProducts = await db.query.products.findMany({
        where: and(
            eq(schema.products.isActive, true),
            lte(schema.products.stockQuantity, 10)
        ),
        orderBy: schema.products.stockQuantity,
        limit: 20,
    });

    return success(c, lowStockProducts);
});

// ============================================================================
// GET /admin/dashboard/products/top-selling - Get Top Selling Products
// ============================================================================
dashboard.get("/products/top-selling", async (c) => {
    const db = createDb(c.env.DB);

    // Get products ordered most frequently
    const topProducts = await db
        .select({
            productId: schema.orderItems.productId,
            productName: schema.orderItems.productName,
            totalQuantity: sql<number>`sum(${schema.orderItems.quantity})`,
            totalRevenue: sql<number>`sum(${schema.orderItems.totalPrice})`,
        })
        .from(schema.orderItems)
        .groupBy(schema.orderItems.productId, schema.orderItems.productName)
        .orderBy(desc(sql`sum(${schema.orderItems.quantity})`))
        .limit(10);

    return success(c, topProducts);
});

export default dashboard;
