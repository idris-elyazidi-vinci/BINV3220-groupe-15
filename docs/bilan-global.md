# Bilan global du projet Gesta — développement agentique

> Groupe 15 (solo). Cinq PR : filtre par période (S1), candidatures (S2), harnais (S3),
> skills/TDD/hooks + recherche (S4), MCP et tests end-to-end (S5). Agent utilisé : Claude
> Code (alternative autorisée à Copilot), avec `AGENTS.md` comme source de contexte unique.

## Ce que j'ai appris

### Piloter un agent, pas juste lui demander du code
- **Explorer → planifier → coder → vérifier.** Les meilleures séances ont commencé par une
  lecture de la chaîne existante (controller → service → repository → mapper) et la recherche
  d'un **patron à réutiliser** (le filtre `?q=` des entreprises). L'agent produit alors du
  code cohérent avec le projet, pas seulement du code qui « marche ».
- **Les décisions métier restent humaines.** Le cahier des charges ne tranchait pas tout : par
  exemple, une seule candidature « En cours » par offre et la re-candidature autorisée après un
  retrait ou un refus. Je les ai décidées et notées avant de coder, et je ne les ai pas
  laissées à l'agent.

### Le harnais : guides et senseurs
- Un **guide** (`AGENTS.md`, skills) oriente l'agent avant qu'il agisse. Un **senseur**
  (tests, lint, typecheck, `npm run check`, hooks) contrôle après coup, ou avant pour un hook.
  Un guide sans senseur n'est qu'une consigne.
- Les **skills** sont des guides chargés à la demande. Un chemin explicite dans `AGENTS.md` a
  suffi pour qu'un agent neuf lise le skill TDD en premier et s'arrête avant de coder.
- Un **hook** bloque ce qu'il sait reconnaître, pas plus. C'est une illustration de garde-fou,
  pas une sécurité.
- **MCP** donne à l'agent des outils externes (ici un navigateur). C'est puissant pour
  explorer, mais ça ne remplace pas une suite de tests.

### Vérifier le travail de l'IA (et le mien)
- **Une suite verte ne prouve rien sur la couverture.** Les **mutations** (injecter un bug,
  lancer les tests, restaurer) ont été mon meilleur outil. En semaine 3, deux bugs réalistes
  passaient l'ancienne suite. En semaine 5, la recherche désactivée fait bien échouer les E2E.
- **TDD** : voir le test **rouge** avant le code, c'est la preuve que le test teste quelque
  chose. L'agent a même repéré lui-même des tests qui passaient sans code.
- **Relire les données avant de valider des attentes** : « pap**i**er » contient « api », je ne
  l'avais pas vu en semaine 4. Je l'ai transformé en piège voulu en semaine 5.
- **Beaucoup de « bugs » venaient de l'environnement** : des serveurs `tsx watch` en double
  (S2, S5), un port occupé par un autre projet (S4) ou une config MCP ignorée en silence (S5).
  Avant d'accuser le code, je vérifie les processus et les ports.
- Les chiffres (nombre de tests, d'appels d'outils) se **recomptent par une commande**. Je me
  suis trompé deux fois de mémoire.

### Contexte et coût
- Ce qui coûte le plus, c'est le **contexte relu** à chaque appel d'outil (des millions de
  tokens), pas le texte produit. Des **sessions courtes et neuves, une par tâche**, coûtent
  moins cher, restent plus nettes et donnent des traces propres pour la PR.
- Les guides doivent exister **avant** d'ouvrir la session qui doit les suivre. Ma session
  lancée en parallèle en semaine 4 a pris le mauvais skill.

## Ce que je n'ai pas appris (et que j'aurais aimé apprendre)

- **CI/CD** : faire tourner `npm run check` et les tests Playwright automatiquement sur chaque
  PR (GitHub Actions). Nos senseurs restent manuels, et rien n'empêche de merger une PR rouge.
- **Travailler en vrai binôme** avec un agent : branches parallèles, revues croisées, conflits
  et partage d'`AGENTS.md`. J'ai fait le projet seul.
- **Écrire mon propre serveur MCP**, par exemple un MCP en lecture seule sur la base Gesta,
  plutôt que seulement en utiliser un.
- **Les ADR** (Architecture Decision Records) dans une boucle agentique : je les ai vus en
  théorie, mais mes décisions sont restées dans les bilans et les PR, pas dans des ADR que
  l'agent relirait.
- Le **sous-agent / l'orchestration** de plusieurs agents sur une même fonctionnalité, et
  l'évaluation de la qualité d'un agent (évals) au-delà de « les tests passent ».
- Comparer sérieusement **plusieurs modèles ou outils** (Copilot vs Claude Code, petit modèle
  vs gros) sur la même tâche, avec des mesures de coût et de qualité.
