import { Hono } from "hono";
import type { Bindings, Variables } from "../../types";
import { nanoid } from "nanoid";

const uploadRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST /admin/upload - Upload an image to R2
uploadRoutes.post("/", async (c) => {
    const storage = c.env.STORAGE;

    if (!storage) {
        return c.json(
            { success: false, error: { message: "Storage not configured" } },
            500
        );
    }

    try {
        const contentType = c.req.header("Content-Type") || "";

        // Handle multipart form data
        if (contentType.includes("multipart/form-data")) {
            const formData = await c.req.formData();
            const file = formData.get("file") as File | null;

            if (!file) {
                return c.json(
                    { success: false, error: { message: "No file uploaded" } },
                    400
                );
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

            // Generate unique filename
            const extension = file.name.split(".").pop() || "jpg";
            const filename = `${nanoid()}.${extension}`;
            const key = `images/${filename}`;

            // Upload to R2
            await storage.put(key, file.stream(), {
                httpMetadata: {
                    contentType: file.type,
                },
            });

            // Generate public URL
            // Note: You need to configure R2 bucket for public access or use a custom domain
            // The URL format depends on your R2 configuration
            const publicUrl = `https://pub-shopping-assets.r2.dev/${key}`;

            return c.json({
                success: true,
                data: {
                    url: publicUrl,
                    key: key,
                    filename: filename,
                    size: file.size,
                    contentType: file.type,
                },
            });
        }

        // Handle base64 JSON upload
        const body = await c.req.json();
        const { base64, filename: providedFilename, contentType: providedContentType } = body;

        if (!base64) {
            return c.json(
                { success: false, error: { message: "No base64 data provided" } },
                400
            );
        }

        // Parse base64 data URL
        const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
            return c.json(
                { success: false, error: { message: "Invalid base64 format. Expected data:mime;base64,..." } },
                400
            );
        }

        const mimeType = matches[1];
        const data = matches[2];

        // Validate mime type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(mimeType)) {
            return c.json(
                { success: false, error: { message: "Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed." } },
                400
            );
        }

        // Decode base64
        const binaryData = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

        // Validate size (max 5MB)
        if (binaryData.length > 5 * 1024 * 1024) {
            return c.json(
                { success: false, error: { message: "File too large. Maximum size is 5MB." } },
                400
            );
        }

        // Generate filename
        const extension = mimeType.split("/")[1] || "jpg";
        const filename = `${nanoid()}.${extension}`;
        const key = `images/${filename}`;

        // Upload to R2
        await storage.put(key, binaryData, {
            httpMetadata: {
                contentType: mimeType,
            },
        });

        // Generate public URL
        const publicUrl = `https://pub-shopping-assets.r2.dev/${key}`;

        return c.json({
            success: true,
            data: {
                url: publicUrl,
                key: key,
                filename: filename,
                size: binaryData.length,
                contentType: mimeType,
            },
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return c.json(
            { success: false, error: { message: error.message || "Upload failed" } },
            500
        );
    }
});

// DELETE /admin/upload/:key - Delete an image from R2
uploadRoutes.delete("/:key", async (c) => {
    const storage = c.env.STORAGE;

    if (!storage) {
        return c.json(
            { success: false, error: { message: "Storage not configured" } },
            500
        );
    }

    try {
        const key = c.req.param("key");
        const fullKey = `images/${key}`;

        await storage.delete(fullKey);

        return c.json({
            success: true,
            message: "File deleted successfully",
        });
    } catch (error: any) {
        console.error("Delete error:", error);
        return c.json(
            { success: false, error: { message: error.message || "Delete failed" } },
            500
        );
    }
});

export default uploadRoutes;
