import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================================================
// USERS
// ============================================================================

export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    googleId: text("google_id").unique(),
    deviceId: text("device_id"),
    email: text("email"),
    name: text("name"),
    phone: text("phone"),
    profileImage: text("profile_image"),
    isGuest: integer("is_guest", { mode: "boolean" }).default(true).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    onesignalPlayerId: text("onesignal_player_id"),
    notificationPreferences: text("notification_preferences", { mode: "json" }).$type<{
        orders: boolean;
        promotions: boolean;
        priceDrops: boolean;
        stockAlerts: boolean;
    }>(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
    deletedAt: text("deleted_at"),
});

// ============================================================================
// ADDRESSES
// ============================================================================

export const addresses = sqliteTable("addresses", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    label: text("label").notNull(),
    recipientName: text("recipient_name").notNull(),
    phone: text("phone").notNull(),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// CATEGORIES
// ============================================================================

export const categories = sqliteTable("categories", {
    id: text("id").primaryKey(),
    parentId: text("parent_id").references((): any => categories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = sqliteTable("products", {
    id: text("id").primaryKey(),
    sku: text("sku").unique().notNull(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    shortDescription: text("short_description").notNull(),
    longDescription: text("long_description"),
    basePrice: real("base_price").notNull(),
    salePrice: real("sale_price"),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    brand: text("brand"),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    isFeatured: integer("is_featured", { mode: "boolean" }).default(false).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    averageRating: real("average_rating").default(0).notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// PRODUCT IMAGES
// ============================================================================

export const productImages = sqliteTable("product_images", {
    id: text("id").primaryKey(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text"),
    displayOrder: integer("display_order").default(0).notNull(),
    isPrimary: integer("is_primary", { mode: "boolean" }).default(false).notNull(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// PRODUCT VARIANTS
// ============================================================================

export const productVariants = sqliteTable("product_variants", {
    id: text("id").primaryKey(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    sku: text("sku").unique().notNull(),
    priceModifier: real("price_modifier").default(0).notNull(),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    attributes: text("attributes", { mode: "json" }).$type<Record<string, string>>(),
    imageUrl: text("image_url"),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// CART ITEMS
// ============================================================================

export const cartItems = sqliteTable("cart_items", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    quantity: integer("quantity").notNull(),
    addedAt: text("added_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// WISHLIST ITEMS
// ============================================================================

export const wishlistItems = sqliteTable("wishlist_items", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    addedAt: text("added_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// COUPONS
// ============================================================================

export const coupons = sqliteTable("coupons", {
    id: text("id").primaryKey(),
    code: text("code").unique().notNull(),
    description: text("description"),
    discountType: text("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
    discountValue: real("discount_value").notNull(),
    minimumPurchase: real("minimum_purchase").default(0).notNull(),
    maximumDiscount: real("maximum_discount"),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").default(0).notNull(),
    userUsageLimit: integer("user_usage_limit").default(1).notNull(),
    applicableProducts: text("applicable_products", { mode: "json" }).$type<string[]>(),
    applicableCategories: text("applicable_categories", { mode: "json" }).$type<string[]>(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// ORDERS
// ============================================================================

export const orders = sqliteTable("orders", {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").unique().notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status", {
        enum: ["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"],
    }).default("placed").notNull(),
    subtotal: real("subtotal").notNull(),
    discountAmount: real("discount_amount").default(0).notNull(),
    shippingAmount: real("shipping_amount").notNull(),
    taxAmount: real("tax_amount").default(0).notNull(),
    totalAmount: real("total_amount").notNull(),
    couponId: text("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    shippingAddress: text("shipping_address", { mode: "json" }).$type<{
        recipientName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }>().notNull(),
    billingAddress: text("billing_address", { mode: "json" }).$type<{
        recipientName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }>(),
    paymentMethod: text("payment_method").notNull(),
    paymentStatus: text("payment_status", {
        enum: ["pending", "paid", "failed", "refunded"],
    }).default("pending").notNull(),
    paymentReference: text("payment_reference"),
    notes: text("notes"),
    shippedAt: text("shipped_at"),
    deliveredAt: text("delivered_at"),
    cancelledAt: text("cancelled_at"),
    cancellationReason: text("cancellation_reason"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// ORDER ITEMS
// ============================================================================

export const orderItems = sqliteTable("order_items", {
    id: text("id").primaryKey(),
    orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    variantName: text("variant_name"),
    quantity: integer("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    totalPrice: real("total_price").notNull(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// REVIEWS
// ============================================================================

export const reviews = sqliteTable("reviews", {
    id: text("id").primaryKey(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    content: text("content").notNull(),
    isVerifiedPurchase: integer("is_verified_purchase", { mode: "boolean" }).default(false).notNull(),
    isApproved: integer("is_approved", { mode: "boolean" }).default(false).notNull(),
    helpfulCount: integer("helpful_count").default(0).notNull(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// BANNERS
// ============================================================================

export const banners = sqliteTable("banners", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    imageUrl: text("image_url").notNull(),
    linkType: text("link_type", { enum: ["product", "category", "external", "none"] }).notNull(),
    linkValue: text("link_value"),
    bannerType: text("banner_type", { enum: ["hero", "category", "promotional", "flash_sale"] }).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    startsAt: text("starts_at"),
    endsAt: text("ends_at"),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// COUPON USAGES
// ============================================================================

export const couponUsages = sqliteTable("coupon_usages", {
    id: text("id").primaryKey(),
    couponId: text("coupon_id").references(() => coupons.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
    usedAt: text("used_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = sqliteTable("notifications", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: text("data", { mode: "json" }).$type<Record<string, any>>(),
    notificationType: text("notification_type", {
        enum: ["order", "promo", "price_drop", "stock_alert", "general"],
    }).notNull(),
    isRead: integer("is_read", { mode: "boolean" }).default(false).notNull(),
    sentAt: text("sent_at").default(sql`(datetime('now'))`).notNull(),
    readAt: text("read_at"),
});

// ============================================================================
// ADMIN USERS
// ============================================================================

export const adminUsers = sqliteTable("admin_users", {
    id: text("id").primaryKey(),
    email: text("email").unique().notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role", { enum: ["super_admin", "admin", "manager"] }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    lastLoginAt: text("last_login_at"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// REFRESH TOKENS
// ============================================================================

export const refreshTokens = sqliteTable("refresh_tokens", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    token: text("token").unique().notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// ============================================================================
// SETTINGS
// ============================================================================

export const settings = sqliteTable("settings", {
    id: text("id").primaryKey(),
    key: text("key").unique().notNull(),
    value: text("value").notNull(),
    group: text("group").notNull(), // e.g., 'store', 'payment', 'shipping'
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});
