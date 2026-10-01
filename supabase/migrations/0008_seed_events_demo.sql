-- ============================================================
-- Seed de démonstration — Événements & billetterie
--
-- Données publiques (catégories, artistes, un événement publié avec ses
-- types de billets) pour tester l'app mobile immédiatement après migration.
-- Idempotent (guards "where not exists" / "on conflict").
--
-- ⚠️ Données de démo uniquement. À retirer / adapter en production.
-- ============================================================

-- Catégories de base
insert into categories (name, slug, icon, color)
values
  ('Concerts',   'concerts',   'music',        '#C86B3C'),
  ('Festivals',  'festivals',  'party-popper', '#7A9E7E'),
  ('Sport',      'sport',      'trophy',       '#3C6EC8'),
  ('Théâtre',    'theatre',    'drama-masks',  '#9E7A3C'),
  ('Conférences','conferences','presentation', '#5C5C7A')
on conflict (slug) do nothing;

-- Artistes de démo
insert into artists (name, image_url)
select 'Salif Keita', null
where not exists (select 1 from artists where name = 'Salif Keita');
insert into artists (name, image_url)
select 'Oumou Sangaré', null
where not exists (select 1 from artists where name = 'Oumou Sangaré');

-- Événement de démo, rattaché à la première organisation existante
-- (nécessite au moins une ligne dans `organizations`).
do $$
declare
  v_org   uuid;
  v_cat   uuid;
  v_event uuid;
  v_tt    uuid;
  v_art1  uuid;
begin
  select id into v_org from organizations order by created_at asc limit 1;
  if v_org is null then
    raise notice 'Aucune organisation : seed événement ignoré.';
    return;
  end if;

  select id into v_cat from categories where slug = 'concerts' limit 1;

  -- Crée l'événement si un événement de démo du même titre n'existe pas déjà.
  select id into v_event from events where title = 'Festival Acoustik Bamako' limit 1;
  if v_event is null then
    insert into events (
      organization_id, category_id, title, description, cover_image_url,
      venue_name, venue_address, venue_city, venue_region,
      latitude, longitude, start_date, end_date,
      status, is_featured, is_promoted
    ) values (
      v_org, v_cat, 'Festival Acoustik Bamako',
      'Une soirée de musique mandingue avec des artistes de renom.',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
      'Palais de la Culture', 'Route de Koulikoro', 'Bamako', 'District de Bamako',
      12.6392, -8.0029,
      now() + interval '21 days', now() + interval '21 days' + interval '5 hours',
      'upcoming', true, true
    ) returning id into v_event;

    -- Types de billets
    insert into ticket_types (event_id, name, price, available_quantity, max_per_order, description)
    values
      (v_event, 'Standard',  10000, 500, 10, 'Accès général'),
      (v_event, 'VIP',       25000, 100, 5,  'Accès VIP + boisson'),
      (v_event, 'Carré Or',  50000, 20,  4,  'Places assises premium');

    -- Association d'un artiste
    select id into v_art1 from artists where name = 'Salif Keita' limit 1;
    if v_art1 is not null then
      insert into event_artists (event_id, artist_id) values (v_event, v_art1)
      on conflict do nothing;
    end if;
  end if;
end $$;
