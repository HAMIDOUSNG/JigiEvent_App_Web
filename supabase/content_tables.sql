-- ============================================================
-- JigiEvent Admin — Vues dérivées + tables de contenu
-- À exécuter dans Supabase : SQL Editor > New query > Run.
--
-- Remplace les dernières données fictives (mock) par du réel :
--   • VUES dérivées (aucune donnée à saisir) : admins, utilisateurs
--     finaux, paiements de billetterie.
--   • TABLES de contenu géré par le back-office (vides au départ) :
--     event_types, licenses, notification_campaigns, articles, promotions.
--
-- PRÉREQUIS : migrations 0001 + 0007, helpers current_role_is()/owns_org().
-- ============================================================


-- ============================================================
-- PARTIE 1 — VUES DÉRIVÉES (lecture seule)
-- ============================================================

-- ── Administrateurs : profils ADMIN + leur organisation ─────────────────────
create or replace view public.admins_view as
select
  p.id,
  p.name,
  p.email,
  coalesce(o.phone, '')            as phone,
  p.organization_id,
  coalesce(o.name, '')             as organization_name,
  coalesce(o.category_id::text, '') as category_id,
  coalesce(o.region, '')           as region,
  coalesce(o.status, 'active')     as status,
  (select count(*) from public.events e where e.organization_id = p.organization_id) as events_count,
  coalesce((
    select sum(ord.total) from public.orders ord
    join public.events e on e.id = ord.event_id
    where e.organization_id = p.organization_id and ord.status = 'confirmed'
  ), 0)                            as revenue,
  p.created_at
from public.profiles p
left join public.organizations o on o.id = p.organization_id
where p.role = 'ADMIN';

-- ── Utilisateurs finaux : acheteurs (auth.users) + agrégats d'achat ─────────
-- Dérivé des billets/commandes. Region inconnue (non collectée) -> ''.
-- IMPORTANT : lire auth.users exige des droits élevés. On passe par une
-- fonction `security definer` réservée au Super Admin, exposée ensuite via
-- une vue (l'app lit toujours `end_users_view`).
create or replace function public.list_end_users()
returns table(
  id uuid, name text, email text, phone text, region text,
  tickets_purchased bigint, total_spent bigint, created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name,
    u.email,
    coalesce(u.raw_user_meta_data->>'phone', '')  as phone,
    ''::text                                       as region,
    (select count(*) from public.tickets t where t.user_id = u.id and t.status <> 'cancelled') as tickets_purchased,
    coalesce((select sum(o.total) from public.orders o where o.user_id = u.id and o.status = 'confirmed'), 0)::bigint as total_spent,
    u.created_at
  from auth.users u
  -- Réservé au Super Admin ; exclut les comptes du back-office.
  where public.current_role_is('SUPER_ADMIN')
    and not exists (select 1 from public.profiles p where p.id = u.id);
$$;

create or replace view public.end_users_view as
  select * from public.list_end_users();

-- ── Paiements de billetterie : dérivés des commandes ────────────────────────
create or replace view public.payments_view as
select
  o.id,
  o.id                              as order_id,
  o.reference                       as order_ref,
  coalesce((select t.holder_name from public.tickets t where t.order_id = o.id and t.holder_name <> '' limit 1), '') as customer_name,
  e.organization_id,
  org.name                          as organization_name,
  o.total                           as amount,
  o.payment_method                  as method,
  o.status,
  o.created_at
from public.orders o
join public.events e on e.id = o.event_id
left join public.organizations org on org.id = e.organization_id;


-- ============================================================
-- PARTIE 2 — TABLES DE CONTENU (gérées par le back-office)
-- ============================================================

-- ── Types d'événement ───────────────────────────────────────────────────────
create table if not exists public.event_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- ── Licences (par organisation) ─────────────────────────────────────────────
create table if not exists public.licenses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type            text not null default '',
  start_date      timestamptz not null default now(),
  end_date        timestamptz not null,
  status          text not null default 'active',
  created_at      timestamptz not null default now()
);

-- ── Campagnes de notification ────────────────────────────────────────────────
create table if not exists public.notification_campaigns (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  message      text not null default '',
  channel      text not null default 'push',
  audience     text not null default '',
  scheduled_at timestamptz,
  status       text not null default 'draft',
  reach        integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ── Articles / actualités ─────────────────────────────────────────────────────
create table if not exists public.articles (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  cover          text not null default '',
  excerpt        text not null default '',
  author         text not null default '',
  category       text not null default '',
  status         text not null default 'draft',
  published_date timestamptz,
  views          integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ── Promotions (codes promo billetterie) ──────────────────────────────────────
create table if not exists public.promotions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid references public.organizations(id) on delete cascade,
  name              text not null,
  code              text not null,
  discount_percent  integer not null default 0,
  start_date        timestamptz not null default now(),
  end_date          timestamptz not null,
  applicable_events text not null default 'all',
  target_audience   text not null default 'all',
  status            text not null default 'scheduled',
  usage_count       integer not null default 0,
  created_at        timestamptz not null default now()
);


-- ============================================================
-- PARTIE 3 — RLS pour les tables de contenu
-- Lecture : utilisateurs authentifiés. Écriture : SUPER_ADMIN.
-- (Les promotions/licences pourraient être affinées par organisation
--  plus tard ; on reste simple et sûr pour l'instant.)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['event_types','licenses','notification_campaigns','articles','promotions']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_read', t);
    execute format('drop policy if exists %I on public.%I;', t || '_write', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true);',
      t || '_read', t
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.current_role_is(''SUPER_ADMIN'')) with check (public.current_role_is(''SUPER_ADMIN''));',
      t || '_write', t
    );
  end loop;
end $$;


-- ============================================================
-- FIN.
-- Les vues (admins_view, end_users_view, payments_view) renvoient des
-- données réelles immédiatement. Les tables de contenu sont VIDES au
-- départ : les pages afficheront "aucune donnée" jusqu'à création via
-- le back-office (fini les fausses données mock).
-- ============================================================
