# Programme de démonstration NexusCare (≈ 20 min)

## Avant la démo (5 min)
1. Lancer Docker Desktop, puis `scripts\dev-up-dns.bat` (ou `dev-up.bat` si le réseau autorise Docker Hub). Attendre ~2 minutes.
2. Ouvrir https://localhost:5173 et accepter le certificat auto-signé (une seule fois).
3. Préparer **deux fenêtres de navigateur** (une normale, une privée) : Sophie (médecin organisatrice) et Jean (médecin invité). Autoriser caméra et micro.
4. Vérifier `.env` : `GEMINI_API_KEY` / `GROQ_API_KEY` renseignées pour la partie IA.

## Déroulé
| Min | Étape | Ce qu'on montre | US |
|---|---|---|---|
| 0–2 | Inscription d'un nouveau médecin, tentative avec un e-mail déjà pris, connexion, rechargement (session conservée) | Comptes et sécurité | 01, 02 |
| 2–3 | Profil : changer la spécialité ; bouton de déconnexion visible partout | Profil, déconnexion | 03, 04 |
| 3–6 | **Sophie** crée une RCP (patient, date, durée), invite Jean avec sa spécialité, masque/affiche une spécialité | Réunions | 05–08 |
| 6–8 | **Jean** voit la réunion dans son tableau de bord, ouvre le détail, remplit son dossier patient avec champs personnalisés → statut « Pré-requis réalisé » ✓ | Dossier patient | 06, 07, 14–16 |
| 8–10 | Jean clique « Rejoindre » → écran de pré-réunion (aperçu caméra, test micro) → entre | Pré-réunion | 09, 12 |
| 10–13 | Les deux en visio : couper/rétablir caméra et micro, chat de salle, consultation du dossier de l'autre participant | Visio + chat + dossiers | 10, 11, 17–19 |
| 13–15 | Actions → **Transcription en direct** : parler quelques phrases, exporter en `.txt` | Transcription | 21, 22 |
| 15–17 | Actions → **Générer un rapport** : relire/corriger, télécharger le PDF `rapport_<id>.pdf` ; complétion automatique du formulaire | IA | 23–25 |
| 17–18 | Jean quitte la réunion (notification à Sophie) | Fin de réunion | 13 |
| 18–19 | Chat de groupe persistant (/chat) | Groupes | 20 |
| 19–20 | Connexion **admin** → Administration : créer/désactiver une spécialité (elle disparaît de l'inscription), promouvoir un utilisateur, renommer un groupe | Administration | 26–28 |

## Plan B si quelque chose échoue
- Pas de caméra : montrer la pré-réunion + le chat + le dossier, puis la visio sur deux onglets si un seul appareil.
- IA indisponible (clés/réseau) : montrer l'écran de relecture et le PDF avec un texte saisi à la main.
- Page blanche après modification du code : `scripts\dev-restart.bat`.

## Réinitialiser les données de démo
Les comptes et réunions de démo sont recréés au démarrage de l'API (développement uniquement).
