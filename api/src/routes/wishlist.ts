import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../db";
import {
    Bindings,
    Variables,
    addToWishlistSchema,
    mergeWishlistSchema,
} from "../types";
import { success, errors } from "../utils/response";
import { authMiddleware } from "../middleware/auth";

const wishlist = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require authentication
wishlist.use("/*", authMiddleware);

// ============================================================================
// GET /wishlist - Get User Wishlist
// ============================================================================
wishlist.get("/", async (c) => {
    const userId = c.get("userId");
    const db = createDb(c.env.DB);

    const wishlistItems = await db.query.wishlistItems.findMany({
        where: eq(schema.wishlistItems.userId, userId),
    });

    // Get product details for each item
    const itemsWithDetails = await Promise.all(
        wishlistItems.map(async (item) => {
            const product = await db.query.products.findFirst({
                where: eq(schema.products.id, item.productId),
            });

            // Get primary image
            const image = await db.query.productImages.findFirst({
                where: and(
                    eq(schema.productImages.productId, item.productId),
                    eq(schema.productImages.isPrimary, true)
                ),
            });

            return {
                id: item.id,
                productId: item.productId,
                addedAt: item.addedAt,
                product: product
                    ? {
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        basePrice: product.basePrice,
                        salePrice: product.salePrice,
                        stockQuantity: product.stockQuantity,
                        averageRating: product.averageRating,
                        isActive: product.isActive,
                        imageUrl: image?.imageUrl || null,
                    }
                    : null,
            };
        })
    );

    return success(c, {
        items: itemsWithDetails.filter((item) => item.product !== null),
        itemCount: itemsWithDetails.filter((item) => item.product !== null).length,
    });
});

// ============================================================================
// POST /wishlist/items - Add to Wishlist
// ============================================================================
wishlist.post("/items", zValidator("json", addToWishlistSchema), async (c) => {
    const userId = c.get("userId");
    const { productId } = c.req.valid("json");
    const db = createDb(c.env.DB);

    // Check if product exists
    const product = await db.query.products.findFirst({
        where: eq(schema.products.id, productId),
    });

    if (!product) {
        return errors.notFound(c, "Product");
    }

    // Check if already in wishlist
    const existingItem = await db.query.wishlistItems.findFirst({
        where: and(
            eq(schema.wishlistItems.userId, userId),
            eq(schema.wishlistItems.productId, productId)
        ),
    });

    if (existingItem) {
        return errors.conflict(c, "Product already in wishlist");
    }

    const wishlistItemId = nanoid();
    await db.insert(schema.wishlistItems).values({
        id: wishlistItemId,
        userId,
        productId,
    });

    return success(c, { message: "Added to wishlist", id: wishlistItemId }, 201);
});

// ============================================================================
// DELETE /wishlist/items/:id - Remove from Wishlist
// ============================================================================
wishlist.delete("/items/:id", async (c) => {
    const userId = c.get("userId");
    const wishlistItemId = c.req.param("id");
    const db = createDb(c.env.DB);

    const item = await db.query.wishlistItems.findFirst({
        where: and(
            eq(schema.wishlistItems.id, wishlistItemId),
            eq(schema.wishlistItems.userId, userId)
        ),
    });

    if (!item) {
        return errors.notFound(c, "Wishlist item");
    }

    await db
        .delete(schema.wishlistItems)
        .where(eq(schema.wishlistItems.id, wishlistItemId));

    return success(c, { message: "Removed from wishlist" });
});

// ============================================================================
// DELETE /wishlist/product/:productId - Remove by Product ID
// ============================================================================
wishlist.delete("/product/:productId", async (c) => {
    const userId = c.get("userId");
    const productId = c.req.param("productId");
    const db = createDb(c.env.DB);

    await db
        .delete(schema.wishlistItems)
        .where(
            and(
                eq(schema.wishlistItems.userId, userId),
                eq(schema.wishlistItems.productId, productId)
            )
        );

    return success(c, { message: "Removed from wishlist" });
});

// ============================================================================
// POST /wishlist/merge - Merge Guest Wishlist
// ============================================================================
wishlist.post("/merge", zValidator("json", mergeWishlistSchema), async (c) => {
    const userId = c.get("userId");
    const isGuest = c.get("isGuest");
    const { guestUserId } = c.req.valid("json");
    const db = createDb(c.env.DB);

    if (isGuest) {
        return errors.badRequest(c, "Cannot merge wishlists for guest users");
    }

    // Get guest wishlist items
    const guestItems = await db.query.wishlistItems.findMany({
        where: eq(schema.wishlistItems.userId, guestUserId),
    });

    for (const guestItem of guestItems) {
        // Check if product already in user's wishlist
        const existingItem = await db.query.wishlistItems.findFirst({
            where: and(
                eq(schema.wishlistItems.userId, userId),
                eq(schema.wishlistItems.productId, guestItem.productId)
            ),
        });

        if (!existingItem) {
            // Move item to user's wishlist
            await db
                .update(schema.wishlistItems)
                .set({ userId })
                .where(eq(schema.wishlistItems.id, guestItem.id));
        } else {
            // Delete duplicate
            await db
                .delete(schema.wishlistItems)
                .where(eq(schema.wishlistItems.id, guestItem.id));
        }
    }

    return success(c, { message: "Wishlist merged successfully" });
});

// ============================================================================
// POST /wishlist/items/:id/move-to-cart - Move Item to Cart
// ============================================================================
wishlist.post("/items/:id/move-to-cart", async (c) => {
    const userId = c.get("userId");
    const wishlistItemId = c.req.param("id");
    const db = createDb(c.env.DB);

    const wishlistItem = await db.query.wishlistItems.findFirst({
        where: and(
            eq(schema.wishlistItems.id, wishlistItemId),
            eq(schema.wishlistItems.userId, userId)
        ),
    });

    if (!wishlistItem) {
        return errors.notFound(c, "Wishlist item");
    }

    // Check if product is available
    const product = await db.query.products.findFirst({
        where: and(
            eq(schema.products.id, wishlistItem.productId),
            eq(schema.products.isActive, true)
        ),
    });

    if (!product) {
        return errors.badRequest(c, "Product is not available");
    }

    if (product.stockQuantity <= 0) {
        return errors.badRequest(c, "Product is out of stock");
    }

    // Check if already in cart
    const existingCartItem = await db.query.cartItems.findFirst({
        where: and(
            eq(schema.cartItems.userId, userId),
            eq(schema.cartItems.productId, wishlistItem.productId)
        ),
    });

    if (existingCartItem) {
        // Update quantity
        await db
            .update(schema.cartItems)
            .set({
                quantity: existingCartItem.quantity + 1,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.cartItems.id, existingCartItem.id));
    } else {
        // Add to cart
        await db.insert(schema.cartItems).values({
            id: nanoid(),
            userId,
            productId: wishlistItem.productId,
            quantity: 1,
        });
    }

    // Remove from wishlist
    await db
        .delete(schema.wishlistItems)
        .where(eq(schema.wishlistItems.id, wishlistItemId));

    return success(c, { message: "Moved to cart" });
});

export default wishlist;
