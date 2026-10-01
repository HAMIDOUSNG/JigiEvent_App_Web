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
