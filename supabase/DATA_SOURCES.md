# État des sources de données (mock vs Supabase)

Audit des pages du back-office : lesquelles lisent Supabase, lesquelles
utilisent encore des données fictives (mock), et pourquoi.

Mode actuel : `NEXT_PUBLIC_USE_MOCKS=false` → mode réel (Supabase) activé.

---

## ✅ Branché sur Supabase (données réelles)

| Domaine | Service | Table(s) |
|---|---|---|
| Événements | `eventService` | `events`, `events_public_view` |
| Types de billets | `ticketService.allWithEvents` | `ticket_types`, `tickets` |
| Organisations | `organizationService` (+ création du compte de connexion) | `organizations`, `auth.users`, `profiles` |
| Catégories | `categoryService.all`, `eventService.categories` | `categories` |
| Commandes | `orderService` | `orders` (+ `events`, `tickets`) |
| Abonnements / Plans / Promotions | `subscriptionService`, `planService`, `subscriptionPromotionService` | `subscriptions`, `subscription_plans`, `subscription_promotions`, `subscription_payments` |
| Tableau de bord (KPIs) | `dashboardService` | Fonctions RPC `sa_kpis`, `subscription_kpis`, `admin_kpis` (`supabase/analytics.sql`) |
| Analytics (graphes) | `analyticsService` | Fonctions RPC d'agrégation (`supabase/analytics.sql`) |
| Administrateurs | `adminService` | Vue `admins_view` (`profiles` + `organizations`) |
| Utilisateurs finaux | `userService` | Vue `end_users_view` (`auth.users` + `tickets`/`orders`) |
| Paiements (billetterie) | `paymentService` | Vue `payments_view` (dérivée de `orders`) |
| Types d'événement | `eventTypeService` | Table `event_types` |
| Licences | `licenseService` | Table `licenses` |
| Notifications | `notificationService` | Table `notification_campaigns` |
| Articles | `articleService` | Table `articles` |
| Promotions (billetterie) | `promotionService` | Table `promotions` |
| Upload d'images | `mediaService` | Storage `event-images` |

Filtres "Organisation" et "Catégorie" des pages Événements et Paiements :
désormais alimentés par les services réels (plus de mock).

**Il n'y a plus aucun service en mode mock en production.** Les vues sont
dérivées (données réelles immédiates) ; les tables de contenu (`event_types`,
`licenses`, `notification_campaigns`, `articles`, `promotions`) sont VIDES au
départ — les pages affichent "aucune donnée" jusqu'à ce que du contenu soit
créé, au lieu d'afficher de fausses données.

---

## ⚠️ Détails partiels

- **`eventService.ordersFor(eventId)`** (détail d'un événement) : reste en
  mock. Peut être branché sur `ordersRepo` (filtrer par `event_id`) si besoin.
- **Page Commandes (`/orders`)** : le service est branché, mais nécessite les
  policies RLS `orders_read_organizer` / `tickets_read_organizer` du fichier
  `setup_rls_and_storage.sql`. Sans elles, la RLS `orders_rw_owner` (migration
  0007) limite la lecture à l'acheteur → la page reste vide côté organisateur.
- **Catégories** : `name` et `icon` sont réels ; `description` et
  `organizationsCount` valent 0 (colonnes absentes du schéma). `eventsCount`
  est calculé. Ajouter ces colonnes à la table `categories` si nécessaire.
- **Nom/email du client dans les commandes** : `customerEmail` reste vide et
  `customerName` provient de `tickets.holder_name` (l'identité de l'acheteur
  `auth.users` n'est pas exposée au back-office).
- **Administrateurs** : `licenseType`/`licenseStatus` par défaut (pas encore
  reliés à la table `licenses`). `revenue` et `eventsCount` sont réels.
- **Utilisateurs finaux** (`end_users_view` → fonction `list_end_users`
  `security definer`, réservée au Super Admin) : `region` est vide (non
  collectée au signup) ; `ticketsPurchased`/`totalSpent` sont réels.
- **Types d'événement** : le filtre "Type" a été retiré de la page Événements
  (la table `events` n'a pas de colonne `event_type_id`). La table
  `event_types` alimente la page `/event-types`.
- **Tolérance** : `content.ts` renvoie des listes vides (au lieu de planter) si
  les vues/tables ne sont pas encore créées.

---

## Actions de création / édition (écriture) qui persistent

| Page | Actions branchées sur Supabase |
|---|---|
| Catégories | Créer, Modifier, Supprimer (table `categories`) |
| Types d'événement | Créer, Modifier, Supprimer (table `event_types`) |
| Notifications | Créer (brouillon ou programmée) (table `notification_campaigns`) |
| Articles | Créer (brouillon / publier), Supprimer (table `articles`) |
| Promotions | Créer, Supprimer (table `promotions`) |
| Événements | Créer / Publier / Modifier / Supprimer + billets (déjà en place) |
| Organisations | Créer (+ compte de connexion), Modifier (déjà en place) |
| Plans / Promotions d'abonnement | CRUD complet (déjà en place) |

Toutes ces actions utilisent des formulaires à **champs contrôlés**, appellent
le service réel, affichent un toast de succès/erreur et **rafraîchissent la
liste** (react-query `invalidateQueries` / `refetch`).

### Volontairement NON mutable (par conception)
- **Administrateurs / Utilisateurs / Paiements** : ce sont des **vues** dérivées
  (lecture seule). Les anciennes actions « suspendre / activer / supprimer »
  étaient de faux toasts ; elles n'ont pas été reliées car modifier un compte
  passe par `auth.users` / `profiles` (sensible) ou par une intégration de
  paiement (remboursement). À traiter séparément si le besoin est confirmé.
- **Licences** : la page est en lecture seule (aucun formulaire dans l'UI).
- **Modifier un article** et **dupliquer une promotion** : actions retirées du
  menu (non implémentées) plutôt que de laisser de faux boutons.

---

## Tableau de bord & Analytics : métriques réelles vs non couvertes

Alimentés par les fonctions RPC de `supabase/analytics.sql` (à exécuter).

**Réel (calculé depuis Supabase) :**
- Revenu (brut, commission 12 %, net) — `orders` au statut `confirmed`.
- Billets vendus / disponibles / utilisés — `tickets` par statut.
- Événements créés / terminés / annulés / à venir — `events` par statut.
- Revenu par catégorie, top organisations, top événements, répartition des
  billets par type.
- KPIs Super Admin (utilisateurs, admins, événements, licences actives…).
- KPIs abonnements (entreprises, actifs/expirés, revenus, promotions,
  publications par entreprise).
- KPIs Admin (mes événements, ventes, revenu, commandes en attente…),
  cadrés sur l'organisation.

**Non couvert (aucune source de données) — reste estimé/vide :**
- "Utilisateurs par région" : renvoie une liste vide (pas de géolocalisation
  des utilisateurs). Le graphe s'affiche vide.
- "Nouveaux utilisateurs" et certains `trend` (pourcentages ±) des StatCards :
  valeurs de démonstration codées en dur dans les pages, non dérivées de la base.

**Tolérance :** si `analytics.sql` n'a pas encore été exécuté, les fonctions RPC
sont absentes (`PGRST202`). Le repo `analytics.ts` renvoie alors des valeurs
vides et journalise un avertissement, sans faire planter les pages.

---

## Ordre d'exécution SQL rappelé

1. `fix_auth_trigger.sql` — profil Super Admin + trigger robuste.
2. `setup_rls_and_storage.sql` — RLS events/ticket_types/orders/tickets +
   bucket Storage.
3. `analytics.sql` — fonctions d'agrégation pour le tableau de bord et
   les analytics.
4. `content_tables.sql` — vues dérivées (admins, utilisateurs, paiements) +
   tables de contenu (types d'événement, licences, notifications, articles,
   promotions).
5. Se déconnecter / reconnecter dans l'app (le rôle est chargé au login).

> Note : `end_users_view` s'appuie sur la fonction `list_end_users`
> (`security definer`, réservée au Super Admin) pour lire `auth.users` en toute
> sécurité. `admins_view` et `payments_view` lisent des tables `public` et
> fonctionnent avec la RLS standard.
