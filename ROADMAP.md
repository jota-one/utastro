# Migration UT to Pocketbase/Astro stack

La version pb tourne sur `never.urban-training.ch` (DEV) et sur `next.urban-training.ch`, le futur environnement de prod, en attendant la bascule de `www.urban-training.ch`.

## Dev Lanes

### Data @Joël

Migration de mariadb vers pocketbase (tables + données) via migrations ré-excutables.

- [x] Collections PocketBase (users, cities, locations, events, event_types, event_proposers, subscriptions, city_watchers, sponsors)
- [x] Imports legacy ré-exécutables : `ut:import` (cities, events, users, sponsors)
- [x] Fusion des comptes legacy en doublon d'email à l'import
- [x] Teasers : décision prise de ne pas les migrer (voir Décisions actées)
- [x] Import sur le serveur scripté de bout en bout (`docs/data-import.md`) : export des 15 tables utiles et des logos sponsors depuis ton poste (`scripts/export-mariadb.sh`), puis import sur le VPS (`scripts/import-on-server.sh`) avec sauvegarde, retour arrière automatique en cas d'échec, purge des données brutes du legacy et smoke test
- [x] Répétition générale sur `never` le 2026-10-13 : 58 426 comptes, 15 878 sessions, 241 098 inscriptions ; environ 4 min de coupure ; connexion avec d'anciens mots de passe vérifiée sur deux comptes réels

### UI @Istvan

Migration du site web Vue de nuxt à astro (SSR).

- [x] Déconstruire le CMS (inline edit, etc) — les 10 pages legacy sont désormais des routes Astro statiques (`src/routes.ts`), plus de contenu en base
- [x] Spécificités nuxt => loin
- [x] Implémenter les spécificités Astro (login, activation de compte, reset de mot de passe, profil)
- [x] Pages publiques : accueil, inscription, ville, session + détail, contact, formulaire d'inscription, formulaire coach, mon compte
- [x] `/{lang}/session` affichait un texte de debug (`StubPage`) : redirigée vers la page inscription de la langue par Caddy

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
- [x] Connexion des comptes importés : un ancien mot de passe contenant un emoji (ou tout caractère hors du plan de base) ne correspondait jamais à son empreinte legacy
- [x] Fiche session : après s'être inscrit ou désinscrit, le compteur de coachs (et le compteur d'inscrits qui décide si la session est pleine) affichait une valeur fausse jusqu'au rechargement de la page
- [x] **Les sites `next` et `never` partageaient la base de `never`** : l'URL de PocketBase était compilée dans le build depuis le `.env` du dépôt. `next` affichait les données de `never` et y aurait écrit les inscriptions, comme `www` après la bascule. Chaque site utilise désormais sa propre base, sur son propre domaine
- [x] Page d'activation ouverte sans jeton : le cadre d'erreur s'affichait sans texte
- [x] Import CSV de sessions : une fin de récurrence au format suisse (`30.11.2026`) figeait l'onglet de l'admin (boucle sans fin), et une date impossible (`2026-13-45`) passait pour une date de 2027 — la ligne est désormais signalée en erreur dans l'aperçu
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

- [x] Déploiement automatisé (build + migrations PB via les workflows `jota-one/infra`) : push `develop` → `never`, push `main` → prod
- [x] Environnement de démo `never.urban-training.ch` en ligne
- [x] VPS dédié pour la prod — `jota-apps-3-infomaniak`, l'app y est déployée sur `next.urban-training.ch` (2026-10-09)
- [x] DEV et PRD séparés : `never` suit `develop`, la prod suit `main` ; une mise en prod passe par une PR « PRD Release » `develop` → `main`
- [x] Domaine chez Infomaniak — zone DNS et registrar migrés depuis OVH le 2026-09-18, sans aucune coupure du site ni des mails : il n'y a personne à prévenir d'un downtime
- [x] DNSSEC réactivé — fait automatiquement par Infomaniak à la reprise du domaine le 2026-09-18 : zone signée en algorithme 13 (ECDSA), DS correspondant publié au registre, validation vérifiée sur Google, Cloudflare et Quad9
- [x] DMARC en `p=quarantine` depuis le 2026-09-19 — trois analyses des rapports `rua` (17 septembre, 26 septembre, 12 octobre) : toutes les sources légitimes sont alignées (Newsletter Infomaniak via Amazon SES, Mandrill, mail Infomaniak), y compris la campagne du 1er octobre envoyée sous `quarantine` (4 476 messages conformes sur 4 480)
- [ ] DMARC en `p=reject`, après la bascule : attendre une série de rapports où les e-mails de l'app, qui passent désormais par l'API Mandrill, apparaissent alignés — ne pas cumuler les deux changements. Coût connu : les quelques newsletters transférées automatiquement par leur destinataire et dont la signature casse en route (4 sur 4 480 le 1er octobre) seraient rejetées au lieu d'aller en spam
- [ ] SPF de `?all` à `~all` — de l'hygiène : la Newsletter et Mandrill utilisent leur propre domaine d'enveloppe, ce SPF ne couvre que le mail Infomaniak direct, déjà conforme
- [x] Renouvellement du domaine sous contrôle — renouvellement automatique actif chez Infomaniak et désactivé chez OVH, plus aucune facturation possible de leur côté (échéance fin octobre 2026)
- [x] Anciennes URLs redirigées par Caddy (clé `caddy` de l'app dans `apps.yaml`, sur `never` et `next`) : les 22 redirections du legacy, la page Sponsors abandonnée et `/{lang}/session`

### Tests E2E

Suite Playwright dans `tests/e2e`, lancée à la main en local (`./tests/e2e/run.sh`) sur une copie des données de prod, avec Mailpit pour les e-mails. Elle ne tourne pas en CI. Dernier run le 2026-10-12 : 53 tests verts, plus aucun sauté. Les tests créent leurs propres comptes et sessions et les suppriment ensuite : seul un compte admin est à configurer.

- [x] Visiteur : chargement des pages publiques, redirection de `/`, page ville et page session, formulaire d'inscription (champs, bouton désactivé, e-mail d'activation, e-mail déjà utilisé)
- [x] Membre : inscription et désinscription à une session, compteur du header, modale de confirmation, session pleine, session passée, suivi d'une ville, redirection vers la connexion pour un visiteur
- [x] Membre : désinscription depuis le profil, sessions passées masquées, inscription à une session passée refusée côté serveur
- [x] Concurrence : 3 membres pour la dernière place, un seul l'obtient
- [x] Admin : exports CSV utilisateurs, observateurs et inscrits d'une session

À ajouter avant la bascule :

- [x] Suite remise au vert : la recherche de sessions des tests comparait les dates à l'heure UTC et prenait des sessions déjà commencées pour des sessions ouvertes (8 échecs), et `/fr/sponsors`, page abandonnée, était encore testée
- [x] README des tests à jour
- [x] Les tests suppriment les comptes qu'ils créent (le test d'inscription en laissait un à chaque run) ; les comptes `e2e+…@example.com` déjà créés ont été purgés de la base locale
- [x] Session pleine et course à la dernière place : chacune sur une session créée et remplie pour le test, au lieu de modifier la capacité d'une vraie session ; le refus côté serveur est aussi vérifié
- [x] Export CSV des utilisateurs : environ 13 s pour 57 000 comptes, délai du test porté à 90 s ; ses échecs venaient de redémarrages intempestifs du PocketBase local, pas de la durée de l'export
- [x] Specs membre jouées par un vrai membre : chaque test crée son propre compte au rôle `user` et le supprime ensuite ; le compte de test du `.env` ne sert plus qu'aux specs admin
- [x] Droits d'accès d'un membre : rôle, champs legacy, inscription d'un tiers, inscription comme coach, présence, et non-régression sur ce qui était déjà bloqué (utilisateurs et inscriptions des autres, modification d'une session, feuille de présence, impersonation, admin)
- [x] Connexion par l'interface : connexion, maintien après rechargement, déconnexion, mauvais mot de passe, compte pas encore activé
- [x] Comptes importés : connexion avec l'ancien mot de passe (simple, accentué, emoji, court), migration vers un mot de passe PocketBase, mauvais mot de passe refusé
- [x] Mot de passe oublié de bout en bout : demande depuis la modale, e-mail, lien vers le bon site, nouveau mot de passe, connexion ; un lien ne sert qu'une fois
- [x] Activation : lien vers le bon site, compte réellement activé, connexion refusée avant et acceptée après
- [x] Coach : inscription et désinscription comme coach avec le compteur, feuille de présence réservée aux coachs de la session, pointage présent/absent enregistré
- [x] Smoke test en lecture seule (`specs/smoke`), lançable sur `next` avant la bascule DNS puis sur `www` juste après : pages en fr/de/en, page ville, page session, le site appelle sa propre API, ouverture de la connexion, pages d'activation et de réinitialisation
- [x] Anciennes URLs : spec `04-redirects`, 31 redirections vérifiées sur `never` et `next` (à lancer contre un site déployé, Caddy n'existant pas en local)

Pas encore couvert :

- [ ] Site public — page ville : filtres des sessions, navigation par date (option désactivée), carte Google Maps, bandeau des sponsors (liens activables) ; accueil : contenu, teasers, carte des villes
- [ ] Site public — versions allemande et anglaise au-delà du chargement des pages : textes, liens entre pages, e-mails (aujourd'hui en français seulement)
- [ ] Site public — affichage mobile (menu hamburger), page 404, redirection d'un ancien identifiant numérique de session (`/fr/session/36` → 301)
- [ ] Profil : modification des informations, changement de mot de passe, onglet des villes suivies (ajout et retrait), compteurs du header (villes, sessions, coaching)
- [ ] Formulaire coach : validation, pièces jointes, envoi de l'e-mail (captcha désactivé en local)
- [ ] Coach : validation finale de la feuille de présence (option désactivée), désinscription comme coach depuis le profil
- [ ] Impersonation : se connecter en tant qu'un utilisateur depuis l'admin, bannière, retour au compte admin (seul le refus pour un membre est testé)
- [ ] Admin sessions : création, modification, suppression, filtres et recherche, liste des inscrits (copie des e-mails, export)
- [ ] Admin utilisateurs : recherche par e-mail, création, modification, validation du compte, suppression
- [ ] Admin villes, lieux, types d'activité, proposants : création, modification, activation, suppression ; fusion de lieux ; exports par ville et statistiques (seul l'export global des personnes intéressées est testé)
- [ ] Admin sponsors : création avec logo, limite de 150 Ko, sponsor global ou par villes, activation, affichage sur les pages ville
- [ ] E-mails réellement envoyés par Mandrill (testé à la main sur `never`, les tests passent par Mailpit) ; rapport d'erreur d'envoi
- [ ] Page de maintenance et retour automatique (testés à la main sur `never`, pas de spec)
- [ ] Faire tourner la suite en CI sur un jeu de données de test, sans dépendre d'une copie des données de prod

### Bascule

- [x] Failles de droits d'accès corrigées
- [x] Fuseau horaire des serveurs corrigé
- [x] Couverture E2E « avant la bascule » ci-dessus au vert
- [ ] `next` est vide (aucune ville ni session) : il affichait jusqu'ici les données de `never`, il montre désormais sa propre base — le smoke test y restera rouge sur la page ville et la page session jusqu'à l'import
- [x] Page de maintenance (`public/maintenance.html`, en fr/de/en) servie par Caddy avec un code 503 dès que l'app ne répond pas — import, déploiement ou panne ; elle se recharge d'elle-même au retour du site. Testée sur `never`. Le monitoring continue de signaler le site en panne (« HTTP 503 »)
- [x] Caddy officiel sur tous les serveurs : `jota-apps-3` tournait avec le Caddy 2.6 de Debian, qui refusait la config — le provisionnement installe désormais la version officielle
- [x] Bascule scriptée étape par étape (`scripts/switchover.sh`, marche à suivre dans `docs/switchover.md`) : gel du nouveau site, attente du DNS, merge de la PR de bascule, arrêt de l'ancien site, export, import, smoke test sur `www`, nettoyage — répétée sur `never` le 2026-10-13 (moins de 6 min de maintenance, export compris)
- [x] Redirection `urban-training.ch` et `next.urban-training.ch` → `www`, et liens des e-mails sur `www` : prêts dans la PR de bascule `jota-one/infra#30` (brouillon, à merger seulement le jour J après la bascule DNS)
- [ ] Jour J : suivre `docs/switchover.md` — seuls le changement DNS chez Infomaniak et la vérification d'une connexion avec un ancien compte restent manuels
- [x] Redirections des anciennes URLs en place et testées
- [x] Sonde de monitoring : rien à changer, elle surveille déjà `www.urban-training.ch/fr`

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
- [2026-10-12] Connexion — les comptes importés dont l'ancien mot de passe contient un emoji peuvent se connecter
- [2026-10-12] Sessions — le compteur de coachs de la fiche session est juste après une inscription ou une désinscription
- [2026-10-12] Tests E2E — connexion, comptes importés, mot de passe oublié, activation et feuille de présence coach couverts
- [2026-10-12] DMARC — 3e analyse des rapports (24 septembre → 11 octobre, 4 560 messages) : la campagne newsletter du 1er octobre est passée sous `p=quarantine`, aucune usurpation, seuls 2 transferts automatiques mis en quarantaine
- [2026-10-12] Anciennes URLs — les adresses du site actuel (redirections legacy, page Sponsors, liste des sessions) mènent aux bonnes pages du nouveau site sur `never` et `next`
- [2026-10-12] Prod — `next` utilise sa propre base de données au lieu de celle de `never` (et `www` après la bascule) ; smoke test en lecture seule des sites déployés
- [2026-10-13] Import des données — export et import sur le serveur scriptés de bout en bout ; répétition générale sur `never` avec des données fraîches, environ 4 min de coupure
- [2026-10-13] Page de maintenance — affichée automatiquement quand le site est arrêté (import, déploiement, panne) et retirée d'elle-même à son retour
- [2026-10-13] Bascule — scriptée étape par étape et répétée sur `never` ; l'adresse `www` et les redirections de `urban-training.ch` sont prêtes à être activées le jour J
- [2026-10-13] Admin — l'import CSV de sessions ne fige plus l'onglet sur une date de fin de récurrence mal formée ; parcours complet de l'import couvert par les tests E2E
- [2026-10-13] Tests E2E — toutes les specs membre jouées par de vrais comptes membre jetables ; inventaire complet de ce qui reste à couvrir
- [2026-10-14] Environnements — `never` déployé depuis `develop`, la prod uniquement depuis `main` via une PR de release
