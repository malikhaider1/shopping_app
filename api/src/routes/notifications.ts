import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../db";
import {
    Bindings,
    Variables,
    registerDeviceSchema,
    notificationPreferencesSchema,
    paginationSchema,
} from "../types";
import { success, successWithMeta, errors } from "../utils/response";
import { authMiddleware } from "../middleware/auth";

const notifications = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require authentication
notifications.use("/*", authMiddleware);

// ============================================================================
// POST /notifications/register - Register Device for Push Notifications
// ============================================================================
notifications.post(
    "/register",
    zValidator("json", registerDeviceSchema),
    async (c) => {
        const userId = c.get("userId");
        const { playerId } = c.req.valid("json");
        const db = createDb(c.env.DB);

        await db
            .update(schema.users)
            .set({
                onesignalPlayerId: playerId,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.users.id, userId));

        return success(c, { message: "Device registered successfully" });
    }
);

// ============================================================================
// GET /notifications - Get Notification History
// ============================================================================
notifications.get("/", zValidator("query", paginationSchema), async (c) => {
    const userId = c.get("userId");
    const { page, limit } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    // Get user notifications and broadcast notifications
    const notificationsData = await db.query.notifications.findMany({
        where: (n, { or }) =>
            or(eq(n.userId, userId), isNull(n.userId)),
        orderBy: desc(schema.notifications.sentAt),
        limit,
        offset,
    });

    // Count unread
    const allNotifications = await db.query.notifications.findMany({
        where: (n, { or }) =>
            or(eq(n.userId, userId), isNull(n.userId)),
    });

    const unreadCount = allNotifications.filter((n) => !n.isRead).length;

    return successWithMeta(c, notificationsData, {
        page,
        limit,
        total: allNotifications.length,
        // @ts-ignore - adding custom meta
        unreadCount,
    });
});

// ============================================================================
// PUT /notifications/:id/read - Mark Notification as Read
// ============================================================================
notifications.put("/:id/read", async (c) => {
    const userId = c.get("userId");
    const notificationId = c.req.param("id");
    const db = createDb(c.env.DB);

    const notification = await db.query.notifications.findFirst({
        where: eq(schema.notifications.id, notificationId),
    });

    if (!notification) {
        return errors.notFound(c, "Notification");
    }

    // Check if notification belongs to user or is a broadcast
    if (notification.userId && notification.userId !== userId) {
        return errors.forbidden(c);
    }

    await db
        .update(schema.notifications)
        .set({
            isRead: true,
            readAt: new Date().toISOString(),
        })
        .where(eq(schema.notifications.id, notificationId));

    return success(c, { message: "Notification marked as read" });
});

// ============================================================================
// PUT /notifications/read-all - Mark All Notifications as Read
// ============================================================================
notifications.put("/read-all", async (c) => {
    const userId = c.get("userId");
    const db = createDb(c.env.DB);

    // Mark user-specific notifications as read
    await db
        .update(schema.notifications)
        .set({
            isRead: true,
            readAt: new Date().toISOString(),
        })
        .where(eq(schema.notifications.userId, userId));

    return success(c, { message: "All notifications marked as read" });
});

// ============================================================================
// PUT /notifications/preferences - Update Notification Preferences
// ============================================================================
notifications.put(
    "/preferences",
    zValidator("json", notificationPreferencesSchema),
    async (c) => {
        const userId = c.get("userId");
        const preferences = c.req.valid("json");
        const db = createDb(c.env.DB);

        await db
            .update(schema.users)
            .set({
                notificationPreferences: preferences,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.users.id, userId));

        return success(c, preferences);
    }
);

// ============================================================================
// GET /notifications/preferences - Get Notification Preferences
// ============================================================================
notifications.get("/preferences", async (c) => {
    const userId = c.get("userId");
    const db = createDb(c.env.DB);

    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { notificationPreferences: true },
    });

    const defaultPreferences = {
        orders: true,
        promotions: true,
        priceDrops: true,
        stockAlerts: true,
    };

    return success(c, user?.notificationPreferences || defaultPreferences);
});

export default notifications;
