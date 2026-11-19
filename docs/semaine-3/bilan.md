# Bilan — Semaine 3 : harnais agentique (guides et senseurs)

> Brouillon à relire et reformuler dans mes propres mots avant la remise.
> Rapport complet : [`../semaine-3.md`](../semaine-3.md).

## Qu'ai-je appris ?

- La différence entre un **guide**, qui dit à l'agent quoi faire avant qu'il agisse (`AGENTS.md`,
  `architecture.md`), et un **senseur**, qui contrôle le résultat après coup (tests, lint,
  typecheck, `npm run check`). Un guide ne garantit rien tant qu'un senseur ne le vérifie pas.
  Exemple : « `npm run check` doit être vert avant chaque commit » n'est qu'une consigne, puisque
  le dépôt n'a ni CI ni hook.
- **Une suite verte ne prouve pas la couverture.** Nos 127 tests passaient, mais en injectant
  deux bugs réalistes (n'accepter de refuser que les offres « soumises », ne considérer comme
  « traitée » que la candidature « retenue »), la suite restait verte. Les tests de semaine 2
  vérifiaient surtout le **code de réponse**, pas l'**état** après l'action.
- Une matrice de traçabilité *exigence → cas → assertion* oblige à découper EF-32 / EF-33 en cas
  précis (refus, limites, droits). C'est là qu'on voit les trous.

## Ce qui a bien marché

- Partir du cahier des charges, et non des tests, pour construire la matrice. Je n'ai pas
  simplement relu les tests existants en me disant « ça a l'air complet ».
- Les **mutations temporaires** (injecter un bug → lancer les tests → restaurer avec
  `git checkout`) : c'est une preuve concrète qu'un test protège quelque chose. M2 et M3 ont
  échoué uniquement grâce aux nouveaux tests.
- Les tests ajoutés réutilisent les outils du projet (`createTestApp`, `tokenFor`, `seedIds`),
  sans dépendance ni code de production modifié. `npm run check` est resté vert (151 + 55 tests).

## Ce qui a moins bien marché / limites

- La première version de mon décompte était fausse (« 20 → 39 tests » au lieu de 15 → 39) :
  `it.each` démultiplie les cas. J'ai dû recompter en relançant la suite sur `main`. Il faut
  vérifier les chiffres par une commande, pas de mémoire.
- Certains cas ne sont pas vérifiables avec nos outils : la **concurrence** (deux candidatures
  simultanées, pas de contrainte `UNIQUE` en base) et l'**intégration réelle** front↔back (les
  tests front simulent `fetch`).
- L'audit Web 2 dépend des supports que j'ai retrouvés (synthèse JS2, projet MiamMiam). Pour
  l'**ergonomie / accessibilité**, je n'avais pas les supports, donc je n'ai rien affirmé.

## Crédits IA

| Membre | Outil | Consommation |
|---|---|---|
| Idris | Claude Code | *à compléter* |
