# Migration UT to Pocketbase/Astro stack

La version pb se trouve actuellement sur never

## Dev Lanes

### Data @Joël

Migration de mariadb vers pocketbase (tables + données) via migrations ré-excutables.

- [x] Collections PocketBase (users, cities, locations, events, event_types, event_proposers, subscriptions, city_watchers, sponsors)
- [x] Imports legacy ré-exécutables : `ut:import` (cities, events, users, sponsors)
- [x] Fusion des comptes legacy en doublon d'email à l'import
- [x] Teasers : décision prise de ne pas les migrer (voir Décisions actées)

### UI @Istvan

Migration du site web Vue de nuxt à astro (SSR).

- [x] Déconstruire le CMS (inline edit, etc) — les 10 pages legacy sont désormais des routes Astro statiques (`src/routes.ts`), plus de contenu en base
- [x] Spécificités nuxt => loin
- [x] Implémenter les spécificités Astro (login, activation de compte, reset de mot de passe, profil)
- [x] Pages publiques : accueil, inscription, ville, session + détail, contact, formulaire d'inscription, formulaire coach, mon compte
- [ ] `/{lang}/session` affiche un texte de debug (`StubPage`) : cette page n'avait pas de contenu en legacy, décider 404 ou redirection

### Backend @Istvan

Migration du backend vers calls aux endpoint Pb out-of-the-box et ajout de routes via pb hooks en typescript qd c'est pas possible ou trop compliqué. Au pire => migration quasi 1:1 du backend nuxt sur hooks pb.

- [x] Approche validée : endpoints PB natifs + hooks JSVM ciblés (`attendees`, `subscriptions`, `impersonate`, `legacy_auth`, `settings`, `users`)
- [x] Règles métier côté serveur : fenêtre d'inscription, capacité, compteurs dénormalisés, feuille de présence
- [x] Emails : activation, reset de mot de passe (templates PB en migration), candidature coach (endpoint Astro)

### Admin @Joël

Migration de l'UI et du backend. Décision prise : on reste sur **Element Plus**.

- [x] SPA admin (auth guard, sidebar, layout `EntityView` aligné sur la prod)
- [x] CRUD Events, Cities, Locations, EventTypes, EventProposers, Sponsors, Users
- [x] Validation de compte (bascule `verified`), impersonation
- [x] Exports CSV (utilisateurs, observateurs/inscrits par ville, statistiques, inscrits par session)
- [x] Import CSV de sessions, fusion de lieux, dialog des inscrits
- [x] Dashboard (page d'accueil minimale, comme en prod)

### Infra @Istvan

La migration se fait sur never.urban-training.ch

- [x] Déploiement automatisé sur push `main` (build + migrations PB via les workflows `jota-one/infra`)
- [x] Environnement de démo `never.urban-training.ch` en ligne
- [ ] Préparer un vps dédié pour la prod
- [ ] Mettre en environnement de dev et un de prod (develop.urban-training.ch et www.urban-training.ch)
- [ ] Si le domaine n'est pas chez Infomaniak => le bouger au plus vite si possible, sinon, prévoir un plan de migration avec des dates pour pouvoir prévenir Matthieu le jour où on est prêt à switcher (y aura sûrement du downtime)
- [ ] S'assurer que lesles anciens redirects ne sont plus possible, sinon les gérer si possible via caddy — les ~22 redirections 301 du site actuel ne sont reprises nulle part pour l'instant

## Décisions actées

- **Element Plus conservé** pour l'admin (pas de migration vers PrimeVue)
- **CMS abandonné** : plus de contenu ni de labels en base, les pages sont des composants Astro et les traductions des fichiers JSON — l'admin CMS (pages, contenus) n'est donc pas migré
- **Page Sponsors dédiée abandonnée** : remplacée par le bandeau de logos en bas des pages ville
- **Teasers non migrés** : pas de gestion en base ni d'admin, le contenu reste dans la page
- **Doublons d'utilisateurs** : plus de détection ni de fusion dans l'admin — les doublons legacy sont fusionnés à l'import et l'unicité de l'e-mail est garantie par PocketBase
- **Validation de mot de passe en attente** : notion abandonnée, remplacée par le flux de réinitialisation PocketBase
- **Backend** : endpoints PocketBase natifs par défaut, hooks JSVM uniquement quand la logique métier l'exige

## Priorités

Certaines tâches doivent être faites en 1er lieu et ensebmle pour que tout le reste puisse avancer:

1. ~~Valider sur la façon de faire le backend~~ — fait : endpoints PB + hooks JSVM
2. ~~Chacun démarre son lane~~ — fait, Data / UI / Backend / Admin sont largement avancés
3. ~~On garde l'admin pour la fin~~ — l'admin est en place ; il reste l'infra de prod, qui devient la priorité

## Choses importantes à prendre en compte

- Ne pas garder les labels en base (fait : traductions dans `src/translations/*.json`)
- Ne pas implémenter les conneries (du genre table Sessions doit s'appeler Events ds le nouveau site)
- Questionner certaines choses qu'on a automatisée mais qu'ona pas besoin de garder automatique (genre les teasers) — tranché : teasers non migrés
- Prendre en compte / garder en tête les modifs qu'on a fait le plus souvent (modifier labels, images)

## History

- [2026-06-12] Port user profile page — composables, components, utils, styles migrés depuis Nuxt ; page `mon-compte` fonctionnelle avec formulaire profil et onglet villes
- [2026-06-12] Collections PocketBase cities — `ut_cities` + `ut_city_watchers`, commande `import-cities`, watching/unwatching de villes opérationnel
- [2026-06-12] Sessions page — liste des sessions avec filtres, navigation par date, page détail et inscription/désinscription
- [2026-06-21] Admin SPA — interface CRUD complète pour Events, Cities, Locations, EventTypes et Users ; auth guard, sidebar, migrations PocketBase pour corriger les règles de collection
- [2026-06-22] Formulaire d'inscription — création de compte depuis le site avec améliorations UX
- [2026-06-24] Activation de compte et réinitialisation de mot de passe — templates d'e-mails migrés, réglages PocketBase définis en IaC
- [2026-06-24] Profil — changement de mot de passe pour les utilisateurs connectés ; règles de validation du formulaire d'inscription
- [2026-06-24] Ajout du suivi d'audience Plausible
- [2026-06-27] Fix session — état d'authentification résiduel dans le navigateur après déconnexion, vérification de session à l'initialisation
- [2026-07-05] Passage à Astro 7 — correctifs de styles (utilitaires Tailwind à nouveau générés, résolution des imports CSS, imbrication CSS vs styles scoped Vue)
- [2026-07-05] Sessions — désinscription depuis une modale globale, filtrage des sessions passées, retrait réactif des sessions désinscrites dans le profil
- [2026-07-05] Sessions — fenêtre d'inscription et capacité vérifiées côté serveur, compteurs d'inscrits tenus à jour automatiquement
- [2026-07-05] Admin — refonte esthétique des listes (layout aligné sur la prod Nuxt : recherche pleine largeur, actions icônes, sélecteur de langue)
- [2026-07-07] Import des données legacy — scripts villes et sessions, commande unifiée `ut:import`, garde-fous (serveur arrêté, fichiers orphelins ignorés)
- [2026-07-07] Admin — exports CSV (utilisateurs, observateurs/inscrits par ville et globaux, statistiques de présence, inscrits par session)
- [2026-07-08] Admin — alignement des exports CSV sur la prod : booléens en `1`/vide, labels des menus d'export villes, colonne staff dans les statistiques, colonnes location/adresse/type d'event/rue dans l'export inscriptions
- [2026-07-09] Admin — import CSV de sessions (upload, préviz avec erreurs par cellule, fusion multi-langues, récurrence, détection de doublons) ; fix index unique `legacy_id` qui bloquait toute 2e création admin (cities, locations, types, events)
- [2026-07-09] Admin — dialog des inscrits par session (clic sur le compteur : liste coach/nom/e-mail/présence, copie des e-mails, export CSV)
- [2026-07-09] Admin — fusion de lieux (re-pointage des sessions vers un lieu de destination, ville dénormalisée mise à jour)
- [2026-07-10] Fix création d'utilisateur — le champ `id` de `ut_users` n'était plus auto-généré, toute création échouait (admin inclus)
- [2026-07-10] Admin — gestion des proposants de sessions (CRUD, activation/désactivation)
- [2026-07-10] Import users — fusion des comptes legacy en doublon d'email (survivant = compte à l'inscription la plus récente, rôle le plus élevé conservé) ; les inscriptions et villes suivies des comptes fusionnés sont récupérées (~8000 inscriptions perdues auparavant)
- [2026-07-10] Feuille de présence (coach) — modal de pointage des inscrits sur la page session (présent/absent, compteur, validation), routes PB dédiées réservées staff/admin ; l'état "non pointé" legacy est préservé (`presence_checked`)
- [2026-07-10] Sponsors — gestion en DB via l'admin (logo, lien, global ou par villes, activation) et bandeau de logos en bas des pages ville ; import des sponsors legacy avec leurs logos (`ut:import-sponsors`) ; la page Sponsors dédiée est abandonnée
- [2026-07-10] Impersonation admin — bouton "se connecter en tant que" dans la liste des utilisateurs, bannière sur le site avec retour au compte admin en un clic (repersonate, impossible dans l'ancien système)
- [2026-07-10] Fix recherche par email dans l'admin Utilisateurs — le filtre email était silencieusement ignoré (`emailVisibility` requis par PocketBase pour filtrer le champ email)
- [2026-07-10] Admin sponsors — limite de 150 Ko sur les logos uploadés (refus immédiat dans le dialog + validation serveur)
- [2026-07-14] Import legacy — temps d'import fortement réduit (jointures quadratiques éliminées)
