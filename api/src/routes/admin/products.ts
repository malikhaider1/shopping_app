import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../../db";
import {
    Bindings,
    Variables,
    createProductSchema,
    updateProductSchema,
    paginationSchema,
} from "../../types";
import { success, successWithMeta, errors } from "../../utils/response";
import { adminMiddleware } from "../../middleware/admin";
import { z } from "zod";

const products = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All routes require admin authentication
products.use("/*", adminMiddleware);

const adminProductQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    isFeatured: z.coerce.boolean().optional(),
});

// ============================================================================
// GET /admin/products - List All Products
// ============================================================================
products.get("/", zValidator("query", adminProductQuerySchema), async (c) => {
    const { page, limit, search, categoryId, isActive, isFeatured } = c.req.valid("query");
    const offset = (page - 1) * limit;
    const db = createDb(c.env.DB);

    const conditions: any[] = [];

    if (search) {
        conditions.push(
            or(
                like(schema.products.name, `%${search}%`),
                like(schema.products.sku, `%${search}%`)
            )
        );
    }

    if (categoryId) {
        conditions.push(eq(schema.products.categoryId, categoryId));
    }

    if (isActive !== undefined) {
        conditions.push(eq(schema.products.isActive, isActive));
    }

    if (isFeatured !== undefined) {
        conditions.push(eq(schema.products.isFeatured, isFeatured));
    }

    const productsData = await db.query.products.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(schema.products.createdAt),
        limit,
        offset,
    });

    // Fetch primary images for all products
    const productIds = productsData.map((p) => p.id);
    const images = productIds.length > 0
        ? await db.query.productImages.findMany({
            where: and(
                sql`${schema.productImages.productId} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`,
                eq(schema.productImages.isPrimary, true)
            ),
        })
        : [];

    // Create a map for quick lookup
    const imageMap = new Map(images.map((img) => [img.productId, img.imageUrl]));

    // Attach mainImage to each product
    const productsWithImages = productsData.map((product) => ({
        ...product,
        mainImage: imageMap.get(product.id) || null,
    }));

    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    return successWithMeta(c, productsWithImages, {
        page,
        limit,
        total: countResult[0]?.count || 0,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
    });
});

// ============================================================================
// GET /admin/products/:id - Get Product Details
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

    const images = await db.query.productImages.findMany({
        where: eq(schema.productImages.productId, productId),
        orderBy: [desc(schema.productImages.isPrimary), schema.productImages.displayOrder],
    });

    const variants = await db.query.productVariants.findMany({
        where: eq(schema.productVariants.productId, productId),
    });

    return success(c, { ...product, images, variants });
});

// ============================================================================
// POST /admin/products - Create Product
// ============================================================================
products.post("/", zValidator("json", createProductSchema), async (c) => {
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    // Check if SKU already exists
    const existingProduct = await db.query.products.findFirst({
        where: or(
            eq(schema.products.sku, data.sku),
            eq(schema.products.slug, data.slug)
        ),
    });

    if (existingProduct) {
        return errors.conflict(c, "Product with this SKU or slug already exists");
    }

    const productId = nanoid();
    await db.insert(schema.products).values({
        id: productId,
        ...data,
    });

    const product = await db.query.products.findFirst({
        where: eq(schema.products.id, productId),
    });

    return success(c, product, 201);
});

// ============================================================================
// PUT /admin/products/:id - Update Product
// ============================================================================
products.put("/:id", zValidator("json", updateProductSchema), async (c) => {
    const productId = c.req.param("id");
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    const existingProduct = await db.query.products.findFirst({
        where: eq(schema.products.id, productId),
    });

    if (!existingProduct) {
        return errors.notFound(c, "Product");
    }

    // Check for duplicate SKU/slug
    if (data.sku || data.slug) {
        const duplicate = await db.query.products.findFirst({
            where: and(
                or(
                    data.sku ? eq(schema.products.sku, data.sku) : sql`false`,
                    data.slug ? eq(schema.products.slug, data.slug) : sql`false`
                ),
                sql`${schema.products.id} != ${productId}`
            ),
        });

        if (duplicate) {
            return errors.conflict(c, "Product with this SKU or slug already exists");
        }
    }

    await db
        .update(schema.products)
        .set({
            ...data,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.products.id, productId));

    const product = await db.query.products.findFirst({
        where: eq(schema.products.id, productId),
    });

    return success(c, product);
});

// ============================================================================
// DELETE /admin/products/:id - Delete Product
// ============================================================================
products.delete("/:id", async (c) => {
    const productId = c.req.param("id");
    const db = createDb(c.env.DB);

    const existingProduct = await db.query.products.findFirst({
        where: eq(schema.products.id, productId),
    });

    if (!existingProduct) {
        return errors.notFound(c, "Product");
    }

    // Soft delete by setting isActive to false
    await db
        .update(schema.products)
        .set({
            isActive: false,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.products.id, productId));

    return success(c, { message: "Product deleted successfully" });
});

// ============================================================================
// POST /admin/products/:id/images - Add Product Image
// ============================================================================
const addImageSchema = z.object({
    imageUrl: z.string().refine(
        (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:'),
        { message: 'Must be a valid URL or data URL' }
    ),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
    displayOrder: z.number().int().min(0).default(0),
});

products.post(
    "/:id/images",
    zValidator("json", addImageSchema),
    async (c) => {
        const productId = c.req.param("id");
        const data = c.req.valid("json");
        const db = createDb(c.env.DB);

        const product = await db.query.products.findFirst({
            where: eq(schema.products.id, productId),
        });

        if (!product) {
            return errors.notFound(c, "Product");
        }

        // If setting as primary, unset other primaries
        if (data.isPrimary) {
            await db
                .update(schema.productImages)
                .set({ isPrimary: false })
                .where(eq(schema.productImages.productId, productId));
        }

        const imageId = nanoid();
        await db.insert(schema.productImages).values({
            id: imageId,
            productId,
            ...data,
        });

        const image = await db.query.productImages.findFirst({
            where: eq(schema.productImages.id, imageId),
        });

        return success(c, image, 201);
    }
);

// ============================================================================
// DELETE /admin/products/:id/images/:imageId - Delete Product Image
// ============================================================================
products.delete("/:id/images/:imageId", async (c) => {
    const productId = c.req.param("id");
    const imageId = c.req.param("imageId");
    const db = createDb(c.env.DB);

    const image = await db.query.productImages.findFirst({
        where: and(
            eq(schema.productImages.id, imageId),
            eq(schema.productImages.productId, productId)
        ),
    });

    if (!image) {
        return errors.notFound(c, "Image");
    }

    await db.delete(schema.productImages).where(eq(schema.productImages.id, imageId));

    return success(c, { message: "Image deleted successfully" });
});

// ============================================================================
// POST /admin/products/:id/variants - Add Product Variant
// ============================================================================
const addVariantSchema = z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    priceModifier: z.number().default(0),
    stockQuantity: z.number().int().min(0).default(0),
    attributes: z.record(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().default(true),
});

products.post(
    "/:id/variants",
    zValidator("json", addVariantSchema),
    async (c) => {
        const productId = c.req.param("id");
        const data = c.req.valid("json");
        const db = createDb(c.env.DB);

        const product = await db.query.products.findFirst({
            where: eq(schema.products.id, productId),
        });

        if (!product) {
            return errors.notFound(c, "Product");
        }

        // Check for duplicate SKU
        const existingVariant = await db.query.productVariants.findFirst({
            where: eq(schema.productVariants.sku, data.sku),
        });

        if (existingVariant) {
            return errors.conflict(c, "Variant with this SKU already exists");
        }

        const variantId = nanoid();
        await db.insert(schema.productVariants).values({
            id: variantId,
            productId,
            ...data,
        });

        const variant = await db.query.productVariants.findFirst({
            where: eq(schema.productVariants.id, variantId),
        });

        return success(c, variant, 201);
    }
);

// ============================================================================
// PUT /admin/products/:id/variants/:variantId - Update Product Variant
// ============================================================================
products.put(
    "/:id/variants/:variantId",
    zValidator("json", addVariantSchema.partial()),
    async (c) => {
        const productId = c.req.param("id");
        const variantId = c.req.param("variantId");
        const data = c.req.valid("json");
        const db = createDb(c.env.DB);

        const variant = await db.query.productVariants.findFirst({
            where: and(
                eq(schema.productVariants.id, variantId),
                eq(schema.productVariants.productId, productId)
            ),
        });

        if (!variant) {
            return errors.notFound(c, "Variant");
        }

        await db
            .update(schema.productVariants)
            .set(data)
            .where(eq(schema.productVariants.id, variantId));

        const updatedVariant = await db.query.productVariants.findFirst({
            where: eq(schema.productVariants.id, variantId),
        });

        return success(c, updatedVariant);
    }
);

// ============================================================================
// DELETE /admin/products/:id/variants/:variantId - Delete Product Variant
// ============================================================================
products.delete("/:id/variants/:variantId", async (c) => {
    const productId = c.req.param("id");
    const variantId = c.req.param("variantId");
    const db = createDb(c.env.DB);

    const variant = await db.query.productVariants.findFirst({
        where: and(
            eq(schema.productVariants.id, variantId),
            eq(schema.productVariants.productId, productId)
        ),
    });

    if (!variant) {
        return errors.notFound(c, "Variant");
    }

    await db.delete(schema.productVariants).where(eq(schema.productVariants.id, variantId));

    return success(c, { message: "Variant deleted successfully" });
});

export default products;
