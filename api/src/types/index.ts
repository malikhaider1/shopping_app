import { z } from "zod";

// ============================================================================
// ENVIRONMENT BINDINGS
// ============================================================================

export type Bindings = {
    DB: D1Database;
    STORAGE?: R2Bucket;  // Optional - enable when R2 is set up
    JWT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    ONESIGNAL_APP_ID: string;
    ONESIGNAL_API_KEY: string;
    ENVIRONMENT: string;
    JWT_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
};

export type Variables = {
    userId: string;
    isGuest: boolean;
    adminId?: string;
    adminRole?: "super_admin" | "admin" | "manager";
};

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const googleAuthSchema = z.object({
    idToken: z.string().min(1, "ID token is required"),
});

export const guestInitSchema = z.object({
    deviceId: z.string().min(1, "Device ID is required"),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const updateUserSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().min(10).max(20).optional(),
});

export const addressSchema = z.object({
    label: z.string().min(1).max(50),
    recipientName: z.string().min(1).max(100),
    phone: z.string().min(10).max(20),
    addressLine1: z.string().min(1).max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(1).max(100),
    isDefault: z.boolean().optional(),
});

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const productQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    categoryId: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    sort: z.enum(["price_asc", "price_desc", "newest", "popular", "rating"]).default("newest"),
    featured: z.coerce.boolean().optional(),
});

export const createProductSchema = z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(200),
    shortDescription: z.string().min(1).max(500),
    longDescription: z.string().optional(),
    basePrice: z.number().positive(),
    salePrice: z.number().positive().optional(),
    categoryId: z.string().optional(),
    brand: z.string().max(100).optional(),
    stockQuantity: z.number().int().min(0).default(0),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    metaTitle: z.string().max(100).optional(),
    metaDescription: z.string().max(300).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ============================================================================
// CART SCHEMAS
// ============================================================================

export const addToCartSchema = z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
    quantity: z.number().int().min(1),
});

export const applyCouponSchema = z.object({
    code: z.string().min(1).max(50),
});

export const mergeCartSchema = z.object({
    guestUserId: z.string().min(1),
});

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const createOrderSchema = z.object({
    shippingAddressId: z.string().optional(),
    shippingAddress: addressSchema.omit({ label: true, isDefault: true }).optional(),
    paymentMethod: z.enum(["cod", "card", "upi", "wallet"]),
    notes: z.string().max(500).optional(),
    couponCode: z.string().optional(),
});

export const orderQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    status: z.enum(["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]).optional(),
});

export const cancelOrderSchema = z.object({
    reason: z.string().min(1).max(500),
});

export const returnOrderSchema = z.object({
    reason: z.string().min(1).max(500),
    items: z.array(z.object({
        orderItemId: z.string(),
        quantity: z.number().int().min(1),
    })).min(1),
});

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().max(100).optional(),
    content: z.string().min(10).max(1000),
});

// ============================================================================
// WISHLIST SCHEMAS
// ============================================================================

export const addToWishlistSchema = z.object({
    productId: z.string().min(1),
});

export const mergeWishlistSchema = z.object({
    guestUserId: z.string().min(1),
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const registerDeviceSchema = z.object({
    playerId: z.string().min(1),
});

export const notificationPreferencesSchema = z.object({
    orders: z.boolean(),
    promotions: z.boolean(),
    priceDrops: z.boolean(),
    stockAlerts: z.boolean(),
});

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

export const createCategorySchema = z.object({
    parentId: z.string().optional(),
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    imageUrl: z.string().refine(
        (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:'),
        { message: 'Must be a valid URL or data URL' }
    ).optional(),
    displayOrder: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================================================
// BANNER SCHEMAS
// ============================================================================

export const createBannerSchema = z.object({
    title: z.string().min(1).max(100),
    imageUrl: z.string().url(),
    linkType: z.enum(["product", "category", "external", "none"]),
    linkValue: z.string().optional(),
    bannerType: z.enum(["hero", "category", "promotional", "flash_sale"]),
    displayOrder: z.number().int().min(0).default(0),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    isActive: z.boolean().default(true),
});

export const updateBannerSchema = createBannerSchema.partial();

// ============================================================================
// COUPON SCHEMAS
// ============================================================================

export const createCouponSchema = z.object({
    code: z.string().min(1).max(50).toUpperCase(),
    description: z.string().max(200).optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().positive(),
    minimumPurchase: z.number().min(0).default(0),
    maximumDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    userUsageLimit: z.number().int().positive().default(1),
    applicableProducts: z.array(z.string()).optional(),
    applicableCategories: z.array(z.string()).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const adminLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const createAdminSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
    role: z.enum(["super_admin", "admin", "manager"]),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]),
    trackingNumber: z.string().optional(),
    notes: z.string().optional(),
});

// ============================================================================
// ADMIN NOTIFICATION SCHEMA
// ============================================================================

export const sendNotificationSchema = z.object({
    title: z.string().min(1).max(100),
    body: z.string().min(1).max(500),
    userIds: z.array(z.string()).optional(),
    segment: z.enum(["all", "registered", "guests"]).optional(),
    data: z.record(z.any()).optional(),
});

// ============================================================================
// PAGINATION
// ============================================================================

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type GuestInitInput = z.infer<typeof guestInitSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
