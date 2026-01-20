import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { adminMiddleware } from "../middleware/admin";

const imagesRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST /api/images - Upload an image (Admin only)
imagesRoutes.post("/", adminMiddleware, async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body["image"] || body["file"];

        if (!file || !(file instanceof File)) {
            return c.json({ success: false, error: { message: "No image file provided" } }, 400);
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return c.json(
                { success: false, error: { message: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." } },
                400
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return c.json(
                { success: false, error: { message: "File too large. Maximum size is 5MB." } },
                400
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { success, meta } = await c.env.DB.prepare(
            "INSERT INTO images (data, mime_type) VALUES (?, ?)"
        ).bind(buffer, file.type).run();

        if (success) {
            const id = meta.last_row_id;
            // Return the full URL to the image
            const url = `${new URL(c.req.url).origin}/api/images/${id}`;
            return c.json({
                success: true,
                data: {
                    id,
                    url,
                    contentType: file.type,
                    size: file.size,
                },
            }, 201);
        }

        return c.json({ success: false, error: { message: "Failed to upload image" } }, 500);
    } catch (error: any) {
        console.error("Error uploading image:", error);
        return c.json({ success: false, error: { message: error.message || "Invalid request" } }, 400);
    }
});

// GET /api/images/:id - Get an image (Public)
imagesRoutes.get("/:id", async (c) => {
    const id = c.req.param("id");
    const image: any = await c.env.DB.prepare(
        "SELECT data, mime_type FROM images WHERE id = ?"
    ).bind(id).first();

    if (!image) {
        return c.json({ success: false, error: { message: "Image not found" } }, 404);
    }

    // D1 can return BLOB data in different formats
    let data: Uint8Array;

    if (image.data instanceof ArrayBuffer) {
        data = new Uint8Array(image.data);
    } else if (image.data instanceof Uint8Array) {
        data = image.data;
    } else if (Array.isArray(image.data)) {
        data = new Uint8Array(image.data);
    } else if (typeof image.data === "object" && image.data !== null) {
        // Handle object with numeric keys (common in D1)
        const values = Object.values(image.data) as number[];
        data = new Uint8Array(values);
    } else {
        console.error("Unknown image data format:", typeof image.data);
        return c.json({ success: false, error: { message: "Invalid image data format" } }, 500);
    }

    const mimeType = image.mime_type || "image/jpeg";

    return new Response(data, {
        status: 200,
        headers: {
            "Content-Type": mimeType,
            "Content-Disposition": "inline",
            "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        },
    });
});

// DELETE /api/images/:id - Delete an image (Admin only)
imagesRoutes.delete("/:id", adminMiddleware, async (c) => {
    const id = c.req.param("id");

    try {
        const image = await c.env.DB.prepare(
            "SELECT id FROM images WHERE id = ?"
        ).bind(id).first();

        if (!image) {
            return c.json({ success: false, error: { message: "Image not found" } }, 404);
        }

        await c.env.DB.prepare("DELETE FROM images WHERE id = ?").bind(id).run();

        return c.json({
            success: true,
            message: "Image deleted successfully",
        });
    } catch (error: any) {
        console.error("Delete error:", error);
        return c.json({ success: false, error: { message: error.message || "Delete failed" } }, 500);
    }
});

export default imagesRoutes;
