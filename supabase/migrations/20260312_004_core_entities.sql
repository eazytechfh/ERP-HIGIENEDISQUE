-- ERP HIGIENE DISQUE - Core entities missing from v1 UI

create table if not exists public.equipe_membros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  nome text not null,
  telefone text,
  cargo text,
  endereco text,
  cpf text,
  cnh boolean not null default false,
  cnh_validade date,
  nr33_validade date,
  nr35_validade date,
  aso_validade date,
  situacao text not null default 'Ativo' check (situacao in ('Ativo','Inativo')),
  email_acesso text,
  perfil_acesso public.app_role,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  cnpj text,
  telefone text,
  email text,
  rua text,
  numero text,
  bairro text,
  cidade text,
  uf text,
  nome_contato text,
  observacoes text,
  ativo boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.produtos
  add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete set null,
  add column if not exists marca text,
  add column if not exists custo_unitario numeric,
  add column if not exists categoria text,
  add column if not exists unidade text,
  add column if not exists estoque_minimo numeric not null default 0;

create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  modelo text not null,
  marca text not null,
  placa text not null unique,
  responsavel text not null,
  ativo boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.manutencoes_preventivas (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos(id) on delete cascade,
  descricao text not null,
  data_prevista date not null,
  quilometragem integer not null,
  status text not null default 'Pendente' check (status in ('Pendente','Agendada','Concluida')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_equipe_membros_updated_at on public.equipe_membros;
create trigger trg_equipe_membros_updated_at before update on public.equipe_membros
for each row execute function public.set_updated_at();

drop trigger if exists trg_fornecedores_updated_at on public.fornecedores;
create trigger trg_fornecedores_updated_at before update on public.fornecedores
for each row execute function public.set_updated_at();

drop trigger if exists trg_veiculos_updated_at on public.veiculos;
create trigger trg_veiculos_updated_at before update on public.veiculos
for each row execute function public.set_updated_at();

drop trigger if exists trg_manutencoes_preventivas_updated_at on public.manutencoes_preventivas;
create trigger trg_manutencoes_preventivas_updated_at before update on public.manutencoes_preventivas
for each row execute function public.set_updated_at();

alter table public.equipe_membros enable row level security;
alter table public.fornecedores enable row level security;
alter table public.veiculos enable row level security;
alter table public.manutencoes_preventivas enable row level security;

create policy if not exists equipe_membros_read_core_fin on public.equipe_membros
for select using (public.can_financeiro_read() and deleted_at is null);

create policy if not exists equipe_membros_write_core on public.equipe_membros
for all using (public.can_operar_core())
with check (public.can_operar_core());

create policy if not exists fornecedores_read_core_fin on public.fornecedores
for select using (public.can_financeiro_read() and deleted_at is null);

create policy if not exists fornecedores_write_core on public.fornecedores
for all using (public.can_operar_core())
with check (public.can_operar_core());

create policy if not exists veiculos_read_core_fin on public.veiculos
for select using (public.can_financeiro_read() and deleted_at is null);

create policy if not exists veiculos_write_core on public.veiculos
for all using (public.can_operar_core())
with check (public.can_operar_core());

create policy if not exists manutencoes_read_core_fin on public.manutencoes_preventivas
for select using (public.can_financeiro_read() and deleted_at is null);

create policy if not exists manutencoes_write_core on public.manutencoes_preventivas
for all using (public.can_operar_core())
with check (public.can_operar_core());
