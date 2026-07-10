# Migration UT to Pocketbase/Astro stack

La version pb se trouve actuellement sur never

## Dev Lanes

### Data @Joël

Migration de mariadb vers pocketbase (tables + données) via migrations ré-excutables.

### UI @Istvan

Migration du site web Vue de nuxt à astro (SSR).

- [ ] Déconstruire le CMS (inline edit, etc)
- [ ] Spécificités nuxt => loin
- [ ] Implémenter les spécificités Astro (login, etc)

### Backend @Istvan

Migration du backend vers calls aux endpoint Pb out-of-the-box et ajout de routes via pb hooks en typescript qd c'est pas possible ou trop compliqué. Au pire => migration quasi 1:1 du backend nuxt sur hooks pb.

### Admin @Joël

Migration de l'UI et du backend. Question: est-ce qu'n garde ElementsPlus ou on migre sur PrimeVue? A voir sur le moment ce qui est le plus rapide.

### Infra @Istvan

La migration se fait sur never.urban-training.ch

- [ ] Préparer un vps dédié pour la prod
- [ ] Mettre en environnement de dev et un de prod (develop.urban-training.ch et www.urban-training.ch)
- [ ] Si le domaine n'est pas chez Infomaniak => le bouger au plus vite si possible, sinon, prévoir un plan de migration avec des dates pour pouvoir prévenir Matthieu le jour où on est prêt à switcher (y aura sûrement du downtime)
- [ ] S'assurer que lesles anciens redirects ne sont plus possible, sinon les gérer si possible via caddy

## Priorités

Certaines tâches doivent être faites en 1er lieu et ensebmle pour que tout le reste puisse avancer:

1. Valider sur la façon de faire le backend (tout pb hooks ou pb endpoints ou les 2 ou certains trucs en go selon le cas)
2. Chacun démarre son lane (Joël: Data, Istvan: UI) et on se met d'accord sur comment migrer dès lors qu'on tombe sur un problème (backend, structure données, etc)
3. On garde l'admin pour la fin une fois que tout les reste est plus ou moins en place

## Choses importantes à prendre en compte

- Ne pas garder les labels en base
- Ne pas implémenter les conneries (du genre table Sessions doit s'appeler Events ds le nouveau site)
- Questionner certaines choses qu'on a automatisée mais qu'ona pas besoin de garder automatique (genre les teasers)
- Prendre en compte / garder en tête les modifs qu'on a fait le plus souvent (modifier labels, images)

## History

- [2026-06-12] Port user profile page — composables, components, utils, styles migrés depuis Nuxt ; page `mon-compte` fonctionnelle avec formulaire profil et onglet villes
- [2026-06-12] Collections PocketBase cities — `ut_cities` + `ut_city_watchers`, commande `import-cities`, watching/unwatching de villes opérationnel
- [2026-06-12] Sessions page — liste des sessions avec filtres, navigation par date, page détail et inscription/désinscription
- [2026-06-21] Admin SPA — interface CRUD complète pour Events, Cities, Locations, EventTypes et Users ; auth guard, sidebar, migrations PocketBase pour corriger les règles de collection
- [2026-07-05] Admin — refonte esthétique des listes (layout aligné sur la prod Nuxt : recherche pleine largeur, actions icônes, sélecteur de langue)
- [2026-07-07] Admin — exports CSV (utilisateurs, observateurs/inscrits par ville et globaux, statistiques de présence, inscrits par session)
- [2026-07-08] Admin — alignement des exports CSV sur la prod : booléens en `1`/vide, labels des menus d'export villes, colonne staff dans les statistiques, colonnes location/adresse/type d'event/rue dans l'export inscriptions
- [2026-07-09] Admin — import CSV de sessions (upload, préviz avec erreurs par cellule, fusion multi-langues, récurrence, détection de doublons) ; fix index unique `legacy_id` qui bloquait toute 2e création admin (cities, locations, types, events)
- [2026-07-09] Admin — dialog des inscrits par session (clic sur le compteur : liste coach/nom/e-mail/présence, copie des e-mails, export CSV)
- [2026-07-09] Admin — fusion de lieux (re-pointage des sessions vers un lieu de destination, ville dénormalisée mise à jour)
- [2026-07-10] Fix création d'utilisateur — le champ `id` de `ut_users` n'était plus auto-généré, toute création échouait (admin inclus)
- [2026-07-10] Admin — gestion des proposants de sessions (CRUD, activation/désactivation)
- [2026-07-10] Import users — fusion des comptes legacy en doublon d'email (survivant = compte à l'inscription la plus récente, rôle le plus élevé conservé) ; les inscriptions et villes suivies des comptes fusionnés sont récupérées (~8000 inscriptions perdues auparavant)
