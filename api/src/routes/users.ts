import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../db";
import {
    Bindings,
    Variables,
    updateUserSchema,
    addressSchema,
    registerDeviceSchema,
    notificationPreferencesSchema,
} from "../types";
import { success, errors } from "../utils/response";
import { authMiddleware } from "../middleware/auth";

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require authentication
users.use("/*", authMiddleware);

// ============================================================================
// GET /users/me - Get Current User Profile
// ============================================================================
users.get("/me", async (c) => {
    const userId = c.get("userId");
    const db = createDb(c.env.DB);

    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
    });

    if (!user) {
        return errors.notFound(c, "User");
    }

    return success(c, {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profileImage: user.profileImage,
        isGuest: user.isGuest,
        notificationPreferences: user.notificationPreferences,
        createdAt: user.createdAt,
    });
});

// ============================================================================
// PUT /users/me - Update User Profile
// ============================================================================
users.put("/me", zValidator("json", updateUserSchema), async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    await db
        .update(schema.users)
        .set({
            ...data,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.users.id, userId));

    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
    });

    return success(c, {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        phone: user?.phone,
        profileImage: user?.profileImage,
        isGuest: user?.isGuest,
    });
});

// ============================================================================
// GET /users/me/addresses - Get User Addresses
// ============================================================================
users.get("/me/addresses", async (c) => {
    const userId = c.get("userId");
    const db = createDb(c.env.DB);

    const addresses = await db.query.addresses.findMany({
        where: eq(schema.addresses.userId, userId),
        orderBy: (a, { desc }) => [desc(a.isDefault), desc(a.createdAt)],
    });

    return success(c, addresses);
});

// ============================================================================
// POST /users/me/addresses - Add New Address
// ============================================================================
users.post("/me/addresses", zValidator("json", addressSchema), async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    // If this is the first address or set as default, update other addresses
    if (data.isDefault) {
        await db
            .update(schema.addresses)
            .set({ isDefault: false })
            .where(eq(schema.addresses.userId, userId));
    }

    const addressId = nanoid();
    await db.insert(schema.addresses).values({
        id: addressId,
        userId,
        ...data,
    });

    const address = await db.query.addresses.findFirst({
        where: eq(schema.addresses.id, addressId),
    });

    return success(c, address, 201);
});

// ============================================================================
// PUT /users/me/addresses/:id - Update Address
// ============================================================================
users.put(
    "/me/addresses/:id",
    zValidator("json", addressSchema.partial()),
    async (c) => {
        const userId = c.get("userId");
        const addressId = c.req.param("id");
        const data = c.req.valid("json");
        const db = createDb(c.env.DB);

        // Check if address belongs to user
        const existingAddress = await db.query.addresses.findFirst({
            where: (a, { and }) =>
                and(eq(a.id, addressId), eq(a.userId, userId)),
        });

        if (!existingAddress) {
            return errors.notFound(c, "Address");
        }

        // If setting as default, unset other defaults
        if (data.isDefault) {
            await db
                .update(schema.addresses)
                .set({ isDefault: false })
                .where(eq(schema.addresses.userId, userId));
        }

        await db
            .update(schema.addresses)
            .set({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.addresses.id, addressId));

        const address = await db.query.addresses.findFirst({
            where: eq(schema.addresses.id, addressId),
        });

        return success(c, address);
    }
);

// ============================================================================
// DELETE /users/me/addresses/:id - Delete Address
// ============================================================================
users.delete("/me/addresses/:id", async (c) => {
    const userId = c.get("userId");
    const addressId = c.req.param("id");
    const db = createDb(c.env.DB);

    // Check if address belongs to user
    const existingAddress = await db.query.addresses.findFirst({
        where: (a, { and }) =>
            and(eq(a.id, addressId), eq(a.userId, userId)),
    });

    if (!existingAddress) {
        return errors.notFound(c, "Address");
    }

    await db.delete(schema.addresses).where(eq(schema.addresses.id, addressId));

    return success(c, { message: "Address deleted successfully" });
});

// ============================================================================
// POST /users/me/device - Register Device for Push Notifications
// ============================================================================
users.post(
    "/me/device",
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
// PUT /users/me/notification-preferences - Update Notification Preferences
// ============================================================================
users.put(
    "/me/notification-preferences",
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

export default users;
