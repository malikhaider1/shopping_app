import { cors } from "hono/cors";

export const corsMiddleware = cors({
    origin: (origin) => {
        // Allow requests from any origin in development
        // In production, you should restrict this to your frontend domains
        const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:5173",
            // Add your production domains here
        ];

        // Allow if origin is in the list or if it's a mobile app (no origin)
        if (!origin || allowedOrigins.includes(origin)) {
            return origin || "*";
        }

        // Allow all origins in development (you can make this more restrictive)
        return origin;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 86400,
    credentials: true,
});
