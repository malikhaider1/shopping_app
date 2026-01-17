import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, or, like, gte, lte, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../db";
import {
    Bindings,
    Variables,
    productQuerySchema,
    createReviewSchema,
    paginationSchema,
} from "../types";
import { success, successWithMeta, errors } from "../utils/response";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";

const products = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// GET /products - List Products (Paginated, Filtered)
// ============================================================================
products.get("/", zValidator("query", productQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const db = createDb(c.env.DB);

    const {
        page,
        limit,
        categoryId,
        search,
        minPrice,
        maxPrice,
        sort,
        featured,
    } = query;

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions: any[] = [eq(schema.products.isActive, true)];

    if (categoryId) {
        conditions.push(eq(schema.products.categoryId, categoryId));
    }

    if (search) {
        conditions.push(
            or(
                like(schema.products.name, `%${search}%`),
                like(schema.products.shortDescription, `%${search}%`)
            )
        );
    }

    if (minPrice !== undefined) {
        conditions.push(gte(schema.products.basePrice, minPrice));
    }

    if (maxPrice !== undefined) {
        conditions.push(lte(schema.products.basePrice, maxPrice));
    }

    if (featured !== undefined) {
        conditions.push(eq(schema.products.isFeatured, featured));
    }

    // Build order by
    let orderBy: any;
    switch (sort) {
        case "price_asc":
            orderBy = asc(schema.products.basePrice);
            break;
        case "price_desc":
            orderBy = desc(schema.products.basePrice);
            break;
        case "popular":
            orderBy = desc(schema.products.reviewCount);
            break;
        case "rating":
            orderBy = desc(schema.products.averageRating);
            break;
        case "newest":
        default:
            orderBy = desc(schema.products.createdAt);
    }

    // Get products with primary image
    const productsData = await db
        .select({
            id: schema.products.id,
            sku: schema.products.sku,
            name: schema.products.name,
            slug: schema.products.slug,
            shortDescription: schema.products.shortDescription,
            basePrice: schema.products.basePrice,
            salePrice: schema.products.salePrice,
            categoryId: schema.products.categoryId,
            brand: schema.products.brand,
            stockQuantity: schema.products.stockQuantity,
            isFeatured: schema.products.isFeatured,
            averageRating: schema.products.averageRating,
            reviewCount: schema.products.reviewCount,
            createdAt: schema.products.createdAt,
        })
        .from(schema.products)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

    // Get primary images for products
    const productIds = productsData.map((p) => p.id);
    const images = productIds.length > 0
        ? await db.query.productImages.findMany({
            where: and(
                sql`${schema.productImages.productId} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`,
                eq(schema.productImages.isPrimary, true)
            ),
        })
        : [];

    const imageMap = new Map(images.map((img) => [img.productId, img.imageUrl]));

    const productsWithImages = productsData.map((p) => ({
        ...p,
        imageUrl: imageMap.get(p.id) || null,
    }));

    // Get total count
    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products)
        .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    return successWithMeta(c, productsWithImages, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});

// ============================================================================
// GET /products/search - Search Products
// ============================================================================
products.get("/search", zValidator("query", productQuerySchema), async (c) => {
    // Reuse the main products list endpoint with search
    const query = c.req.valid("query");

    if (!query.search) {
        return errors.badRequest(c, "Search query is required");
    }

    // Forward to main handler by re-executing query logic
    const db = createDb(c.env.DB);
    const { page, limit, search } = query;
    const offset = (page - 1) * limit;

    const productsData = await db.query.products.findMany({
        where: and(
            eq(schema.products.isActive, true),
            or(
                like(schema.products.name, `%${search}%`),
                like(schema.products.shortDescription, `%${search}%`),
                like(schema.products.brand, `%${search}%`)
            )
        ),
        orderBy: desc(schema.products.createdAt),
        limit,
        offset,
    });

    return success(c, productsData);
});

// ============================================================================
// GET /products/featured - Get Featured Products
// ============================================================================
products.get(
    "/featured",
    zValidator("query", paginationSchema),
    async (c) => {
        const { page, limit } = c.req.valid("query");
        const offset = (page - 1) * limit;
        const db = createDb(c.env.DB);

        const productsData = await db.query.products.findMany({
            where: and(
                eq(schema.products.isActive, true),
                eq(schema.products.isFeatured, true)
            ),
            orderBy: desc(schema.products.createdAt),
            limit,
            offset,
        });

        return success(c, productsData);
    }
);

// ============================================================================
// GET /products/bestsellers - Get Bestseller Products
// ============================================================================
products.get(
    "/bestsellers",
    zValidator("query", paginationSchema),
    async (c) => {
        const { page, limit } = c.req.valid("query");
        const offset = (page - 1) * limit;
        const db = createDb(c.env.DB);

        const productsData = await db.query.products.findMany({
            where: eq(schema.products.isActive, true),
            orderBy: desc(schema.products.reviewCount),
            limit,
            offset,
        });

        return success(c, productsData);
    }
);

// ============================================================================
// GET /products/new-arrivals - Get New Arrivals
// ============================================================================
products.get(
    "/new-arrivals",
    zValidator("query", paginationSchema),
    async (c) => {
        const { page, limit } = c.req.valid("query");
        const offset = (page - 1) * limit;
        const db = createDb(c.env.DB);

        const productsData = await db.query.products.findMany({
            where: eq(schema.products.isActive, true),
            orderBy: desc(schema.products.createdAt),
            limit,
            offset,
        });

        return success(c, productsData);
    }
);

// ============================================================================
// GET /products/:id - Get Product Details
// ============================================================================
products.get("/:id", async (c) => {
    const productId = c.req.param("id");
    const db = createDb(c.env.DB);

    const product = await db.query.products.findFirst({
        where: eq(schema.products.id, productId),
    });

    if (!product) {
        return errors.notFound(c, "Product");
    }

    // Get product images
    const images = await db.query.productImages.findMany({
        where: eq(schema.productImages.productId, productId),
        orderBy: [desc(schema.productImages.isPrimary), asc(schema.productImages.displayOrder)],
    });

    // Get product variants
    const variants = await db.query.productVariants.findMany({
        where: and(
            eq(schema.productVariants.productId, productId),
            eq(schema.productVariants.isActive, true)
        ),
    });

    // Get category
    let category = null;
    if (product.categoryId) {
        category = await db.query.categories.findFirst({
            where: eq(schema.categories.id, product.categoryId),
        });
    }

    return success(c, {
        ...product,
        images,
        variants,
        category,
    });
});

// ============================================================================
// GET /products/:id/reviews - Get Product Reviews
// ============================================================================
products.get(
    "/:id/reviews",
    zValidator("query", paginationSchema),
    async (c) => {
        const productId = c.req.param("id");
        const { page, limit } = c.req.valid("query");
        const offset = (page - 1) * limit;
        const db = createDb(c.env.DB);

        // Check if product exists
        const product = await db.query.products.findFirst({
            where: eq(schema.products.id, productId),
        });

        if (!product) {
            return errors.notFound(c, "Product");
        }

        const reviews = await db.query.reviews.findMany({
            where: and(
                eq(schema.reviews.productId, productId),
                eq(schema.reviews.isApproved, true)
            ),
            orderBy: desc(schema.reviews.createdAt),
            limit,
            offset,
        });

        // Get user info for each review
        const reviewsWithUser = await Promise.all(
            reviews.map(async (review) => {
                if (review.userId) {
                    const user = await db.query.users.findFirst({
                        where: eq(schema.users.id, review.userId),
                        columns: { id: true, name: true, profileImage: true },
                    });
                    return { ...review, user };
                }
                return { ...review, user: null };
            })
        );

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.reviews)
            .where(
                and(
                    eq(schema.reviews.productId, productId),
                    eq(schema.reviews.isApproved, true)
                )
            );

        return successWithMeta(c, reviewsWithUser, {
            page,
            limit,
            total: countResult[0]?.count || 0,
        });
    }
);

// ============================================================================
// POST /products/:id/reviews - Submit Product Review
// ============================================================================
products.post(
    "/:id/reviews",
    authMiddleware,
    zValidator("json", createReviewSchema),
    async (c) => {
        const productId = c.req.param("id");
        const userId = c.get("userId");
        const isGuest = c.get("isGuest");
        const data = c.req.valid("json");
        const db = createDb(c.env.DB);

        // Guests cannot submit reviews
        if (isGuest) {
            return errors.forbidden(c, "Guests cannot submit reviews. Please sign in.");
        }

        // Check if product exists
        const product = await db.query.products.findFirst({
            where: eq(schema.products.id, productId),
        });

        if (!product) {
            return errors.notFound(c, "Product");
        }

        // Check if user already reviewed this product
        const existingReview = await db.query.reviews.findFirst({
            where: and(
                eq(schema.reviews.productId, productId),
                eq(schema.reviews.userId, userId)
            ),
        });

        if (existingReview) {
            return errors.conflict(c, "You have already reviewed this product");
        }

        // Check if user purchased this product
        const order = await db.query.orders.findFirst({
            where: and(
                eq(schema.orders.userId, userId),
                eq(schema.orders.status, "delivered")
            ),
        });

        let isVerifiedPurchase = false;
        if (order) {
            const orderItem = await db.query.orderItems.findFirst({
                where: and(
                    eq(schema.orderItems.orderId, order.id),
                    eq(schema.orderItems.productId, productId)
                ),
            });
            isVerifiedPurchase = !!orderItem;
        }

        const reviewId = nanoid();
        await db.insert(schema.reviews).values({
            id: reviewId,
            productId,
            userId,
            orderId: order?.id,
            rating: data.rating,
            title: data.title,
            content: data.content,
            isVerifiedPurchase,
            isApproved: false, // Requires moderation
        });

        const review = await db.query.reviews.findFirst({
            where: eq(schema.reviews.id, reviewId),
        });

        return success(c, review, 201);
    }
);

// ============================================================================
// GET /products/:id/related - Get Related Products
// ============================================================================
products.get("/:id/related", async (c) => {
    const productId = c.req.param("id");
    const db = createDb(c.env.DB);

    const product = await db.query.products.findFirst({
        where: eq(schema.products.id, productId),
    });

    if (!product) {
        return errors.notFound(c, "Product");
    }

    // Get products from same category
    const relatedProducts = await db.query.products.findMany({
        where: and(
            eq(schema.products.isActive, true),
            eq(schema.products.categoryId, product.categoryId!),
            sql`${schema.products.id} != ${productId}`
        ),
        limit: 8,
        orderBy: desc(schema.products.averageRating),
    });

    return success(c, relatedProducts);
});

export default products;
