# Cas de tests « à la main » (end-to-end) — Semaine 2 : candidatures

Fonctionnalité : candidater à une offre (EF-32), consulter ses candidatures (EF-33), retirer
une candidature (EF-32), dans le respect de RG-03 (offre publiée uniquement).

Deux niveaux de vérification :
- **API** : vérifié par requêtes HTTP sur le serveur local (`npm run dev`, base de démo), avec
  les connexions de démo. Résultats observés ci-dessous.
- **Navigateur** : à rejouer sur http://localhost:5173 avec deux profils étudiants.

Utilisateurs de démo utilisés : Lucas (étudiant id 1, a déjà une candidature en cours sur
l'offre 1), Louis (étudiant id 9, sans candidature), Mateusz (étudiant id 3, candidature
retenue), un administrateur (id 1).

## Cas vérifiés au niveau API

| # | Cas | Attendu | Observé |
|---|-----|---------|---------|
| 1 | Louis candidate à l'offre 1 (publiée) **avec** message | 201, statut `IN_PROGRESS` | ✅ 201 |
| 2 | Louis candidate à l'offre 2 (**soumise**, non publiée) | 409 `OFFER_NOT_PUBLISHED` (RG-03) | ✅ |
| 3 | Louis candidate une 2ᵉ fois à l'offre 1 (déjà en cours) | 409 `ALREADY_APPLIED` | ✅ |
| 4 | Louis candidate à une offre inexistante (999) | 404 | ✅ |
| 5 | Un **administrateur** appelle `GET /applications` | 403 (réservé aux étudiants) | ✅ |
| 6 | Lucas consulte ses candidatures | seulement les siennes : `[(offre 1, En cours)]` | ✅ |
| 7 | Lucas retire sa candidature en cours | 200, statut `WITHDRAWN` | ✅ |
| 8 | Lucas candidate à nouveau à l'offre 1 **après retrait** | 201 (décision de groupe) | ✅ |
| 9 | Mateusz retire une candidature **retenue** (traitée) | 409 `APPLICATION_TREATED` | ✅ |
| 10 | Lucas retire la candidature d'un **autre** étudiant | 404 (ni vue ni modifiable) | ✅ |
| 11 | Louis candidate **sans** message | 201, `message = null` | ✅ |

Ces cas couvrent les refus exigés par l'énoncé : un autre rôle ne peut pas candidater (cas 5),
une offre non publiée refuse la candidature (cas 2) ; les contrôles sont faits **côté serveur**
(le service, pas seulement l'interface).

## Cas à rejouer au navigateur (http://localhost:5173)

| # | Cas | Attendu |
|---|-----|---------|
| B1 | Se connecter en étudiant, onglet **Offres**, cliquer **Candidater** sur une offre publiée, laisser le message vide, envoyer | la candidature apparaît dans **Mes candidatures**, statut « En cours » |
| B2 | Recommencer en saisissant un **message** | idem, candidature enregistrée |
| B3 | **Recharger** la page Mes candidatures | la candidature et son statut sont toujours là |
| B4 | Sur une offre déjà visée | le bouton affiche **« Déjà candidaté »** (pas de double) |
| B5 | Dans Mes candidatures, **Retirer** une candidature « En cours » | le statut passe à « Retirée » |
| B6 | Une candidature « Retenue » / « Non retenue » | **pas** de bouton Retirer |
| B7 | Se connecter avec un **second étudiant** | il ne voit **que ses** candidatures, pas celles du premier |

## Reproduire les cas API

Serveur lancé (`npm run dev`), puis utiliser `backend/http/applications.http` (extension REST
Client) ou des requêtes `curl` équivalentes. Base remise à neuf avec `npm run db:reset`.
