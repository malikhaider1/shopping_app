import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../db";
import {
    Bindings,
    Variables,
    createOrderSchema,
    orderQuerySchema,
    cancelOrderSchema,
    returnOrderSchema,
} from "../types";
import { success, successWithMeta, errors } from "../utils/response";
import { authMiddleware } from "../middleware/auth";

const orders = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require authentication
orders.use("/*", authMiddleware);

// ============================================================================
// Generate Order Number
// ============================================================================
function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = nanoid(6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

// ============================================================================
// GET /orders - List User Orders
// ============================================================================
orders.get("/", zValidator("query", orderQuerySchema), async (c) => {
    const userId = c.get("userId");
    const { page, limit, status } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    const conditions = [eq(schema.orders.userId, userId)];
    if (status) {
        conditions.push(eq(schema.orders.status, status));
    }

    const ordersData = await db.query.orders.findMany({
        where: and(...conditions),
        orderBy: desc(schema.orders.createdAt),
        limit,
        offset,
    });

    // Get order items for each order
    const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
            const items = await db.query.orderItems.findMany({
                where: eq(schema.orderItems.orderId, order.id),
            });

            return {
                ...order,
                items,
                itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            };
        })
    );

    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders)
        .where(and(...conditions));

    return successWithMeta(c, ordersWithItems, {
        page,
        limit,
        total: countResult[0]?.count || 0,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    });
});

// ============================================================================
// POST /orders - Create Order
// ============================================================================
orders.post("/", zValidator("json", createOrderSchema), async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    // Get cart items
    const cartItems = await db.query.cartItems.findMany({
        where: eq(schema.cartItems.userId, userId),
    });

    if (cartItems.length === 0) {
        return errors.badRequest(c, "Cart is empty");
    }

    // Get or create shipping address
    let shippingAddress: any;

    if (data.shippingAddressId) {
        const address = await db.query.addresses.findFirst({
            where: and(
                eq(schema.addresses.id, data.shippingAddressId),
                eq(schema.addresses.userId, userId)
            ),
        });

        if (!address) {
            return errors.notFound(c, "Address");
        }

        shippingAddress = {
            recipientName: address.recipientName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
        };
    } else if (data.shippingAddress) {
        shippingAddress = data.shippingAddress;
    } else {
        return errors.badRequest(c, "Shipping address is required");
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems: Array<{
        productId: string;
        variantId: string | null;
        productName: string;
        variantName: string | null;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }> = [];

    for (const cartItem of cartItems) {
        const product = await db.query.products.findFirst({
            where: eq(schema.products.id, cartItem.productId),
        });

        if (!product || !product.isActive) {
            return errors.badRequest(c, `Product ${cartItem.productId} is not available`);
        }

        let variantName = null;
        let stockQuantity = product.stockQuantity;
        let priceModifier = 0;

        if (cartItem.variantId) {
            const variant = await db.query.productVariants.findFirst({
                where: eq(schema.productVariants.id, cartItem.variantId),
            });

            if (!variant || !variant.isActive) {
                return errors.badRequest(c, `Variant ${cartItem.variantId} is not available`);
            }

            variantName = variant.name;
            stockQuantity = variant.stockQuantity;
            priceModifier = variant.priceModifier;
        }

        if (stockQuantity < cartItem.quantity) {
            return errors.badRequest(c, `Insufficient stock for ${product.name}`);
        }

        const unitPrice = (product.salePrice || product.basePrice) + priceModifier;
        const totalPrice = unitPrice * cartItem.quantity;

        orderItems.push({
            productId: cartItem.productId,
            variantId: cartItem.variantId,
            productName: product.name,
            variantName,
            quantity: cartItem.quantity,
            unitPrice,
            totalPrice,
        });

        subtotal += totalPrice;
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let couponId = null;

    if (data.couponCode) {
        const coupon = await db.query.coupons.findFirst({
            where: and(
                eq(schema.coupons.code, data.couponCode.toUpperCase()),
                eq(schema.coupons.isActive, true)
            ),
        });

        if (coupon) {
            const now = new Date();
            if (now >= new Date(coupon.startsAt) && now <= new Date(coupon.endsAt)) {
                if (subtotal >= coupon.minimumPurchase) {
                    if (coupon.discountType === "percentage") {
                        discountAmount = (subtotal * coupon.discountValue) / 100;
                        if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
                            discountAmount = coupon.maximumDiscount;
                        }
                    } else {
                        discountAmount = coupon.discountValue;
                    }
                    couponId = coupon.id;
                }
            }
        }
    }

    // Calculate shipping (simple flat rate for now)
    const shippingAmount = subtotal >= 50 ? 0 : 5.99;
    const taxAmount = 0; // Can be calculated based on location
    const totalAmount = subtotal - discountAmount + shippingAmount + taxAmount;

    // Create order
    const orderId = nanoid();
    const orderNumber = generateOrderNumber();

    await db.insert(schema.orders).values({
        id: orderId,
        orderNumber,
        userId,
        status: "placed",
        subtotal,
        discountAmount,
        shippingAmount,
        taxAmount,
        totalAmount,
        couponId,
        shippingAddress,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === "cod" ? "pending" : "pending",
        notes: data.notes,
    });

    // Create order items
    for (const item of orderItems) {
        await db.insert(schema.orderItems).values({
            id: nanoid(),
            orderId,
            ...item,
        });

        // Update stock
        if (item.variantId) {
            await db
                .update(schema.productVariants)
                .set({
                    stockQuantity: sql`${schema.productVariants.stockQuantity} - ${item.quantity}`,
                })
                .where(eq(schema.productVariants.id, item.variantId));
        } else {
            await db
                .update(schema.products)
                .set({
                    stockQuantity: sql`${schema.products.stockQuantity} - ${item.quantity}`,
                })
                .where(eq(schema.products.id, item.productId));
        }
    }

    // Record coupon usage
    if (couponId) {
        await db.insert(schema.couponUsages).values({
            id: nanoid(),
            couponId,
            userId,
            orderId,
        });

        await db
            .update(schema.coupons)
            .set({
                usageCount: sql`${schema.coupons.usageCount} + 1`,
            })
            .where(eq(schema.coupons.id, couponId));
    }

    // Clear cart
    await db.delete(schema.cartItems).where(eq(schema.cartItems.userId, userId));

    // Get complete order
    const order = await db.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
    });

    const items = await db.query.orderItems.findMany({
        where: eq(schema.orderItems.orderId, orderId),
    });

    return success(c, { ...order, items }, 201);
});

// ============================================================================
// GET /orders/:id - Get Order Details
// ============================================================================
orders.get("/:id", async (c) => {
    const userId = c.get("userId");
    const orderId = c.req.param("id");
    const db = createDb(c.env.DB);

    const order = await db.query.orders.findFirst({
        where: and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)),
    });

    if (!order) {
        return errors.notFound(c, "Order");
    }

    const items = await db.query.orderItems.findMany({
        where: eq(schema.orderItems.orderId, orderId),
    });

    // Get product images for each item
    const itemsWithImages = await Promise.all(
        items.map(async (item) => {
            if (item.productId) {
                const image = await db.query.productImages.findFirst({
                    where: and(
                        eq(schema.productImages.productId, item.productId),
                        eq(schema.productImages.isPrimary, true)
                    ),
                });
                return { ...item, imageUrl: image?.imageUrl || null };
            }
            return { ...item, imageUrl: null };
        })
    );

    return success(c, {
        ...order,
        items: itemsWithImages,
    });
});

// ============================================================================
// PUT /orders/:id/cancel - Cancel Order
// ============================================================================
orders.put(
    "/:id/cancel",
    zValidator("json", cancelOrderSchema),
    async (c) => {
        const userId = c.get("userId");
        const orderId = c.req.param("id");
        const { reason } = c.req.valid("json");
        const db = createDb(c.env.DB);

        const order = await db.query.orders.findFirst({
            where: and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)),
        });

        if (!order) {
            return errors.notFound(c, "Order");
        }

        // Can only cancel orders that are not shipped yet
        const nonCancellableStatuses = ["shipped", "out_for_delivery", "delivered", "cancelled", "returned"];
        if (nonCancellableStatuses.includes(order.status)) {
            return errors.badRequest(c, `Cannot cancel order with status: ${order.status}`);
        }

        // Restore stock
        const orderItems = await db.query.orderItems.findMany({
            where: eq(schema.orderItems.orderId, orderId),
        });

        for (const item of orderItems) {
            if (item.variantId) {
                await db
                    .update(schema.productVariants)
                    .set({
                        stockQuantity: sql`${schema.productVariants.stockQuantity} + ${item.quantity}`,
                    })
                    .where(eq(schema.productVariants.id, item.variantId));
            } else if (item.productId) {
                await db
                    .update(schema.products)
                    .set({
                        stockQuantity: sql`${schema.products.stockQuantity} + ${item.quantity}`,
                    })
                    .where(eq(schema.products.id, item.productId));
            }
        }

        // Update order status
        await db
            .update(schema.orders)
            .set({
                status: "cancelled",
                cancelledAt: new Date().toISOString(),
                cancellationReason: reason,
                paymentStatus: order.paymentStatus === "paid" ? "refunded" : "pending",
                updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.orders.id, orderId));

        const updatedOrder = await db.query.orders.findFirst({
            where: eq(schema.orders.id, orderId),
        });

        return success(c, updatedOrder);
    }
);

// ============================================================================
// POST /orders/:id/return - Initiate Return
// ============================================================================
orders.post(
    "/:id/return",
    zValidator("json", returnOrderSchema),
    async (c) => {
        const userId = c.get("userId");
        const orderId = c.req.param("id");
        const { reason, items: returnItems } = c.req.valid("json");
        const db = createDb(c.env.DB);

        const order = await db.query.orders.findFirst({
            where: and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)),
        });

        if (!order) {
            return errors.notFound(c, "Order");
        }

        // Can only return delivered orders
        if (order.status !== "delivered") {
            return errors.badRequest(c, "Can only return delivered orders");
        }

        // For now, just mark the whole order as returned
        // In a full implementation, you'd track individual item returns
        await db
            .update(schema.orders)
            .set({
                status: "returned",
                updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.orders.id, orderId));

        // Restore stock for returned items
        for (const returnItem of returnItems) {
            const orderItem = await db.query.orderItems.findFirst({
                where: eq(schema.orderItems.id, returnItem.orderItemId),
            });

            if (orderItem) {
                if (orderItem.variantId) {
                    await db
                        .update(schema.productVariants)
                        .set({
                            stockQuantity: sql`${schema.productVariants.stockQuantity} + ${returnItem.quantity}`,
                        })
                        .where(eq(schema.productVariants.id, orderItem.variantId));
                } else if (orderItem.productId) {
                    await db
                        .update(schema.products)
                        .set({
                            stockQuantity: sql`${schema.products.stockQuantity} + ${returnItem.quantity}`,
                        })
                        .where(eq(schema.products.id, orderItem.productId));
                }
            }
        }

        const updatedOrder = await db.query.orders.findFirst({
            where: eq(schema.orders.id, orderId),
        });

        return success(c, {
            ...updatedOrder,
            returnReason: reason,
            returnedItems: returnItems,
        });
    }
);

// ============================================================================
// POST /orders/:id/reorder - Reorder (add previous order items to cart)
// ============================================================================
orders.post("/:id/reorder", async (c) => {
    const userId = c.get("userId");
    const orderId = c.req.param("id");
    const db = createDb(c.env.DB);

    const order = await db.query.orders.findFirst({
        where: and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)),
    });

    if (!order) {
        return errors.notFound(c, "Order");
    }

    const orderItems = await db.query.orderItems.findMany({
        where: eq(schema.orderItems.orderId, orderId),
    });

    let addedCount = 0;
    let skippedCount = 0;

    for (const item of orderItems) {
        if (!item.productId) {
            skippedCount++;
            continue;
        }

        // Check if product is still available
        const product = await db.query.products.findFirst({
            where: and(
                eq(schema.products.id, item.productId),
                eq(schema.products.isActive, true)
            ),
        });

        if (!product || product.stockQuantity < 1) {
            skippedCount++;
            continue;
        }

        // Check if already in cart
        const existingCartItem = await db.query.cartItems.findFirst({
            where: and(
                eq(schema.cartItems.userId, userId),
                eq(schema.cartItems.productId, item.productId),
                item.variantId
                    ? eq(schema.cartItems.variantId, item.variantId)
                    : sql`${schema.cartItems.variantId} IS NULL`
            ),
        });

        if (existingCartItem) {
            const newQuantity = Math.min(
                existingCartItem.quantity + item.quantity,
                product.stockQuantity
            );
            await db
                .update(schema.cartItems)
                .set({ quantity: newQuantity, updatedAt: new Date().toISOString() })
                .where(eq(schema.cartItems.id, existingCartItem.id));
        } else {
            const quantity = Math.min(item.quantity, product.stockQuantity);
            await db.insert(schema.cartItems).values({
                id: nanoid(),
                userId,
                productId: item.productId,
                variantId: item.variantId,
                quantity,
            });
        }

        addedCount++;
    }

    return success(c, {
        message: `Added ${addedCount} items to cart${skippedCount > 0 ? `, ${skippedCount} items skipped (unavailable)` : ""}`,
        addedCount,
        skippedCount,
    });
});

export default orders;
