import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, schema } from "../../db";
import { Bindings, Variables } from "../../types";
import { success, errors } from "../../utils/response";
import { adminMiddleware } from "../../middleware/admin";
import { z } from "zod";

const settings = new Hono<{ Bindings: Bindings; Variables: Variables }>();

settings.use("*", adminMiddleware);

const updateSettingSchema = z.object({
    key: z.string(),
    value: z.string(),
    group: z.string().default('store'),
});

const bulkUpdateSettingsSchema = z.array(updateSettingSchema);

// GET /admin/settings
settings.get("/", async (c) => {
    const db = createDb(c.env.DB);
    const group = c.req.query("group");

    const query = db.select().from(schema.settings);
    if (group) {
        query.where(eq(schema.settings.group, group));
    }

    const allSettings = await query;
    return success(c, allSettings);
});

// PUT /admin/settings
settings.put("/", zValidator("json", bulkUpdateSettingsSchema), async (c) => {
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);

    for (const item of data) {
        const existing = await db.query.settings.findFirst({
            where: and(
                eq(schema.settings.key, item.key),
                eq(schema.settings.group, item.group)
            )
        });

        if (existing) {
            await db.update(schema.settings)
                .set({
                    value: item.value,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(schema.settings.id, existing.id));
        } else {
            await db.insert(schema.settings).values({
                id: nanoid(),
                key: item.key,
                value: item.value,
                group: item.group,
            });
        }
    }

    return success(c, { message: "Settings updated successfully" });
});

export default settings;
