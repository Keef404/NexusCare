# Recette fonctionnelle — NexusCare (8 EPICs / 28 User Stories)

Légende : ✅ validé par test automatisé sur l'API réelle (Docker) · 🖥️ à vérifier à l'écran (navigateur + caméra/micro nécessaires) · ⚠️ point d'attention

**Comptes de démonstration** (créés au démarrage en environnement de développement) :

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Médecin | sophie.martin@oncocollab.fr | password123 |
| Médecin | jean.dupont@oncocollab.fr | password123 |
| Médecin | marie.lefevre@oncocollab.fr / paul.bernard@oncocollab.fr | password123 |
| Administrateur plateforme | admin@oncocollab.fr | admin123 |

URL : https://localhost:5173 (accepter le certificat auto-signé au premier chargement).

## EPIC 1 — Authentification

| US | Scénario de recette | Résultat attendu | État |
|---|---|---|---|
| US-01 | /register : créer un compte avec une spécialité | Compte créé, redirection vers /login ; la réponse ne contient jamais le mot de passe (haché bcrypt côté serveur) | ✅ |
| US-01 | Réinscrire le même e-mail | Message « User already exists » | ✅ |
| US-02 | Connexion valide | Jeton JWT reçu, accès au tableau de bord, session conservée au rechargement | ✅ API · 🖥️ UI |
| US-02 | Mauvais mot de passe | Message « Identifiants invalides » (même message si l'e-mail n'existe pas) | ✅ |
| US-02 | Appel API sans jeton | 401 | ✅ |
| US-03 | Bouton « Déconnexion » sur toutes les pages (bouton flottant en haut à droite, en-tête sur l'accueil) | Jeton supprimé, retour sur /login ; confirmation si on est en réunion | 🖥️ |
| US-04 | /profile : modifier prénom, nom, spécialité | Profil mis à jour ; modifier le profil d'un autre → 403 | ✅ API · 🖥️ UI |

## EPIC 2 — Réunions

| US | Scénario | Résultat attendu | État |
|---|---|---|---|
| US-05 | Créer une RCP (sujet, description, date, heure, durée, patient) | Identifiant de salle généré, créateur = administrateur de la réunion (forcé côté serveur), statut « pending » | ✅ |
| US-06 | /meetings | Toutes les réunions du participant avec patient, sujet, date, heure, durée, statut du dossier | ✅ API · 🖥️ UI |
| US-07 | Ouvrir le détail | Modale : titre, description, heure, durée, patient, participants, ✓ si dossier rempli | ✅ API · 🖥️ UI |
| US-08 | Inviter un participant avec sa spécialité ; masquer/afficher un participant et sa spécialité (icônes œil / étiquette, réservées à l'admin de la réunion) | Ajout OK ; non-admin → 403 | ✅ |
| US-09 | Bouton « Rejoindre » | Passage par /meeting/:id/premeeting avant l'appel | 🖥️ |

## EPIC 3 — Visioconférence

| US | Scénario | Résultat attendu | État |
|---|---|---|---|
| US-10 | Deux utilisateurs (deux navigateurs/profils) rejoignent la même réunion | Flux vidéo/audio mutuels, arrivées/départs dynamiques | 🖥️ (signalisation WebSocket authentifiée par JWT, validée) |
| US-11 | Boutons caméra / micro | État visible par les autres participants | 🖥️ |
| US-12 | Pré-réunion | Aperçu caméra + test micro avant d'entrer | 🖥️ |
| US-13 | Bouton « Quitter » | Notification temps réel, retour au tableau de bord | 🖥️ |

⚠️ La visio réelle nécessite des appareils caméra/micro et, hors réseau local, le serveur TURN (coturn) configuré.

## EPIC 4 — Dossier patient

| US | Scénario | Résultat attendu | État |
|---|---|---|---|
| US-14 | Créer un dossier (prénom, nom, profession, champs libres) avant la réunion | Dossier créé, statut « Pré-requis réalisé » | ✅ |
| US-15 | Modifier le dossier | Modale pré-remplie, sauvegarde et statut mis à jour | ✅ API · 🖥️ UI |
| US-16 | Champs personnalisés clé/valeur (JSON) | Ajout, édition, suppression individuels | ✅ API · 🖥️ UI |
| US-17 | Consulter les dossiers des autres en réunion | Dossiers associés à la profession du rédacteur ; le dossier d'un participant **masqué** n'est visible que par lui, l'admin de la réunion et les admins plateforme | ✅ |

## EPIC 5 — Chat

| US | Scénario | Résultat attendu | État |
|---|---|---|---|
| US-18 | Envoyer un message en salle | Temps réel (WebSocket), nom + heure, persistance ; l'expéditeur est toujours l'utilisateur connecté (anti-usurpation) | ✅ |
| US-19 | Rouvrir une salle | Historique chronologique chargé | ✅ |
| US-20 | Chat de groupe (/chat) | Historique persistant visible par tous les membres | ✅ |

## EPIC 6 — Transcription

| US | Scénario | Résultat attendu | État |
|---|---|---|---|
| US-21 | En visio : menu « Actions » → « Transcription en direct » | Panneau de transcription, activation/désactivation pendant la session | 🖥️ (micro requis) |
| US-22 | Bouton d'export (icône ↓) du panneau | Fichier `transcription_<idRéunion>.txt` en texte brut | 🖥️ |

## EPIC 7 — Rapports IA

| US | Scénario | Résultat attendu | État |
|---|---|---|---|
| US-23 | Actions → « Générer un rapport » : audio → transcription (Whisper/Groq) → structuration (Gemini/Groq) ; relecture et correction du texte avant export | Compte-rendu structuré éditable | ✅ service généré joignable (`/ai/health` OK) · 🖥️ bout en bout (clés API requises) |
| US-24 | « Télécharger en PDF » | PDF `rapport_<idRéunion>.pdf` | 🖥️ |
| US-25 | Complétion automatique du formulaire patient | Extraction selon le schéma de la spécialité, vérification avant validation | 🖥️ (clés API requises) |

⚠️ Les clés `GEMINI_API_KEY` / `GROQ_API_KEY` doivent être renseignées dans `.env` pour tester US-23 à US-25 de bout en bout.

## EPIC 8 — Administration (page /admin, réservée aux administrateurs)

| US | Scénario | Résultat attendu | État |
|---|---|---|---|
| US-26 | Créer / activer / désactiver / supprimer une spécialité | Une spécialité inactive disparaît de `/professions/active` (inscription) ; un non-admin reçoit 403 | ✅ |
| US-27 | Liste des utilisateurs, attribution / retrait du rôle admin, suppression | Un non-admin ne peut pas se promouvoir (403) ; on ne peut pas se retirer ses propres droits depuis l'écran | ✅ |
| US-28 | Groupes : création, ajout/retrait de membres, renommage, suppression ; chat de groupe | Seuls le créateur et les admins gèrent le groupe ; un membre peut le quitter | ✅ |

## Contrôles transverses (sécurité)

- JWT HS256 obligatoire sur toute l'API et sur le WebSocket ; routes publiques limitées à l'inscription, la connexion, la liste des spécialités actives et la santé.
- Mots de passe jamais renvoyés par l'API ; compte « admin » non créable via l'inscription.
- Droits par réunion : seul l'admin de la réunion (ou un admin plateforme) modifie, annule, supprime la réunion et gère ses participants.
- CORS restreint (localhost + `CORS_ORIGINS`) ; `JWT_SECRET` obligatoire en production.
