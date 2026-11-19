# Bilan — Semaine 4 : skills, tests et hooks

> Rapport complet : [`../semaine-4.md`](../semaine-4.md).

## Qu'ai-je appris ?

- Un **skill** est un guide chargé à la demande : seul son nom et sa description restent dans le
  contexte, le corps n'est lu que si l'agent le juge utile. La consigne dans `AGENTS.md`, qui
  donne le **chemin exact** du skill, a suffi pour qu'un agent neuf lise le skill TDD **en
  premier**, sans qu'on le lui demande.
- Un **hook** est un senseur qui agit **avant** l'action : le `rm` sur le fichier de démo a été
  bloqué alors que la commande était autorisée. En revanche, il ne bloque que ce qu'il sait
  reconnaître (pas un joker, pas Python). C'est une illustration, pas une sécurité.
- **Fenêtre de contexte** : l'essentiel de la consommation vient du contexte relu à chaque appel
  d'outil, pas du texte produit. Des sessions courtes, une par tâche, coûtent moins cher et
  restent plus nettes.

## Ce qui a bien marché

- L'essai 2 montre exactement ce que demande la fiche : skill du projet lu de lui-même, tests
  écrits et vus **rouges**, arrêt avant le code, puis vert après validation.
- L'agent a critiqué ses propres tests : il a remplacé un test de combinaison qui passait sans
  code, et signalé que le test « que des espaces » pouvait passer avec un bug à cause du délai
  de 300 ms.
- L'audit `test-gap-audit` a trouvé un vrai manque (re-candidater après un refus), et la
  mutation montre que l'ancienne suite ne l'aurait pas vu.

## Ce qui a moins bien marché / limites

- **J'ai lancé deux sessions en même temps** (installation et recherche). La session de
  recherche a démarré sans le skill du projet, a pris le skill TDD global et a codé sans
  attendre ma validation. Il a fallu la refaire. Leçon : les guides doivent être en place
  **avant** d'ouvrir la session qui doit les suivre.
- L'essai 2 a lu les traces de l'essai 1 rangées dans `docs/` : il n'était donc pas « aveugle ».
- En validant les tests, je n'ai pas vu une attente fausse (« pap**i**er » contient « api »).
  C'est l'agent qui l'a corrigée ensuite. Je dois relire les données avant de valider.
- Pas de test au navigateur (le port 3000 était occupé par un autre projet) : l'API a été
  essayée avec `curl` sur 3 profils, la page seulement avec les tests front.

## Crédits IA

Voir le tableau en fin de [`../semaine-4.md`](../semaine-4.md) (sessions Claude Code relevées
dans les journaux de session ; groupe 15 en solo).
