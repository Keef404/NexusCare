# Audit NexusCare — 16/11/2026

Périmètre : lancement local Docker, intégration OncoVision, couverture des 8 EPICs / 28 US.
Méthode : lecture du code (visio-app, rest-api, websocket, OncoVision/app), build Vite de validation sur copie. **Docker n'a pas pu être lancé depuis l'environnement d'audit** : le démarrage complet reste à valider sur votre poste.

## 1. Page blanche — cause et correctif

**Cause** : `visio-app/src/oncovision/RestProvider.tsx` faisait `export { RestProvider, useRest } from 'oncovision'`. L'alias `oncovision` pointe sur `OncoVision/app/src/lib.tsx`, qui n'exporte pas `RestProvider` (défini dans `hooks/rest.tsx`). L'erreur `RestProvider.tsx:3:10` = ligne 3, colonne 10 de ce fichier-là (pas celui de `OncoVision/app/src`).

**Correctifs appliqués** (dans `visio-app/`) :
- `vite.config.ts` : alias `oncovision-src/…` vers les sources OncoVision ; chemin de repli corrigé (`../OncoVision/app/src`, il était `../../`) ; plugin Babel décorateurs legacy (OncoVision utilise `@subscribe` dans `viewers/socket/canva.tsx`).
- `src/oncovision/RestProvider.tsx` : ré-export depuis `oncovision-src/hooks/rest`.
- `src/App.tsx` : suppression du `RestProvider` factice (il créait un contexte différent de celui de `useRest` → erreur « must be used within a RestProvider » à l'ouverture des annotations) ; utilisation du vrai.
- `package.json` : ajout de `antd`, `react-cookie`, `lucide-react`, `@tanstack/react-query`, `react-icons`, **`react-dropzone`, `uuid`** (manquaient aussi) et `@babel/plugin-proposal-decorators` (dev). `package-lock.json` régénéré.
- `Dockerfile.dev` : token npm en clair retiré ; `npm install` → `npm ci`.

**Validation** : `vite build` sur une copie reproduisant la disposition Docker → OK (3 725 modules, aucune erreur d'export).

## 2. Lancement (CMD Windows)

```
cd C:\Users\Enock\NexusCare
docker compose up -d --build --renew-anon-volumes visio-app
docker compose logs -f visio-app
```
`--renew-anon-volumes` est indispensable : le volume anonyme `/app/node_modules` du compose conserve sinon l'ancien `node_modules` (sans les nouvelles dépendances) et masque l'image reconstruite. Ne pas utiliser `docker compose down -v` (efface aussi les données Postgres/Mongo/MySQL).
Vider le cache Firefox (Ctrl+Maj+R) après redémarrage.

## 3. Sécurité — à traiter avant la recette

| # | Gravité | Constat |
|---|---|---|
| S1 | Critique | **Aucune authentification côté API** : pas de JWT ni de guard sur les contrôleurs (`/users`, `/meetings`, `/patient-records`, `/messages`…). `ProtectedRoute` ne vérifie que `localStorage`. Données patients accessibles sans connexion. |
| S2 | Critique | **Le hash du mot de passe est renvoyé au client** (`common/serializers/serializers.ts` : `password: user.password`) ; `login` retourne l'objet utilisateur complet. |
| S3 | Critique | Token npm du registre `git.jdsr.dev` écrit en clair dans `visio-app/Dockerfile.dev` (retiré du fichier mais **présent dans l'historique git** → à révoquer). |
| S4 | Élevée | CORS `origin: '*'` (API et WebSocket) ; WebSocket sans contrôle d'identité (`join-room` accepte n'importe quel `roomId`). |
| S5 | Élevée | Mots de passe par défaut dans `docker-compose.yml` (`password123`, `minioadmin123`, `root`…), comptes seed `password123`/`admin123`, endpoints `POST /professions/seed` et `POST /meetings/repair-collaboration-ids` ouverts. |
| S6 | Moyenne | Rôle admin (`isAdmin`) non appliqué : aucune vérification de rôle sur la gestion des spécialités/utilisateurs. |
| S7 | Moyenne | Images non épinglées (`mysql:latest`, `minio/minio`, `phpmyadmin:latest`) ; MySQL/phpMyAdmin exposés avec root/root. |

## 4. Couverture des User Stories

Légende : OK = présent dans le code (à tester en recette) · Partiel · Manquant.

| EPIC / US | Statut | Constat |
|---|---|---|
| **1 — US-01 Inscription** | OK | argon2, e-mail unique (`BadRequest`), liste de professions à l'inscription. |
| US-02 Connexion | **Partiel** | Pas de token (cf. S1/S2) ; session = `user` en localStorage. |
| US-03 Déconnexion | **Partiel** | Bouton uniquement dans `Home.tsx`, pas sur toutes les pages. |
| US-04 Profil | OK | `Profile.tsx` → `updateUser`. |
| **2 — US-05 à US-07, US-09** | OK | `POST/GET /meetings`, `pending`, `:id`, `participants-status`, `start` ; UI `Meetings.tsx`, `PreMeeting.tsx`. |
| US-08 Invitation / visibilité | **Partiel** | Endpoints `participants` et `participants/:id/visibility` présents ; pas d'UI de visibilité repérée. |
| **3 — US-10 à US-13** | OK | `VideoCall.tsx` + signalisation WebSocket (offer/answer/ICE, join/leave) ; coturn en dev. Test multi-postes à faire. |
| **4 — US-14 à US-17** | OK | `patient-records` (CRUD), `meetings/:id/patient-records`, `form-filled`, modale dans `Meetings.tsx`. |
| **5 — US-18, US-19** | OK | `send-chat-message` (WS) + `GET /messages/room/:roomId`. |
| US-20 Chat de groupe | OK | `groups` API + onglet Groupes de `Chat.tsx`. |
| **6 — US-21 Transcription live** | OK | `useTranscription` + `TranscriptionPanel` + service `transcription-api` (Whisper/Groq). |
| US-22 Export texte | **Manquant** | Aucun export `.txt` (pas de Blob/download dans `TranscriptionPanel`/`VideoCall`). |
| **7 — US-23 Rapport IA** | **Partiel** | `ai/generate-report` + `ReportGeneratorModal` ; moteurs réels = Groq/Gemini (le backlog dit Whisper OpenAI + Gemini) → aligner le cahier des charges ou le code. Relecture avant export à vérifier. |
| US-24 Export PDF | **Partiel** | Téléchargement présent mais fichier nommé `rapport_reunion.pdf` (attendu : identifiant de réunion). |
| US-25 Complétion formulaire | OK | `forms/extract` + service `completion-formulaire`. |
| **8 — US-26 Spécialités** | **Partiel** | CRUD + `active` côté API ; **aucune interface d'administration**. |
| US-27 Utilisateurs / rôles | **Partiel** | API `users` + champ `isAdmin` ; **pas d'UI**, rôle non contrôlé (S6). |
| US-28 Groupes | **Partiel** | Création / ajout / retrait de membres ; pas de modification/suppression de groupe ni lien réunions↔groupe vérifié. |

Autre : `/wsi-analysis` affiche « Fonctionnalité à venir » ; OncoVision n'est réellement utilisé que dans `Meetings.tsx` et `VideoCall.tsx` via `CollaborativeAnnotation`.

## 5. Infra / dette technique

- Le brief mentionne MySQL : la base principale est **PostgreSQL** ; MySQL ne sert qu'à OLGA.
- `vite.config.ts` : proxy `/api → https://localhost:3000` inutile et faux dans le conteneur (le front appelle directement `VITE_API_URL`). Les proxys `/room`, `/viewer`, `/draw` vers `oncovision-api` couvrent bien les endpoints OncoVision utilisés.
- `docker-compose.yml` : conteneur `…comqpletion-formulaire…` (faute), `dockerfile: DockerFile` (casse, fragile sur Linux/CI), `visio-app` sans `healthcheck`.
- `OncoVision/` est un dépôt git imbriqué dont **tous les fichiers apparaissent modifiés** (probablement CRLF/autocrlf) : décider sous-module ou copie, et fixer `.gitattributes`.
- Un stub `OncoVision/app/src/RestProvider.tsx` (créé pendant vos essais) est inutile : à supprimer.
- `Meetings.tsx` fait ~80 Ko : à découper avant d'ajouter des fonctions.
- README encore intitulé « OncoCollab » : ne mentionne ni OncoVision ni OLGA.

## 6. Plan recommandé (ordre)

1. Valider le lancement (§2) et tester `/login` → `/meetings` → ouverture d'une annotation OncoVision.
2. Révoquer le token npm ; retirer le hash des réponses (S2) ; ajouter JWT + guards + rôles (S1, S6).
3. Combler les écarts fonctionnels : export transcription (US-22), nom du PDF (US-24), déconnexion globale (US-03), UI de visibilité (US-08).
4. Écrans d'administration (US-26/27/28) — le plus gros chantier restant.
5. Recette complète des 28 US avec la MOA ; durcissement des mots de passe/CORS ; mise à jour README.
