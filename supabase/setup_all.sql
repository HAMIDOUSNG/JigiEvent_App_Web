-- ============================================================
-- JigiEvent — schéma initial (domaine Super Admin / abonnements)
-- À exécuter dans l'éditeur SQL Supabase (ou via le MCP).
-- Colonnes en snake_case (convention Postgres) ; le service
-- applique le mapping vers le camelCase du front.
-- ============================================================

-- Types énumérés
do $$ begin
  create type entity_status as enum ('active', 'suspended', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type org_type as enum ('private', 'public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_period as enum ('daily', 'monthly', 'yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active', 'expired', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type promotion_status as enum ('active', 'scheduled', 'ended', 'draft');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'successful', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- Entreprises (organisations)
-- ------------------------------------------------------------
create table if not exists organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category_id   text not null default '',
  type          org_type not null default 'private',
  country_code  text not null default 'ML',
  region        text not null default '',
  city          text not null default '',
  address       text not null default '',
  phone         text not null default '',
  email         text not null default '',
  admin_name    text not null default '',
  status        entity_status not null default 'active',
  events_count  integer not null default 0,
  revenue       bigint not null default 0,
  logo          text,
  login_email   text,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Plans d'abonnement (configurables par le Super Admin)
-- ------------------------------------------------------------
create table if not exists subscription_plans (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  period       subscription_period not null,
  price        bigint not null default 0,
  description  text not null default '',
  features     text[] not null default '{}',
  status       plan_status not null default 'active',
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Promotions sur abonnements
-- ------------------------------------------------------------
create table if not exists subscription_promotions (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  period           subscription_period not null,
  discount_type    text not null check (discount_type in ('percent', 'fixed')),
  discount_percent numeric,
  promo_price      bigint,
  start_date       timestamptz not null,
  end_date         timestamptz not null,
  status           promotion_status not null default 'scheduled',
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Abonnements des entreprises
-- ------------------------------------------------------------
create table if not exists subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  plan_id               uuid references subscription_plans(id) on delete set null,
  plan_name             text not null default '',
  period                subscription_period not null,
  price_paid            bigint not null default 0,
  start_date            timestamptz not null default now(),
  end_date              timestamptz not null,
  status                subscription_status not null default 'active',
  applied_promotion_id  uuid references subscription_promotions(id) on delete set null,
  created_at            timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Historique des paiements d'abonnement
-- ------------------------------------------------------------
create table if not exists subscription_payments (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references subscriptions(id) on delete cascade,
  organization_id  uuid not null references organizations(id) on delete cascade,
  plan_name        text not null default '',
  period           subscription_period not null,
  amount           bigint not null default 0,
  method           text not null default 'bank_card',
  status           payment_status not null default 'successful',
  promotion_name   text,
  paid_at          timestamptz not null default now()
);

create index if not exists idx_subscriptions_org on subscriptions(organization_id);
create index if not exists idx_sub_payments_sub on subscription_payments(subscription_id);
create index if not exists idx_sub_payments_org on subscription_payments(organization_id);

-- ============================================================
-- Row Level Security
-- Politique de démo : lecture publique via la clé anon.
-- ⚠️ À restreindre avant la mise en production (auth + rôles).
-- ============================================================
alter table organizations            enable row level security;
alter table subscription_plans        enable row level security;
alter table subscription_promotions   enable row level security;
alter table subscriptions             enable row level security;
alter table subscription_payments     enable row level security;

do $$ begin
  create policy "read_all_organizations" on organizations for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "read_all_plans" on subscription_plans for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "read_all_sub_promotions" on subscription_promotions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "read_all_subscriptions" on subscriptions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "read_all_sub_payments" on subscription_payments for select using (true);
exception when duplicate_object then null; end $$;
-- ============================================================
-- Seed : plans d'abonnement par défaut (prix modifiables ensuite
-- depuis l'interface Super Admin). Idempotent via un nom unique.
-- ============================================================

insert into subscription_plans (name, period, price, description, features, status)
select 'Journalier', 'daily', 5000,
       'Accès complet à la publication pour 24 heures.',
       array['Publications illimitées pendant 24h', 'Ajout d''images et médias', 'Publication d''événements'],
       'active'
where not exists (select 1 from subscription_plans where name = 'Journalier');

insert into subscription_plans (name, period, price, description, features, status)
select 'Mensuel', 'monthly', 50000,
       'Idéal pour les entreprises actives tout au long du mois.',
       array['Publications illimitées', 'Ajout d''images et médias', 'Publication d''événements', 'Statistiques de base'],
       'active'
where not exists (select 1 from subscription_plans where name = 'Mensuel');

insert into subscription_plans (name, period, price, description, features, status)
select 'Annuel', 'yearly', 1000000,
       'La meilleure valeur pour une présence continue sur l''année.',
       array['Publications illimitées', 'Ajout d''images et médias', 'Publication d''événements', 'Statistiques avancées', 'Support prioritaire'],
       'active'
where not exists (select 1 from subscription_plans where name = 'Annuel');
-- ============================================================
-- Policies RLS — backend partagé web (admin) + app mobile.
--
-- Principes :
--  * Lecture publique (clé anon) des données de catalogue :
--    plans et promotions d'abonnement (l'app mobile en a besoin).
--  * Lecture des organisations et abonnements ouverte pour la démo.
--  * Écriture réservée aux utilisateurs authentifiés (rôle "authenticated"),
--    c.-à-d. les admins connectés via Supabase Auth.
--
--  ⚠️ À durcir avant production :
--    - restreindre l'écriture au Super Admin / au propriétaire de l'org
--      (via une table de rôles ou des claims JWT) ;
--    - limiter la lecture des données sensibles (paiements) aux admins.
-- ============================================================

-- --- Plans : lecture publique, écriture authentifiée ---
do $$ begin
  create policy "plans_write_auth" on subscription_plans
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- --- Promotions : lecture publique, écriture authentifiée ---
do $$ begin
  create policy "sub_promotions_write_auth" on subscription_promotions
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- --- Organisations : écriture authentifiée ---
do $$ begin
  create policy "organizations_write_auth" on organizations
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- --- Abonnements : écriture authentifiée ---
do $$ begin
  create policy "subscriptions_write_auth" on subscriptions
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- --- Paiements : lecture + écriture authentifiées (données sensibles) ---
do $$ begin
  create policy "sub_payments_read_auth" on subscription_payments
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "sub_payments_write_auth" on subscription_payments
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- POUR TESTER RAPIDEMENT SANS AUTH (démo web en clé anon) :
-- décommentez les policies ci-dessous pour autoriser l'écriture
-- via la clé anon. À NE PAS laisser en production.
-- ------------------------------------------------------------
-- do $$ begin
--   create policy "organizations_write_anon" on organizations
--     for all to anon using (true) with check (true);
-- exception when duplicate_object then null; end $$;
-- do $$ begin
--   create policy "plans_write_anon" on subscription_plans
--     for all to anon using (true) with check (true);
-- exception when duplicate_object then null; end $$;
-- do $$ begin
--   create policy "sub_promotions_write_anon" on subscription_promotions
--     for all to anon using (true) with check (true);
-- exception when duplicate_object then null; end $$;
-- ============================================================
-- Profils utilisateurs (rôles) liés à Supabase Auth.
--
-- Chaque compte auth.users a un profil portant son rôle
-- (SUPER_ADMIN / ADMIN) et, pour un admin, l'organisation rattachée.
-- Un trigger crée automatiquement le profil au moment du signup.
-- ============================================================

do $$ begin
  create type app_role as enum ('SUPER_ADMIN', 'ADMIN');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text not null default '',
  email            text not null default '',
  role             app_role not null default 'ADMIN',
  organization_id  uuid references organizations(id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table profiles enable row level security;

-- Un utilisateur peut lire son propre profil.
do $$ begin
  create policy "profiles_read_self" on profiles
    for select to authenticated using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Un utilisateur peut mettre à jour son propre profil (nom, etc.).
do $$ begin
  create policy "profiles_update_self" on profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- Création automatique du profil au signup.
-- Le rôle et l'organisation peuvent être passés dans
-- raw_user_meta_data (options.data côté client) :
--   { "name": "...", "role": "ADMIN", "organization_id": "..." }
-- Par défaut : rôle ADMIN.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, organization_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'ADMIN'),
    nullif(new.raw_user_meta_data->>'organization_id', '')::uuid
  );
  return new;
end;
$$;

do $$ begin
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- (Optionnel) Helper : le rôle de l'utilisateur courant.
-- Utile pour écrire des policies "Super Admin uniquement".
-- ------------------------------------------------------------
create or replace function public.current_role_is(target app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = target
  );
$$;
-- ============================================================
-- Durcissement RLS — moindre privilège.
--
-- Principe :
--  * Catalogue (plans, promotions) : lecture publique conservée
--    (l'app mobile en a besoin) ; écriture réservée au SUPER_ADMIN.
--  * Organisations / abonnements / paiements : plus de lecture
--    publique. Lecture réservée au SUPER_ADMIN ou au propriétaire
--    (admin rattaché à l'organisation). Écriture idem selon le cas.
--
-- Prérequis : table `profiles` (migration 0004) et helper
-- current_role_is(app_role).
-- ============================================================

-- Helper : l'utilisateur courant est-il rattaché à cette organisation ?
create or replace function public.owns_org(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and organization_id = org
  );
$$;

-- ------------------------------------------------------------
-- On repart d'un état propre : suppression des policies larges
-- posées par 0001 (lecture publique) et 0003 (écriture authentifiée).
-- ------------------------------------------------------------
drop policy if exists "read_all_organizations"      on organizations;
drop policy if exists "read_all_subscriptions"       on subscriptions;
drop policy if exists "read_all_sub_payments"        on subscription_payments;
drop policy if exists "organizations_write_auth"     on organizations;
drop policy if exists "subscriptions_write_auth"     on subscriptions;
drop policy if exists "sub_payments_read_auth"       on subscription_payments;
drop policy if exists "sub_payments_write_auth"      on subscription_payments;
drop policy if exists "plans_write_auth"             on subscription_plans;
drop policy if exists "sub_promotions_write_auth"    on subscription_promotions;
-- policies "test anon" éventuelles
drop policy if exists "organizations_write_anon"     on organizations;
drop policy if exists "plans_write_anon"             on subscription_plans;
drop policy if exists "sub_promotions_write_anon"    on subscription_promotions;

-- ============================================================
-- CATALOGUE : plans & promotions
-- Lecture publique (déjà posée en 0001 : read_all_plans /
-- read_all_sub_promotions) ; écriture Super Admin uniquement.
-- ============================================================
do $$ begin
  create policy "plans_write_superadmin" on subscription_plans
    for all to authenticated
    using (public.current_role_is('SUPER_ADMIN'))
    with check (public.current_role_is('SUPER_ADMIN'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "sub_promotions_write_superadmin" on subscription_promotions
    for all to authenticated
    using (public.current_role_is('SUPER_ADMIN'))
    with check (public.current_role_is('SUPER_ADMIN'));
exception when duplicate_object then null; end $$;

-- ============================================================
-- ORGANISATIONS
-- Lecture : Super Admin (tout) ou propriétaire (sa propre org).
-- Écriture : Super Admin uniquement (création/désactivation de comptes).
-- ============================================================
do $$ begin
  create policy "organizations_read" on organizations
    for select to authenticated
    using (public.current_role_is('SUPER_ADMIN') or public.owns_org(id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "organizations_write_superadmin" on organizations
    for all to authenticated
    using (public.current_role_is('SUPER_ADMIN'))
    with check (public.current_role_is('SUPER_ADMIN'));
exception when duplicate_object then null; end $$;

-- ============================================================
-- ABONNEMENTS
-- Lecture : Super Admin ou propriétaire de l'organisation.
-- Écriture : Super Admin uniquement.
-- ============================================================
do $$ begin
  create policy "subscriptions_read" on subscriptions
    for select to authenticated
    using (public.current_role_is('SUPER_ADMIN') or public.owns_org(organization_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "subscriptions_write_superadmin" on subscriptions
    for all to authenticated
    using (public.current_role_is('SUPER_ADMIN'))
    with check (public.current_role_is('SUPER_ADMIN'));
exception when duplicate_object then null; end $$;

-- ============================================================
-- PAIEMENTS (données sensibles)
-- Lecture : Super Admin ou propriétaire. Écriture : Super Admin.
-- Aucune lecture publique.
-- ============================================================
do $$ begin
  create policy "sub_payments_read" on subscription_payments
    for select to authenticated
    using (public.current_role_is('SUPER_ADMIN') or public.owns_org(organization_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "sub_payments_write_superadmin" on subscription_payments
    for all to authenticated
    using (public.current_role_is('SUPER_ADMIN'))
    with check (public.current_role_is('SUPER_ADMIN'));
exception when duplicate_object then null; end $$;
-- ============================================================
-- Source de vérité en base : logique métier partagée web + mobile.
-- Évite de dupliquer les calculs (statut, prix promo, gating) dans
-- chaque client.
-- ============================================================

-- ------------------------------------------------------------
-- Vue abonnements : statut "vivant" calculé à partir de end_date.
-- suspended reste suspended ; sinon expired si échéance passée.
-- Inclut le nom de l'organisation pour éviter une jointure côté client.
-- ------------------------------------------------------------
create or replace view subscriptions_view as
select
  s.*,
  o.name as organization_name,
  case
    when s.status = 'suspended' then 'suspended'
    when s.end_date < now() then 'expired'
    else 'active'
  end::subscription_status as effective_status,
  greatest(0, date_part('day', s.end_date - now())::int) as days_remaining
from subscriptions s
join organizations o on o.id = s.organization_id;

-- La vue hérite de la RLS des tables sous-jacentes (security invoker
-- par défaut sur les vues récentes de Postgres/Supabase).

-- ------------------------------------------------------------
-- Prix effectif d'un plan : applique la promotion active de sa période.
-- Retourne le prix (après promo) et l'id de la promo appliquée.
-- ------------------------------------------------------------
create or replace function public.plan_effective_price(plan uuid)
returns table (price bigint, promotion_id uuid)
language sql
stable
as $$
  with p as (
    select id, period, price from subscription_plans where id = plan
  ),
  promo as (
    select sp.*
    from subscription_promotions sp, p
    where sp.period = p.period
      and sp.status = 'active'
      and sp.start_date <= now()
      and sp.end_date >= now()
    order by sp.start_date desc
    limit 1
  )
  select
    coalesce(
      case
        when promo.discount_type = 'fixed' and promo.promo_price is not null
          then promo.promo_price
        when promo.discount_type = 'percent' and promo.discount_percent is not null
          then round(p.price * (1 - promo.discount_percent / 100.0))::bigint
        else p.price
      end,
      p.price
    ) as price,
    promo.id as promotion_id
  from p
  left join promo on true;
$$;

-- ------------------------------------------------------------
-- Une organisation peut-elle publier ? (abonnement actif requis)
-- ------------------------------------------------------------
create or replace function public.can_publish(org uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from subscriptions s
    where s.organization_id = org
      and s.status <> 'suspended'
      and s.end_date >= now()
  );
$$;
