# AGENTS.md — Gesta

Instructions pour tout agent de codage (Claude Code, GitHub Copilot, …) travaillant sur ce
dépôt. Ce fichier est la source de contexte unique ; les outils qui lisent `CLAUDE.md` ou
`.github/copilot-instructions.md` peuvent y être pointés.

## Le projet

Gesta : application web de gestion des stages (cours BINV3220). Monorepo npm workspaces,
volontairement incomplet — les fonctionnalités métier se développent séance par séance.

- **Frontend** `frontend/` — React + TypeScript + Vite, React Router, CSS simple, pas de
  bibliothèque d'UI.
- **Backend** `backend/` — Node.js + Express + TypeScript, SQLite via `better-sqlite3`
  avec du SQL écrit à la main (pas d'ORM).
- **Base** `backend/data/gesta.db` (créée localement), migrations en fichiers `.sql`.

## Commandes (toujours à la racine)

| Commande | Rôle |
|---|---|
| `npm run dev` | Démarre l'API (http://localhost:3000) et le web (http://localhost:5173) |
| `npm run setup` | Crée `backend/.env` puis la base de démo (une seule fois) |
| `npm run db:reset` | Recrée la base de démo (arrêter `npm run dev` avant) |
| `npm run check` | **lint + typecheck + test + build** — doit être vert avant chaque commit |

Node ≥ 22.14 requis (24 LTS recommandé). Ne pas lancer `npm install` sans raison : utiliser
`npm ci` pour installer, `npm install <paquet>` seulement pour ajouter une dépendance.

## Architecture backend (par couches)

Le flux d'une route suit toujours : **controller → service → repository → base**, puis
**mapper** pour convertir vers le DTO exposé.

- `controllers/` — routes Express, parsing/validation des paramètres de requête (lève
  `HttpError(400, "INVALID_QUERY", …)` si invalide), appel du service, mapping vers DTO.
- `services/` — règles métier (droits, visibilité selon le profil) ; ne connaissent pas Express.
- `repositories/` — requêtes SQL préparées, typées `<Params, Dbo>`.
- `mappers/` — `Dbo` (colonnes SQL) → modèle → `Dto` (forme exposée par l'API).
- `models/` — types et constantes (`OFFER_STATUSES`, `PERIOD_CODES`, …).
- `middlewares/` — `authenticate`, `authorize`.

Les contrôles de droits sont **toujours côté serveur** (le frontend ne décide rien).

## Architecture frontend (par couches)

`pages/` → `hooks/` → `services/` → `fetch`. Les réponses de l'API sont validées par des
**type guards** (`utils/guards.ts`) avant usage ; les libellés français vivent dans
`utils/labels.ts`. Pas de logique de droits côté front : on affiche ce que l'API renvoie.

## Conventions

- Imports locaux avec l'extension explicite (`./foo.ts`, `./Bar.tsx`).
- Validation par **type guards écrits à la main**, pas de bibliothèque de schéma.
- SQL lisible dans les repositories, paramètres nommés (`@param`).
- Statuts/codes stockés en anglais, libellés français produits par le front.
- Tests : Vitest + Supertest (back) / Testing Library (front). Un comportement par test,
  nom explicite en français.

## Méthode de travail attendue (cours « développement agentique »)

1. **Explorer avant de coder** : lire les fichiers concernés, repérer un patron existant à
   réutiliser (ex. le filtre `?q=` des entreprises est le modèle des autres filtres).
2. **Planifier** : annoncer le plan, poser les questions ouvertes avant d'écrire du code.
3. **TDD** : écrire le test qui échoue, le voir échouer, puis le code minimal qui le fait
   passer.
4. **Vérifier** : `npm run check` vert + test manuel au navigateur sur plusieurs profils ;
   mettre à jour `backend/API.md` et les fichiers `backend/http/*.http`.
5. **Expliquer** : chaque changement doit pouvoir être justifié (examen oral).

## Portée

Développer uniquement la fonctionnalité demandée pour la séance. Pas de refactor opportuniste,
pas de dépendance ajoutée sans nécessité, pas de migration inutile. Ne jamais committer de
secret (`backend/.env` est ignoré par Git).
