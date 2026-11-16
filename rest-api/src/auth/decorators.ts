import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Route accessible sans jeton (inscription, connexion, liste des spécialités actives, santé). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ADMIN_ONLY_KEY = 'adminOnly';
/** Route réservée aux administrateurs de la plateforme (isAdmin = true). */
export const AdminOnly = () => SetMetadata(ADMIN_ONLY_KEY, true);

export interface AuthUser {
    id: string;
    email: string;
    isAdmin: boolean;
}

/** Utilisateur authentifié, injecté par AuthGuard à partir du jeton. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user as AuthUser;
});
