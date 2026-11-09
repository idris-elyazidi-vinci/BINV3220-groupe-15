# Bilan — Semaine 2 : les candidatures (EF-32, EF-33)

> Brouillon à relire et reformuler dans mes propres mots avant la remise.

## Choix (planification)

Le cahier des charges ne tranche pas deux points, décidés avant de coder :
- **Candidatures répétées** : on bloque une 2ᵉ candidature tant qu'une est « En cours »
  (409 `ALREADY_APPLIED`) ; après un **retrait** ou un **refus**, candidater à nouveau est
  permis. Règle simple = « bloquer seulement s'il existe déjà une candidature en cours ».
- **Retrait** : autorisé uniquement tant que la candidature n'est pas traitée (statut
  `IN_PROGRESS`), conformément à EF-32.

Découpage en trois étapes comme le suggère l'énoncé : candidater, consulter, retirer. Pas de
migration : la table `applications` existait déjà dans le schéma.

## Résultat

Tout fonctionne : un étudiant candidate à une offre publiée (avec ou sans message), voit ses
candidatures et leur statut, et retire une candidature en cours. Les refus serveur sont en
place (offre non publiée, offre inexistante, doublon, retrait d'une candidature traitée, accès
d'un non-étudiant). Limite connue : la sélection d'un candidat (EF-34) et la création du stage
restent hors périmètre, donc aucune candidature ne passe « Retenue »/« Non retenue » depuis
l'application — ces statuts viennent des données de démo.

## Modifications

- **Backend** (nouvelle ressource `/applications`) : `models/application.ts`,
  `repositories/applications.repository.ts` (SQL + `RETURNING`), `services/applications.service.ts`
  (règles EF-32/EF-33/RG-03), `controllers/applications.controller.ts` (validation du corps,
  routes réservées aux étudiants via `authorize(isStudent)`), `mappers/application.mapper.ts`,
  montage dans `app.ts`. Doc : `backend/API.md`, `backend/http/applications.http`.
- **Frontend** : modèle, guards, libellés, `services/applications.service.ts`,
  `hooks/useApplications.ts`, page **Mes candidatures** (`ApplicationsPage` + `ApplicationTable`),
  bouton **Candidater** sur la page Offres (formulaire message facultatif, « Déjà candidaté »
  si en cours), route + lien NavBar réservés aux étudiants.
- Décision prise après coup : charger les candidatures de l'étudiant sur la page Offres (via un
  paramètre `enabled` du hook) pour griser les offres déjà visées, sans jamais appeler l'API
  pour un non-étudiant.

## Validation fonctionnelle

11 cas rejoués au niveau API sur le serveur local (voir `cas-de-tests-e2e.md`), tous conformes :
candidature avec/sans message, offre non publiée (409), doublon (409), offre inexistante (404),
accès administrateur refusé (403), liste limitée à l'étudiant, retrait en cours, retrait d'une
candidature traitée (409), retrait d'une candidature d'autrui (404), re-candidature après
retrait. Les cas navigateur (B1–B7) sont listés pour rejeu.

## Qualité

Code aligné sur l'architecture existante (controller → service → repository → mapper, type
guards manuels, SQL lisible). La ressource `/applications` reprend la structure des offres. Un
point vérifié au-delà du compte rendu de l'agent : un `POST` renvoyait un **500** en dev alors
que les tests passaient. En isolant le problème (sonde SQL directe + inspection des process),
j'ai constaté que l'insert était correct : le 500 venait de **plusieurs serveurs `tsx watch`
en double** qui se chevauchaient, pas du code. Après avoir tout arrêté et relancé un seul
serveur, les 11 cas sont passés. Bon rappel : vérifier soi-même, ne pas croire le premier
résultat.

## Tests et commandes

- Tests ajoutés : `backend/tests/applications.test.ts` (15 cas, écrits en TDD avant le code),
  `frontend/tests/ApplicationsPage.test.tsx` (4 cas) et cas EF-32 dans `OffersPage.test.tsx`.
  Exemple de comportement couvert : « refuse une deuxième candidature tant que la première est
  en cours » → attend 409 `ALREADY_APPLIED`.
- Commandes : `npm run check` **vert** (lint + typecheck + **182 tests** + build) ;
  `npm run db:reset` pour une base propre ; vérification API par `curl` / `applications.http`.
