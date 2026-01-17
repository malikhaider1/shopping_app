import { Context, Next } from "hono";
import { Bindings, Variables } from "../types";
import { verifyToken, AdminTokenPayload } from "../utils/jwt";
import { errors } from "../utils/response";

export async function adminMiddleware(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    next: Next
) {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errors.unauthorized(c, "Missing or invalid authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    const payload = await verifyToken<AdminTokenPayload>(token, c.env.JWT_SECRET);

    if (!payload) {
        return errors.unauthorized(c, "Invalid or expired token");
    }

    if (payload.type !== "admin_access") {
        return errors.unauthorized(c, "Invalid token type");
    }

    c.set("adminId", payload.sub);
    c.set("adminRole", payload.role);

    await next();
}

// Require specific admin roles
export function requireRole(...allowedRoles: AdminTokenPayload["role"][]) {
    return async (
        c: Context<{ Bindings: Bindings; Variables: Variables }>,
        next: Next
    ) => {
        const role = c.get("adminRole");

        if (!role || !allowedRoles.includes(role)) {
            return errors.forbidden(c, "Insufficient permissions");
        }

        await next();
    };
}
