import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from './token.service';
import { ADMIN_ONLY_KEY, IS_PUBLIC_KEY } from './decorators';

/**
 * Guard global : toute route exige un jeton « Authorization: Bearer <jwt> » valide,
 * sauf celles marquées @Public(). Les routes @AdminOnly() exigent en plus isAdmin.
 */
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private readonly tokens: TokenService) {}

    canActivate(context: ExecutionContext): boolean {
        const targets = [context.getHandler(), context.getClass()];
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);

        const req = context.switchToHttp().getRequest();
        const header: string | undefined = req.headers?.authorization;
        const token = header && header.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
        const user = token ? this.tokens.verify(token) : null;
        if (user) req.user = user;

        if (isPublic) return true;
        if (!user) throw new UnauthorizedException('Authentification requise');

        const adminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, targets);
        if (adminOnly && !user.isAdmin) {
            throw new ForbiddenException('Droits administrateur requis');
        }
        return true;
    }
}
