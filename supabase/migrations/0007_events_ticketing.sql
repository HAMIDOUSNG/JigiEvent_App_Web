-- ============================================================
-- JigiEvent — Domaine Événements & Billetterie (grand public)
--
-- Ce domaine est produit par le back-office web (organisateurs =
-- table `organizations`) et consommé par l'app mobile grand public
-- (découverte d'événements, achat de billets, QR codes).
--
-- Conventions :
--  * colonnes snake_case (Postgres) ; les clients mappent vers camelCase.
--  * montants en FCFA (XOF), entiers (bigint).
--  * RLS : lecture PUBLIQUE des événements PUBLIÉS + catalogue
--    (catégories, types de billets, artistes) pour l'app mobile ;
--    les commandes/billets sont privés à leur acheteur (auth.uid()).
--
-- À exécuter APRÈS 0001..0006 (dépend de `organizations`).
-- ============================================================

-- ── Types énumérés ────────────────────────────────────────────────────────────
do $$ begin
  create type event_status as enum ('draft', 'upcoming', 'ongoing', 'past', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_availability as enum ('available', 'limited', 'sold_out');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('confirmed', 'pending', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('valid', 'used', 'cancelled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_payment_method as enum ('orange_money', 'moov_money', 'card');
exception when duplicate_object then null; end $$;

-- ── Catégories ────────────────────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  icon        text not null default '',
  color       text not null default '#C86B3C',
  created_at  timestamptz not null default now()
);

-- ── Artistes ──────────────────────────────────────────────────────────────────
create table if not exists artists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  image_url  text,
  created_at timestamptz not null default now()
);

-- ── Événements ────────────────────────────────────────────────────────────────
-- L'organisateur est une `organizations` (back-office web).
create table if not exists events (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  category_id        uuid references categories(id) on delete set null,
  title              text not null,
  description        text not null default '',
  cover_image_url    text not null default '',
  gallery_image_urls text[] not null default '{}',
  -- Lieu (dénormalisé pour la lecture mobile)
  venue_name         text not null default '',
  venue_address      text not null default '',
  venue_city         text not null default '',
  venue_region       text not null default '',
  latitude           double precision,
  longitude          double precision,
  start_date         timestamptz not null,
  end_date           timestamptz not null,
  status             event_status not null default 'draft',
  is_featured        boolean not null default false,
  is_promoted        boolean not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists idx_events_org       on events(organization_id);
create index if not exists idx_events_category   on events(category_id);
create index if not exists idx_events_status     on events(status);
create index if not exists idx_events_start_date on events(start_date);

-- ── Association Événements ⇄ Artistes (M2M) ─────────────────────────────────────
create table if not exists event_artists (
  event_id   uuid not null references events(id) on delete cascade,
  artist_id  uuid not null references artists(id) on delete cascade,
  primary key (event_id, artist_id)
);

-- ── Types de billets ────────────────────────────────────────────────────────────
create table if not exists ticket_types (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references events(id) on delete cascade,
  name               text not null,
  price              bigint not null default 0,           -- FCFA
  currency           text not null default 'XOF',
  available_quantity integer not null default 0,
  max_per_order      integer not null default 10,
  description        text,
  created_at         timestamptz not null default now()
);

create index if not exists idx_ticket_types_event on ticket_types(event_id);

-- ── Commandes ────────────────────────────────────────────────────────────────────
-- `user_id` = acheteur (auth.users). Privé à son propriétaire via RLS.
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,
  user_id        uuid not null references auth.users(id) on delete cascade,
  event_id       uuid not null references events(id) on delete restrict,
  subtotal       bigint not null default 0,
  fees           bigint not null default 0,
  total          bigint not null default 0,
  currency       text not null default 'XOF',
  status         order_status not null default 'pending',
  payment_method order_payment_method not null default 'orange_money',
  created_at     timestamptz not null default now()
);

create index if not exists idx_orders_user  on orders(user_id);
create index if not exists idx_orders_event on orders(event_id);

-- ── Lignes de commande ────────────────────────────────────────────────────────────
create table if not exists order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  ticket_type_id uuid not null references ticket_types(id) on delete restrict,
  quantity       integer not null default 1,
  unit_price     bigint not null default 0,
  subtotal       bigint not null default 0
);

create index if not exists idx_order_items_order on order_items(order_id);

-- ── Billets émis ──────────────────────────────────────────────────────────────────
-- Un billet par unité achetée, avec sa donnée QR unique.
create table if not exists tickets (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  ticket_type_id uuid not null references ticket_types(id) on delete restrict,
  event_id       uuid not null references events(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  qr_code_data   text not null unique,
  holder_name    text not null default '',
  status         ticket_status not null default 'valid',
  created_at     timestamptz not null default now()
);

create index if not exists idx_tickets_user  on tickets(user_id);
create index if not exists idx_tickets_order on tickets(order_id);
create index if not exists idx_tickets_event on tickets(event_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table categories    enable row level security;
alter table artists       enable row level security;
alter table events         enable row level security;
alter table event_artists  enable row level security;
alter table ticket_types   enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table tickets        enable row level security;

-- ── Catalogue : lecture publique (app mobile grand public) ──────────────────────
do $$ begin
  create policy "categories_read_public" on categories for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "artists_read_public" on artists for select using (true);
exception when duplicate_object then null; end $$;

-- Événements : seuls les statuts "publiés" (tout sauf draft) sont publics.
do $$ begin
  create policy "events_read_public" on events
    for select using (status <> 'draft');
exception when duplicate_object then null; end $$;

-- Association artistes : lisible si l'événement est public.
do $$ begin
  create policy "event_artists_read_public" on event_artists
    for select using (
      exists (select 1 from events e where e.id = event_id and e.status <> 'draft')
    );
exception when duplicate_object then null; end $$;

-- Types de billets : lisibles si l'événement est public.
do $$ begin
  create policy "ticket_types_read_public" on ticket_types
    for select using (
      exists (select 1 from events e where e.id = event_id and e.status <> 'draft')
    );
exception when duplicate_object then null; end $$;

-- ── Écriture catalogue : réservée aux utilisateurs authentifiés (back-office) ──
-- (À durcir en production vers le propriétaire de l'organisation / Super Admin.)
do $$ begin
  create policy "categories_write_auth" on categories
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "artists_write_auth" on artists
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "events_write_auth" on events
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "event_artists_write_auth" on event_artists
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "ticket_types_write_auth" on ticket_types
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- ── Commandes & billets : privés à leur propriétaire (acheteur) ─────────────────
do $$ begin
  create policy "orders_rw_owner" on orders
    for all to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "order_items_rw_owner" on order_items
    for all to authenticated
    using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()))
    with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tickets_rw_owner" on tickets
    for all to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ============================================================
-- Source de vérité en base : statut de disponibilité d'un type de billet.
-- Calculé à partir des billets déjà vendus vs quantité disponible.
-- ============================================================
create or replace function public.ticket_type_availability(tt uuid)
returns ticket_availability
language sql
stable
as $$
  with sold as (
    select count(*)::int as n from tickets where ticket_type_id = tt and status <> 'cancelled'
  ),
  cap as (
    select available_quantity as q from ticket_types where id = tt
  )
  select case
    when (select q from cap) <= (select n from sold) then 'sold_out'::ticket_availability
    when (select q from cap) - (select n from sold) <= 10 then 'limited'::ticket_availability
    else 'available'::ticket_availability
  end;
$$;

-- ------------------------------------------------------------
-- Vue "grand public" des événements : agrège le prix le plus bas
-- et le nom de la catégorie, pour alimenter les listes mobiles
-- sans jointures côté client.
-- ------------------------------------------------------------
create or replace view events_public_view as
select
  e.*,
  c.name  as category_name,
  c.slug  as category_slug,
  c.icon  as category_icon,
  c.color as category_color,
  o.name  as organizer_name,
  o.logo  as organizer_logo,
  (select min(tt.price) from ticket_types tt where tt.event_id = e.id) as lowest_price
from events e
left join categories c    on c.id = e.category_id
left join organizations o on o.id = e.organization_id
where e.status <> 'draft';
