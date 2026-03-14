alter table public.financeiro_lancamentos
  drop constraint if exists financeiro_lancamentos_tipo_check;

alter table public.financeiro_lancamentos
  add constraint financeiro_lancamentos_tipo_check
  check (tipo in ('receita','despesa','investimento'));

create table if not exists public.financeiro_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('receita','despesa','investimento')),
  descricao text,
  ativo boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.financeiro_categorias
  add constraint financeiro_categorias_nome_tipo_unique unique (nome, tipo);

alter table public.financeiro_lancamentos
  add column if not exists categoria_id uuid references public.financeiro_categorias(id) on delete set null,
  add column if not exists notificacao_email boolean not null default false,
  add column if not exists notificacao_whatsapp boolean not null default false,
  add column if not exists api_integracao_status text not null default 'nao_enviado' check (api_integracao_status in ('nao_enviado','pendente','enviado','erro')),
  add column if not exists api_integracao_referencia text;

alter table public.financeiro_documentos
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null,
  add column if not exists contrato_id uuid references public.contratos(id) on delete set null,
  add column if not exists descricao text,
  add column if not exists valor_servico numeric(12,2),
  add column if not exists notificacao_email boolean not null default false,
  add column if not exists notificacao_whatsapp boolean not null default false,
  add column if not exists api_integracao_status text not null default 'nao_enviado' check (api_integracao_status in ('nao_enviado','pendente','enviado','erro')),
  add column if not exists api_integracao_referencia text;

drop trigger if exists trg_financeiro_categorias_updated_at on public.financeiro_categorias;
create trigger trg_financeiro_categorias_updated_at
before update on public.financeiro_categorias
for each row execute function public.set_updated_at();

alter table public.financeiro_categorias enable row level security;

drop policy if exists financeiro_categorias_read on public.financeiro_categorias;
create policy financeiro_categorias_read
on public.financeiro_categorias
for select
using (public.can_financeiro_read() and deleted_at is null);

drop policy if exists financeiro_categorias_write on public.financeiro_categorias;
create policy financeiro_categorias_write
on public.financeiro_categorias
for all
using (public.can_operar_financeiro())
with check (public.can_operar_financeiro());

insert into public.financeiro_categorias (nome, tipo, descricao)
values
  ('Mensalidade de Contrato', 'receita', 'Receitas recorrentes de contratos ativos'),
  ('Servico Avulso', 'receita', 'Receitas de servicos adicionais ou avulsos'),
  ('Dedetizacao Residencial', 'receita', 'Receitas de atendimentos residenciais'),
  ('Dedetizacao Comercial', 'receita', 'Receitas de atendimentos comerciais'),
  ('Compra de Insumos', 'despesa', 'Despesas com compra de produtos e materiais'),
  ('Combustivel', 'despesa', 'Despesas com frota operacional'),
  ('Folha de Pagamento', 'despesa', 'Despesas com equipe e encargos'),
  ('Manutencao de Veiculos', 'despesa', 'Despesas de manutencao preventiva ou corretiva'),
  ('Equipamentos', 'investimento', 'Investimentos em equipamentos e ativos'),
  ('Expansao Comercial', 'investimento', 'Investimentos em crescimento e marketing')
on conflict (nome, tipo) do nothing;
