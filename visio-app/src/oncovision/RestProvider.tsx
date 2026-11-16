// Re-exports depuis les sources OncoVision (alias 'oncovision-src' défini dans vite.config.ts).
// lib.tsx n'exporte pas RestProvider : on passe par hooks/rest pour partager LE MÊME contexte
// entre les composants locaux et l'ImageViewer d'OncoVision.
export { RestProvider, useRest } from 'oncovision-src/hooks/rest';
export type { RestContextType } from 'oncovision-src/hooks/rest';
