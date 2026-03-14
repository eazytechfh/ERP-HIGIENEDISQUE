create or replace function public.can_operar_financeiro()
returns boolean
language sql
stable
as $$
  select public.current_user_role() in (
    'admin'::public.app_role,
    'operacional'::public.app_role,
    'financeiro'::public.app_role
  )
$$;

alter table public.servicos
  add column if not exists cobranca_modo text check (cobranca_modo in ('contrato','adicional')),
  add column if not exists contrato_id uuid references public.contratos(id) on delete set null,
  add column if not exists contrato_item_id uuid references public.contrato_itens(id) on delete set null,
  add column if not exists valor_cobranca numeric(12,2),
  add column if not exists forma_pagamento text,
  add column if not exists tipo_documento_cobranca text check (tipo_documento_cobranca in ('recibo','nota_fiscal','boleto','outro')),
  add column if not exists motivo_adicional text,
  add column if not exists cobranca_aprovada boolean not null default false;

create table if not exists public.financeiro_lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receita','despesa')),
  status text not null default 'programado' check (status in ('programado','realizado','cancelado')),
  origem text not null default 'manual' check (origem in ('manual','servico','contrato','boleto','nota_fiscal','ajuste')),
  descricao text not null,
  categoria text,
  valor numeric(12,2) not null check (valor >= 0),
  data_competencia date not null,
  data_vencimento date not null,
  data_liquidacao date,
  cliente_id uuid references public.clientes(id) on delete set null,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  servico_id uuid references public.servicos(id) on delete set null,
  contrato_id uuid references public.contratos(id) on delete set null,
  forma_pagamento text,
  documento_tipo text check (documento_tipo in ('boleto','nota_fiscal','recibo','pix','transferencia','dinheiro','cartao','outro')),
  documento_numero text,
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.financeiro_documentos (
  id uuid primary key default gen_random_uuid(),
  lancamento_id uuid not null references public.financeiro_lancamentos(id) on delete cascade,
  tipo text not null check (tipo in ('boleto','nota_fiscal')),
  status text not null default 'pendente' check (status in ('pendente','emitido','cancelado')),
  numero text not null,
  serie text,
  chave_documento text,
  linha_digitavel text,
  data_emissao date not null,
  data_vencimento date,
  valor numeric(12,2) not null check (valor >= 0),
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_financeiro_lancamentos_tipo_status_vencimento
  on public.financeiro_lancamentos (tipo, status, data_vencimento)
  where deleted_at is null;

create index if not exists idx_financeiro_lancamentos_servico
  on public.financeiro_lancamentos (servico_id)
  where deleted_at is null;

create index if not exists idx_financeiro_documentos_tipo_status
  on public.financeiro_documentos (tipo, status)
  where deleted_at is null;

drop trigger if exists trg_financeiro_lancamentos_updated_at on public.financeiro_lancamentos;
create trigger trg_financeiro_lancamentos_updated_at
before update on public.financeiro_lancamentos
for each row execute function public.set_updated_at();

drop trigger if exists trg_financeiro_documentos_updated_at on public.financeiro_documentos;
create trigger trg_financeiro_documentos_updated_at
before update on public.financeiro_documentos
for each row execute function public.set_updated_at();

alter table public.financeiro_lancamentos enable row level security;
alter table public.financeiro_documentos enable row level security;

drop policy if exists financeiro_lancamentos_read on public.financeiro_lancamentos;
create policy financeiro_lancamentos_read
on public.financeiro_lancamentos
for select
using (public.can_financeiro_read() and deleted_at is null);

drop policy if exists financeiro_lancamentos_write on public.financeiro_lancamentos;
create policy financeiro_lancamentos_write
on public.financeiro_lancamentos
for all
using (public.can_operar_financeiro())
with check (public.can_operar_financeiro());

drop policy if exists financeiro_documentos_read on public.financeiro_documentos;
create policy financeiro_documentos_read
on public.financeiro_documentos
for select
using (
  public.can_financeiro_read()
  and deleted_at is null
  and exists (
    select 1
    from public.financeiro_lancamentos fl
    where fl.id = financeiro_documentos.lancamento_id
      and fl.deleted_at is null
  )
);

drop policy if exists financeiro_documentos_write on public.financeiro_documentos;
create policy financeiro_documentos_write
on public.financeiro_documentos
for all
using (public.can_operar_financeiro())
with check (public.can_operar_financeiro());
