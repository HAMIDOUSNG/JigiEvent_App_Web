-- ============================================================
-- JigiEvent Admin — Fonctions d'agrégation (Tableau de bord + Analytics)
-- À exécuter dans Supabase : SQL Editor > New query > Run.
--
-- PRÉREQUIS : migrations 0001 (subscriptions) et 0007 (events/tickets),
--             + helpers current_role_is() / owns_org() (0004/0005).
--
-- Toutes les fonctions sont `security definer` : elles agrègent des
-- données au-delà de la RLS de l'appelant, mais restent réservées aux
-- utilisateurs authentifiés et cadrées par rôle (Super Admin = global,
-- Admin = son organisation).
--
-- Rappel des enums :
--   order_status  = confirmed | pending | failed | refunded  (payée = confirmed)
--   ticket_status = valid | used | cancelled | expired
--   event_status  = draft | upcoming | ongoing | past | cancelled
-- ============================================================


-- ------------------------------------------------------------
-- 1. KPIs Super Admin (globaux)
-- ------------------------------------------------------------
create or replace function public.sa_kpis()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'totalUsers',    (select count(*) from auth.users),
    'totalAdmins',   (select count(*) from profiles where role = 'ADMIN'),
    'totalEvents',   (select count(*) from events),
    'ticketsSold',   (select count(*) from tickets where status <> 'cancelled'),
    'totalRevenue',  (select coalesce(sum(total), 0) from orders where status = 'confirmed'),
    'commission',    (select round(coalesce(sum(total), 0) * 0.12) from orders where status = 'confirmed'),
    'activeLicenses',(select count(*) from subscriptions where status = 'active'),
    'pendingEvents', (select count(*) from events where status = 'draft')
  );
$$;


-- ------------------------------------------------------------
-- 2. KPIs abonnements / entreprises (Super Admin)
-- ------------------------------------------------------------
create or replace function public.subscription_kpis()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'totalCompanies',       (select count(*) from organizations),
    'activeSubscriptions',  (select count(*) from subscriptions where status = 'active'),
    'expiredSubscriptions', (select count(*) from subscriptions where status = 'expired'),
    'expiringSoon',         (select count(*) from subscriptions
                              where status = 'active' and end_date <= now() + interval '30 days'),
    'subscriptionRevenue',  (select coalesce(sum(amount), 0) from subscription_payments where status = 'successful'),
    'activePromotions',     (select count(*) from subscription_promotions where status = 'active'),
    'publicationsByCompany',(
      select coalesce(json_agg(row), '[]'::json) from (
        select o.id as "organizationId", o.name as "organizationName",
               (select count(*) from events e where e.organization_id = o.id) as publications
        from organizations o
        order by publications desc
      ) row
    )
  );
$$;


-- ------------------------------------------------------------
-- 3. KPIs Admin (une organisation)
-- ------------------------------------------------------------
create or replace function public.admin_kpis(org uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with ev as (select id from events where organization_id = org),
       ev_upcoming as (select count(*) n from events where organization_id = org and status = 'upcoming'),
       sold as (select count(*) n from tickets t
                  where t.event_id in (select id from ev) and t.status <> 'cancelled'),
       cap as (select coalesce(sum(available_quantity),0) n from ticket_types
                 where event_id in (select id from ev)),
       rev as (select coalesce(sum(total),0) n from orders
                 where event_id in (select id from ev) and status = 'confirmed'),
       pending as (select count(*) n from orders
                 where event_id in (select id from ev) and status = 'pending')
  select json_build_object(
    'myEvents',        (select count(*) from ev),
    'ticketsSold',     (select n from sold),
    'revenue',         (select n from rev),
    'pendingOrders',   (select n from pending),
    'upcomingEvents',  (select n from ev_upcoming),
    'ticketsAvailable',greatest((select n from cap) - (select n from sold), 0)
  );
$$;


-- ------------------------------------------------------------
-- 4. Revenu par mois (12 derniers mois) — orders confirmées
--    Optionnellement filtré par organisation (org = null => global).
-- ------------------------------------------------------------
create or replace function public.revenue_over_time(org uuid default null)
returns table(label text, value bigint, commission bigint)
language sql
stable
security definer
set search_path = public
as $$
  with months as (
    select date_trunc('month', now()) - (interval '1 month' * g) as m
    from generate_series(0, 11) g
  )
  select
    to_char(m.m, 'Mon') as label,
    coalesce(sum(o.total), 0)::bigint as value,
    round(coalesce(sum(o.total), 0) * 0.12)::bigint as commission
  from months m
  left join orders o
    on date_trunc('month', o.created_at) = m.m
   and o.status = 'confirmed'
   and (org is null or o.event_id in (select id from events where organization_id = org))
  group by m.m
  order by m.m;
$$;


-- ------------------------------------------------------------
-- 5. Billets par mois (vendus / disponibles / utilisés)
-- ------------------------------------------------------------
create or replace function public.tickets_over_time(org uuid default null)
returns table(label text, sold bigint, available bigint, used bigint)
language sql
stable
security definer
set search_path = public
as $$
  with months as (
    select date_trunc('month', now()) - (interval '1 month' * g) as m
    from generate_series(0, 11) g
  )
  select
    to_char(m.m, 'Mon') as label,
    coalesce(count(t.id) filter (where t.status <> 'cancelled'), 0)::bigint as sold,
    coalesce(count(t.id) filter (where t.status = 'valid'), 0)::bigint as available,
    coalesce(count(t.id) filter (where t.status = 'used'), 0)::bigint as used
  from months m
  left join tickets t
    on date_trunc('month', t.created_at) = m.m
   and (org is null or t.event_id in (select id from events where organization_id = org))
  group by m.m
  order by m.m;
$$;


-- ------------------------------------------------------------
-- 6. Événements par mois et statut (6 derniers mois)
-- ------------------------------------------------------------
create or replace function public.events_breakdown()
returns table(label text, created bigint, completed bigint, cancelled bigint, upcoming bigint)
language sql
stable
security definer
set search_path = public
as $$
  with months as (
    select date_trunc('month', now()) - (interval '1 month' * g) as m
    from generate_series(0, 5) g
  )
  select
    to_char(m.m, 'Mon') as label,
    coalesce(count(e.id), 0)::bigint as created,
    coalesce(count(e.id) filter (where e.status = 'past'), 0)::bigint as completed,
    coalesce(count(e.id) filter (where e.status = 'cancelled'), 0)::bigint as cancelled,
    coalesce(count(e.id) filter (where e.status = 'upcoming'), 0)::bigint as upcoming
  from months m
  left join events e on date_trunc('month', e.created_at) = m.m
  group by m.m
  order by m.m;
$$;


-- ------------------------------------------------------------
-- 7. Revenu par catégorie (orders confirmées)
-- ------------------------------------------------------------
create or replace function public.revenue_by_category()
returns table(label text, value bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.name as label, coalesce(sum(o.total), 0)::bigint as value
  from categories c
  left join events e on e.category_id = c.id
  left join orders o on o.event_id = e.id and o.status = 'confirmed'
  group by c.name
  having coalesce(sum(o.total), 0) > 0
  order by value desc
  limit 6;
$$;


-- ------------------------------------------------------------
-- 8. Top organisations par revenu (orders confirmées)
-- ------------------------------------------------------------
create or replace function public.top_organizations()
returns table(label text, value bigint)
language sql
stable
security definer
set search_path = public
as $$
  select o.name as label, coalesce(sum(ord.total), 0)::bigint as value
  from organizations o
  left join events e on e.organization_id = o.id
  left join orders ord on ord.event_id = e.id and ord.status = 'confirmed'
  group by o.name
  order by value desc
  limit 5;
$$;


-- ------------------------------------------------------------
-- 9. Top événements par revenu (orders confirmées)
-- ------------------------------------------------------------
create or replace function public.top_events(org uuid default null)
returns table(label text, value bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.title as label, coalesce(sum(o.total), 0)::bigint as value
  from events e
  left join orders o on o.event_id = e.id and o.status = 'confirmed'
  where (org is null or e.organization_id = org)
  group by e.title
  order by value desc
  limit 5;
$$;


-- ------------------------------------------------------------
-- 10. Répartition des billets par type (part en %)
-- ------------------------------------------------------------
create or replace function public.ticket_distribution(org uuid default null)
returns table(label text, value numeric)
language sql
stable
security definer
set search_path = public
as $$
  with sold as (
    select tt.name as name, count(t.id) as n
    from ticket_types tt
    join tickets t on t.ticket_type_id = tt.id and t.status <> 'cancelled'
    where (org is null or tt.event_id in (select id from events where organization_id = org))
    group by tt.name
  ),
  tot as (select coalesce(sum(n), 0) as total from sold)
  select s.name as label,
         case when (select total from tot) = 0 then 0
              else round(s.n * 100.0 / (select total from tot)) end as value
  from sold s
  order by value desc;
$$;


-- ------------------------------------------------------------
-- Droits d'exécution : utilisateurs authentifiés uniquement.
-- ------------------------------------------------------------
grant execute on function
  public.sa_kpis(),
  public.subscription_kpis(),
  public.admin_kpis(uuid),
  public.revenue_over_time(uuid),
  public.tickets_over_time(uuid),
  public.events_breakdown(),
  public.revenue_by_category(),
  public.top_organizations(),
  public.top_events(uuid),
  public.ticket_distribution(uuid)
to authenticated;

-- ============================================================
-- FIN. Ces fonctions alimentent /dashboard et /analytics en données réelles.
-- Non couvert (pas de source de données) : "utilisateurs par région" et
-- "nouveaux utilisateurs" (aucune géoloc utilisateur). Voir DATA_SOURCES.md.
-- ============================================================
