# Conversation 3 — Playwright MCP, exécution du scénario 1

Session Claude Code **neuve**, lancée en mode non interactif :

```bash
claude -p "<prompt de la fiche>" --mcp-config .mcp.json --strict-mcp-config --allowedTools "mcp__playwright__*" "Read" --disallowedTools "Edit" "Write" "Bash" "mcp__playwright__browser_run_code_unsafe" "mcp__playwright__browser_evaluate" --output-format stream-json --verbose
```

**Init** — modèle `claude-opus-5-5`, serveurs MCP : `[{'name': 'playwright', 'status': 'connected', 'source': 'dynamic'}]`, 23 outils MCP chargés.

**Appel d'outil** `Read`

````json
{
  "file_path": "/Users/idris/etudes/ia-agentique/BINV3220-groupe-15/e2e/recherche-offres/scenarios.md"
}
````

Résultat :

````
1	# Scénarios end-to-end — recherche d'offres par titre (EF-30)
2	
3	Règles de la semaine 9 (voir [`docs/semaine-4.md`](../../docs/semaine-4.md) §2-3) : la recherche
4	porte sur le **titre**, est insensible à la casse, ignore les espaces autour, s'**ajoute** à la
5	visibilité du profil (un étudiant ne voit que les offres publiées) et affiche
6	« Aucune offre ne correspond à la recherche. » quand rien ne correspond.
7	
8	## État initial commun
9	
10	- Base de démonstration fraîche : `npm run db:reset`, puis `npm run dev`
11	  (API sur http://localhost:3000, web sur http://localhost:5173).
12	- Connexion de démonstration (sans mot de passe) en tant qu'**étudiant Lucas Dupont**.
13	- Données utiles du seed ([`docs/seed.md`](../../docs/seed.md)) : 10 offres, dont **4 publiées**
14	  visibles par un étudiant (Application React de gestion de flotte, API REST de facturation,
15	  Tableau de bord de qualité des données, Assistant conversationnel interne).
16	- Piège voulu : « Numérisation d'archives **papi**er » contient aussi « api », mais elle est
17	  **archivée**, donc invisible pour un étudiant.
18	- Ces scénarios ne modifient aucune donnée (lecture seule) : ils sont rejouables dans n'importe
19	  quel ordre.
20	
21	| Numéro | Scénario | Actions dans l'interface | Résultat attendu |
22	|---|---|---|---|
23	| 1 | **Recherche avec résultat** (cas nominal, + casse et visibilité) | 1. Ouvrir http://localhost:5173 et cliquer sur « Lucas Dupont ». 2. Cliquer sur « Offres » dans la barre de navigation. 3. Constater « 4 offres ». 4. Saisir `API` (majuscules) dans le champ « Rechercher par titre ». | Le compteur affiche **« 1 offre »** ; le tableau contient **une seule ligne : « API REST de facturation »** (Orbis, publiée). « Numérisation d'archives papier » n'apparaît **pas** (archivée). |
24	| 2 | **Recherche sans résultat** (cas limite) | 1 et 2 identiques. 3. Saisir `blockchain` dans « Rechercher par titre ». | Le message **« Aucune offre ne correspond à la recherche. »** s'affiche ; **aucun tableau** d'offres. Après avoir vidé le champ, les **4 offres** reviennent. |
25	
26	## Pourquoi ces deux cas
27	
28	- **Scénario 1** vérifie en un seul geste trois règles visibles de l'utilisateur : le filtrage
29	  sur le titre, l'insensibilité à la casse (`API` en majuscules) et le fait que la recherche ne
30	  contourne pas la visibilité (l'offre archivée qui contient « api » reste cachée). Un « ça
31	  marche » se contenterait de voir des offres ; ici le résultat attendu 
… [résultat tronqué : 2738 caractères au total]
````

**Appel d'outil** `ToolSearch`

````json
{
  "query": "select:mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_click,mcp__playwright__browser_type,mcp__playwright__browser_fill_form,mcp__playwright__browser_wait_for,mcp__playwright__browser_press_key,mcp__playwright__browser_network_requests,mcp__playwright__browser_console_messages,mcp__playwright__browser_take_screenshot"
}
````

Résultat :

````

````

**Appel d'outil** `mcp__playwright__browser_navigate`

````json
{
  "url": "http://localhost:5173"
}
````

Résultat :

````
### Ran Playwright code
```js
await page.goto('http://localhost:5173');
```
### Page
- Page URL: http://localhost:5173/
- Page Title: Gesta
### Snapshot
- [Snapshot](.playwright-mcp/page-2026-11-26T12-04-38-392Z.yml)
### Events
- New console entries: .playwright-mcp/console-2026-11-26T12-04-38-256Z.log#L1
````

**Appel d'outil** `mcp__playwright__browser_snapshot`

````json
{}
````

Résultat :

````
### Page
- Page URL: http://localhost:5173/
- Page Title: Gesta
### Snapshot
```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]: Gesta
  - note [ref=e5]: Mode démo — connexion sans mot de passe, réservée au développement local.
  - main [ref=e6]:
    - generic [ref=e7]:
      - heading "Connexion de démonstration" [level=1] [ref=e8]
      - paragraph [ref=e9]: "Choisissez un utilisateur fictif. Il n'y a pas de mot de passe : ce mode remplace, en développement local uniquement, la connexion par lien envoyé par e-mail."
      - generic [ref=e10]:
        - generic [ref=e11]:
          - heading "Administrateurs" [level=2] [ref=e12]
          - list [ref=e13]:
            - listitem [ref=e14]:
              - button [ref=e15] [cursor=pointer]:
                - strong [ref=e16]: Anne Leclercq
            - listitem [ref=e17]:
              - button [ref=e18] [cursor=pointer]:
                - strong [ref=e19]: Philippe Moreau
        - generic [ref=e20]:
          - heading "Étudiants" [level=2] [ref=e21]
          - list [ref=e22]:
            - listitem [ref=e23]:
              - button [ref=e24] [cursor=pointer]:
                - strong [ref=e25]: Louis Claes
            - listitem [ref=e26]:
              - button [ref=e27] [cursor=pointer]:
                - strong [ref=e28]: Aminata Diallo
            - listitem [ref=e29]:
              - button [ref=e30] [cursor=pointer]:
                - strong [ref=e31]: Lucas Dupont
            - listitem [ref=e32]:
              - button [ref=e33] [cursor=pointer]:
                - strong [ref=e34]: Youssef El Amrani
            - listitem [ref=e35]:
              - button [ref=e36] [cursor=pointer]:
                - strong [ref=e37]: Inès Haddad
            - listitem [ref=e38]:
              - button [ref=e39] [cursor=pointer]:
                - strong [ref=e40]: Dmytro Kovalenko
            - listitem [ref=e41]:
              - button [ref=e42] [cursor=pointer]:
                - strong [ref=e43]: Mateusz Kowalski
            - listitem [ref=e44]:
              - button [ref=e45] [cursor=pointer]:
                - strong [ref=e46]: Léa Mertens
            - listitem [ref=e47]:
              - button [ref=e48] [cursor=pointer]:
                - strong [ref=e49]: Ioana Popescu
        - generic [ref=e50]:
          - heading "Contacts d'entreprise" [level=2] [ref=e51]
          - list [ref=e52]:
            - listitem [ref=e53]:
              - button "Mehdi Alaoui Hexagone · promoteur"
… [résultat tronqué : 6526 caractères au total]
````

**Appel d'outil** `mcp__playwright__browser_click`

````json
{
  "target": "e30",
  "element": "Bouton Lucas Dupont"
}
````

Résultat :

````
### Ran Playwright code
```js
await page.getByRole('button', { name: 'Lucas Dupont' }).click();
```
### Page
- Page URL: http://localhost:5173/
- Page Title: Gesta
### Snapshot
- [Snapshot](.playwright-mcp/page-2026-11-26T12-04-46-574Z.yml)
````

**Appel d'outil** `mcp__playwright__browser_snapshot`

````json
{}
````

Résultat :

````
### Page
- Page URL: http://localhost:5173/
- Page Title: Gesta
### Snapshot
```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]: Gesta
    - navigation "Navigation principale" [ref=e121]:
      - link "Accueil" [ref=e122] [cursor=pointer]:
        - /url: /
      - link "Offres" [ref=e123] [cursor=pointer]:
        - /url: /offres
      - link "Mes candidatures" [ref=e124] [cursor=pointer]:
        - /url: /mes-candidatures
      - link "Entreprises" [ref=e125] [cursor=pointer]:
        - /url: /entreprises
    - generic [ref=e126]:
      - generic [ref=e127]:
        - strong [ref=e128]: Lucas Dupont
        - generic [ref=e129]: Étudiant
      - button "Changer d'utilisateur" [ref=e130] [cursor=pointer]
  - note [ref=e5]: Mode démo — connexion sans mot de passe, réservée au développement local.
  - main [ref=e6]:
    - generic [ref=e131]:
      - heading "Bonjour Lucas" [level=1] [ref=e132]
      - paragraph [ref=e133]: Vous êtes connecté en tant que étudiant.
      - paragraph [ref=e134]: Gesta — API connectée
```
````

### 🤖 Agent

Connecté en tant que Lucas Dupont ; je passe à la page « Offres ».

**Appel d'outil** `mcp__playwright__browser_click`

````json
{
  "target": "e123",
  "element": "Lien Offres"
}
````

Résultat :

````
### Ran Playwright code
```js
await page.getByRole('link', { name: 'Offres' }).click();
```
### Page
- Page URL: http://localhost:5173/offres
- Page Title: Gesta
### Snapshot
- [Snapshot](.playwright-mcp/page-2026-11-26T12-04-55-427Z.yml)
````

**Appel d'outil** `mcp__playwright__browser_snapshot`

````json
{
  "target": "e6"
}
````

Résultat :

````
### Page
- Page URL: http://localhost:5173/offres
- Page Title: Gesta
### Snapshot
```yaml
- main [ref=e6]:
  - generic [ref=e135]:
    - heading "Offres de stage" [level=1] [ref=e136]
    - paragraph [ref=e137]: Les offres publiées.
    - generic [ref=e138]:
      - generic [ref=e139]: Filtrer par période
      - combobox "Filtrer par période" [ref=e140]:
        - option "Toutes" [selected]
        - option "P1"
        - option "P2"
        - option "Autre"
    - generic [ref=e141]:
      - generic [ref=e142]: Rechercher par titre
      - searchbox "Rechercher par titre" [ref=e143]
    - paragraph [ref=e144]: 4 offres
    - table [ref=e146]:
      - rowgroup [ref=e147]:
        - row [ref=e148]:
          - columnheader "Titre" [ref=e149]
          - columnheader "Entreprise" [ref=e150]
          - columnheader "Année" [ref=e151]
          - columnheader "Période" [ref=e152]
          - columnheader "Statut" [ref=e153]
          - columnheader "Action" [ref=e154]
      - rowgroup [ref=e155]:
        - row [ref=e156]:
          - cell "Assistant conversationnel interne" [ref=e157]
          - cell "Nexalis" [ref=e158]
          - cell "2026-2027" [ref=e159]
          - cell "P2" [ref=e160]
          - cell "Publiée" [ref=e161]
          - cell [ref=e163]:
            - button "Candidater" [ref=e164]
        - row [ref=e165]:
          - cell "Tableau de bord de qualité des données" [ref=e166]
          - cell "Lumen Data" [ref=e167]
          - cell "2026-2027" [ref=e168]
          - cell "P2" [ref=e169]
          - cell "Publiée" [ref=e170]
          - cell [ref=e172]:
            - button "Candidater" [ref=e173]
        - row [ref=e174]:
          - cell "Application React de gestion de flotte" [ref=e175]
          - cell "Lumen Digital" [ref=e176]
          - cell "2026-2027" [ref=e177]
          - cell "P2" [ref=e178]
          - cell "Publiée" [ref=e179]
          - cell "Déjà candidaté" [ref=e181]
        - row [ref=e182]:
          - cell "API REST de facturation" [ref=e183]
          - cell "Orbis" [ref=e184]
          - cell "2026-2027" [ref=e185]
          - cell "P2" [ref=e186]
          - cell "Publiée" [ref=e187]
          - cell [ref=e189]:
            - button "Candidater" [ref=e190]
```
````

### 🤖 Agent

"4 offres" confirmé. Je saisis `API` dans le champ de recherche.

**Appel d'outil** `mcp__playwright__browser_type`

````json
{
  "target": "e143",
  "element": "Champ Rechercher par titre",
  "text": "API"
}
````

Résultat :

````
### Ran Playwright code
```js
await page.getByRole('searchbox', { name: 'Rechercher par titre' }).fill('API');
```
````

**Appel d'outil** `mcp__playwright__browser_wait_for`

````json
{
  "text": "1 offre",
  "time": 5
}
````

Résultat :

````
### Result
Waited for 1 offre
### Ran Playwright code
```js
await page.getByText("1 offre").first().waitFor({ state: 'visible' });
```
### Page
- Page URL: http://localhost:5173/offres
- Page Title: Gesta
### Snapshot
- [Snapshot](.playwright-mcp/page-2026-11-26T12-05-03-087Z.yml)
````

**Appel d'outil** `mcp__playwright__browser_snapshot`

````json
{
  "target": "e6"
}
````

Résultat :

````
### Page
- Page URL: http://localhost:5173/offres
- Page Title: Gesta
### Snapshot
```yaml
- main [ref=e6]:
  - generic [ref=e135]:
    - heading "Offres de stage" [level=1] [ref=e136]
    - paragraph [ref=e137]: Les offres publiées.
    - generic [ref=e138]:
      - generic [ref=e139]: Filtrer par période
      - combobox "Filtrer par période" [ref=e140]:
        - option "Toutes" [selected]
        - option "P1"
        - option "P2"
        - option "Autre"
    - generic [ref=e141]:
      - generic [ref=e142]: Rechercher par titre
      - searchbox "Rechercher par titre" [active] [ref=e143]: API
    - paragraph [ref=e191]: 1 offre
    - table [ref=e193]:
      - rowgroup [ref=e194]:
        - row [ref=e195]:
          - columnheader "Titre" [ref=e196]
          - columnheader "Entreprise" [ref=e197]
          - columnheader "Année" [ref=e198]
          - columnheader "Période" [ref=e199]
          - columnheader "Statut" [ref=e200]
          - columnheader "Action" [ref=e201]
      - rowgroup [ref=e202]:
        - row [ref=e203]:
          - cell "API REST de facturation" [ref=e204]
          - cell "Orbis" [ref=e205]
          - cell "2026-2027" [ref=e206]
          - cell "P2" [ref=e207]
          - cell "Publiée" [ref=e208]
          - cell [ref=e210]:
            - button "Candidater" [ref=e211]
```
````

**Appel d'outil** `mcp__playwright__browser_network_requests`

````json
{
  "static": false,
  "filter": "/api/.*offers"
}
````

Résultat :

````
### Result
61. [GET] http://localhost:5173/api/offers => [200] OK
63. [GET] http://localhost:5173/api/offers?q=API => [200] OK

Note: 55 static requests not shown, run with "static" option to see them.
````

**Appel d'outil** `mcp__playwright__browser_console_messages`

````json
{
  "level": "warning",
  "all": true
}
````

Résultat :

````
### Result
Total messages: 3 (Errors: 0, Warnings: 0)
Returning 0 messages for level "warning"
````

### 🤖 Agent

Le scénario 1 est **réussi** : saisir `API` affiche exactement « 1 offre », et la seule ligne est « API REST de facturation » (Orbis, Publiée). Je n'ai modifié aucun code et je n'ai généré aucun script de test.

## Actions effectuées

1. J'ai ouvert http://localhost:5173 et cliqué sur **« Lucas Dupont »** (section Étudiants). L'en-tête indique « Lucas Dupont · Étudiant » et l'accueil affiche « Bonjour Lucas ».
2. J'ai cliqué sur **« Offres »** dans la barre de navigation, ce qui ouvre `/offres`.
3. J'ai vérifié le compteur : il affiche **« 4 offres »**.
4. J'ai saisi **`API`** (en majuscules) dans le champ « Rechercher par titre ».

## Observations

- **Avant la recherche :** 4 lignes, toutes au statut « Publiée » : Assistant conversationnel interne (Nexalis), Tableau de bord de qualité des données (Lumen Data), Application React de gestion de flotte (Lumen Digital) et API REST de facturation (Orbis). Ce sont bien les 4 offres annoncées par le scénario.
- **Après la saisie de `API` :**
  - Le compteur affiche **« 1 offre »**.
  - Le tableau contient **une seule ligne** : « API REST de facturation », Orbis, 2026-2027, P2, Publiée, avec un bouton « Candidater ».
  - « Numérisation d'archives papier » (l'offre archivée qui contient aussi « api ») **n'apparaît pas**.
- **Côté réseau :** le front a d'abord appelé `GET /api/offers`, puis `GET /api/offers?q=API`. Les deux ont répondu 200. Le filtrage se fait donc bien côté serveur.
- **Console :** aucune erreur ni aucun avertissement.

## Écarts avec le scénario

- **Aucun écart sur le résultat attendu.** La recherche filtre sur le titre, ne tient pas compte de la casse et ne fait pas apparaître l'offre archivée.
- **État initial non vérifié :** l'application tournait déjà quand j'ai commencé. Je n'ai pas lancé `npm run db:reset` et je n'ai donc pas confirmé que la base était fraîche. Le jeu de données affiché correspond quand même au seed décrit (4 offres publiées).
- **Point à vérifier :** l'offre « Application React de gestion de flotte » affiche « Déjà candidaté » pour Lucas. Le scénario ne le mentionne pas et cela ne change pas le résultat. Je n'ai pas vérifié dans `docs/seed.md` si cette candidature fait partie du seed ou si elle a été ajoutée lors d'un essai précédent.

---

**Fin de session** — 14 tours, coût estimé 0.36 $ (équivalent API), tokens : entrée 22, cache lu 326224, cache écrit 30645, sortie 2263.
