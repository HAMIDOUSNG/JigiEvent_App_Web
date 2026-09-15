# Backend Supabase — JigiEvent (partagé web + mobile)

Ce dossier décrit le backend Supabase commun à **l'admin web** (ce dépôt Next.js)
et à **l'application mobile**. Les deux clients pointent sur le **même projet Supabase**.

- Project ref : `lycxrglmpegyizmsecor`
- Project URL : `https://lycxrglmpegyizmsecor.supabase.co`

## Ordre d'exécution des migrations

À exécuter dans l'ordre depuis le **SQL Editor** de Supabase (ou via le MCP) :

1. `migrations/0001_init_subscriptions.sql` — tables, types énumérés, RLS (lecture).
2. `migrations/0002_seed_plans.sql` — plans par défaut (5 000 / 50 000 / 1 000 000).
3. `migrations/0003_rls_policies.sql` — policies d'écriture (utilisateurs authentifiés).

## Tables

| Table | Rôle |
| --- | --- |
| `organizations` | Comptes entreprise (nom, pays, contact, statut, logo…) |
| `subscription_plans` | Plans configurables (journalier / mensuel / annuel) |
| `subscription_promotions` | Promotions (% ou prix fixe) par période |
| `subscriptions` | Abonnement courant d'une entreprise |
| `subscription_payments` | Historique des paiements d'abonnement |

Convention : colonnes en **snake_case** en base ; le front mappe vers camelCase
dans `src/api/repositories/*`.

## Variables d'environnement

### Web (ce dépôt) — `.env`
```
NEXT_PUBLIC_SUPABASE_URL=https://lycxrglmpegyizmsecor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon publique>
NEXT_PUBLIC_USE_MOCKS=false   # true = données fictives, false = Supabase
```

### Mobile
L'app mobile utilise **les mêmes** Project URL + clé anon (jamais la clé
`service_role` côté client). Adapter les noms de variables au framework mobile
(ex. `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` pour Expo).

## Sécurité (RLS)

- **Lecture publique** (clé anon) : `subscription_plans`, `subscription_promotions`
  — nécessaire pour que l'app mobile affiche le catalogue.
- **Lecture démo** ouverte sur `organizations` / `subscriptions`
  (à restreindre en production).
- **Écriture** : réservée aux utilisateurs **authentifiés** (Supabase Auth).
- **Paiements** : lecture + écriture authentifiées uniquement.

### À durcir avant production
- Restreindre l'écriture au **Super Admin** et au **propriétaire de l'organisation**
  (table de rôles ou claims JWT), plutôt qu'à tout utilisateur authentifié.
- Restreindre la lecture des `organizations`/`subscriptions` selon le rôle.
- Le fichier `0003_rls_policies.sql` contient, en commentaire, des policies
  d'écriture via la clé `anon` **pour tester la démo web sans auth** — à ne
  jamais activer en production.

## Authentification (Supabase Auth)

Migration : `migrations/0004_profiles_auth.sql`.

- Table `profiles` (1-1 avec `auth.users`) : `role` (`SUPER_ADMIN` / `ADMIN`) et
  `organization_id` pour un admin.
- Un **trigger** crée le profil automatiquement au signup. Le rôle/organisation
  peuvent être fournis dans les métadonnées d'inscription
  (`options.data = { name, role, organization_id }`), défaut : `ADMIN`.
- Policies : chaque utilisateur lit/modifie **son** profil.

### Créer le premier Super Admin
1. Dashboard Supabase → **Authentication → Users → Add user** (email + mot de passe).
2. SQL Editor : promouvoir ce compte en Super Admin
   ```sql
   update profiles set role = 'SUPER_ADMIN'
   where email = 'ton-email@exemple.com';
   ```
   (Si le profil n'existe pas encore, insère-le avec l'`id` de l'utilisateur auth.)
3. Connecte-toi via l'écran de login du web avec ces identifiants.

L'app mobile utilise la **même** table `auth.users` / `profiles` (mêmes comptes).

## Basculer entre mock et Supabase (web)

Le flag `NEXT_PUBLIC_USE_MOCKS` pilote tout :
- `true` → données fictives en mémoire (aucune connexion réseau).
- `false` → appels réels via les repos `src/api/repositories/*`.

Services déjà branchés sur Supabase : `organizationService`, `planService`,
`subscriptionService`, `subscriptionPromotionService`.
