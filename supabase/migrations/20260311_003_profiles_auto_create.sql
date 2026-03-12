-- Auto criar profile ao cadastrar novo usu?rio no Auth
-- Executar ap?s migrations de schema base

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, nome, role, ativo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    'operacional'::public.app_role,
    true
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- garante que o dono da fun??o seja um role com permiss?o de escrita em public.profiles
alter function public.handle_new_auth_user() owner to postgres;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- backfill para usu?rios j? existentes sem profile
insert into public.profiles (user_id, nome, role, ativo)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'nome', split_part(u.email, '@', 1)) as nome,
  'operacional'::public.app_role as role,
  true as ativo
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;
