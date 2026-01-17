import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../db";
import {
    Bindings,
    Variables,
    googleAuthSchema,
    guestInitSchema,
    refreshTokenSchema,
} from "../types";
import { success, errors } from "../utils/response";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    TokenPayload,
    getExpirationDate,
} from "../utils/jwt";
import { authMiddleware } from "../middleware/auth";

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// POST /auth/google - Google OAuth Sign-In
// ============================================================================
auth.post("/google", zValidator("json", googleAuthSchema), async (c) => {
    const { idToken } = c.req.valid("json");
    const db = createDb(c.env.DB);

    try {
        // Verify Google ID token
        const googleResponse = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        );

        if (!googleResponse.ok) {
            return errors.unauthorized(c, "Invalid Google token");
        }

        const googleData = (await googleResponse.json()) as {
            sub: string;
            email: string;
            name: string;
            picture: string;
            aud: string;
        };

        // Verify the token was issued for our app
        if (googleData.aud !== c.env.GOOGLE_CLIENT_ID) {
            return errors.unauthorized(c, "Token not issued for this application");
        }

        // Check if user exists
        let user = await db.query.users.findFirst({
            where: eq(schema.users.googleId, googleData.sub),
        });

        if (!user) {
            // Create new user
            const userId = nanoid();
            await db.insert(schema.users).values({
                id: userId,
                googleId: googleData.sub,
                email: googleData.email,
                name: googleData.name,
                profileImage: googleData.picture,
                isGuest: false,
            });

            user = await db.query.users.findFirst({
                where: eq(schema.users.id, userId),
            });
        } else {
            // Update existing user info
            await db
                .update(schema.users)
                .set({
                    email: googleData.email,
                    name: googleData.name,
                    profileImage: googleData.picture,
                    isGuest: false,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(schema.users.id, user.id));
        }

        if (!user) {
            return errors.serverError(c, "Failed to create user");
        }

        // Generate tokens
        const accessToken = await generateAccessToken(
            user.id,
            false,
            c.env.JWT_SECRET,
            c.env.JWT_EXPIRES_IN
        );
        const refreshToken = await generateRefreshToken(
            user.id,
            false,
            c.env.JWT_SECRET,
            c.env.REFRESH_TOKEN_EXPIRES_IN
        );

        // Store refresh token
        await db.insert(schema.refreshTokens).values({
            id: nanoid(),
            userId: user.id,
            token: refreshToken,
            expiresAt: getExpirationDate(c.env.REFRESH_TOKEN_EXPIRES_IN),
        });

        return success(c, {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                profileImage: user.profileImage,
                isGuest: false,
            },
        });
    } catch (error) {
        console.error("Google auth error:", error);
        return errors.serverError(c, "Authentication failed");
    }
});

// ============================================================================
// POST /auth/guest/init - Initialize Guest User
// ============================================================================
auth.post("/guest/init", zValidator("json", guestInitSchema), async (c) => {
    const { deviceId } = c.req.valid("json");
    const db = createDb(c.env.DB);

    try {
        // Check if guest user already exists for this device
        let user = await db.query.users.findFirst({
            where: eq(schema.users.deviceId, deviceId),
        });

        if (!user) {
            // Create new guest user
            const userId = nanoid();
            await db.insert(schema.users).values({
                id: userId,
                deviceId,
                isGuest: true,
            });

            user = await db.query.users.findFirst({
                where: eq(schema.users.id, userId),
            });
        }

        if (!user) {
            return errors.serverError(c, "Failed to create guest user");
        }

        // Generate tokens
        const accessToken = await generateAccessToken(
            user.id,
            true,
            c.env.JWT_SECRET,
            c.env.JWT_EXPIRES_IN
        );
        const refreshToken = await generateRefreshToken(
            user.id,
            true,
            c.env.JWT_SECRET,
            c.env.REFRESH_TOKEN_EXPIRES_IN
        );

        // Store refresh token
        await db.insert(schema.refreshTokens).values({
            id: nanoid(),
            userId: user.id,
            token: refreshToken,
            expiresAt: getExpirationDate(c.env.REFRESH_TOKEN_EXPIRES_IN),
        });

        return success(c, {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                isGuest: true,
            },
        });
    } catch (error) {
        console.error("Guest init error:", error);
        return errors.serverError(c, "Failed to initialize guest user");
    }
});

// ============================================================================
// POST /auth/refresh - Refresh Access Token
// ============================================================================
auth.post("/refresh", zValidator("json", refreshTokenSchema), async (c) => {
    const { refreshToken } = c.req.valid("json");
    const db = createDb(c.env.DB);

    try {
        // Verify the refresh token
        const payload = await verifyToken<TokenPayload>(
            refreshToken,
            c.env.JWT_SECRET
        );

        if (!payload || payload.type !== "refresh") {
            return errors.unauthorized(c, "Invalid refresh token");
        }

        // Check if token exists in database
        const storedToken = await db.query.refreshTokens.findFirst({
            where: eq(schema.refreshTokens.token, refreshToken),
        });

        if (!storedToken) {
            return errors.unauthorized(c, "Refresh token not found");
        }

        // Check if token is expired
        if (new Date(storedToken.expiresAt) < new Date()) {
            // Delete expired token
            await db
                .delete(schema.refreshTokens)
                .where(eq(schema.refreshTokens.id, storedToken.id));
            return errors.unauthorized(c, "Refresh token expired");
        }

        // Get user
        const user = await db.query.users.findFirst({
            where: eq(schema.users.id, payload.sub),
        });

        if (!user || !user.isActive) {
            return errors.unauthorized(c, "User not found or inactive");
        }

        // Delete old refresh token
        await db
            .delete(schema.refreshTokens)
            .where(eq(schema.refreshTokens.id, storedToken.id));

        // Generate new tokens
        const newAccessToken = await generateAccessToken(
            user.id,
            user.isGuest,
            c.env.JWT_SECRET,
            c.env.JWT_EXPIRES_IN
        );
        const newRefreshToken = await generateRefreshToken(
            user.id,
            user.isGuest,
            c.env.JWT_SECRET,
            c.env.REFRESH_TOKEN_EXPIRES_IN
        );

        // Store new refresh token
        await db.insert(schema.refreshTokens).values({
            id: nanoid(),
            userId: user.id,
            token: newRefreshToken,
            expiresAt: getExpirationDate(c.env.REFRESH_TOKEN_EXPIRES_IN),
        });

        return success(c, {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error("Token refresh error:", error);
        return errors.serverError(c, "Failed to refresh token");
    }
});

// ============================================================================
// POST /auth/logout - Logout User
// ============================================================================
auth.post("/logout", authMiddleware, async (c) => {
    const userId = c.get("userId");
    const db = createDb(c.env.DB);

    try {
        // Delete all refresh tokens for this user
        await db
            .delete(schema.refreshTokens)
            .where(eq(schema.refreshTokens.userId, userId));

        return success(c, { message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return errors.serverError(c, "Failed to logout");
    }
});

// ============================================================================
// POST /auth/link-guest - Link guest account to Google (merge data)
// ============================================================================
auth.post(
    "/link-guest",
    authMiddleware,
    zValidator("json", googleAuthSchema),
    async (c) => {
        const userId = c.get("userId");
        const isGuest = c.get("isGuest");
        const { idToken } = c.req.valid("json");
        const db = createDb(c.env.DB);

        if (!isGuest) {
            return errors.badRequest(c, "User is already authenticated");
        }

        try {
            // Verify Google ID token
            const googleResponse = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
            );

            if (!googleResponse.ok) {
                return errors.unauthorized(c, "Invalid Google token");
            }

            const googleData = (await googleResponse.json()) as {
                sub: string;
                email: string;
                name: string;
                picture: string;
                aud: string;
            };

            if (googleData.aud !== c.env.GOOGLE_CLIENT_ID) {
                return errors.unauthorized(c, "Token not issued for this application");
            }

            // Check if a user with this Google ID already exists
            const existingUser = await db.query.users.findFirst({
                where: eq(schema.users.googleId, googleData.sub),
            });

            if (existingUser) {
                // Merge guest data into existing account
                // Transfer cart items
                await db
                    .update(schema.cartItems)
                    .set({ userId: existingUser.id })
                    .where(eq(schema.cartItems.userId, userId));

                // Transfer wishlist items (ignore duplicates)
                const guestWishlist = await db.query.wishlistItems.findMany({
                    where: eq(schema.wishlistItems.userId, userId),
                });

                for (const item of guestWishlist) {
                    const exists = await db.query.wishlistItems.findFirst({
                        where: (w, { and }) =>
                            and(
                                eq(w.userId, existingUser.id),
                                eq(w.productId, item.productId)
                            ),
                    });

                    if (!exists) {
                        await db
                            .update(schema.wishlistItems)
                            .set({ userId: existingUser.id })
                            .where(eq(schema.wishlistItems.id, item.id));
                    }
                }

                // Transfer orders
                await db
                    .update(schema.orders)
                    .set({ userId: existingUser.id })
                    .where(eq(schema.orders.userId, userId));

                // Delete guest user
                await db.delete(schema.users).where(eq(schema.users.id, userId));

                // Generate tokens for existing user
                const accessToken = await generateAccessToken(
                    existingUser.id,
                    false,
                    c.env.JWT_SECRET,
                    c.env.JWT_EXPIRES_IN
                );
                const refreshToken = await generateRefreshToken(
                    existingUser.id,
                    false,
                    c.env.JWT_SECRET,
                    c.env.REFRESH_TOKEN_EXPIRES_IN
                );

                await db.insert(schema.refreshTokens).values({
                    id: nanoid(),
                    userId: existingUser.id,
                    token: refreshToken,
                    expiresAt: getExpirationDate(c.env.REFRESH_TOKEN_EXPIRES_IN),
                });

                return success(c, {
                    accessToken,
                    refreshToken,
                    user: {
                        id: existingUser.id,
                        email: existingUser.email,
                        name: existingUser.name,
                        profileImage: existingUser.profileImage,
                        isGuest: false,
                    },
                    merged: true,
                });
            } else {
                // Link Google account to guest user
                await db
                    .update(schema.users)
                    .set({
                        googleId: googleData.sub,
                        email: googleData.email,
                        name: googleData.name,
                        profileImage: googleData.picture,
                        isGuest: false,
                        updatedAt: new Date().toISOString(),
                    })
                    .where(eq(schema.users.id, userId));

                const user = await db.query.users.findFirst({
                    where: eq(schema.users.id, userId),
                });

                // Generate new tokens
                const accessToken = await generateAccessToken(
                    userId,
                    false,
                    c.env.JWT_SECRET,
                    c.env.JWT_EXPIRES_IN
                );
                const refreshToken = await generateRefreshToken(
                    userId,
                    false,
                    c.env.JWT_SECRET,
                    c.env.REFRESH_TOKEN_EXPIRES_IN
                );

                // Delete old refresh tokens and add new one
                await db
                    .delete(schema.refreshTokens)
                    .where(eq(schema.refreshTokens.userId, userId));

                await db.insert(schema.refreshTokens).values({
                    id: nanoid(),
                    userId: userId,
                    token: refreshToken,
                    expiresAt: getExpirationDate(c.env.REFRESH_TOKEN_EXPIRES_IN),
                });

                return success(c, {
                    accessToken,
                    refreshToken,
                    user: {
                        id: userId,
                        email: user?.email,
                        name: user?.name,
                        profileImage: user?.profileImage,
                        isGuest: false,
                    },
                    merged: false,
                });
            }
        } catch (error) {
            console.error("Link guest error:", error);
            return errors.serverError(c, "Failed to link account");
        }
    }
);

export default auth;
