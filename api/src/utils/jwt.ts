import * as jose from "jose";

export interface TokenPayload {
    sub: string;
    isGuest: boolean;
    type: "access" | "refresh";
    iat?: number;
    exp?: number;
}

export interface AdminTokenPayload {
    sub: string;
    role: "super_admin" | "admin" | "manager";
    type: "admin_access";
    iat?: number;
    exp?: number;
}

export async function generateAccessToken(
    userId: string,
    isGuest: boolean,
    secret: string,
    expiresIn: string = "7d"
): Promise<string> {
    const secretKey = new TextEncoder().encode(secret);

    const token = await new jose.SignJWT({
        sub: userId,
        isGuest,
        type: "access",
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secretKey);

    return token;
}

export async function generateRefreshToken(
    userId: string,
    isGuest: boolean,
    secret: string,
    expiresIn: string = "30d"
): Promise<string> {
    const secretKey = new TextEncoder().encode(secret);

    const token = await new jose.SignJWT({
        sub: userId,
        isGuest,
        type: "refresh",
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secretKey);

    return token;
}

export async function generateAdminToken(
    adminId: string,
    role: AdminTokenPayload["role"],
    secret: string,
    expiresIn: string = "24h"
): Promise<string> {
    const secretKey = new TextEncoder().encode(secret);

    const token = await new jose.SignJWT({
        sub: adminId,
        role,
        type: "admin_access",
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secretKey);

    return token;
}

export async function verifyToken<T extends TokenPayload | AdminTokenPayload>(
    token: string,
    secret: string
): Promise<T | null> {
    try {
        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jose.jwtVerify(token, secretKey);
        return payload as unknown as T;
    } catch {
        return null;
    }
}

export function parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case "d":
            return value * 24 * 60 * 60 * 1000;
        case "h":
            return value * 60 * 60 * 1000;
        case "m":
            return value * 60 * 1000;
        case "s":
            return value * 1000;
        default:
            return 7 * 24 * 60 * 60 * 1000;
    }
}

export function getExpirationDate(expiresIn: string): string {
    const ms = parseExpiresIn(expiresIn);
    return new Date(Date.now() + ms).toISOString();
}
