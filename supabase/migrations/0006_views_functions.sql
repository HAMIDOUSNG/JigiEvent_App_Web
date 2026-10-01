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
