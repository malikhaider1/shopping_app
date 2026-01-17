import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../db";
import {
    Bindings,
    Variables,
    addToCartSchema,
    updateCartItemSchema,
    applyCouponSchema,
    mergeCartSchema,
} from "../types";
import { success, errors } from "../utils/response";
import { authMiddleware } from "../middleware/auth";

const cart = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require authentication
cart.use("/*", authMiddleware);

// ============================================================================
// GET /cart - Get User Cart
// ============================================================================
cart.get("/", async (c) => {
    const userId = c.get("userId");
    const db = createDb(c.env.DB);

    const cartItems = await db.query.cartItems.findMany({
        where: eq(schema.cartItems.userId, userId),
    });

    // Get product and variant details for each item
    const itemsWithDetails = await Promise.all(
        cartItems.map(async (item) => {
            const product = await db.query.products.findFirst({
                where: eq(schema.products.id, item.productId),
            });

            let variant = null;
            if (item.variantId) {
                variant = await db.query.productVariants.findFirst({
                    where: eq(schema.productVariants.id, item.variantId),
                });
            }

            // Get primary image
            const image = await db.query.productImages.findFirst({
                where: and(
                    eq(schema.productImages.productId, item.productId),
                    eq(schema.productImages.isPrimary, true)
                ),
            });

            const unitPrice = product
                ? (variant?.priceModifier || 0) + (product.salePrice || product.basePrice)
                : 0;

            return {
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                product: product
                    ? {
                        id: product.id,
                        name: product.name,
                        sku: product.sku,
                        basePrice: product.basePrice,
                        salePrice: product.salePrice,
                        stockQuantity: product.stockQuantity,
                        imageUrl: image?.imageUrl || null,
                    }
                    : null,
                variant: variant
                    ? {
                        id: variant.id,
                        name: variant.name,
                        sku: variant.sku,
                        priceModifier: variant.priceModifier,
                        stockQuantity: variant.stockQuantity,
                        attributes: variant.attributes,
                    }
                    : null,
                unitPrice,
                totalPrice: unitPrice * item.quantity,
                addedAt: item.addedAt,
            };
        })
    );

    // Calculate totals
    const subtotal = itemsWithDetails.reduce((sum, item) => sum + item.totalPrice, 0);

    return success(c, {
        items: itemsWithDetails,
        itemCount: itemsWithDetails.length,
        subtotal,
    });
});

// ============================================================================
// POST /cart/items - Add Item to Cart
// ============================================================================
cart.post("/items", zValidator("json", addToCartSchema), async (c) => {
    const userId = c.get("userId");
    const { productId, variantId, quantity } = c.req.valid("json");
    const db = createDb(c.env.DB);

    // Check if product exists and is active
    const product = await db.query.products.findFirst({
        where: and(
            eq(schema.products.id, productId),
            eq(schema.products.isActive, true)
        ),
    });

    if (!product) {
        return errors.notFound(c, "Product");
    }

    // Check stock
    let availableStock = product.stockQuantity;
    if (variantId) {
        const variant = await db.query.productVariants.findFirst({
            where: eq(schema.productVariants.id, variantId),
        });
        if (!variant) {
            return errors.notFound(c, "Product variant");
        }
        availableStock = variant.stockQuantity;
    }

    if (availableStock < quantity) {
        return errors.badRequest(c, "Insufficient stock");
    }

    // Check if item already in cart
    const existingItem = await db.query.cartItems.findFirst({
        where: and(
            eq(schema.cartItems.userId, userId),
            eq(schema.cartItems.productId, productId),
            variantId
                ? eq(schema.cartItems.variantId, variantId)
                : sql`${schema.cartItems.variantId} IS NULL`
        ),
    });

    if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > availableStock) {
            return errors.badRequest(c, "Insufficient stock for requested quantity");
        }

        await db
            .update(schema.cartItems)
            .set({
                quantity: newQuantity,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.cartItems.id, existingItem.id));

        return success(c, { message: "Cart updated", quantity: newQuantity });
    }

    // Add new item
    const cartItemId = nanoid();
    await db.insert(schema.cartItems).values({
        id: cartItemId,
        userId,
        productId,
        variantId,
        quantity,
    });

    return success(c, { message: "Added to cart", id: cartItemId }, 201);
});

// ============================================================================
// PUT /cart/items/:id - Update Cart Item Quantity
// ============================================================================
cart.put(
    "/items/:id",
    zValidator("json", updateCartItemSchema),
    async (c) => {
        const userId = c.get("userId");
        const cartItemId = c.req.param("id");
        const { quantity } = c.req.valid("json");
        const db = createDb(c.env.DB);

        const cartItem = await db.query.cartItems.findFirst({
            where: and(
                eq(schema.cartItems.id, cartItemId),
                eq(schema.cartItems.userId, userId)
            ),
        });

        if (!cartItem) {
            return errors.notFound(c, "Cart item");
        }

        // Check stock
        const product = await db.query.products.findFirst({
            where: eq(schema.products.id, cartItem.productId),
        });

        let availableStock = product?.stockQuantity || 0;
        if (cartItem.variantId) {
            const variant = await db.query.productVariants.findFirst({
                where: eq(schema.productVariants.id, cartItem.variantId),
            });
            availableStock = variant?.stockQuantity || 0;
        }

        if (quantity > availableStock) {
            return errors.badRequest(c, "Insufficient stock");
        }

        await db
            .update(schema.cartItems)
            .set({
                quantity,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.cartItems.id, cartItemId));

        return success(c, { message: "Cart updated", quantity });
    }
);

// ============================================================================
// DELETE /cart/items/:id - Remove Item from Cart
// ============================================================================
cart.delete("/items/:id", async (c) => {
    const userId = c.get("userId");
    const cartItemId = c.req.param("id");
    const db = createDb(c.env.DB);

    const cartItem = await db.query.cartItems.findFirst({
        where: and(
            eq(schema.cartItems.id, cartItemId),
            eq(schema.cartItems.userId, userId)
        ),
    });

    if (!cartItem) {
        return errors.notFound(c, "Cart item");
    }

    await db.delete(schema.cartItems).where(eq(schema.cartItems.id, cartItemId));

    return success(c, { message: "Item removed from cart" });
});

// ============================================================================
// DELETE /cart - Clear Cart
// ============================================================================
cart.delete("/", async (c) => {
    const userId = c.get("userId");
    const db = createDb(c.env.DB);

    await db.delete(schema.cartItems).where(eq(schema.cartItems.userId, userId));

    return success(c, { message: "Cart cleared" });
});

// ============================================================================
// POST /cart/merge - Merge Guest Cart with User Cart
// ============================================================================
cart.post("/merge", zValidator("json", mergeCartSchema), async (c) => {
    const userId = c.get("userId");
    const isGuest = c.get("isGuest");
    const { guestUserId } = c.req.valid("json");
    const db = createDb(c.env.DB);

    if (isGuest) {
        return errors.badRequest(c, "Cannot merge carts for guest users");
    }

    // Get guest cart items
    const guestCartItems = await db.query.cartItems.findMany({
        where: eq(schema.cartItems.userId, guestUserId),
    });

    for (const guestItem of guestCartItems) {
        // Check if product already in user's cart
        const existingItem = await db.query.cartItems.findFirst({
            where: and(
                eq(schema.cartItems.userId, userId),
                eq(schema.cartItems.productId, guestItem.productId),
                guestItem.variantId
                    ? eq(schema.cartItems.variantId, guestItem.variantId)
                    : sql`${schema.cartItems.variantId} IS NULL`
            ),
        });

        if (existingItem) {
            // Update quantity
            await db
                .update(schema.cartItems)
                .set({
                    quantity: existingItem.quantity + guestItem.quantity,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(schema.cartItems.id, existingItem.id));
        } else {
            // Move item to user's cart
            await db
                .update(schema.cartItems)
                .set({ userId })
                .where(eq(schema.cartItems.id, guestItem.id));
        }
    }

    // Delete any remaining guest cart items
    await db
        .delete(schema.cartItems)
        .where(eq(schema.cartItems.userId, guestUserId));

    return success(c, { message: "Cart merged successfully" });
});

// ============================================================================
// POST /cart/coupon - Apply Coupon Code
// ============================================================================
cart.post("/coupon", zValidator("json", applyCouponSchema), async (c) => {
    const userId = c.get("userId");
    const { code } = c.req.valid("json");
    const db = createDb(c.env.DB);

    // Find coupon
    const coupon = await db.query.coupons.findFirst({
        where: and(
            eq(schema.coupons.code, code.toUpperCase()),
            eq(schema.coupons.isActive, true)
        ),
    });

    if (!coupon) {
        return errors.notFound(c, "Coupon");
    }

    const now = new Date();
    const startsAt = new Date(coupon.startsAt);
    const endsAt = new Date(coupon.endsAt);

    // Check if coupon is valid
    if (now < startsAt || now > endsAt) {
        return errors.badRequest(c, "Coupon is not valid at this time");
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return errors.badRequest(c, "Coupon usage limit reached");
    }

    // Check user usage limit
    const userUsages = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.couponUsages)
        .where(
            and(
                eq(schema.couponUsages.couponId, coupon.id),
                eq(schema.couponUsages.userId, userId)
            )
        );

    if (userUsages[0]?.count >= coupon.userUsageLimit) {
        return errors.badRequest(c, "You have already used this coupon");
    }

    // Get cart subtotal to check minimum purchase
    const cartItems = await db.query.cartItems.findMany({
        where: eq(schema.cartItems.userId, userId),
    });

    let subtotal = 0;
    for (const item of cartItems) {
        const product = await db.query.products.findFirst({
            where: eq(schema.products.id, item.productId),
        });
        if (product) {
            const price = product.salePrice || product.basePrice;
            subtotal += price * item.quantity;
        }
    }

    if (subtotal < coupon.minimumPurchase) {
        return errors.badRequest(
            c,
            `Minimum purchase of ${coupon.minimumPurchase} required`
        );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
        }
    } else {
        discount = coupon.discountValue;
    }

    return success(c, {
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
        },
        discount,
        subtotal,
        total: subtotal - discount,
    });
});

export default cart;
