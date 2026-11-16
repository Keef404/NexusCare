import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const SENSITIVE_KEYS = new Set(['password']);

function strip(value: any): any {
    if (Array.isArray(value)) return value.map(strip);
    if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
            if (!SENSITIVE_KEYS.has(k)) out[k] = strip(v);
        }
        return out;
    }
    return value;
}

/** Filet de sécurité : aucune réponse JSON ne doit jamais contenir un hash de mot de passe. */
@Injectable()
export class StripSensitiveInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(map(strip));
    }
}
