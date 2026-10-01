-- ============================================================
-- Correctif : trigger de création de profil robuste + profil
-- Super Admin pour hamidousng@gmail.com.
--
-- À exécuter dans Supabase → SQL Editor (tout d'un coup).
-- Résout l'erreur "Database error querying schema" causée par
-- un trigger handle_new_user qui échouait au signup.
-- ============================================================

-- 1) Version durcie du trigger : ne bloque JAMAIS la création du compte auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role := 'ADMIN';
  v_org  uuid := null;
begin
  -- rôle depuis les métadonnées, sinon ADMIN
  begin
    if coalesce(new.raw_user_meta_data->>'role','') <> '' then
      v_role := (new.raw_user_meta_data->>'role')::app_role;
    end if;
  exception when others then
    v_role := 'ADMIN';
  end;

  -- organisation depuis les métadonnées, sinon null
  begin
    if coalesce(new.raw_user_meta_data->>'organization_id','') <> '' then
      v_org := (new.raw_user_meta_data->>'organization_id')::uuid;
    end if;
  exception when others then
    v_org := null;
  end;

  insert into public.profiles (id, name, email, role, organization_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    v_role,
    v_org
  )
  on conflict (id) do nothing;

  return new;
exception when others then
  -- Filet de sécurité : ne jamais faire échouer l'auth à cause du profil.
  return new;
end;
$$;

-- 2) (Ré)attacher le trigger au cas où il manquerait.
do $$ begin
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
exception when duplicate_object then null; end $$;

-- 3) Créer/mettre à jour le profil Super Admin pour l'utilisateur existant.
insert into public.profiles (id, name, email, role)
select id, 'Hamidou', email, 'SUPER_ADMIN'
from auth.users
where email = 'hamidousng@gmail.com'
on conflict (id) do update set role = 'SUPER_ADMIN';

-- 4) Vérification.
select email, role from public.profiles where email = 'hamidousng@gmail.com';
