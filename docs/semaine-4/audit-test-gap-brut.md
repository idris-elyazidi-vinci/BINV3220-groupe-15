# Rapport brut du skill test-gap-audit (non retouché)

> Produit par `/test-gap-audit` dans une session Claude Code neuve (modèle Sonnet, outils en lecture seule : Read, Grep, Glob, `git status`, `vitest run`), le 19/11/2026. Les constats sont **vérifiés à la main** dans `docs/semaine-4.md` : ce fichier est la sortie de l’agent, pas une preuve.
>
> Demande : « /test-gap-audit les tests des candidatures (EF-32 et EF-33). Décisions du binôme déjà prises : une seule candidature « En cours » par étudiant et par offre (409 ALREADY_APPLIED) ; re-candidater est autorisé après un retrait ou un refus ; seul l’étudiant propriétaire peut voir ou retirer sa candidature (404 sinon). Ignore les fichiers en cours de modification sur les offres : hors périmètre. »

---

**Audit des tests de candidatures (EF-32, EF-33)**

Aucun code modifié. J'ai relu le contrôleur, le service, le dépôt SQL, la migration, `backend/API.md`, `backend/tests/applications.test.ts` et `frontend/tests/ApplicationsPage.test.tsx`. Les tests existants passent. Aucun P0. Les décisions du binôme (une seule candidature `IN_PROGRESS` par offre, re-candidature après retrait ou refus, 404 pour un non-propriétaire) sont codées dans `backend/src/services/applications.service.ts`. Le backend les teste déjà presque toutes, il manque surtout des tests côté front et quelques cas limites.

**P1 : la page « Mes candidatures » ne teste pas le comportement observable du retrait (front)**

- **Manque :** après un retrait, rien ne vérifie que la liste est rechargée et affiche « Retirée » sans bouton. Rien ne vérifie non plus l'affichage d'une erreur 409 ou 404 de l'API.
- **Couverture actuelle :** le test du retrait vérifie seulement que `fetch` a été appelé avec `POST` (`frontend/tests/ApplicationsPage.test.tsx:61`). Si `.then(() => reload())` (`frontend/src/pages/ApplicationsPage.tsx:24`) disparaissait, le test resterait vert.
- **Preuve :** le code d'erreur (`ApplicationsPage.tsx:29`, `setActionError`) et le `onUnauthorized` du retrait n'apparaissent dans aucun test (`grep` visuel du fichier de test, 4 tests seulement).
- **Test suggéré (Testing Library, même fichier) :**
  1. `stubFetch` renvoie d'abord la liste avec la candidature 1 « En cours », puis, après le POST, la même liste avec le statut `WITHDRAWN`. Vérifier que « Retirée » est affiché et qu'il n'y a plus de bouton « Retirer ».
  2. Le POST renvoie 409 avec un message d'erreur. Vérifier que le message est affiché et que la liste reste inchangée.
  3. Le POST renvoie 401. Vérifier que `onUnauthorized` est appelé.

**P2 : l'ordre « de la plus récente à la plus ancienne » n'est jamais vérifié (EF-33)**

- **Manque :** la promesse de tri est dans `backend/API.md:181` et dans `ORDER BY a.applied_at DESC` (`backend/src/repositories/applications.repository.ts:38`).
- **Couverture actuelle :** le test d'Inès compare des identifiants d'offre après `.sort()` (`backend/tests/applications.test.ts:102`), donc l'ordre est ignoré.
- **Test suggéré (Supertest) :** `GET /applications` pour Inès. Vérifier `body.map(a => a.id)` égal à `[APPLICATION.INES_FLEET_APP, APPLICATION.INES_BILLING_API]`, dans l'ordre des `applied_at` du seed (`backend/src/db/seed/offersData.ts`). Avant d'écrire le test, relire ces dates pour confirmer lequel est le plus récent.

**P2 : la re-candidature après un refus n'est pas testée (décision du binôme)**

- **Manque :** seul le cas « après un retrait » est testé (`backend/tests/applications.test.ts:88` et `:142`). Le cas `REJECTED` est une décision explicite, mais aucun test ne le couvre.
- **Couverture actuelle :** la seule candidature `REJECTED` que j'ai vue est Léa sur `CLOUD_MIGRATION` (`backend/tests/applications.test.ts:225`). Cette offre est « attribuée » (`:164`), donc une nouvelle candidature donnerait `OFFER_NOT_PUBLISHED`. Je n'ai pas vérifié si le seed contient un refus sur une offre publiée.
- **Confiance :** moyenne.
- **Test suggéré :** si le seed n'a pas de refus sur une offre publiée, en ajouter un, ou passer le statut à `REJECTED` en SQL dans le test (le helper `createTestApp` donne accès à la base, à vérifier). Ensuite, `POST /applications` renvoie 201 et la liste contient deux candidatures pour cette offre : l'ancienne reste `REJECTED`, la nouvelle est `IN_PROGRESS`.

**P2 : après une re-candidature, l'historique n'est pas vérifié**

- **Manque :** après retrait puis nouvelle candidature, rien ne prouve que l'ancienne ligne reste `WITHDRAWN` et qu'une deuxième apparaît. Un correctif qui réutiliserait l'ancienne ligne passerait les tests.
- **Couverture actuelle :** `backend/tests/applications.test.ts:142` vérifie seulement le 201 et le statut de la réponse.
- **Test suggéré :** étendre ce test avec un `GET /applications`. Vérifier deux entrées pour `FLEET_APP` (une `WITHDRAWN`, une `IN_PROGRESS`) et qu'un troisième `POST` renvoie 409 `ALREADY_APPLIED`.

**P3 : cas limites de validation non testés**

- **Message vide ou composé d'espaces :** il devrait donner `message: null` (`backend/src/controllers/applications.controller.ts:28`). Il n'est pas testé. Le message est aussi rogné (`trim`) : testé nulle part.
- **Limite de 1000 caractères :** seul 1001 est testé (`backend/tests/applications.test.ts:205`). Ajouter `"x".repeat(1000)` qui doit renvoyer 201.
- **`offerId` invalide :** `0`, `-1` et `null` ne sont pas testés (`controllers/applications.controller.ts:13`). La liste actuelle va de `:201` à `:205`.
- **Identifiant du retrait :** seul `"abc"` est testé (`backend/tests/applications.test.ts:259`). Ajouter `0`, `-1` et `1.5` (400 `INVALID_PARAM`).
- **Niveau :** ces cas rentrent dans les `it.each` existants.

**P3 : la page ne teste ni l'erreur de chargement, ni l'état désactivé, ni le 401**

- **Manque :** la page affiche `ErrorState` si le chargement échoue, désactive le bouton pendant le retrait (`ApplicationTable.tsx`, `disabled={pendingId === application.id}`) et appelle `onUnauthorized` sur un 401 au chargement (`frontend/src/hooks/useApplications.ts:32`). Aucun test ne les couvre.
- **Confiance :** haute pour le manque.
- **Tests suggérés :** `/api/applications` renvoie 500 et on vérifie le message d'erreur. Il renvoie 401 et on vérifie `onUnauthorized`.

**P3 (confiance basse) : la règle « une seule candidature en cours » n'est garantie que par le code**

- **Manque :** la migration n'a pas d'index unique partiel sur `(student_id, offer_id) WHERE status = 'IN_PROGRESS'` (`applications` est défini dans `backend/src/db/migrations/*.sql`, autour des lignes 124 à 134).
- **Risque :** `better-sqlite3` est synchrone, donc la vérification puis l'insertion ne peuvent pas s'entrecroiser dans un seul processus. Un test de concurrence ne se justifie pas. Si vous ajoutez un jour l'index, un test de contrainte au niveau du dépôt serait utile.

**Plan de tests, dans l'ordre**
1. Front : retrait suivi du rechargement, erreur 409 affichée, 401 sur retrait (P1).
2. Backend : ordre de la liste (P2).
3. Backend : re-candidature après `REJECTED`, avec historique de deux lignes (P2).
4. Backend : validation du message (vide, 1000 caractères) et des identifiants `0`, `-1` (P3).
5. Front : erreur de chargement et bouton désactivé pendant le retrait (P3).

Selon `AGENTS.md`, ces tests sont à écrire et exécuter d'abord, à présenter, puis à faire valider avant toute modification du code applicatif. Ces ajouts ne devraient pas toucher au code applicatif.

**Couverture existante à conserver**
- Accès réservé aux étudiants : 401 et 403 sur les trois routes (`backend/tests/applications.test.ts:267` à `:291`).
- 404 pour un non-propriétaire, avec vérification que la candidature n'a pas bougé (`:238`).
- `studentId` du corps ignoré (`:187`).
- Offres non publiées (pending, attribuée, archivée) sans création de ligne (`:161`).
- Retrait refusé pour `REJECTED` et `WITHDRAWN` avec statut inchangé (`:224`).

**Checks exécutés**
- `npx vitest run --root backend tests/applications.test.ts` : 1 fichier, 39 tests passés.
- `cd frontend && npx vitest run tests/ApplicationsPage.test.tsx` : 1 fichier, 4 tests passés.
- Je n'ai pas lancé `scripts/coverage_map.py`. Le périmètre étant restreint, j'ai relu les fichiers directement.

**Non testé ou non inspecté**
- Les `type guards` de `frontend/src/utils/guards.ts` pour les candidatures et `frontend/src/services/applications.service.ts` : non lus.
- Le bouton « Candidater » dans `OffersPage` (`frontend/src/pages/OffersPage.tsx:105`) et `frontend/tests/OffersPage.test.tsx` : exclus, car en cours de modification. Cela signifie que le flux de candidature côté interface n'est pas audité ici.
- Je n'ai pas lancé `npm run check` ni testé dans le navigateur.

**Hypothèses**
- « Refus » correspond au statut `REJECTED`.