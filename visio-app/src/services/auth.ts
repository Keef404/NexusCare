// Gestion de la session : le JWT émis par rest-api est stocké dans l'objet « user » (localStorage).
const USER_KEY = 'user';

export function getStoredUser<T = any>(): T | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

export function getToken(): string | null {
    return getStoredUser<{ accessToken?: string }>()?.accessToken ?? null;
}

export function clearSession(): void {
    localStorage.removeItem(USER_KEY);
}

/** Déconnexion : supprime le jeton et retourne sur /login. */
export function logout(): void {
    clearSession();
    window.location.assign('/login');
}

/** fetch qui ajoute « Authorization: Bearer <jwt> » ; une réponse 401 (jeton expiré/invalide) déconnecte l'utilisateur. */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const token = getToken();
    const headers = new Headers(init.headers);
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(input, { ...init, headers });
    if (res.status === 401 && token) {
        clearSession();
        if (!window.location.pathname.startsWith('/login')) window.location.assign('/login');
    }
    return res;
}
