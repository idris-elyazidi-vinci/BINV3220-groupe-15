# Scénarios end-to-end — recherche d'offres par titre (EF-30)

Règles de la semaine 9 (voir [`docs/semaine-4.md`](../../docs/semaine-4.md) §2-3) : la recherche
porte sur le **titre**, est insensible à la casse, ignore les espaces autour, s'**ajoute** à la
visibilité du profil (un étudiant ne voit que les offres publiées) et affiche
« Aucune offre ne correspond à la recherche. » quand rien ne correspond.

## État initial commun

- Base de démonstration fraîche : `npm run db:reset`, puis `npm run dev`
  (API sur http://localhost:3000, web sur http://localhost:5173).
- Connexion de démonstration (sans mot de passe) en tant qu'**étudiant Lucas Dupont**.
- Données utiles du seed ([`docs/seed.md`](../../docs/seed.md)) : 10 offres, dont **4 publiées**
  visibles par un étudiant (Application React de gestion de flotte, API REST de facturation,
  Tableau de bord de qualité des données, Assistant conversationnel interne).
- Piège voulu : « Numérisation d'archives **papi**er » contient aussi « api », mais elle est
  **archivée**, donc invisible pour un étudiant.
- Ces scénarios ne modifient aucune donnée (lecture seule) : ils sont rejouables dans n'importe
  quel ordre.

| Numéro | Scénario | Actions dans l'interface | Résultat attendu |
|---|---|---|---|
| 1 | **Recherche avec résultat** (cas nominal, + casse et visibilité) | 1. Ouvrir http://localhost:5173 et cliquer sur « Lucas Dupont ». 2. Cliquer sur « Offres » dans la barre de navigation. 3. Constater « 4 offres ». 4. Saisir `API` (majuscules) dans le champ « Rechercher par titre ». | Le compteur affiche **« 1 offre »** ; le tableau contient **une seule ligne : « API REST de facturation »** (Orbis, publiée). « Numérisation d'archives papier » n'apparaît **pas** (archivée). |
| 2 | **Recherche sans résultat** (cas limite) | 1 et 2 identiques. 3. Saisir `blockchain` dans « Rechercher par titre ». | Le message **« Aucune offre ne correspond à la recherche. »** s'affiche ; **aucun tableau** d'offres. Après avoir vidé le champ, les **4 offres** reviennent. |

## Pourquoi ces deux cas

- **Scénario 1** vérifie en un seul geste trois règles visibles de l'utilisateur : le filtrage
  sur le titre, l'insensibilité à la casse (`API` en majuscules) et le fait que la recherche ne
  contourne pas la visibilité (l'offre archivée qui contient « api » reste cachée). Un « ça
  marche » se contenterait de voir des offres ; ici le résultat attendu est **exact** (1 ligne,
  ce titre-là).
- **Scénario 2** vérifie le message spécifique de la semaine 9, distinct de « Aucune offre à
  afficher. » (liste vide sans recherche), et le retour à la liste complète quand on efface.
