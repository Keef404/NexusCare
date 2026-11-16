import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import type { AuthUser } from './decorators';

interface TokenPayload {
    sub: string;
    email: string;
    isAdmin: boolean;
    iat: number;
    exp: number;
}

/**
 * Jeton JWT HS256 minimal (sans dépendance externe), compatible avec n'importe quelle librairie JWT.
 * Le secret vient de JWT_SECRET (obligatoire en production). Le service WebSocket utilise le même secret.
 */
@Injectable()
export class TokenService {
    private readonly secret: string;
    private readonly ttlSeconds: number;

    constructor() {
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET est obligatoire en production');
        }
        if (!secret) {
            console.warn('[auth] JWT_SECRET absent : secret de développement utilisé (NE PAS utiliser en production)');
        }
        this.secret = secret || 'dev-only-insecure-secret-change-me';
        this.ttlSeconds = Number(process.env.JWT_EXPIRES_IN_SEC) || 8 * 3600;
    }

    private b64(input: Buffer | string): string {
        return Buffer.from(input).toString('base64url');
    }

    private signature(data: string): Buffer {
        return createHmac('sha256', this.secret).update(data).digest();
    }

    sign(user: AuthUser): string {
        const now = Math.floor(Date.now() / 1000);
        const payload: TokenPayload = {
            sub: user.id,
            email: user.email,
            isAdmin: !!user.isAdmin,
            iat: now,
            exp: now + this.ttlSeconds,
        };
        const header = this.b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = this.b64(JSON.stringify(payload));
        const data = `${header}.${body}`;
        return `${data}.${this.b64(this.signature(data))}`;
    }

    verify(token: string): AuthUser | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const [header, body, sig] = parts;
            const expected = this.signature(`${header}.${body}`);
            const given = Buffer.from(sig, 'base64url');
            if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
            const head = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
            if (head.alg !== 'HS256') return null;
            const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
            if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) return null;
            return { id: payload.sub, email: payload.email, isAdmin: !!payload.isAdmin };
        } catch {
            return null;
        }
    }
}
