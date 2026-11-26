# Bilan — Semaine 5 : MCP et tests end-to-end avec Playwright

> Rapport complet : [`../semaine-5.md`](../semaine-5.md).

## Qu'ai-je appris ?

- **MCP** : c'est un protocole qui donne à un agent des **outils** exposés par un serveur.
  Ici, le serveur Playwright tournait en local (HTTP sur `localhost:8931`), lancé par moi
  **hors** de l'agent. L'agent ne « voit » pas la page comme une image : il reçoit un
  **arbre d'accessibilité** avec des références (`e143`) et agit sur ces références. Le serveur
  lui renvoie le code Playwright réellement exécuté.
- **Un fichier de config peut être ignoré en silence.** Le `.mcp.json` de la fiche (avec
  `"tools": ["*"]`, propre à Copilot) n'a chargé **aucun** serveur dans Claude Code, sans
  message d'erreur. J'ai trouvé la cause en comparant deux sessions, avec et sans la clé.
- **MCP et tests automatisés ne font pas le même travail.** MCP sert à explorer et à
  diagnostiquer, avec un agent dans la boucle. Playwright Test sert à garantir : c'est
  reproductible, versionné, ~3 s et zéro token.

## Ce qui a bien marché

- Écrire les **scénarios avant** de lancer l'agent, avec un résultat exact et un piège voulu
  (l'offre archivée « pap**i**er » qui contient « api »). Les tests générés reprennent ce piège
  comme assertion.
- **Restreindre les outils de l'agent** pendant l'exploration MCP : pas d'`Edit`, de `Write`,
  de `Bash` ni d'exécution de JavaScript arbitraire. Il ne pouvait que naviguer et observer.
- Quand le MCP n'était pas connecté, l'agent a **refusé d'inventer un résultat** et a expliqué
  pourquoi. C'est le comportement qu'on attend.
- La **mutation** (recherche désactivée) fait échouer les deux tests sur les bonnes assertions,
  et ils repassent après restauration. Les tests protègent donc réellement la fonctionnalité.
- La base E2E **dédiée**, recréée depuis le seed, rend les tests indépendants de ma base de
  développement et de leur ordre.

## Ce qui a moins bien marché / limites

- J'ai perdu du temps sur la configuration MCP (format Copilot ≠ Claude Code).
- Un **`tsx watch` resté actif** a relancé l'API pendant la mutation, et ma relance a échoué
  sur « port déjà utilisé ». C'était encore l'environnement, pas le code, comme en semaine 2.
- Dans mon premier compte rendu, j'avais compté **10** appels MCP au lieu de **11** : il faut
  recompter par une commande, pas à l'œil.
- `npm run check` ne lance pas les E2E et le typecheck ne couvre pas `e2e/` : il faut penser
  à lancer `npm run test:e2e` à part.
- Seuls 2 scénarios, sur un seul profil (étudiant). La visibilité côté déposant et la
  combinaison avec le filtre de période ne sont couvertes que par les tests back/front, pas
  en E2E.

## Crédits IA

Voir le tableau en fin de [`../semaine-5.md`](../semaine-5.md). Groupe 15 en solo.
