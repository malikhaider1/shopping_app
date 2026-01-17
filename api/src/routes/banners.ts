import { Hono } from "hono";
import { eq, and, lte, gte, desc } from "drizzle-orm";
import { createDb, schema } from "../db";
import { Bindings, Variables } from "../types";
import { success, errors } from "../utils/response";

const banners = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// GET /banners - Get All Active Banners
// ============================================================================
banners.get("/", async (c) => {
    const db = createDb(c.env.DB);
    const now = new Date().toISOString();

    const bannersData = await db.query.banners.findMany({
        where: and(
            eq(schema.banners.isActive, true),
            // Include banners where either no schedule is set, or we're within the schedule
            // This is a simplified version - in production you might want more complex logic
        ),
        orderBy: [schema.banners.displayOrder, desc(schema.banners.createdAt)],
    });

    // Filter by date in JavaScript (simpler than complex SQL for D1)
    const activeBanners = bannersData.filter((banner) => {
        if (banner.startsAt && new Date(banner.startsAt) > new Date()) {
            return false;
        }
        if (banner.endsAt && new Date(banner.endsAt) < new Date()) {
            return false;
        }
        return true;
    });

    return success(c, activeBanners);
});

// ============================================================================
// GET /banners/hero - Get Hero Banners
// ============================================================================
banners.get("/hero", async (c) => {
    const db = createDb(c.env.DB);

    const bannersData = await db.query.banners.findMany({
        where: and(
            eq(schema.banners.isActive, true),
            eq(schema.banners.bannerType, "hero")
        ),
        orderBy: schema.banners.displayOrder,
    });

    const activeBanners = bannersData.filter((banner) => {
        if (banner.startsAt && new Date(banner.startsAt) > new Date()) {
            return false;
        }
        if (banner.endsAt && new Date(banner.endsAt) < new Date()) {
            return false;
        }
        return true;
    });

    return success(c, activeBanners);
});

// ============================================================================
// GET /banners/:type - Get Banners by Type
// ============================================================================
banners.get("/:type", async (c) => {
    const type = c.req.param("type");
    const db = createDb(c.env.DB);

    const validTypes = ["hero", "category", "promotional", "flash_sale"];
    if (!validTypes.includes(type)) {
        return errors.badRequest(c, "Invalid banner type");
    }

    const bannersData = await db.query.banners.findMany({
        where: and(
            eq(schema.banners.isActive, true),
            eq(schema.banners.bannerType, type as any)
        ),
        orderBy: schema.banners.displayOrder,
    });

    const activeBanners = bannersData.filter((banner) => {
        if (banner.startsAt && new Date(banner.startsAt) > new Date()) {
            return false;
        }
        if (banner.endsAt && new Date(banner.endsAt) < new Date()) {
            return false;
        }
        return true;
    });

    return success(c, activeBanners);
});

export default banners;
