import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and } from "drizzle-orm";
import { createDb, schema } from "../../db";
import { Bindings, Variables, paginationSchema } from "../../types";
import { success, successWithMeta, errors } from "../../utils/response";
import { adminMiddleware } from "../../middleware/admin";
import { z } from "zod";

const reviews = new Hono<{ Bindings: Bindings; Variables: Variables }>();

reviews.use("/*", adminMiddleware);

const reviewQuerySchema = paginationSchema.extend({
    isApproved: z.coerce.boolean().optional(),
    productId: z.string().optional(),
});

// GET /admin/reviews
reviews.get("/", zValidator("query", reviewQuerySchema), async (c) => {
    const { page, limit, isApproved, productId } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    const conditions: any[] = [];
    if (isApproved !== undefined) conditions.push(eq(schema.reviews.isApproved, isApproved));
    if (productId) conditions.push(eq(schema.reviews.productId, productId));

    const reviewsData = await db.query.reviews.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(schema.reviews.createdAt),
        limit,
        offset,
    });

    const reviewsWithDetails = await Promise.all(
        reviewsData.map(async (review) => {
            const product = await db.query.products.findFirst({
                where: eq(schema.products.id, review.productId),
                columns: { id: true, name: true },
            });

            let user = null;
            if (review.userId) {
                user = await db.query.users.findFirst({
                    where: eq(schema.users.id, review.userId),
                    columns: { id: true, name: true, email: true },
                });
            }

            return { ...review, product, user };
        })
    );

    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.reviews)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    return successWithMeta(c, reviewsWithDetails, {
        page,
        limit,
        total: countResult[0]?.count || 0,
    });
});

// PUT /admin/reviews/:id/approve
reviews.put("/:id/approve", async (c) => {
    const reviewId = c.req.param("id");
    const db = createDb(c.env.DB);

    const review = await db.query.reviews.findFirst({
        where: eq(schema.reviews.id, reviewId),
    });

    if (!review) return errors.notFound(c, "Review");

    await db
        .update(schema.reviews)
        .set({ isApproved: true, updatedAt: new Date().toISOString() })
        .where(eq(schema.reviews.id, reviewId));

    // Update product rating
    const productReviews = await db.query.reviews.findMany({
        where: and(
            eq(schema.reviews.productId, review.productId),
            eq(schema.reviews.isApproved, true)
        ),
    });

    const avgRating =
        productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length || 0;

    await db
        .update(schema.products)
        .set({
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: productReviews.length,
        })
        .where(eq(schema.products.id, review.productId));

    return success(c, { message: "Review approved" });
});

// PUT /admin/reviews/:id/reject
reviews.put("/:id/reject", async (c) => {
    const reviewId = c.req.param("id");
    const db = createDb(c.env.DB);

    const review = await db.query.reviews.findFirst({
        where: eq(schema.reviews.id, reviewId),
    });

    if (!review) return errors.notFound(c, "Review");

    await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId));

    return success(c, { message: "Review rejected and deleted" });
});

// DELETE /admin/reviews/:id
reviews.delete("/:id", async (c) => {
    const reviewId = c.req.param("id");
    const db = createDb(c.env.DB);

    const review = await db.query.reviews.findFirst({
        where: eq(schema.reviews.id, reviewId),
    });

    if (!review) return errors.notFound(c, "Review");

    await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId));

    // Update product rating
    const productReviews = await db.query.reviews.findMany({
        where: and(
            eq(schema.reviews.productId, review.productId),
            eq(schema.reviews.isApproved, true)
        ),
    });

    const avgRating =
        productReviews.length > 0
            ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
            : 0;

    await db
        .update(schema.products)
        .set({
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: productReviews.length,
        })
        .where(eq(schema.products.id, review.productId));

    return success(c, { message: "Review deleted" });
});

export default reviews;
