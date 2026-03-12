-- Expandir schema de clientes para refletir todos os campos do frontend
-- Executar apos 20260310_001_init_schema.sql

-- 1) Campos faltantes na tabela public.clientes
alter table public.clientes
  add column if not exists nome_fantasia text,
  add column if not exists inscricao_estadual text,
  add column if not exists inscricao_municipal text,
  add column if not exists canal_preferencial text,
  add column if not exists horarios_contato text,
  add column if not exists notif_agendamentos boolean not null default true,
  add column if not exists notif_lembretes boolean not null default true,
  add column if not exists notif_certificados boolean not null default false,
  add column if not exists notif_cobrancas boolean not null default true,
  add column if not exists horarios_atendimento text,
  add column if not exists autorizacao_previa boolean not null default false,
  add column if not exists epi_especifico boolean not null default false,
  add column if not exists possui_pets boolean not null default false,
  add column if not exists observacoes_operacionais text,
  add column if not exists tipo_contrato text,
  add column if not exists observacoes_internas text;

-- 2) Locais de atendimento por cliente
create table if not exists public.cliente_locais (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text,
  cep text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  tipo_ambiente text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists ix_cliente_locais_cliente_id
  on public.cliente_locais(cliente_id)
  where deleted_at is null;

-- 3) Contatos por cliente
create table if not exists public.cliente_contatos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text,
  cargo text,
  telefone text,
  email text,
  principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists ix_cliente_contatos_cliente_id
  on public.cliente_contatos(cliente_id)
  where deleted_at is null;

-- 4) Arquivos do cliente (metadados + path no storage)
create table if not exists public.cliente_arquivos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text not null,
  mime_type text,
  storage_bucket text,
  storage_path text,
  tamanho bigint,
  origem text,
  contrato_id uuid references public.contratos(id) on delete set null,
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists ix_cliente_arquivos_cliente_id
  on public.cliente_arquivos(cliente_id)
  where deleted_at is null;

-- 5) Trigger updated_at para novas tabelas
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cliente_locais_updated_at on public.cliente_locais;
create trigger trg_cliente_locais_updated_at
before update on public.cliente_locais
for each row execute function public.set_updated_at();

drop trigger if exists trg_cliente_contatos_updated_at on public.cliente_contatos;
create trigger trg_cliente_contatos_updated_at
before update on public.cliente_contatos
for each row execute function public.set_updated_at();

drop trigger if exists trg_cliente_arquivos_updated_at on public.cliente_arquivos;
create trigger trg_cliente_arquivos_updated_at
before update on public.cliente_arquivos
for each row execute function public.set_updated_at();

-- 6) RLS
alter table public.cliente_locais enable row level security;
alter table public.cliente_contatos enable row level security;
alter table public.cliente_arquivos enable row level security;

-- Read: admin/operacional/financeiro
-- Write: admin/operacional

drop policy if exists cliente_locais_read_core_fin on public.cliente_locais;
create policy cliente_locais_read_core_fin on public.cliente_locais
for select using (public.can_financeiro_read() and deleted_at is null);

drop policy if exists cliente_locais_write_core on public.cliente_locais;
create policy cliente_locais_write_core on public.cliente_locais
for all using (public.can_operar_core())
with check (public.can_operar_core());

drop policy if exists cliente_contatos_read_core_fin on public.cliente_contatos;
create policy cliente_contatos_read_core_fin on public.cliente_contatos
for select using (public.can_financeiro_read() and deleted_at is null);

drop policy if exists cliente_contatos_write_core on public.cliente_contatos;
create policy cliente_contatos_write_core on public.cliente_contatos
for all using (public.can_operar_core())
with check (public.can_operar_core());

drop policy if exists cliente_arquivos_read_core_fin on public.cliente_arquivos;
create policy cliente_arquivos_read_core_fin on public.cliente_arquivos
for select using (public.can_financeiro_read() and deleted_at is null);

drop policy if exists cliente_arquivos_write_core on public.cliente_arquivos;
create policy cliente_arquivos_write_core on public.cliente_arquivos
for all using (public.can_operar_core())
with check (public.can_operar_core());
