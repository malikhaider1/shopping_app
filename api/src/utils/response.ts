import { Context } from "hono";

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export function success<T>(c: Context, data: T, status: number = 200): Response {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };
    return c.json(response, status as any);
}

export function successWithMeta<T>(
    c: Context,
    data: T,
    meta: ApiResponse["meta"],
    status: number = 200
): Response {
    const response: ApiResponse<T> = {
        success: true,
        data,
        meta,
    };
    return c.json(response, status as any);
}

export function error(
    c: Context,
    code: string,
    message: string,
    status: number = 400,
    details?: any
): Response {
    const response: ApiResponse = {
        success: false,
        error: {
            code,
            message,
            details,
        },
    };
    return c.json(response, status as any);
}

// Common error responses
export const errors = {
    unauthorized: (c: Context, message = "Unauthorized") =>
        error(c, "UNAUTHORIZED", message, 401),

    forbidden: (c: Context, message = "Forbidden") =>
        error(c, "FORBIDDEN", message, 403),

    notFound: (c: Context, resource = "Resource") =>
        error(c, "NOT_FOUND", `${resource} not found`, 404),

    badRequest: (c: Context, message: string, details?: any) =>
        error(c, "BAD_REQUEST", message, 400, details),

    conflict: (c: Context, message: string) =>
        error(c, "CONFLICT", message, 409),

    validationError: (c: Context, details: any) =>
        error(c, "VALIDATION_ERROR", "Validation failed", 422, details),

    serverError: (c: Context, message = "Internal server error") =>
        error(c, "SERVER_ERROR", message, 500),

    rateLimited: (c: Context) =>
        error(c, "RATE_LIMITED", "Too many requests", 429),
};
