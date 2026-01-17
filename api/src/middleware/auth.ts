import { Context, Next } from "hono";
import { Bindings, Variables } from "../types";
import { verifyToken, TokenPayload } from "../utils/jwt";
import { errors } from "../utils/response";

export async function authMiddleware(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    next: Next
) {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errors.unauthorized(c, "Missing or invalid authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    const payload = await verifyToken<TokenPayload>(token, c.env.JWT_SECRET);

    if (!payload) {
        return errors.unauthorized(c, "Invalid or expired token");
    }

    if (payload.type !== "access") {
        return errors.unauthorized(c, "Invalid token type");
    }

    c.set("userId", payload.sub);
    c.set("isGuest", payload.isGuest);

    await next();
}

// Optional auth - allows both authenticated and unauthenticated requests
export async function optionalAuthMiddleware(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    next: Next
) {
    const authHeader = c.req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyToken<TokenPayload>(token, c.env.JWT_SECRET);

        if (payload && payload.type === "access") {
            c.set("userId", payload.sub);
            c.set("isGuest", payload.isGuest);
        }
    }

    await next();
}
