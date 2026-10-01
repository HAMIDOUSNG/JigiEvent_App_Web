-- ============================================================
-- Profils utilisateurs (rôles) liés à Supabase Auth.
--
-- Chaque compte auth.users a un profil portant son rôle
-- (SUPER_ADMIN / ADMIN) et, pour un admin, l'organisation rattachée.
-- Un trigger crée automatiquement le profil au moment du signup.
-- ============================================================

do $$ begin
  create type app_role as enum ('SUPER_ADMIN', 'ADMIN');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text not null default '',
  email            text not null default '',
  role             app_role not null default 'ADMIN',
  organization_id  uuid references organizations(id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table profiles enable row level security;

-- Un utilisateur peut lire son propre profil.
do $$ begin
  create policy "profiles_read_self" on profiles
    for select to authenticated using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Un utilisateur peut mettre à jour son propre profil (nom, etc.).
do $$ begin
  create policy "profiles_update_self" on profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- Création automatique du profil au signup.
-- Le rôle et l'organisation peuvent être passés dans
-- raw_user_meta_data (options.data côté client) :
--   { "name": "...", "role": "ADMIN", "organization_id": "..." }
-- Par défaut : rôle ADMIN.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, organization_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'ADMIN'),
    nullif(new.raw_user_meta_data->>'organization_id', '')::uuid
  );
  return new;
end;
$$;

do $$ begin
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- (Optionnel) Helper : le rôle de l'utilisateur courant.
-- Utile pour écrire des policies "Super Admin uniquement".
-- ------------------------------------------------------------
create or replace function public.current_role_is(target app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = target
  );
$$;
