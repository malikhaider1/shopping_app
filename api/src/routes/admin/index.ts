import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../../db";
import {
    Bindings,
    Variables,
    adminLoginSchema,
    createAdminSchema,
    sendNotificationSchema,
    paginationSchema,
} from "../../types";
import { success, successWithMeta, errors } from "../../utils/response";
import { adminMiddleware, requireRole } from "../../middleware/admin";
import { generateAdminToken } from "../../utils/jwt";

// Import admin sub-routes
import dashboard from "./dashboard";
import products from "./products";
import categories from "./categories";
import orders from "./orders";
import users from "./users";
import banners from "./banners";
import coupons from "./coupons";
import reviews from "./reviews";
import settings from "./settings";
import upload from "./upload";

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// Admin Authentication
// ============================================================================

// POST /admin/login
admin.post("/login", zValidator("json", adminLoginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const db = createDb(c.env.DB);

    const adminUser = await db.query.adminUsers.findFirst({
        where: eq(schema.adminUsers.email, email),
    });

    if (!adminUser || !adminUser.isActive) {
        return errors.unauthorized(c, "Invalid credentials");
    }

    // Simple password verification (in production, use proper hashing like bcrypt)
    // For Workers, you might use Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (adminUser.passwordHash !== hashedPassword) {
        return errors.unauthorized(c, "Invalid credentials");
    }

    // Update last login
    await db
        .update(schema.adminUsers)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(schema.adminUsers.id, adminUser.id));

    // Generate token
    const token = await generateAdminToken(adminUser.id, adminUser.role, c.env.JWT_SECRET);

    return success(c, {
        token,
        admin: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
        },
    });
});

// ============================================================================
// Create Admin (Super Admin Only)
// ============================================================================
admin.post(
    "/admins",
    adminMiddleware,
    requireRole("super_admin"),
    zValidator("json", createAdminSchema),
    async (c) => {
        const data = c.req.valid("json");
        const db = createDb(c.env.DB);

        const existing = await db.query.adminUsers.findFirst({
            where: eq(schema.adminUsers.email, data.email),
        });

        if (existing) {
            return errors.conflict(c, "Admin with this email already exists");
        }

        // Hash password
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(data.password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", passwordData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        const adminId = nanoid();
        await db.insert(schema.adminUsers).values({
            id: adminId,
            email: data.email,
            passwordHash,
            name: data.name,
            role: data.role,
        });

        const adminUser = await db.query.adminUsers.findFirst({
            where: eq(schema.adminUsers.id, adminId),
            columns: { id: true, email: true, name: true, role: true, createdAt: true },
        });

        return success(c, adminUser, 201);
    }
);

// ============================================================================
// Get Notification History (Admin)
// ============================================================================
admin.get(
    "/notifications",
    adminMiddleware,
    zValidator("query", paginationSchema),
    async (c) => {
        const { page, limit } = c.req.valid("query");
        const offset = (page - 1) * limit;
        const db = createDb(c.env.DB);

        const notificationsData = await db.query.notifications.findMany({
            orderBy: desc(schema.notifications.sentAt),
            limit,
            offset,
        });

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.notifications);

        return successWithMeta(c, notificationsData, {
            page,
            limit,
            total: countResult[0]?.count || 0,
        });
    }
);

// ============================================================================
// Send Push Notification (Admin)
// ============================================================================
admin.post(
    "/notifications/send",
    adminMiddleware,
    zValidator("json", sendNotificationSchema),
    async (c) => {
        const { title, body, userIds, segment, data } = c.req.valid("json");
        const db = createDb(c.env.DB);

        // Get OneSignal credentials
        const onesignalAppId = c.env.ONESIGNAL_APP_ID;
        const onesignalApiKey = c.env.ONESIGNAL_API_KEY;

        if (!onesignalAppId || !onesignalApiKey) {
            return errors.serverError(c, "OneSignal not configured");
        }

        // Build notification payload
        const notificationPayload: any = {
            app_id: onesignalAppId,
            headings: { en: title },
            contents: { en: body },
            data: data || {},
        };

        if (userIds && userIds.length > 0) {
            // Get player IDs for specific users
            const users = await db.query.users.findMany({
                where: (u, { inArray }) => inArray(u.id, userIds),
                columns: { onesignalPlayerId: true },
            });

            const playerIds = users
                .map((u) => u.onesignalPlayerId)
                .filter((id): id is string => !!id);

            if (playerIds.length === 0) {
                return errors.badRequest(c, "No valid devices found for specified users");
            }

            notificationPayload.include_player_ids = playerIds;
        } else if (segment) {
            // Send to segment
            switch (segment) {
                case "all":
                    notificationPayload.included_segments = ["All"];
                    break;
                case "registered":
                    notificationPayload.filters = [
                        { field: "tag", key: "isGuest", relation: "=", value: "false" },
                    ];
                    break;
                case "guests":
                    notificationPayload.filters = [
                        { field: "tag", key: "isGuest", relation: "=", value: "true" },
                    ];
                    break;
            }
        } else {
            notificationPayload.included_segments = ["All"];
        }

        // Send to OneSignal
        try {
            const response = await fetch("https://onesignal.com/api/v1/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${onesignalApiKey}`,
                },
                body: JSON.stringify(notificationPayload),
            });

            const result = await response.json();

            if (!response.ok) {
                return errors.serverError(c, "Failed to send notification");
            }

            // Store notification in database
            await db.insert(schema.notifications).values({
                id: nanoid(),
                userId: userIds && userIds.length === 1 ? userIds[0] : null,
                title,
                body,
                data,
                notificationType: "general",
            });

            return success(c, {
                message: "Notification sent",
                recipients: (result as any).recipients || 0,
            });
        } catch (error) {
            console.error("OneSignal error:", error);
            return errors.serverError(c, "Failed to send notification");
        }
    }
);

// ============================================================================
// Mount Sub-Routes
// ============================================================================
admin.route("/dashboard", dashboard);
admin.route("/products", products);
admin.route("/categories", categories);
admin.route("/orders", orders);
admin.route("/users", users);
admin.route("/banners", banners);
admin.route("/coupons", coupons);
admin.route("/reviews", reviews);
admin.route("/settings", settings);
admin.route("/upload", upload);

export default admin;
