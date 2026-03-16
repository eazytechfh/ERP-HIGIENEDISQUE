alter table public.profiles
  add column if not exists permissions text[];

create or replace function public.default_permissions_for_role(target_role public.app_role)
returns text[]
language sql
immutable
as $$
  select case target_role
    when 'admin'::public.app_role then array[
      'dashboard.view',
      'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.delete',
      'contratos.view', 'contratos.create', 'contratos.edit', 'contratos.delete', 'contratos.generate',
      'servicos.view', 'servicos.create', 'servicos.edit', 'servicos.delete', 'servicos.generate_os',
      'estoque.view', 'estoque.create', 'estoque.edit', 'estoque.delete',
      'equipe.view', 'equipe.create', 'equipe.edit', 'equipe.delete', 'equipe.manage_access',
      'veiculos.view', 'veiculos.create', 'veiculos.edit', 'veiculos.delete',
      'financeiro.view', 'financeiro.create', 'financeiro.edit', 'financeiro.delete',
      'logs.view'
    ]::text[]
    when 'operacional'::public.app_role then array[
      'dashboard.view',
      'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.delete',
      'contratos.view', 'contratos.create', 'contratos.edit', 'contratos.delete', 'contratos.generate',
      'servicos.view', 'servicos.create', 'servicos.edit', 'servicos.delete', 'servicos.generate_os',
      'estoque.view', 'estoque.create', 'estoque.edit', 'estoque.delete',
      'equipe.view', 'equipe.create', 'equipe.edit', 'equipe.delete',
      'veiculos.view', 'veiculos.create', 'veiculos.edit', 'veiculos.delete',
      'financeiro.view'
    ]::text[]
    when 'financeiro'::public.app_role then array[
      'dashboard.view',
      'clientes.view',
      'contratos.view',
      'servicos.view',
      'financeiro.view', 'financeiro.create', 'financeiro.edit', 'financeiro.delete'
    ]::text[]
    when 'tecnico'::public.app_role then array[
      'dashboard.view',
      'servicos.view', 'servicos.edit',
      'estoque.view'
    ]::text[]
    else array[]::text[]
  end
$$;

create or replace function public.apply_default_profile_permissions()
returns trigger
language plpgsql
as $$
begin
  if new.permissions is null then
    new.permissions := public.default_permissions_for_role(new.role);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_apply_permissions on public.profiles;
create trigger trg_profiles_apply_permissions
before insert or update on public.profiles
for each row execute function public.apply_default_profile_permissions();

update public.profiles
set permissions = public.default_permissions_for_role(role)
where permissions is null;

create or replace function public.current_user_permissions()
returns text[]
language sql
stable
as $$
  select coalesce(
    (select permissions from public.profiles where user_id = auth.uid()),
    public.default_permissions_for_role(coalesce(public.current_user_role(), 'operacional'::public.app_role))
  )
$$;

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
as $$
  select permission_key = any(coalesce(public.current_user_permissions(), array[]::text[]))
$$;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  actor_nome text,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  entity_label text,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity, entity_id);
create index if not exists idx_audit_logs_actor on public.audit_logs (actor_user_id, created_at desc);

alter table public.audit_logs enable row level security;

create policy if not exists audit_logs_insert_authenticated on public.audit_logs
for insert to authenticated
with check (actor_user_id = auth.uid());

create policy if not exists audit_logs_select_admin on public.audit_logs
for select to authenticated
using (public.is_admin() or public.has_permission('logs.view'));
