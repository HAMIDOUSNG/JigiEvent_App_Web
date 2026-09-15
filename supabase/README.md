# Backend Supabase — JigiEvent (partagé web + mobile)

Ce dossier décrit le backend Supabase commun à **l'admin web** (ce dépôt Next.js)
et à **l'application mobile**. Les deux clients pointent sur le **même projet Supabase**.

- Project ref : `lycxrglmpegyizmsecor`
- Project URL : `https://lycxrglmpegyizmsecor.supabase.co`

## Ordre d'exécution des migrations

À exécuter dans l'ordre depuis le **SQL Editor** de Supabase (ou via le MCP) :

1. `migrations/0001_init_subscriptions.sql` — tables, types énumérés, RLS (lecture).
2. `migrations/0002_seed_plans.sql` — plans par défaut (5 000 / 50 000 / 1 000 000).
3. `migrations/0003_rls_policies.sql` — policies d'écriture (première version).
4. `migrations/0004_profiles_auth.sql` — profils/rôles + trigger de signup.
5. `migrations/0005_rls_hardening.sql` — **RLS durcie** (moindre privilège).
6. `migrations/0006_views_functions.sql` — vue + fonctions (source de vérité).

> ⚠️ Exécuter `0005` **après** `0004` (dépend de `profiles` et `current_role_is`).

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

### Modèle durci (migration 0005)
Appliqué par `0005_rls_hardening.sql` (moindre privilège) :
- **Plans / promotions** : lecture publique (catalogue mobile) ; écriture **Super Admin uniquement**.
- **Organisations** : lecture Super Admin **ou** propriétaire ; écriture Super Admin.
- **Abonnements** : lecture Super Admin **ou** propriétaire ; écriture Super Admin.
- **Paiements** : lecture Super Admin **ou** propriétaire ; écriture Super Admin. Aucune lecture publique.

Helpers SQL : `current_role_is(role)` et `owns_org(org)`.

> ⚠️ Ne jamais activer les policies « anon write » (commentées dans `0003`) en production.

## Source de vérité en base (migration 0006)

Pour éviter de dupliquer la logique métier entre le web et le mobile :
- **`subscriptions_view`** : expose `effective_status` (actif/expiré/suspendu calculé
  depuis `end_date`) et `days_remaining`. Les clients lisent le statut d'ici.
- **`plan_effective_price(plan)`** : prix après application de la promotion active
  de la période (fixe ou pourcentage).
- **`can_publish(org)`** : `true` si l'organisation a un abonnement actif.

Le web appelle déjà la vue (statut d'abonnement) et `can_publish` (RPC).

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
