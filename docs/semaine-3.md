# Semaine 3 — Harnais agentique : guider et vérifier

> Phase 4 (fiche « Semaine 8 »). Travail réalisé avec **Claude Code** (alternative à Copilot
> autorisée, déjà utilisée en semaines 1 et 2). Branche `semaine-3`.
> Conversation exportée : [`semaine-3/conversation-1.md`](semaine-3/conversation-1.md) ·
> bilan réflexif : [`semaine-3/bilan.md`](semaine-3/bilan.md).

Chaque constat ci-dessous a été vérifié en ouvrant le fichier cité ou en exécutant la commande
indiquée. Ce qui n'a été que lu (pas exécuté) est signalé comme tel.

---

## 1. Inventaire — guides et senseurs

### Matrice de classement

|                    | **Guide — feedforward** | **Senseur — feedback** |
|---|---|---|
| **Inférentiel** (interprété par une IA) | `AGENTS.md` · `docs/architecture.md` · `docs/cdc_gesta_developpement.md` · `backend/API.md` · `README.md` · `.github/pull_request_template.md` · skills Superpowers de mon environnement (hors dépôt) | *Aucun dans le dépôt* (pas de revue de code IA configurée, pas de CI) |
| **Computationnel** (règles exécutables) | Types TypeScript partagés (`models/`) · `seedIds.ts` (identifiants nommés) · `.nvmrc` + `engines` · `.npmrc` | Tests Vitest/Supertest (back) et Testing Library (front) · `tsc` strict (typecheck) · oxlint `--deny-warnings` · build (`tsc` + `vite build`) · garde de version Node · contraintes SQLite (`CHECK`, FK, `STRICT`) · `npm run check` qui enchaîne le tout |

> La case « senseur inférentiel » reste vide : je ne l'ai pas remplie artificiellement. Le
> seul usage d'une IA en relecture a été mon propre dialogue avec l'agent, ce n'est pas un
> mécanisme du dépôt.

### Détail des mécanismes présents

| Mécanisme | Type | Fichier / outil | Ce qu'il demande, impose ou vérifie | Exemple concret | Vérifié pendant la séance ? |
|---|---|---|---|---|---|
| `AGENTS.md` | Guide inférentiel | `AGENTS.md` | Contexte unique pour tout agent : stack, commandes, architecture par couches, conventions, méthode (explorer → planifier → TDD → vérifier → expliquer), portée | « Le flux d'une route suit toujours : controller → service → repository → base, puis mapper » | **Lu en entier.** Effet observé : l'agent a réutilisé `createTestApp`/`tokenFor` et les noms en français demandés |
| Architecture | Guide inférentiel | `docs/architecture.md` | Responsabilité de chaque dossier, format d'erreur, migrations, flux d'authentification, outillage des tests | « `services/` — Règles métier ; ne reçoivent jamais `Request` ni `Response` » | **Lu** (sections Backend, Tests, Conventions) |
| Cahier des charges de dev | Guide inférentiel | `docs/cdc_gesta_developpement.md` | Exigences EF-xx / règles RG-xx à implémenter | EF-32, EF-33, RG-03 (base de la matrice §2) | **Lu** (EF-32, EF-33, RG-01→14) |
| Documentation d'API | Guide inférentiel | `backend/API.md` | Contrat des routes : statuts, codes d'erreur, forme JSON | Tableau des erreurs `INVALID_BODY` 400, `FORBIDDEN` 403… | **Lu** (en-tête + format d'erreur) |
| Modèle de PR | Guide inférentiel | `.github/pull_request_template.md` | Checklist avant fusion : check vert, cas d'erreur 400/401/403/404, droits côté backend, API.md à jour, nouvelle migration | « Des tests couvrent le nouveau comportement et les cas d'erreur » | **Lu** ; c'est une checklist déclarative, rien ne la fait respecter automatiquement |
| Types & identifiants nommés | Guide computationnel | `backend/src/models/*.ts`, `db/seed/seedIds.ts` | Contraignent la forme des objets ; noms stables des données de démo | `APPLICATION.LUCAS_FLEET_APP`, `OFFER_STATUSES` | **Utilisés** dans les nouveaux tests |
| Version Node | Guide + senseur computationnel | `.nvmrc` (24), `package.json` `engines`, `src/nodeVersion.ts` + `tests/nodeVersion.test.ts` | Impose Node ≥ 22.14 ; message clair sinon | « Node 20.19.0 est trop ancien » | **Exécuté** (test vert, Node 24.22.2 via fnm) |
| Tests backend | Senseur computationnel | `backend/tests/**` (Vitest + Supertest, SQLite en mémoire) | Comportement de l'API, droits, schéma, cohérence du seed | `expect(response.body.error.code).toBe("OFFER_NOT_PUBLISHED")` | **Exécuté** : 127 tests avant → **151** après |
| Tests frontend | Senseur computationnel | `frontend/tests/**` (Testing Library + fetch simulé) | Rendu des pages, interactions, guards | « ne propose le retrait que pour une candidature en cours » | **Exécuté** : 55 tests verts |
| Typecheck | Senseur computationnel | `tsc --noEmit` (back), `tsc -b` (front), `strict`, `noUncheckedIndexedAccess` | Cohérence des types | Interdit d'utiliser `body[0]` sans vérifier qu'il existe | **Exécuté** : 0 erreur |
| Linter | Senseur computationnel | `oxlint --deny-warnings`, `.oxlintrc.json` (back & front) | `no-explicit-any`, `eqeqeq`, `no-unused-vars`, règles des hooks React | `react/exhaustive-deps`, `rules-of-hooks` (en semaine 1, oxlint a refusé un `setState` synchrone dans un effet) | **Exécuté** : 0 avertissement |
| Build | Senseur computationnel | `tsc -p tsconfig.build.json` + `vite build` | Le projet se compile pour la production | `✓ built in 71ms` | **Exécuté** : OK |
| Contraintes de la base | Senseur computationnel | `db/migrations/001_*.sql` + `tests/db/*.test.ts` | Valeurs autorisées, clés étrangères, tables `STRICT` | `CHECK (status IN ('IN_PROGRESS','SELECTED','REJECTED','WITHDRAWN'))` | **Lu** + tests `db/` exécutés dans la suite |
| `npm run check` | Senseur computationnel (agrégateur) | `package.json` racine | lint → typecheck → test → build, s'arrête au premier échec | Doit être vert avant chaque commit (AGENTS.md) | **Exécuté** : exit 0 |

**Limite importante** : aucun senseur ne s'exécute automatiquement (pas de CI GitHub Actions, pas
de hook de pré-commit). `npm run check` ne protège que si quelqu'un, humain ou agent, pense à le
lancer. C'est un guide (« doit être vert avant chaque commit ») qui dépend d'un senseur manuel.

---

## 2. Couverture des exigences — EF-32 et EF-33

**Sources** : CdC §7.4 (EF-32 « candidate à une offre publiée, avec un message facultatif ; peut
retirer sa candidature tant qu'elle n'a pas été traitée » ; EF-33 « voit ses candidatures et
leur statut : En cours, Retenue, Non retenue, Retirée ») + RG-03 (« ne peut candidater qu'à une
offre au statut Publiée »). Tests examinés : `backend/tests/applications.test.ts` (état du
commit `038e68a`, 15 cas) et `frontend/tests/{ApplicationsPage,OffersPage}.test.tsx`.

**Règle appliquée** : un cas est *couvert* seulement si une assertion porte sur **son résultat
attendu**. Un `201` sans vérifier ce qui a été enregistré, ou un `404` sans vérifier que rien n'a
changé, compte comme *partiel*.

### Matrice de traçabilité (état AVANT mes ajouts)

| Exig. | Cas à vérifier (résultat attendu) | Test existant (fichier › nom) | Assertions utiles | Couverture | Manque confirmé ou constat écarté |
|---|---|---|---|---|---|
| EF-32 | Candidater à une offre publiée avec message → 201, statut « En cours », visible dans sa liste | `applications.test.ts` › « enregistre la candidature d'un étudiant à une offre publiée, avec message » | `status 201`, `toMatchObject({offerId, message, status:"IN_PROGRESS"})`, puis la liste contient l'offre | **Couvert** | — |
| EF-32 | Message facultatif → candidature sans message acceptée | › « accepte une candidature sans message » | `201`, `message` vaut `null` | **Couvert** | — |
| EF-32 / RG-03 | Offre **non publiée** → refus, aucune candidature créée | › « refuse une candidature à une offre non publiée (RG-03, 409) » | `409`, code `OFFER_NOT_PUBLISHED` — **un seul statut testé (SUBMITTED)**, rien ne vérifie l'absence d'insertion | **Partiel** | **Manque confirmé** : PENDING, ASSIGNED, ARCHIVED non testés. Mutation M2 (§3) : un code qui ne refuserait que SUBMITTED passait le test existant |
| EF-32 | Offre inexistante → 404 | › « refuse une candidature à une offre inexistante (404) » | `404` | **Couvert** (code d'erreur non vérifié, acceptable) | — |
| EF-32 | Doublon : 2e candidature pendant qu'une est en cours → refus **sans 2e ligne** | › « refuse une deuxième candidature tant que la première est en cours » | `409`, `ALREADY_APPLIED` | **Partiel** | **Manque confirmé** : rien ne vérifie que la liste n'a pas grossi |
| EF-32 | Re-candidater après retrait (décision de groupe, semaine 2) | › « autorise une nouvelle candidature après un retrait » + « permet de re-candidater après avoir retiré » | `201`, `IN_PROGRESS` | **Couvert** | — |
| EF-32 | Seul un étudiant peut candidater (401 / 403) | › « refuse une requête sans session (401) », « refuse %s (403) » | `401`, `403` (admin, contact) | **Couvert** pour `POST /applications` | — |
| EF-32 | La candidature appartient à l'étudiant **connecté** (pas à un `studentId` envoyé) | — | — | **Absent** | **Manque confirmé** (risque d'usurpation si un jour le service lit le corps) |
| EF-32 | Corps invalide (offerId absent / non entier, message non texte / trop long) → 400 | — | — | **Absent** | **Manque confirmé** : la validation existe dans le controller mais aucun test ne la protège |
| EF-32 | Retirer une candidature en cours → statut « Retirée » **enregistré** | › « retire une candidature en cours de l'étudiant » | `200`, `body.status = WITHDRAWN` (réponse seulement) | **Partiel** | **Manque confirmé** : la persistance (relecture de la liste) n'est pas vérifiée |
| EF-32 | Retirer une candidature **traitée** → 409, statut inchangé | › « refuse de retirer une candidature déjà traitée (409) » | `409`, `APPLICATION_TREATED` — **seulement SELECTED** | **Partiel** | **Manque confirmé** : REJECTED et WITHDRAWN non testés (mutation M3) |
| EF-32 | Retirer la candidature **d'un autre** → refus **et** candidature d'autrui intacte | › « refuse de retirer la candidature d'un autre étudiant (404) » | `404` | **Partiel** | **Manque confirmé** : rien ne vérifie que la candidature de Youssef reste « En cours » |
| EF-32 | Retirer une candidature inexistante / id invalide → 404 / 400 | — | — | **Absent** | **Manque confirmé** |
| EF-32 / EF-33 | `GET /applications` et le retrait réservés aux étudiants (401 / 403) | — | — | **Absent** | **Manque confirmé** : `router.use(authorize(isStudent))` protège tout, mais seul le POST était testé |
| EF-33 | Un étudiant ne voit **que** ses candidatures | › « ne renvoie que les candidatures de l'étudiant connecté » | égalité exacte de l'ensemble des `offerId` d'Inès | **Couvert** | — |
| EF-33 | Chaque statut est exposé : En cours / Retenue / Non retenue / Retirée | › « expose le statut de chaque candidature » | `REJECTED` pour Léa **uniquement** | **Partiel** | **Manque confirmé** : IN_PROGRESS, SELECTED, WITHDRAWN jamais lus via l'API |
| EF-33 | Étudiant sans candidature → liste vide | — (front : « affiche un état vide sans candidature », API simulée) | côté front seulement | **Partiel** | **Manque confirmé** côté API |
| EF-33 | La liste indique l'offre visée (titre, entreprise) | — | — | **Absent** | Manque mineur (l'exigence parle de « ses candidatures » ; sans titre, la liste est illisible) |
| EF-33 | Libellés français des statuts à l'écran | `ApplicationsPage.test.tsx` › « affiche les candidatures avec leur statut en français » | texte affiché | **Couvert** (front, API simulée) | — |
| EF-32 | Bouton « Candidater » / « Déjà candidaté » / retrait à l'écran | `OffersPage.test.tsx`, `ApplicationsPage.test.tsx` | interactions + appel `fetch` | **Couvert** (front, API simulée) | Ne prouve pas l'intégration réelle front↔back (voir limites) |

### Comportements testés qui ne relèvent pas d'EF-32 / EF-33

Je ne les ai pas rattachés de force à une exigence :

- `ApplicationsPage` / `OffersPage` : **ordre d'affichage**, gestion des erreurs réseau → ergonomie, pas d'exigence chiffrée.
- `tests/db/seed.test.ts` › « couvre tous les statuts de candidature… » : vérifie les **données de démo**, pas le comportement de l'application.
- Le tri `ORDER BY applied_at DESC` du repository (« de la plus récente à la plus ancienne ») : implémenté, **non testé**, et **non exigé** par EF-33. Constat noté, rien ajouté.
- RG-04 (sélection → autres « Non retenue ») : concerne EF-34 (admin), **pas encore implémenté**. Hors périmètre.

---

## 3. Modifications et vérification

### Tests ajoutés (`backend/tests/applications.test.ts`, 15 → 39 cas)

Tous au niveau API (Supertest sur base SQLite en mémoire), avec les outils déjà du projet. Aucun
fichier de production modifié.

| Manque traité | Nouveau test | Défaut qui le ferait échouer |
|---|---|---|
| RG-03 sur tous les statuts non publiés | « refuse une offre en attente de validation / attribuée / archivée (409) sans créer de candidature » (×3) | Un service qui ne refuse qu'un sous-ensemble de statuts, ou qui insère avant de vérifier |
| Doublon sans 2e ligne | « ne crée aucune candidature en double quand la deuxième est refusée » | Insertion faite avant le contrôle `hasActiveApplication` |
| Propriétaire = étudiant connecté | « rattache la candidature à l'étudiant connecté, pas à un studentId envoyé dans le corps » | Un controller qui lirait `req.body.studentId` |
| Validation du corps | « refuse un corps invalide : … (400) » (×5) | Suppression ou affaiblissement de `parseOfferId` / `parseMessage` |
| Persistance du retrait | « enregistre le retrait : la liste affiche ensuite Retirée » | `setStatus` qui renverrait le bon DTO sans faire l'`UPDATE` |
| Retrait refusé si traité (REJECTED, WITHDRAWN) | « refuse de retirer une candidature non retenue / déjà retirée (409) et laisse son statut inchangé » (×2) | Condition « traitée » réduite à SELECTED |
| Candidature d'autrui intacte | « ne modifie pas la candidature d'un autre étudiant quand le retrait est refusé (404) » | Contrôle du propriétaire supprimé |
| Retrait : inexistant / id invalide | « répond 404 pour une candidature inexistante », « refuse un identifiant invalide (400) » | `findById` non contrôlé, `parseApplicationId` supprimé |
| Droits sur GET et retrait | « %s refuse une requête sans session (401) » (×2), « refuse à %s de consulter ou retirer (403) » (×2) | `authorize(isStudent)` déplacé sur le seul POST |
| Tous les statuts exposés | « expose En cours et Retirée », « expose Retenue » | Mapper qui écrase ou traduit mal le statut |
| Liste vide | « renvoie une liste vide pour un étudiant sans candidature » | Requête sans filtre `student_id` (renverrait celles des autres) |
| Offre visée | « indique l'offre visée (titre et entreprise) » | Jointure `offers`/`companies` retirée du `SELECT` |

### Preuve que les tests détectent un défaut — mutations temporaires

Pour trois tests, j'ai **injecté volontairement le défaut** dans `applications.service.ts`, lancé
la suite, puis restauré le fichier (`git checkout -- <fichier>`, vérifié par `git status` : seul
le fichier de tests reste modifié). Aucun risque pour le projet.

| Mutation injectée | Tests en échec | Ancien test seul l'aurait-il vu ? |
|---|---|---|
| M1 — suppression de `\|\| application.student_id !== student.id` (retrait) | 2 échecs (l'ancien + le nouveau « ne modifie pas… ») | Oui |
| M2 — `offerStatus !== "PUBLISHED"` → `offerStatus === "SUBMITTED"` | **3 échecs, tous nouveaux** (PENDING, ASSIGNED, ARCHIVED) | **Non** : passait au vert |
| M3 — `status !== "IN_PROGRESS"` → `status === "SELECTED"` (retrait) | **2 échecs, tous nouveaux** (REJECTED, WITHDRAWN) | **Non** : passait au vert |

→ M2 et M3 montrent concrètement que l'ancienne suite, entièrement verte, laissait passer de vrais
bugs métier.

### Commandes lancées et résultats

| Commande | Résultat |
|---|---|
| `npx vitest run tests/applications.test.ts` (backend) | 39 / 39 verts |
| `npm run lint` | oxlint `--deny-warnings` back + front : **0 avertissement, 0 erreur** |
| `npm run typecheck` | `tsc` back + front : **0 erreur** |
| `npm run test` | backend **151 / 151** (127 avant), frontend **55 / 55** |
| `npm run build` | backend `tsc` + `vite build` : **OK** |
| `npm run check` | **exit 0** |

### Limites et vérifications non automatisées

- **Concurrence** : la règle « une seule candidature en cours par offre » est un *check-then-insert*
  dans le service, sans contrainte `UNIQUE` partielle en base. Ce n'est pas testable avec Supertest
  séquentiel. `better-sqlite3` est synchrone et le serveur est mono-processus, donc le risque est
  faible aujourd'hui. Signalé, non corrigé (cela demanderait une migration, hors portée).
- **Intégration front↔back** : les tests front simulent `fetch`. Le parcours réel a été vérifié
  manuellement en semaine 2 (`docs/semaine-2/cas-de-tests-e2e.md`), pas rejoué cette semaine.
- Les mutations ne couvrent que 3 défauts choisis par moi. Ce n'est pas une campagne de mutation
  testing complète.

---

## 4. Audit des guides à la lumière de Web 2

**Sources Web 2 utilisées** (BINV2150-A, Javascript avancé) : ma synthèse des slides
(`synthese-js2.md`, parties « API REST », « Middlewares », « Sécurisation », « Architecture
complète ») et le projet fil rouge **MiamMiam** fourni au cours (README : structure
`models/ services/ mappers/ controllers/ utils/guards.ts http/`). Je n'ai retenu que les attentes
que je retrouve dans ces supports.

**Guides examinés (lus en entier)** : `AGENTS.md`, `docs/architecture.md`,
`.github/pull_request_template.md`, + l'en-tête de `backend/API.md`.

| Attente / convention Web 2 (source) | Guide examiné (fichier › passage) | Correspondance | Écart ou ajout proposé |
|---|---|---|---|
| Serveur REST en couches **Controller → Service → données**, mappers DBO ↔ métier ↔ DTO (synthèse « Middlewares » ; README MiamMiam « Flux d'une requête ») | `AGENTS.md` › « controller → service → repository → base, puis mapper » ; `architecture.md` › schéma Backend | **Oui** | La couche `repositories/` en plus est cohérente (SQL au lieu de fichiers JSON) |
| Valider `req.body` reçu en `unknown` avec des **type guards** `isXxx()` (synthèse « Backend JWT » `const credentials: unknown = req.body` ; MiamMiam `utils/guards.ts`) | `AGENTS.md` › « Validation par type guards écrits à la main » ; front `utils/guards.ts` | **Partielle** | Côté back, le guide ne parle que des « paramètres de requête » (`INVALID_QUERY`). Ajouter : *« le corps est lu comme `unknown` et validé dans le controller → `HttpError(400, "INVALID_BODY")` »* (pratique réelle de `applications.controller.ts`, mais non écrite) |
| **Codes HTTP** : 201 Created pour un POST qui crée, 400 / 401 / 403 / 404 / 409 (synthèse « Réponses » + antisèche) | `AGENTS.md` : aucune mention ; `architecture.md` › middlewares « (401) », « (403) » ; `API.md` › tableau des erreurs | **Partielle** | Ajouter dans `AGENTS.md` un tableau court : quand utiliser 201, 400, 404 (y compris « ressource d'autrui » → 404 plutôt que 403, choix du projet), 409 (conflit d'état métier) |
| **Ressources au pluriel**, méthode HTTP selon l'action (GET lire, POST créer, PATCH modifier partiellement, DELETE) (synthèse « API REST ») | Aucun guide n'en parle. Pratique : `/applications`, mais retrait = `POST /applications/:id/withdrawal` | **Non** (absent) | Documenter la convention de nommage. Le retrait n'est **pas** une contradiction si on l'assume comme sous-ressource « action » créée par POST, mais Web 2 enseignerait plutôt `PATCH /applications/:id {status}`. Le guide devrait trancher pour que l'agent ne réinvente pas un style à chaque séance |
| Tester les routes avec des **fichiers `.http`** REST Client (synthèse « Tests REST Client » ; dossier `http/` de MiamMiam) | `AGENTS.md` › Méthode §4 « mettre à jour `backend/API.md` et les fichiers `backend/http/*.http` » ; PR template | **Oui** | — |
| **Autorisation côté serveur** par middleware (`authorize`, `isAdmin`), JWT dans l'en-tête `Authorization` (synthèse « Sécurisation ») | `AGENTS.md` › « Les contrôles de droits sont toujours côté serveur » ; `architecture.md` › « Identification et droits » | **Oui** | `architecture.md` précise « sans préfixe `Bearer` », comme dans la synthèse (`headers: { Authorization: token }`) |
| **Secret JWT pas sur Git** (synthèse : « `jwtSecret` à garder secret, PAS sur git ») | `AGENTS.md` › Portée « Ne jamais committer de secret (`backend/.env` est ignoré) » | **Oui** | — |
| Mots de passe **hachés (bcrypt)** (synthèse « Chiffrement ») | — (le projet n'a pas de mot de passe : RG-14, lien magique) | **Non applicable** | Rien à ajouter ; le noter éviterait qu'un agent ajoute bcrypt « par réflexe » |
| **Middleware d'erreur** centralisé à 4 arguments (synthèse « Middlewares ») | `architecture.md` › « `throw new HttpError(...)` … `errorHandler` » | **Oui** | Absent d'`AGENTS.md` (seulement dans `architecture.md`) : ajouter un lien vers `architecture.md` |
| Front : `fetch` dans `useEffect` ou un gestionnaire d'événement, pas dans le corps du composant (synthèse « Fetch, Promesses & useEffect ») | `AGENTS.md` › « `pages/` → `hooks/` → `services/` → `fetch` » | **Oui** (plus strict : fetch isolé dans `services/`) | — |
| Front : architecture **MVVM** (plan du cours Web 2 2026, partie 3) | `AGENTS.md` › couches front | **Partielle** | Le découpage pages / hooks / services est de l'esprit MVVM, mais le mot n'apparaît pas. Préciser la correspondance (page = vue, hook = view-model) aiderait l'agent et l'oral |
| Front : **CORS / proxy** pour joindre l'API (synthèse « Sécurité transverse » ; plan S21-S24) | `API.md` › « le proxy Vite transmet sans le préfixe `/api` » | **Oui** | Absent d'`AGENTS.md` : une ligne éviterait qu'un agent ajoute `cors` inutilement |
| Lint (`npm run lint`) dans les scripts (synthèse « Architecture complète ») | `AGENTS.md` › `npm run check` = lint + typecheck + test + build | **Oui** | — |
| **Ergonomie / accessibilité** (BINV2150-B, 20 % de l'UE) | Aucun guide n'en parle | **Non** | Je n'ai pas les supports d'ergonomie sous la main : **je ne déduis pas** de règles précises. Recommandation : ajouter une section dès que les consignes du cours d'ergonomie sont retrouvées |

### Rapport — synthèse de l'audit

- **Ce qui correspond** : architecture en couches, autorisation côté serveur, secrets hors Git,
  fichiers `.http`, lint, découpage front. Les guides du dépôt sont alignés avec Web 2 sur la
  structure du code.
- **Ce qui manque** : les guides disent *où* mettre le code, pas *comment répondre en HTTP*.
  Pas de règle sur les codes de statut ni sur le style des routes, et la validation du corps
  n'est pas mentionnée. C'est exactement là que l'agent a dû décider seul en semaine 2 (404 vs 403
  pour la candidature d'autrui, `POST …/withdrawal`).
- **Contradiction** : aucune trouvée. Le `POST …/withdrawal` est un écart de style par rapport à
  Web 2, non interdit par un guide.
- **Ajouts proposés pour `AGENTS.md`** (non appliqués : la fiche demande un audit, pas une
  correction) :
  1. une section « Réponses HTTP » (201 / 400 / 401 / 403 / 404 / 409 + choix 404 pour une ressource d'autrui) ;
  2. « le corps de requête est `unknown`, validé dans le controller → `INVALID_BODY` » ;
  3. une convention de nommage des routes (pluriel, méthode selon l'action, comment exprimer une transition de statut) ;
  4. une règle de test explicite : *« un test d'erreur vérifie aussi que l'état n'a pas changé »* (c'est le manque le plus récurrent de la matrice §2) ;
  5. un lien vers `docs/architecture.md` pour `HttpError` / `errorHandler` et le proxy Vite.

---

## 5. Optionnel — senseur d'architecture

**Règle vérifiée** : *les dépendances entre couches backend vont dans un seul sens.*
`controllers` → `services` → `repositories`. Un service n'importe jamais `express`, un controller
n'importe jamais un repository ni la base. Côté front, seuls `src/services/` appellent `fetch`.

**Pourquoi celle-ci** : c'est la règle la plus répétée dans les guides (`AGENTS.md`,
`architecture.md`). C'est aussi la plus tentante à violer pour un agent pressé : appeler
`repository.findById` directement dans un controller « pour aller plus vite ». Ça casserait le
contrôle des droits fait dans le service. Aujourd'hui **aucun senseur ne la vérifie** : seule la
revue humaine la protège.

| Aspect | Proposition |
|---|---|
| Quand | Un test Vitest `backend/tests/architecture.test.ts`, donc exécuté par `npm run check` (et par une CI si elle est ajoutée) |
| Données examinées | Le texte des fichiers `src/services/*.ts`, `src/controllers/*.ts`, `frontend/src/**/*.tsx` (lecture `fs` + expression régulière sur les lignes `import … from "…"`) |
| Résultat | Échec avec la liste `fichier → import interdit`, par exemple `controllers/offers.controller.ts importe ../repositories/offers.repository.ts` |
| Exemple de violation | `import { createOffersRepository } from "../repositories/offers.repository.ts"` dans un controller ; `import type { Request } from "express"` dans un service ; `fetch("/api/offers")` dans `pages/OffersPage.tsx` |
| État actuel vérifié | `grep` lancé pendant la séance : **0 violation** (aucun service n'importe `express`, aucun controller n'importe `repositories/`, aucun `fetch(` hors `frontend/src/services/`). Le senseur passerait donc au vert dès sa création |
| Faux positifs / limites | Les imports de **types** (`import type { ApplicationsService }` dans un controller) sont légitimes : la règle doit viser les repositories et la base, pas les types de service. Une regex ne voit ni les imports dynamiques ni un re-export via un fichier `index.ts`. Une vraie analyse demanderait `dependency-cruiser` ou une règle oxlint `no-restricted-imports`, donc une dépendance ou une configuration en plus |
| Coût | ~30 lignes de test, < 50 ms d'exécution. Coût principal : maintenir la liste des exceptions (par ex. `services/*` importe légitimement `utils/httpError.ts`) |

Non implémenté (la fiche le permet) : la proposition est vérifiable telle quelle par les `grep`
ci-dessus.

---

## Crédits IA

| Membre | Outil | Consommation (début → fin de séance) |
|---|---|---|
| Idris | Claude Code | *à compléter par Idris* |
