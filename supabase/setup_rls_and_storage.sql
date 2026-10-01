-- ============================================================
-- JigiEvent Admin — RLS (events + ticket_types) + Storage
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > Run.
--
-- PRÉREQUIS (déjà en place dans tes migrations) :
--   - Table profiles + trigger handle_new_user (migration 0004 / fix_auth_trigger.sql)
--   - Helpers : public.current_role_is(app_role)  (migration 0004)
--               public.owns_org(uuid)             (migration 0005)
--
-- Ce script réutilise ces helpers ; il ne crée AUCUNE fonction en double.
--
-- Modèle :
--   - SUPER_ADMIN : accès total (toutes organisations).
--   - ADMIN       : limité aux événements de SON organisation
--                   (profiles.organization_id = events.organization_id,
--                    via public.owns_org(...)).
-- ============================================================


-- ------------------------------------------------------------
-- 1. Table events
-- ------------------------------------------------------------
alter table public.events enable row level security;

drop policy if exists events_select_admin on public.events;
drop policy if exists events_insert_admin on public.events;
drop policy if exists events_update_admin on public.events;
drop policy if exists events_delete_admin on public.events;

-- SELECT : indispensable pour .insert(...).select().single().
create policy events_select_admin on public.events
for select
to authenticated
using (
  public.current_role_is('SUPER_ADMIN') or public.owns_org(organization_id)
);

-- INSERT : la ligne créée doit appartenir à l'organisation de l'admin.
create policy events_insert_admin on public.events
for insert
to authenticated
with check (
  public.current_role_is('SUPER_ADMIN') or public.owns_org(organization_id)
);

-- UPDATE : publier = changer status.
create policy events_update_admin on public.events
for update
to authenticated
using (
  public.current_role_is('SUPER_ADMIN') or public.owns_org(organization_id)
)
with check (
  public.current_role_is('SUPER_ADMIN') or public.owns_org(organization_id)
);

-- DELETE
create policy events_delete_admin on public.events
for delete
to authenticated
using (
  public.current_role_is('SUPER_ADMIN') or public.owns_org(organization_id)
);


-- ------------------------------------------------------------
-- 2. Table ticket_types (rattachée à l'organisation via l'événement)
-- ------------------------------------------------------------
alter table public.ticket_types enable row level security;

drop policy if exists ticket_types_select_admin on public.ticket_types;
drop policy if exists ticket_types_all_admin on public.ticket_types;

create policy ticket_types_select_admin on public.ticket_types
for select
to authenticated
using (
  public.current_role_is('SUPER_ADMIN')
  or exists (
    select 1 from public.events e
    where e.id = ticket_types.event_id and public.owns_org(e.organization_id)
  )
);

create policy ticket_types_all_admin on public.ticket_types
for all
to authenticated
using (
  public.current_role_is('SUPER_ADMIN')
  or exists (
    select 1 from public.events e
    where e.id = ticket_types.event_id and public.owns_org(e.organization_id)
  )
)
with check (
  public.current_role_is('SUPER_ADMIN')
  or exists (
    select 1 from public.events e
    where e.id = ticket_types.event_id and public.owns_org(e.organization_id)
  )
);


-- ------------------------------------------------------------
-- 3. profiles : le SUPER_ADMIN doit pouvoir lister tous les profils
--    (l'app back-office affiche les admins/organisateurs).
--    (Les policies "self" existent déjà via la migration 0004.)
-- ------------------------------------------------------------
do $$ begin
  create policy profiles_read_superadmin on public.profiles
    for select to authenticated
    using (public.current_role_is('SUPER_ADMIN'));
exception when duplicate_object then null; end $$;


-- ------------------------------------------------------------
-- 4. Storage : bucket "event-images"
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do update set public = true;

drop policy if exists event_images_read on storage.objects;
drop policy if exists event_images_insert on storage.objects;
drop policy if exists event_images_update on storage.objects;
drop policy if exists event_images_delete on storage.objects;

-- Lecture publique (app mobile + back-office)
create policy event_images_read on storage.objects
for select
to public
using (bucket_id = 'event-images');

-- Upload réservé aux connectés
create policy event_images_insert on storage.objects
for insert
to authenticated
with check (bucket_id = 'event-images');

create policy event_images_update on storage.objects
for update
to authenticated
using (bucket_id = 'event-images')
with check (bucket_id = 'event-images');

create policy event_images_delete on storage.objects
for delete
to authenticated
using (bucket_id = 'event-images');


-- ------------------------------------------------------------
-- 5. Commandes & billets : lecture par l'organisateur propriétaire
--    de l'événement (en plus de l'acheteur, policy 0007).
--    Nécessaire pour que la page "Commandes" du back-office affiche
--    les commandes des événements de l'organisation.
-- ------------------------------------------------------------
do $$ begin
  create policy orders_read_organizer on public.orders
    for select to authenticated
    using (
      public.current_role_is('SUPER_ADMIN')
      or exists (
        select 1 from public.events e
        where e.id = orders.event_id and public.owns_org(e.organization_id)
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy tickets_read_organizer on public.tickets
    for select to authenticated
    using (
      public.current_role_is('SUPER_ADMIN')
      or exists (
        select 1 from public.events e
        where e.id = tickets.event_id and public.owns_org(e.organization_id)
      )
    );
exception when duplicate_object then null; end $$;


-- ============================================================
-- FIN.
-- Après exécution :
--   - Un SUPER_ADMIN peut créer/publier des événements pour n'importe
--     quelle organisation.
--   - Un ADMIN rattaché à une organisation peut publier ses événements.
--   - L'upload d'images fonctionne (bucket event-images, lecture publique).
--   - Un organisateur voit les commandes/billets de SES événements.
-- ============================================================
