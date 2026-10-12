# Migration UT to Pocketbase/Astro stack

La version pb tourne sur `never.urban-training.ch` (DEV) et sur `next.urban-training.ch`, le futur environnement de prod, en attendant la bascule de `www.urban-training.ch`.

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
- [x] E-mails d'activation et de réinitialisation : ils ne partaient pas sur `never` ni sur `next` (configuration SMTP incomplète, envoi vers un Mailpit inexistant). Ils passent maintenant par l'API Mandrill comme le formulaire coach et le legacy, avec des liens vers le domaine de l'app — réception vérifiée sur `never`
- [x] Suivi des clics et des ouvertures Mandrill désactivé, pour que les liens à jeton ne soient plus journalisés chez un tiers
- [ ] Emails transactionnels en français uniquement, avec des liens codés en dur sur `/fr/` (`{APP_URL}/fr/inscription/activation`) : un utilisateur de/en reçoit un mail français et atterrit sur la page française
- [x] Sécurité — un membre ne peut plus se donner un autre rôle (ni à la création du compte, ni en modifiant son profil) ni toucher aux champs de l'import legacy
- [x] Sécurité — un membre ne peut plus inscrire quelqu'un d'autre, s'inscrire comme coach sans en avoir le rôle, ni pointer sa propre présence
- [x] Fuseau horaire : les dates des sessions sont saisies en heure suisse alors que les serveurs tournent en UTC — les inscriptions restaient ouvertes jusqu'à 2 h après le début d'une session. `never` et `next` tournent désormais à l'heure suisse (option `timezone` de `jota-one/infra`)
- [x] Adresse d'expédition unifiée sur celle du legacy, `administration@urban-training.ch`
- [ ] Un envoi d'e-mail en échec n'est visible que dans les logs PocketBase : la demande d'activation ou de réinitialisation répond quand même OK à l'utilisateur

### Admin @Joël

Migration de l'UI et du backend. Décision prise : on reste sur **Element Plus**.

- [x] SPA admin (auth guard, sidebar, layout `EntityView` aligné sur la prod)
- [x] CRUD Events, Cities, Locations, EventTypes, EventProposers, Sponsors, Users
- [x] Validation de compte (bascule `verified`), impersonation
- [x] Exports CSV (utilisateurs, observateurs/inscrits par ville, statistiques, inscrits par session)
- [x] Import CSV de sessions, fusion de lieux, dialog des inscrits
- [x] Dashboard (page d'accueil minimale, comme en prod)

### Infra @Istvan

`never.urban-training.ch` reste l'environnement de DEV ; la prod tourne sur un VPS dédié, exposé sur `next.urban-training.ch` jusqu'à la bascule de `www`.

- [x] Déploiement automatisé sur push `main` (build + migrations PB via les workflows `jota-one/infra`)
- [x] Environnement de démo `never.urban-training.ch` en ligne
- [x] VPS dédié pour la prod — `jota-apps-3-infomaniak`, l'app y est déployée sur `next.urban-training.ch` (2026-10-09)
- [ ] Séparer DEV et PRD : `never` et `next` suivent aujourd'hui tous les deux la branche `main`, chaque push part donc directement en prod — faire suivre `develop` à `never` et réserver `main` à la prod (flux PRD Release `develop` → `main`)
- [x] Domaine chez Infomaniak — zone DNS et registrar migrés depuis OVH le 2026-09-18, sans aucune coupure du site ni des mails : il n'y a personne à prévenir d'un downtime
- [x] DNSSEC réactivé — fait automatiquement par Infomaniak à la reprise du domaine le 2026-09-18 : zone signée en algorithme 13 (ECDSA), DS correspondant publié au registre, validation vérifiée sur Google, Cloudflare et Quad9
- [ ] Durcir l'authentification mail du domaine : DMARC de `p=none` à `p=quarantine` (collecte `rua` en cours depuis le 2026-09-17), puis SPF de `?all` à `~all` — deux changements séparés, jamais le même jour
- [x] Renouvellement du domaine sous contrôle — renouvellement automatique actif chez Infomaniak et désactivé chez OVH, plus aucune facturation possible de leur côté (échéance fin octobre 2026)
- [ ] S'assurer que lesles anciens redirects ne sont plus possible, sinon les gérer si possible via caddy — les ~22 redirections 301 du site actuel ne sont reprises nulle part pour l'instant

### Tests E2E

Suite Playwright dans `tests/e2e`, lancée à la main en local (`./tests/e2e/run.sh`) sur une copie des données de prod, avec Mailpit pour les e-mails. Elle ne tourne pas en CI. Dernier run le 2026-10-11 : 40 tests verts, 1 sauté (session pleine, faute de session à venir avec des inscrits dans les données locales).

- [x] Visiteur : chargement des pages publiques, redirection de `/`, page ville et page session, formulaire d'inscription (champs, bouton désactivé, e-mail d'activation, e-mail déjà utilisé)
- [x] Membre : inscription et désinscription à une session, compteur du header, modale de confirmation, session pleine, session passée, suivi d'une ville, redirection vers la connexion pour un visiteur
- [x] Membre : désinscription depuis le profil, sessions passées masquées, inscription à une session passée refusée côté serveur
- [x] Concurrence : 3 membres pour la dernière place, un seul l'obtient
- [x] Admin : exports CSV utilisateurs, observateurs et inscrits d'une session

À ajouter avant la bascule :

- [x] Suite remise au vert : la recherche de sessions des tests comparait les dates à l'heure UTC et prenait des sessions déjà commencées pour des sessions ouvertes (8 échecs), et `/fr/sponsors`, page abandonnée, était encore testée
- [ ] README des tests à remettre à jour (noms de fichiers, specs profil et admin)
- [ ] Le test d'inscription laisse un compte `e2e+…@example.com` à chaque run (19 en base locale) : les supprimer en fin de test
- [ ] Test de session pleine : ne plus dépendre d'une session à venir avec des inscrits, créer la situation pour le test
- [ ] Export CSV des utilisateurs : dépasse parfois les 30 s du test quand la suite complète tourne (57 000 comptes) — vérifier la durée réelle pour un admin avant d'augmenter le délai
- [ ] Compte de test au vrai rôle membre : le compte « membre » actuel est superadmin, les specs membre ne vérifient donc pas ce qu'un membre a le droit de faire
- [x] Droits d'accès d'un membre : rôle, champs legacy, inscription d'un tiers, inscription comme coach, présence, et non-régression sur ce qui était déjà bloqué (utilisateurs et inscriptions des autres, modification d'une session, feuille de présence, impersonation, admin)
- [ ] Connexion par l'interface : connexion, déconnexion, mauvais mot de passe, et surtout connexion d'un compte importé avec son ancien mot de passe (cas de tous les utilisateurs le jour de la bascule)
- [ ] Mot de passe oublié de bout en bout : demande, e-mail, nouveau mot de passe, connexion
- [ ] Activation : vérifier que le compte est réellement activé et peut se connecter (aujourd'hui seule l'absence d'erreur dans l'URL est testée)
- [ ] Coach : feuille de présence (pointage présent/absent, enregistrement), inscription comme coach
- [ ] Smoke test en lecture seule, lançable sur `next` avant la bascule DNS puis sur `www` juste après : pages publiques en fr/de/en, une page ville, une page session, ouverture de la connexion
- [ ] Anciennes URLs : chacune des ~22 redirections 301 arrive sur la bonne page, une fois les règles Caddy en place

Ensuite :

- [ ] Versions allemande et anglaise : pages et sélecteur de langue
- [ ] Profil : modification des infos, changement de mot de passe, onglet des villes suivies
- [ ] Page ville : liste des sessions, filtres, navigation par date, bandeau sponsors
- [ ] Formulaire coach et page contact : validation et envoi
- [ ] Admin : création, modification et suppression d'une session, validation d'un compte, impersonation et retour, import CSV de sessions, fusion de lieux, liste des inscrits
- [ ] Affichage mobile (menu hamburger) et page 404
- [ ] Faire tourner la suite en CI sur un jeu de données de test, sans dépendre d'une copie des données de prod

### Bascule

- [x] Failles de droits d'accès corrigées
- [x] Fuseau horaire des serveurs corrigé
- [ ] Couverture E2E « avant la bascule » ci-dessus au vert
- [ ] Import final des données legacy sur la prod (`ut:import` sur un dump frais), après gel des inscriptions sur l'ancien site
- [ ] Redirections des anciennes URLs en place et testées
- [ ] Bascule DNS de `www.urban-training.ch` vers le nouveau VPS, puis smoke test sur `www`
- [ ] Passer le `domain` de l'app de prod à `www.urban-training.ch` dans `jota-one/infra` : les liens des e-mails d'activation et de réinitialisation suivent ce domaine
- [ ] Mettre à jour la sonde de monitoring (aujourd'hui `www.urban-training.ch/fr`) si l'URL de référence change

## Décisions actées

- **Element Plus conservé** pour l'admin (pas de migration vers PrimeVue)
- **CMS abandonné** : plus de contenu ni de labels en base, les pages sont des composants Astro et les traductions des fichiers JSON — l'admin CMS (pages, contenus) n'est donc pas migré
- **Page Sponsors dédiée abandonnée** : remplacée par le bandeau de logos en bas des pages ville
- **Teasers non migrés** : pas de gestion en base ni d'admin, le contenu reste dans la page
- **Doublons d'utilisateurs** : plus de détection ni de fusion dans l'admin — les doublons legacy sont fusionnés à l'import et l'unicité de l'e-mail est garantie par PocketBase
- **Validation de mot de passe en attente** : notion abandonnée, remplacée par le flux de réinitialisation PocketBase
- **Backend** : endpoints PocketBase natifs par défaut, hooks JSVM uniquement quand la logique métier l'exige
- **Environnements** : `never.urban-training.ch` reste le DEV, pas de `develop.urban-training.ch` ; la prod passe par `next.urban-training.ch` puis `www`

## Priorités

Certaines tâches doivent être faites en 1er lieu et ensebmle pour que tout le reste puisse avancer:

1. ~~Valider sur la façon de faire le backend~~ — fait : endpoints PB + hooks JSVM
2. ~~Chacun démarre son lane~~ — fait, Data / UI / Backend / Admin sont largement avancés
3. ~~On garde l'admin pour la fin~~ — l'admin est en place ; il reste l'infra de prod, qui devient la priorité
4. VPS de prod en place : la priorité est maintenant la couverture E2E et la préparation de la bascule (voir Tests E2E et Bascule)

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
- [2026-09-18] Domaine migré d'OVH vers Infomaniak — zone DNS et registrar, sans aucune coupure du site ni des mails ; DNSSEC désactivé au préalable pour éviter une panne de résolution totale, et la clé DKIM Mandrill et l'include SPF, tous deux absents de la zone Infomaniak, rétablis
- [2026-10-09] VPS dédié pour la prod — l'app tourne sur `next.urban-training.ch` en attendant la bascule de `www` ; `never` reste l'environnement de DEV
- [2026-10-11] Sécurité — un membre ne peut plus se promouvoir admin, s'inscrire comme coach sans en avoir le rôle, inscrire un autre utilisateur ni pointer sa présence ; couvert par une nouvelle spec E2E des droits d'accès
- [2026-10-12] E-mails — activation et réinitialisation de mot de passe à nouveau envoyées sur les serveurs (elles ne partaient pas), via l'API Mandrill, sans suivi des clics et depuis l'adresse du legacy
- [2026-10-12] Fuseau horaire — `never` et `next` tournent à l'heure suisse : les inscriptions se ferment de nouveau au début de la session et ouvrent à l'heure prévue
