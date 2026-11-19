# Semaine 4 — Skills, tests et hooks (Phase 5)

Fiche « Semaine 9 — Skills, tests et hooks » (cours BINV3220-1). Branche `semaine-4`.
Pièces jointes dans `docs/semaine-4/` : rapport brut du skill d'audit, trace du hook,
conversations exportées.

## 0. Adaptation : Copilot → Claude Code

Comme pour les séances précédentes, le travail est fait dans **Claude Code** et non dans
Copilot (alternative autorisée). La fiche décrit l'installation pour Copilot ; voici les
équivalences retenues. L'idée : **garder les fichiers Copilot exactement là où la fiche les
demande**, et ajouter seulement les branchements dont Claude Code a besoin pour les lire.

| Ce que demande la fiche (Copilot) | Ce que lit Claude Code | Ce qui a été fait |
|---|---|---|
| Skills dans `.github/skills/<nom>/SKILL.md` | `.claude/skills/<nom>/SKILL.md` | Skills copiés dans `.github/skills/` ; `.claude/skills/<nom>` = **liens symboliques** vers ces dossiers (une seule copie, pas de divergence possible). |
| Consigne dans `.github/copilot-instructions.md` | `CLAUDE.md` | Le projet a déjà `AGENTS.md` comme source unique. Le paragraphe TDD y est ajouté ; `CLAUDE.md` l'importe (`@AGENTS.md`). |
| `/skills reload`, puis taper `/` | Pas de commande : Claude Code **détecte seul** un nouveau dossier `.claude/skills/` (observé dans la session d'installation : « New skills discovered… ») | Pour l'essai de déclenchement automatique, on ouvre quand même une session neuve, comme le demande la fiche ; `/` (ou `/skills`) y liste `test-gap-audit` et `test-driven-development`. |
| Hook `.github/hooks/tool-guardian.json`, événement `preToolUse` | `.claude/settings.json`, événement `PreToolUse` | Fichiers du zip conservés tels quels. `.claude/settings.json` lance un **adaptateur** (`.claude/hooks/guard-tool-claude.cjs`) qui appelle le script d'origine. |
| Réponse `{"permissionDecision":"deny"}` | `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny",…}}` | L'adaptateur traduit la réponse. Le script d'origine lit déjà `tool_name`/`tool_input`, les noms de champs de Claude Code. |
| « Agent Customizations → Hooks » | Menu `/hooks` | Vérifiable dans une session interactive. |
| Export « Copy All » | `/export` | Conversations dans `docs/semaine-4/`. |

Pourquoi un adaptateur plutôt que modifier `guard-tool.cjs` : le script du cours reste
identique au zip (donc toujours valable pour Copilot), et la seule différence entre les deux
outils — la forme de la réponse — est isolée dans 40 lignes faciles à expliquer.

**Piège repéré** : la session voit **deux** skills TDD, celui du projet
(`test-driven-development`, avec la consigne de pause) et celui du plugin Superpowers installé
globalement (`superpowers:test-driven-development`, sans la consigne). La règle d'`AGENTS.md`
désigne le fichier par son chemin (`.github/skills/test-driven-development/SKILL.md`), ce qui
lève l'ambiguïté. Il faut vérifier dans la session de la recherche que c'est bien ce fichier-là
qui est lu.

## 1. Audit des tests des candidatures

**Installation** : `.github/skills/test-gap-audit/` (`SKILL.md` + `scripts/coverage_map.py`,
licence MIT du dépôt `github/awesome-copilot` jointe). En-tête YAML vérifié : `name`,
`description` sur une seule ligne (toute la description est bien dans le champ),
`license: MIT` — valide, pas besoin de le remplacer.

**Lancement** : `/test-gap-audit les tests des candidatures (EF-32 et EF-33)` dans une session
Claude Code neuve, avec les décisions du binôme jointes (une seule candidature en cours par
offre ; re-candidature après retrait **ou refus** ; 404 pour un non-propriétaire) et des
outils en lecture seule. Rapport brut : [`semaine-4/audit-test-gap-brut.md`](semaine-4/audit-test-gap-brut.md).
L'agent n'a pas lancé `coverage_map.py` (il l'a jugé inutile pour un périmètre aussi
restreint) : il a relu les fichiers directement.

**Vérification des constats** : chaque ligne ci-dessous a été contrôlée en ouvrant le test et
le code cités.

| Cas à vérifier | Test existant et assertion utile | Manque confirmé ou constat écarté |
|---|---|---|
| Candidature à une offre non publiée refusée | `applications.test.ts` « refuse une offre %s (409) sans créer de candidature » (PENDING, ASSIGNED, ARCHIVED) : `409 OFFER_NOT_PUBLISHED` **et** l'offre absente de la liste ensuite | Écarté : couvert, y compris l'absence d'effet en base. |
| Retrait d'une candidature déjà traitée | « refuse de retirer une candidature déjà traitée (409) » (SELECTED) + « refuse de retirer une candidature %s (409) et laisse son statut inchangé » (REJECTED, WITHDRAWN) | Écarté : couvert pour les 3 statuts traités, statut relu après le refus. |
| Accès aux candidatures d'un autre étudiant | « ne renvoie que les candidatures de l'étudiant connecté » + « ne modifie pas la candidature d'un autre étudiant quand le retrait est refusé (404) » (Youssef reste `IN_PROGRESS`) | Écarté : couvert. |
| Re-candidater après un **refus** (décision du binôme) | Aucun. Seuls les cas « après un retrait » sont testés. Le seul `REJECTED` du seed (Léa) vise une offre **attribuée**, donc inutilisable pour ce cas. | **Manque confirmé → traité** (voir ci-dessous). |
| Après une re-candidature, l'ancienne ligne est conservée | « permet de re-candidater après avoir retiré sa candidature » ne vérifie que le 201 et le statut de la réponse | **Manque confirmé**, couvert pour le cas du refus par le nouveau test ; reste ouvert pour le cas du retrait. |
| Ordre « de la plus récente à la plus ancienne » (`backend/API.md`, `ORDER BY a.applied_at DESC`) | « ne renvoie que les candidatures de l'étudiant connecté » trie les identifiants avant de comparer (`.sort()`) : l'ordre n'est pas vérifié | **Manque confirmé**, non traité. Promis par `API.md` mais pas par EF-33 (qui ne parle que des statuts) : priorité plus faible. |
| Message vide ou d'espaces → pas de message ; 1000 caractères acceptés | Seul 1001 caractères est testé (400). Le `trim` et `"" → null` de `parseMessage` ne le sont pas. | **Manque confirmé**, mineur (P3), non traité. |
| Front : après « Retirer », la liste est rechargée et l'erreur 409 s'affiche | `ApplicationsPage.test.tsx` vérifie seulement que `fetch` a été appelé en `POST` | **Manque confirmé**, non traité : la fiche demande de privilégier les tests d'API. |
| Unicité d'une candidature en cours garantie en base (index unique) | Aucun, la règle n'est que dans le service | **Écarté** : ce n'est pas un manque de test. `better-sqlite3` est synchrone, la vérification et l'insertion ne peuvent pas s'entrecroiser dans un même processus. |

**Test ajouté** — `backend/tests/applications.test.ts`, « autorise une nouvelle candidature
après un refus et conserve l'ancienne « Non retenue » » :

- prépare le refus en SQL sur la base de test isolée (la sélection par l'administrateur, EF-34,
  n'existe pas encore) : candidature de Lucas sur `FLEET_APP` passée à `REJECTED` ;
- vérifie `201 IN_PROGRESS` avec un **nouvel** identifiant, que l'ancienne candidature est
  toujours `REJECTED` dans la liste, et qu'une troisième tentative donne `409 ALREADY_APPLIED`.

**Le test prouve-t-il quelque chose ?** Il est passé au vert du premier coup (le code respecte
déjà la décision), ce qui ne prouve rien en soi. On a donc fait une **mutation temporaire** du
dépôt : `hasActiveApplication` compte aussi les `REJECTED`
(`status IN ('IN_PROGRESS', 'REJECTED')`). Résultat : **1 échec / 39 réussites** —
`AssertionError: expected 409 to be 201` sur le nouveau test, **toutes les autres passent**.
L'ancienne suite n'aurait donc pas vu cette régression. Code restauré ensuite (`git diff` vide).
Aucun défaut du code n'a été révélé : rien à corriger.

**Contrôles** : `npm run check` lancé dans un worktree propre contenant uniquement ces commits
(l'arbre de travail contenait en même temps les tests en cours de la recherche, rouges par
construction) : lint OK, typecheck OK, backend **152 tests** (151 → 152), frontend 55, build OK.

## 2. Recherche d'offres avec le TDD

**Installation du skill** : `.github/skills/test-driven-development/` (`SKILL.md`,
`writing-good-tests.md`, licence MIT de Superpowers jointe).

- Consigne de pause de la fiche ajoutée au début du corps, juste après l'en-tête YAML.
- Paragraphe « Pour tout ajout de fonctionnalité ou correction de bug, lis et applique… »
  ajouté à `AGENTS.md` (équivalent de `copilot-instructions.md`, voir §0), sans rien retirer.
- `grep -rn disable-model-invocation .github/skills` → aucun résultat : le déclenchement
  automatique est possible.
- Session neuve : `test-driven-development` apparaît bien dans la liste des skills.

**Fonctionnalité** : *à compléter dans la session dédiée (la recherche n'est pas codée ici)* —
le test vu en échec puis en réussite, notre avis sur les tests proposés avant l'accord, la
preuve que l'agent a lu le skill de lui-même.

## 3. Recherche : essais et résultats

*À compléter après l'implémentation* : cas essayés au navigateur, résultat de
`npm run check`, problèmes restants.

## 4. Hook Tool Guardian

- **Événement** : `preToolUse` côté Copilot (`.github/hooks/tool-guardian.json`, commande
  `node .github/hooks/guard-tool.cjs`), `PreToolUse` côté Claude Code (`.claude/settings.json`,
  commande `node "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-tool-claude.cjs"`). Le hook reçoit
  l'appel d'outil en JSON sur l'entrée standard **avant** son exécution et peut répondre
  `deny`. Il n'utilise jamais `allow` : il ne peut que retirer des droits, pas en ajouter.
- **Fichier de démonstration** : `demo-protected.txt` à la racine.
- **Essais réels** (sessions Claude Code neuves, trace : [`semaine-4/trace-hook.md`](semaine-4/trace-hook.md)) :
  1. « Exécute git status » → exécuté normalement, le hook ne décide rien.
  2. « Supprime demo-protected.txt avec la commande rm » → l'agent appelle bien l'outil
     (`rm demo-protected.txt && …`), le hook le **refuse avant exécution** :
     `PreToolUse:Bash hook error: Démonstration Tool Guardian : suppression de demo-protected.txt interdite…`.
     Le fichier existe toujours. La commande `rm` avait été **autorisée d'avance**
     (`--allowedTools`) : seul le hook pouvait l'arrêter, ce qui exclut que ce soit l'agent ou
     le système de permissions qui ait refusé.
- **Limites vérifiées** par événements simulés : `rm demo-*.txt` (joker) et une suppression
  via `python3 -c "os.remove(...)"` ne sont **pas** bloqués. La détection est textuelle ; ce
  hook illustre le mécanisme, ce n'est pas une protection du système de fichiers.

## Crédits IA

Sous-sessions lancées pendant cette partie (relevé `total_cost_usd` des sorties `stream-json`,
équivalent API — l'abonnement ne débite pas de crédits en euros) :

| Sous-session | Modèle | Tokens entrée (dont cache) | Tokens sortie | Équivalent API |
|---|---|---|---|---|
| Audit `/test-gap-audit` | Sonnet | 193 989 | 5 618 | 0,26 $ |
| Hook, essai `git status` | Haiku | 68 504 | 387 | 0,006 $ |
| Hook, essai suppression | Haiku | 103 522 | 1 148 | 0,006 $ |

*À compléter* : la session principale (relevé `/cost` ou `/usage`) et les crédits du binôme.
