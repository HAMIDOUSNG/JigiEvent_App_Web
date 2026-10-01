-- ============================================================
-- Ajout d'un état "actif/désactivé" sur les types de billets.
--
-- Motivation : on ne peut pas SUPPRIMER un type de billet déjà vendu
-- (FK tickets.ticket_type_id en on delete restrict, pour préserver
-- l'historique). On le DÉSACTIVE : il reste en base mais n'est plus
-- proposé à la vente ni visible côté app mobile.
--
-- À exécuter APRÈS 0007.
-- ============================================================

alter table ticket_types
  add column if not exists is_active boolean not null default true;

-- Les billets déjà présents restent actifs (default true).

-- ------------------------------------------------------------
-- La lecture publique des types de billets ne renvoie plus que
-- les billets actifs d'un événement publié.
-- ------------------------------------------------------------
drop policy if exists "ticket_types_read_public" on ticket_types;
do $$ begin
  create policy "ticket_types_read_public" on ticket_types
    for select using (
      is_active
      and exists (select 1 from events e where e.id = event_id and e.status <> 'draft')
    );
exception when duplicate_object then null; end $$;
