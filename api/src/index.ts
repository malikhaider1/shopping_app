import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

import { corsMiddleware } from "./middleware/cors";
import { Bindings, Variables } from "./types";
import { errors } from "./utils/response";

// Import routes
import auth from "./routes/auth";
import users from "./routes/users";
import products from "./routes/products";
import categories from "./routes/categories";
import cart from "./routes/cart";
import wishlist from "./routes/wishlist";
import orders from "./routes/orders";
import banners from "./routes/banners";
import notifications from "./routes/notifications";
import admin from "./routes/admin";

// Create app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// Global Middleware
// ============================================================================
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use("*", corsMiddleware);

// ============================================================================
// Health Check
// ============================================================================
app.get("/", (c) => {
    return c.json({
        name: "Shopping API",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
    });
});

app.get("/health", (c) => {
    return c.json({ status: "ok" });
});

// ============================================================================
// API Routes
// ============================================================================
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Mount route modules
api.route("/auth", auth);
api.route("/users", users);
api.route("/products", products);
api.route("/categories", categories);
api.route("/cart", cart);
api.route("/wishlist", wishlist);
api.route("/orders", orders);
api.route("/banners", banners);
api.route("/notifications", notifications);
api.route("/admin", admin);

// Mount API under /api/v1
app.route("/api/v1", api);

// ============================================================================
// Error Handling
// ============================================================================
app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return errors.serverError(c, "An unexpected error occurred");
});

app.notFound((c) => {
    return errors.notFound(c, "Endpoint");
});

// ============================================================================
// Export for Cloudflare Workers
// ============================================================================
export default app;
