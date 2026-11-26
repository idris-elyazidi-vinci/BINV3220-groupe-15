# Conversation 2 — Playwright MCP, essai 1 (serveur non chargé)

Session Claude Code **neuve**, lancée en mode non interactif :

```bash
claude -p "<prompt de la fiche>" --mcp-config .mcp.json --strict-mcp-config --allowedTools "mcp__playwright__*" "Read" --disallowedTools "Edit" "Write" "Bash" --output-format stream-json --verbose
```

**Init** — modèle `claude-opus-5-5`, serveurs MCP : `[]`, 0 outils MCP chargés.

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
  "query": "playwright browser",
  "max_results": 25
}
````

Résultat :

````
No matching deferred tools found
````

**Appel d'outil** `Read`

````json
{
  "file_path": "/Users/idris/etudes/ia-agentique/BINV3220-groupe-15/.mcp.json"
}
````

Résultat :

````
1	{
2	  "mcpServers": {
3	    "playwright": {
4	      "type": "http",
5	      "url": "http://localhost:8931/mcp",
6	      "tools": ["*"]
7	    }
8	  }
9	}
10
````

**Appel d'outil** `ToolSearch`

````json
{
  "query": "+mcp navigate snapshot click",
  "max_results": 25
}
````

Résultat :

````
(vide)
````

### 🤖 Agent

Je n'ai pas exécuté le scénario 1 : les outils du serveur Playwright MCP ne sont pas disponibles dans cette session. Aucune action n'a été faite dans le navigateur, et je n'ai modifié aucun fichier.

**Ce que j'ai vérifié**
- J'ai lu `e2e/recherche-offres/scenarios.md`. Le scénario 1 consiste à se connecter comme Lucas Dupont, ouvrir « Offres », constater « 4 offres », saisir `API`, puis attendre « 1 offre » avec la seule ligne « API REST de facturation ».
- `.mcp.json` (non suivi par Git) déclare un serveur `playwright` de type HTTP à l'adresse `http://localhost:8931/mcp`.
- Aucun outil Playwright n'est chargé : une recherche « playwright browser » ne renvoie rien, et une recherche « navigate snapshot click » ne renvoie qu'un outil sans rapport. Le serveur n'est donc pas connecté. Le plus probable est qu'il ne tournait pas sur le port 8931 au démarrage de la session, ou que ce `.mcp.json` n'a pas été approuvé.
- Je n'ai pas non plus d'accès au shell dans cette session. Je ne peux donc ni lancer le serveur MCP, ni lancer `npm run db:reset` / `npm run dev`.

**Pour débloquer**
1. Dans un terminal, lancez le serveur MCP en mode HTTP : `npx @playwright/mcp@latest --port 8931`.
2. Dans un autre terminal, à la racine : `npm run db:reset`, puis `npm run dev`.
3. Redémarrez Claude Code dans le dépôt et acceptez le serveur `playwright` proposé par `.mcp.json`. Avec `/mcp`, vérifiez qu'il apparaît comme connecté.
4. Relancez la même demande. J'exécuterai alors le scénario 1 étape par étape dans l'interface et je vous ferai le compte rendu demandé (actions, observations, écarts).

---

**Fin de session** — 5 tours, coût estimé 0.20 $ (équivalent API), tokens : entrée 8, cache lu 66379, cache écrit 20968, sortie 1178.
