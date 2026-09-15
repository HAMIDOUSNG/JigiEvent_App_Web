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
