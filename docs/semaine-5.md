# Semaine 5 (fiche « Semaine 10 ») — MCP et tests end-to-end avec Playwright

> Groupe 15 (solo). Agent : **Claude Code** au lieu de GitHub Copilot, comme pour les semaines
> précédentes (voir §0). Conversations dans [`semaine-5/`](semaine-5/), bilan dans
> [`semaine-5/bilan.md`](semaine-5/bilan.md), bilan de tout le projet dans
> [`bilan-global.md`](bilan-global.md).

## 0. Adaptations Copilot → Claude Code

| Fiche (Copilot) | Ce que nous avons fait (Claude Code) |
|---|---|
| `.mcp.json` avec `"type": "http"`, `"url"` et `"tools": ["*"]` | Même fichier, **sans la clé `tools`** : avec elle, Claude Code **ignore tout le fichier sans message d'erreur** (constaté, voir §2) |
| « MCP : List Servers » dans VS Code | Événement `init` de la session : `mcp_servers: [{name: "playwright", status: "connected"}]` et la liste des 25 outils `mcp__playwright__browser_*` |
| Conversation Copilot exportée (Copy All) | Chaque étape lancée dans une **session neuve** (`claude -p … --output-format stream-json`), convertie en Markdown sans résumé |
| La sandbox Copilot bloque le navigateur de Playwright Test | Pas de blocage dans Claude Code ; nous avons quand même relancé **nous-mêmes** les tests (§3) |

## 1. Scénarios

Fichier : [`e2e/recherche-offres/scenarios.md`](../e2e/recherche-offres/scenarios.md), écrit et
commité **avant** toute exécution par l'agent (commit `539e258`).

| N° | Scénario | Résultat attendu |
|---|---|---|
| 1 | Étudiant Lucas Dupont, page Offres, saisit `API` **en majuscules** | « 1 offre » ; une seule ligne « API REST de facturation » (Orbis, Publiée) ; « Numérisation d'archives papier » **absente** |
| 2 | Même départ, saisit `blockchain` | « Aucune offre ne correspond à la recherche. », pas de tableau ; après avoir vidé le champ, les 4 offres reviennent |

**Pourquoi ces deux cas.**
- Le **scénario 1** vérifie trois règles de la semaine 9 en un seul geste : le filtrage sur le
  titre, l'insensibilité à la casse et le respect de la visibilité. Le piège est voulu :
  « pap**i**er » contient « api », mais l'offre est archivée et ne doit pas apparaître pour un
  étudiant. C'est exactement l'attente que nous avions ratée en semaine 4.
- Le **scénario 2** vérifie le message propre à la recherche, distinct de « Aucune offre à
  afficher. », et le retour à la liste complète.
- L'état initial est précis : base fraîche (`npm run db:reset`), rôle, 4 offres publiées
  nommées. Les deux scénarios sont en **lecture seule**, donc rejouables dans n'importe quel ordre.

## 2. Exploration avec Playwright MCP

- **Serveur** : `npx -y @playwright/mcp@latest --isolated --port 8931`, lancé par nous dans un
  terminal, en dehors de l'agent. Il écoute sur `localhost` uniquement. Il a été arrêté après
  l'exploration.
- **Client** : une session Claude Code neuve, avec **uniquement** les outils Playwright et `Read`.
  `Edit`, `Write` et `Bash` étaient interdits, ainsi que `browser_evaluate` et
  `browser_run_code_unsafe` (exécution de JavaScript arbitraire). L'agent ne pouvait donc **ni
  modifier le code ni générer de script**, et le prompt de la fiche le lui demandait aussi.

### Essai 1 : échec de connexion, documenté ([conversation 2](semaine-5/conversation-2-mcp-essai-1-echec.md))

Avec le `.mcp.json` de la fiche (clé `"tools": ["*"]`), la session a démarré avec
`mcp_servers: []`. L'agent a cherché les outils (`ToolSearch`), n'a rien trouvé, puis a
répondu **honnêtement** : « Je n'ai pas exécuté le scénario 1 : les outils du serveur
Playwright MCP ne sont pas disponibles ». Il **n'a pas inventé de résultat**.

Diagnostic de notre côté : avec le même fichier **sans** `tools`, `playwright` est
`connected` (25 outils) ; avec `tools`, la liste reste vide. C'est donc une différence de
format entre Copilot et Claude Code, pas un problème de serveur.

### Essai 2 : scénario 1 exécuté ([conversation 3](semaine-5/conversation-3-mcp-scenario-1.md))

**Résultat : scénario 1 réussi, aucun écart sur le résultat attendu.**

Appels d'outils observés (11 appels MCP au total ; extrait) :

| # | Outil | Ce que l'agent a envoyé | Ce que l'outil a renvoyé |
|---|---|---|---|
| 1 | `browser_navigate` | `{"url": "http://localhost:5173"}` | Le code Playwright exécuté (`await page.goto(...)`), l'URL et le titre « Gesta » |
| 2 | `browser_snapshot` | — | L'**arbre d'accessibilité** de la page (YAML) avec des références : `heading "Connexion de démonstration"`, boutons des utilisateurs… |
| 3 | `browser_click` | `{"target": "e30", "element": "Bouton Lucas Dupont"}` | `await page.getByRole('button', { name: 'Lucas Dupont' }).click();` |
| 7 | `browser_type` | `{"target": "e143", "text": "API"}` | `await page.getByRole('searchbox', { name: 'Rechercher par titre' }).fill('API');` |
| 8 | `browser_wait_for` | `{"text": "1 offre"}` | « Waited for 1 offre » |
| 10 | `browser_network_requests` | filtre `/api/.*offers` | `GET /api/offers => 200` puis `GET /api/offers?q=API => 200` |

Observations rapportées et **vérifiées par nous dans la trace** (pas seulement dans le résumé
final) : « 4 offres » avant la recherche, puis « 1 offre » avec la seule ligne « API REST de
facturation », sans l'offre archivée, et aucune erreur dans la console. L'appel réseau
`?q=API` montre que le filtrage se fait **côté serveur**, pas seulement à l'affichage.

Écarts signalés par l'agent lui-même :
- il n'a pas pu vérifier que la base était fraîche, car il n'avait pas de shell. Nous l'avions
  recréée juste avant (`npm run db:reset`) ;
- « Déjà candidaté » sur l'offre de gestion de flotte : nous avons vérifié que cela vient du
  seed (Lucas a une candidature en cours sur cette offre, voir `docs/seed.md`), ce n'est pas un
  reste d'essai.

Les captures et snapshots écrits par le serveur dans `.playwright-mcp/` ne sont pas commités
(ajoutés au `.gitignore`).

## 3. Tests automatisés avec Playwright Test (sans MCP)

**Installation** : `npm init playwright@latest -- --quiet --browser=chromium --lang=ts
--no-examples`. Cette commande ajoute `@playwright/test` et `@types/node` en devDependencies
racine, les règles du `.gitignore` et `playwright.config.ts` à la racine.

**Génération** ([conversation 4](semaine-5/conversation-4-generation-tests-playwright.md)) :
une session neuve, **sans serveur MCP** (`--strict-mcp-config`), avec le prompt de la fiche
précédé d'une demande de vérification de la config.

### Fichiers créés ou modifiés

| Fichier | Contenu |
|---|---|
| `playwright.config.ts` | `testDir: "./e2e"`, `baseURL` = frontend (5173 ; le modèle généré proposait 3000, qui est le port de l'API), `webServer` qui démarre **l'API sur une base dédiée** `backend/data/gesta-e2e.db` recréée depuis le seed, puis le frontend avec le proxy vers ce port |
| `e2e/recherche-offres/recherche-offres.spec.ts` | 2 tests, numéro du scénario dans le nom |
| `package.json` | script `test:e2e` (`playwright test`), ajouté par nous |
| `.gitignore` | rapports Playwright + `/.playwright-mcp/` |

**Données maîtrisées** : chaque lancement repart du seed dans une base séparée. La base de
développement n'est jamais touchée, et les tests ne dépendent ni de son état ni de leur ordre.
Avec `reuseExistingServer: false`, Playwright refuse de réutiliser un serveur déjà lancé, qui
pourrait servir une autre base. Il faut donc arrêter `npm run dev` avant `npm run test:e2e`.

### Principales assertions (relues par nous)

- **Scénario 1** : `"4 offres"` visible et 4 lignes → saisie `API` → `"1 offre"`,
  `toHaveCount(1)`, 1re cellule = `"API REST de facturation"`, 2e = `"Orbis"`, ligne contient
  `"Publiée"`, `getByText("Numérisation d'archives papier")` → `toHaveCount(0)`.
- **Scénario 2** : `"Aucune offre ne correspond à la recherche."` visible, `table` →
  `toHaveCount(0)`, `"Aucune offre à afficher."` absent → champ vidé → `"4 offres"`, 4 lignes
  et chacun des 4 titres publiés visible.
- **Sélecteurs** : uniquement des rôles et des noms accessibles (`button`, `link` dans
  `navigation "Navigation principale"`, `searchbox "Rechercher par titre"`, `table`, `row`,
  `cell`). Aucune classe CSS.
- **Attente** : aucun `waitForTimeout`. Les `expect` de Playwright réessaient jusqu'à ce que la
  réponse arrive, ce qui couvre le délai de frappe de 300 ms.

### Exécutions

| Exécution | Lancée par | Résultat |
|---|---|---|
| Agent, ports 5174/3001 (notre `npm run dev` occupait 5173/3000) | agent | 2 passed |
| Agent, `--repeat-each=5` | agent | 10 passed |
| **Nous, exécution 1** (ports par défaut, `npx playwright test`) | nous | **2 passed (2.8s)** |
| **Nous, exécution 2** | nous | **2 passed (2.7s)**, tests passés dans l'ordre inverse |
| `npm run check` | nous | **vert** : lint + typecheck + backend **166/166** + frontend **59/59** + build |

`npm run check` **ne lance pas** les tests E2E : ils ont besoin de serveurs et d'un navigateur.
Leur exécution reste donc explicite (`npm run test:e2e`). De même, `npm run typecheck` ne
couvre pas `e2e/`, qui est hors des workspaces. Playwright compile le TypeScript au lancement.

## 4. Vérification : le test détecte-t-il un vrai défaut ?

**Défaut temporaire** dans `backend/src/repositories/offers.repository.ts` : la recherche est
désactivée, la condition devient toujours vraie.

```diff
-      AND (@pattern IS NULL OR o.title LIKE @pattern ESCAPE '\\')
+      AND (@pattern IS NULL OR 1 = 1 OR o.title LIKE @pattern ESCAPE '\\')
```

| | Résultat |
|---|---|
| Avec le défaut | **2 failed**. Scénario 1 : `expect(page.getByText("1 offre")).toBeVisible()` → *element(s) not found* (les 4 offres restent). Scénario 2 : le message « Aucune offre ne correspond à la recherche. » est introuvable |
| Après `git checkout` du fichier (diff vide) | **2 passed**, deux fois de suite |

Les échecs viennent bien **du défaut** : les serveurs ont démarré et la connexion de Lucas a
réussi. Ce sont les assertions sur le résultat de la recherche qui échouent. Le défaut n'est
pas dans la PR (`git diff` vide sur ce fichier avant commit).

**Incident pendant la vérification, à noter** : la première relance après restauration a
échoué avec `http://localhost:3000/health is already used`. Notre `npm run dev` du début
n'était pas complètement arrêté. Nous avions tué le serveur API, mais son **`tsx watch`
parent** l'a relancé dès qu'il a vu le repository modifié. Nous avons identifié le processus
(`ps` : cwd `backend`, parent = le watcher), arrêté tout l'arbre, puis relancé : 2 passed,
deux fois. Même leçon qu'en semaine 2 : un résultat inattendu vient souvent de
l'**environnement** (serveurs en double), pas du code.

## 5. Comparaison MCP ↔ Playwright Test

**1. Que permet Playwright MCP dans la conversation avec l'agent ? Quelle action précise
est passée par un outil MCP ?**
L'agent peut **voir et piloter** l'application réelle pendant la conversation : il lit la page
sous forme d'arbre d'accessibilité (`browser_snapshot`), clique et tape en désignant les
éléments par leur référence, attend un texte et inspecte le réseau et la console. Action
précise : la saisie de `API` dans le champ de recherche est passée par `browser_type`
(`target: "e143"`). Le serveur l'a traduite en
`page.getByRole('searchbox', { name: 'Rechercher par titre' }).fill('API')` et a renvoyé ce
code à l'agent.

**2. Qu'apportent les scripts Playwright Test que le compte rendu d'un test par MCP
n'apporte pas ?**
- La **reproductibilité** : le même script donne le même verdict à chaque fois. Un compte rendu
  MCP est une interprétation probabiliste de l'agent, à revérifier.
- Le **versionnement** : les tests sont relus en PR et vivent avec le code.
- Un **verdict binaire** fondé sur des assertions écrites, plutôt qu'un résumé en langage
  naturel.
- Le **coût et la vitesse** : ~3 s, aucun token. L'exploration MCP a coûté ~357 k tokens de
  contexte pour un seul scénario.
- La **détection de régression** : la mutation du §4 est attrapée sans agent, et ces tests
  pourraient tourner en CI.

**3. Quand préférer l'un ou l'autre ?**
- **MCP** pour **explorer** : comprendre une page qu'on ne connaît pas, reproduire un bug
  signalé, faire une première vérification d'une fonctionnalité qui vient d'être codée, ou
  récupérer les bons sélecteurs accessibles avant d'écrire un test. C'est aussi utile pour
  diagnostiquer, puisque l'agent voit le réseau et la console.
- **Playwright Test** pour **garantir** : protéger un comportement stable contre les
  régressions, avant chaque commit ou en CI. On ne veut pas dépendre d'un agent (coût,
  variabilité) pour dire si la recherche marche toujours.

En bref : **MCP permet à l'agent d'interagir avec l'application, Playwright Test garde des
vérifications exécutables sans l'agent.** Dans notre cas, le snapshot MCP a montré les rôles
(`searchbox "Rechercher par titre"`, `navigation "Navigation principale"`) que les tests
utilisent ensuite comme sélecteurs.

## Crédits IA

Consommation relevée dans les journaux de session (abonnement Claude, donc pas de crédits
débités en euros ; « équivalent API » = `total_cost_usd` des sorties `stream-json`) :

| Session | Modèle | Tokens d'entrée (contexte, cache compris) | Tokens de sortie | Équivalent API |
|---|---|---|---|---|
| Conversation 2 — MCP essai 1 (échec) | Opus 5.5 | 87 355 | 1 178 | 0,21 $ |
| Conversation 3 — MCP scénario 1 | Opus 5.5 | 356 891 | 2 263 | 0,36 $ |
| Conversation 4 — génération des tests | Opus 5.5 | 434 647 | 8 714 | 0,58 $ |
| Conversation 1 — pilotage (MooVin, scénarios, vérifications, doc), au moment de la rédaction | Opus 5.5 | ~14,8 M (dont ~14,4 M relus depuis le cache) | ~61 k | — |

Groupe 15 en solo : pas de binôme, donc pas d'autres crédits à déclarer. Comme en semaine 4,
c'est le **contexte relu** à chaque appel d'outil qui pèse, pas le texte produit. Les trois
sous-sessions courtes ont coûté peu, la session de pilotage longue beaucoup.
