import React from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { logout } from '../services/auth';

/** Bouton de déconnexion accessible depuis toutes les pages protégées (US-03). */
const LogoutButton: React.FC = () => {
    const { pathname } = useLocation();
    // La page d'accueil possède déjà son propre bouton dans son en-tête.
    if (pathname === '/') return null;
    const inCall = /\/meeting\/[^/]+\/call/.test(pathname);

    const handleClick = () => {
        if (inCall && !window.confirm('Vous êtes en réunion : voulez-vous vraiment vous déconnecter ?')) return;
        logout();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="fixed top-3 right-3 z-[60] inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 hover:bg-red-600/90 border border-white/10 text-slate-200 hover:text-white text-xs font-medium px-3 py-1.5 backdrop-blur transition-colors"
        >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Déconnexion</span>
        </button>
    );
};

export default LogoutButton;
