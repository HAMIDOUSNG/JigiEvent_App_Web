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
