-- ERP HIGIENE DISQUE - Supabase Init Schema (v1)
-- Run in Supabase SQL Editor (Production)

create extension if not exists pgcrypto;

-- Roles (perfis)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'operacional', 'financeiro', 'tecnico');
  end if;
end
$$;

-- Profile do usu?rio autenticado
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  role public.app_role not null default 'operacional',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clientes
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  tipo_cliente text check (tipo_cliente in ('pf','pj')) not null,
  nome text not null,
  telefone text,
  email text,
  cpf text,
  cnpj text,
  status text not null default 'Ativo',
  possui_contrato boolean not null default false,
  data_inicio_contrato date,
  data_fim_contrato date,
  situacao_contrato text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Contratos
create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  numero text not null,
  descricao text not null,
  status text not null check (status in ('ativo','suspenso','encerrado')),
  tipo_contrato text not null check (tipo_contrato in ('recorrente','avulso')),
  data_inicio date not null,
  data_termino date not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (numero)
);

create table if not exists public.contrato_itens (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

-- Servi?os / OS
create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  os_number text not null unique,
  cliente_id uuid references public.clientes(id),
  cliente text not null,
  servico text not null,
  tipo text,
  local text not null,
  data date not null,
  horario text not null,
  tecnico text,
  status text not null check (status in ('agendado','em_execucao','executado','cancelado')),
  os_status text,
  os_assinada boolean default false,
  baixa_observacao text,
  os_fingerprint text,
  os_documento_html text,
  responsavel_baixa text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists ux_servicos_fingerprint
  on public.servicos (os_fingerprint)
  where os_fingerprint is not null and deleted_at is null;

-- Respons?veis por servi?o (suporte ao perfil t?cnico)
create table if not exists public.servico_responsaveis (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references public.servicos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (servico_id, user_id)
);

-- Estoque
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  unidade text,
  estoque_atual numeric not null default 0,
  estoque_minimo numeric not null default 0,
  ativo boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Helpers de autoriza??o
create or replace function public.current_user_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'admin'::public.app_role
$$;

create or replace function public.can_operar_core()
returns boolean
language sql
stable
as $$
  select public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role)
$$;

create or replace function public.can_financeiro_read()
returns boolean
language sql
stable
as $$
  select public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role, 'financeiro'::public.app_role)
$$;

create or replace function public.is_tecnico()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'tecnico'::public.app_role
$$;

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_clientes_updated_at on public.clientes;
create trigger trg_clientes_updated_at before update on public.clientes
for each row execute function public.set_updated_at();

drop trigger if exists trg_contratos_updated_at on public.contratos;
create trigger trg_contratos_updated_at before update on public.contratos
for each row execute function public.set_updated_at();

drop trigger if exists trg_servicos_updated_at on public.servicos;
create trigger trg_servicos_updated_at before update on public.servicos
for each row execute function public.set_updated_at();

drop trigger if exists trg_produtos_updated_at on public.produtos;
create trigger trg_produtos_updated_at before update on public.produtos
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.contratos enable row level security;
alter table public.contrato_itens enable row level security;
alter table public.servicos enable row level security;
alter table public.servico_responsaveis enable row level security;
alter table public.produtos enable row level security;

-- Profiles policies
create policy if not exists profiles_select_self_or_admin on public.profiles
for select using (user_id = auth.uid() or public.is_admin());

create policy if not exists profiles_update_self_or_admin on public.profiles
for update using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy if not exists profiles_insert_admin on public.profiles
for insert with check (public.is_admin());

-- Clientes policies
create policy if not exists clientes_read_core_fin on public.clientes
for select using (public.can_financeiro_read() and deleted_at is null);

create policy if not exists clientes_write_core on public.clientes
for all using (public.can_operar_core())
with check (public.can_operar_core());

-- Contratos policies
create policy if not exists contratos_read_core_fin on public.contratos
for select using (public.can_financeiro_read() and deleted_at is null);

create policy if not exists contratos_write_core on public.contratos
for all using (public.can_operar_core())
with check (public.can_operar_core());

create policy if not exists contrato_itens_read_core_fin on public.contrato_itens
for select using (public.can_financeiro_read());

create policy if not exists contrato_itens_write_core on public.contrato_itens
for all using (public.can_operar_core())
with check (public.can_operar_core());

-- Servi?os policies
create policy if not exists servicos_read_core_fin on public.servicos
for select using (public.can_financeiro_read() and deleted_at is null);

create policy if not exists servicos_read_tecnico_assigned on public.servicos
for select using (
  public.is_tecnico()
  and exists (
    select 1 from public.servico_responsaveis sr
    where sr.servico_id = servicos.id and sr.user_id = auth.uid()
  )
  and deleted_at is null
);

create policy if not exists servicos_write_core on public.servicos
for all using (public.can_operar_core())
with check (public.can_operar_core());

create policy if not exists servicos_update_tecnico_assigned on public.servicos
for update using (
  public.is_tecnico()
  and exists (
    select 1 from public.servico_responsaveis sr
    where sr.servico_id = servicos.id and sr.user_id = auth.uid()
  )
)
with check (
  public.is_tecnico()
  and exists (
    select 1 from public.servico_responsaveis sr
    where sr.servico_id = servicos.id and sr.user_id = auth.uid()
  )
);

-- Servico responsaveis policies
create policy if not exists servico_resp_read_core_or_self on public.servico_responsaveis
for select using (public.can_financeiro_read() or user_id = auth.uid());

create policy if not exists servico_resp_write_core on public.servico_responsaveis
for all using (public.can_operar_core())
with check (public.can_operar_core());

-- Produtos policies
create policy if not exists produtos_read_all_roles on public.produtos
for select using (
  public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role, 'financeiro'::public.app_role, 'tecnico'::public.app_role)
  and deleted_at is null
);

create policy if not exists produtos_write_core on public.produtos
for all using (public.can_operar_core())
with check (public.can_operar_core());

-- Storage buckets (private)
insert into storage.buckets (id, name, public)
values ('os-documentos', 'os-documentos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('contratos-docx', 'contratos-docx', false)
on conflict (id) do nothing;

-- Storage policies
-- Leitura: admin/operacional/financeiro, e t?cnico somente para os-documentos
create policy if not exists storage_read_private_docs on storage.objects
for select to authenticated
using (
  bucket_id in ('os-documentos','contratos-docx')
  and (
    public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role, 'financeiro'::public.app_role)
    or (public.current_user_role() = 'tecnico'::public.app_role and bucket_id = 'os-documentos')
  )
);

-- Escrita: admin/operacional
create policy if not exists storage_write_private_docs on storage.objects
for insert to authenticated
with check (
  bucket_id in ('os-documentos','contratos-docx')
  and public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role)
);

create policy if not exists storage_update_private_docs on storage.objects
for update to authenticated
using (
  bucket_id in ('os-documentos','contratos-docx')
  and public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role)
)
with check (
  bucket_id in ('os-documentos','contratos-docx')
  and public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role)
);

create policy if not exists storage_delete_private_docs on storage.objects
for delete to authenticated
using (
  bucket_id in ('os-documentos','contratos-docx')
  and public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role)
);
