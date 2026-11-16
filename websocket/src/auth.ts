import { createHmac, timingSafeEqual } from 'crypto';

export interface AuthUser {
    id: string;
    email: string;
    isAdmin: boolean;
}

const secret = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET est obligatoire en production');
    }
    console.warn('[auth] JWT_SECRET absent : secret de développement utilisé (NE PAS utiliser en production)');
}

/** Vérifie un JWT HS256 émis par rest-api (même secret JWT_SECRET). */
export function verifyToken(token: string | undefined): AuthUser | null {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [header, body, sig] = parts;
        const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest();
        const given = Buffer.from(sig, 'base64url');
        if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
        const head = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
        if (head.alg !== 'HS256') return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) return null;
        return { id: payload.sub, email: payload.email, isAdmin: !!payload.isAdmin };
    } catch {
        return null;
    }
}

const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const extraOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

/** Origines autorisées : localhost/127.0.0.1 (dev) + CORS_ORIGINS. */
export function isOriginAllowed(origin: string | undefined): boolean {
    return !origin || localOrigin.test(origin) || extraOrigins.includes(origin);
}
