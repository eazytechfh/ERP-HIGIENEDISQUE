-- Fases 4 e 5 do plano de evolucao do financeiro: NFS-e pelo Asaas.
--
-- * financeiro_nfse_config: padroes tributarios (linha unica), editaveis so pelo
--   aprovador do financeiro; cada alteracao vai para o historico.
-- * financeiro_documentos ganha os campos da NFS-e/Asaas (id, status, numero,
--   codigo de verificacao, PDF/XML, erro, retencoes...). numero passa a ser
--   opcional: a NFS-e so tem numero depois de autorizada pela prefeitura.
-- * financeiro_asaas_clientes: vinculo cliente do ERP -> cliente no Asaas.
-- * financeiro_asaas_eventos: webhooks recebidos (id unico = idempotencia).
--
-- A chave do Asaas fica so no servidor (ASAAS_API_KEY); as rotas usam service role.

-- ---------------------------------------------------------------------------
-- Configuracao tributaria
-- ---------------------------------------------------------------------------
create table if not exists public.financeiro_nfse_config (
  id integer primary key default 1 check (id = 1),
  municipal_service_id text,
  municipal_service_code text,
  municipal_service_name text,
  descricao_padrao text,
  observacoes_padrao text,
  iss_aliquota numeric(5,2) not null default 0 check (iss_aliquota between 0 and 100),
  iss_retido boolean not null default false,
  inss_aliquota numeric(5,2) not null default 0 check (inss_aliquota between 0 and 100),
  ir_aliquota numeric(5,2) not null default 0 check (ir_aliquota between 0 and 100),
  pis_aliquota numeric(5,2) not null default 0 check (pis_aliquota between 0 and 100),
  cofins_aliquota numeric(5,2) not null default 0 check (cofins_aliquota between 0 and 100),
  csll_aliquota numeric(5,2) not null default 0 check (csll_aliquota between 0 and 100),
  atualizado_por uuid references auth.users(id),
  atualizado_por_nome text,
  updated_at timestamptz not null default now()
);

insert into public.financeiro_nfse_config (id) values (1) on conflict (id) do nothing;

create table if not exists public.financeiro_nfse_config_historico (
  id uuid primary key default gen_random_uuid(),
  config jsonb not null,
  alterado_por uuid references auth.users(id),
  alterado_por_nome text,
  alterado_em timestamptz not null default now()
);

alter table public.financeiro_nfse_config enable row level security;
alter table public.financeiro_nfse_config_historico enable row level security;

drop policy if exists financeiro_nfse_config_read on public.financeiro_nfse_config;
create policy financeiro_nfse_config_read on public.financeiro_nfse_config
for select using (public.can_financeiro_read() or public.is_aprovador_financeiro());

drop policy if exists financeiro_nfse_config_historico_read on public.financeiro_nfse_config_historico;
create policy financeiro_nfse_config_historico_read on public.financeiro_nfse_config_historico
for select using (public.can_financeiro_read() or public.is_aprovador_financeiro());

revoke insert, update, delete on table public.financeiro_nfse_config from anon, authenticated;
revoke insert, update, delete on table public.financeiro_nfse_config_historico from anon, authenticated;

create or replace function public.financeiro_salvar_nfse_config(p_config jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := public.financeiro_nome_usuario_atual();
begin
  if auth.uid() is null or not public.is_aprovador_financeiro() then
    raise exception 'Somente o aprovador do financeiro pode alterar a configuracao fiscal.' using errcode = '42501';
  end if;

  update public.financeiro_nfse_config
     set municipal_service_id = nullif(btrim(p_config->>'municipal_service_id'), ''),
         municipal_service_code = nullif(btrim(p_config->>'municipal_service_code'), ''),
         municipal_service_name = nullif(btrim(p_config->>'municipal_service_name'), ''),
         descricao_padrao = nullif(btrim(p_config->>'descricao_padrao'), ''),
         observacoes_padrao = nullif(btrim(p_config->>'observacoes_padrao'), ''),
         iss_aliquota = coalesce((p_config->>'iss_aliquota')::numeric, 0),
         iss_retido = coalesce((p_config->>'iss_retido')::boolean, false),
         inss_aliquota = coalesce((p_config->>'inss_aliquota')::numeric, 0),
         ir_aliquota = coalesce((p_config->>'ir_aliquota')::numeric, 0),
         pis_aliquota = coalesce((p_config->>'pis_aliquota')::numeric, 0),
         cofins_aliquota = coalesce((p_config->>'cofins_aliquota')::numeric, 0),
         csll_aliquota = coalesce((p_config->>'csll_aliquota')::numeric, 0),
         atualizado_por = auth.uid(),
         atualizado_por_nome = v_nome,
         updated_at = now()
   where id = 1;

  insert into public.financeiro_nfse_config_historico (config, alterado_por, alterado_por_nome)
  select to_jsonb(c) - 'atualizado_por', auth.uid(), v_nome
  from public.financeiro_nfse_config c where c.id = 1;
end;
$$;

revoke all on function public.financeiro_salvar_nfse_config(jsonb) from public, anon;
grant execute on function public.financeiro_salvar_nfse_config(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Documentos: campos da NFS-e
-- ---------------------------------------------------------------------------
alter table public.financeiro_documentos alter column numero drop not null;

alter table public.financeiro_documentos
  add column if not exists servico_id uuid references public.servicos(id) on delete set null,
  add column if not exists external_reference text,
  add column if not exists asaas_invoice_id text,
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_status text,
  add column if not exists asaas_status_descricao text,
  add column if not exists erro_motivo text,
  add column if not exists codigo_verificacao text,
  add column if not exists pdf_url text,
  add column if not exists xml_url text,
  add column if not exists emissao_modo text check (emissao_modo in ('agora','agendar')),
  add column if not exists data_efetiva date,
  add column if not exists deducoes numeric(12,2) not null default 0,
  add column if not exists iss_retido boolean,
  add column if not exists iss_aliquota numeric(5,2),
  add column if not exists inss_aliquota numeric(5,2),
  add column if not exists ir_aliquota numeric(5,2),
  add column if not exists valor_iss numeric(12,2),
  add column if not exists valor_inss numeric(12,2),
  add column if not exists valor_ir numeric(12,2),
  add column if not exists valor_liquido_receber numeric(12,2),
  add column if not exists municipal_service_code text,
  add column if not exists municipal_service_name text,
  add column if not exists sincronizado_em timestamptz;

create unique index if not exists uq_financeiro_documentos_external_reference
  on public.financeiro_documentos (external_reference) where external_reference is not null;
create unique index if not exists uq_financeiro_documentos_asaas_invoice
  on public.financeiro_documentos (asaas_invoice_id) where asaas_invoice_id is not null;

-- ---------------------------------------------------------------------------
-- Vinculo de clientes com o Asaas (so o servidor escreve)
-- ---------------------------------------------------------------------------
create table if not exists public.financeiro_asaas_clientes (
  cliente_id uuid primary key references public.clientes(id) on delete cascade,
  asaas_customer_id text not null unique,
  ambiente text not null check (ambiente in ('sandbox','producao')),
  created_at timestamptz not null default now()
);
alter table public.financeiro_asaas_clientes enable row level security;
revoke all on table public.financeiro_asaas_clientes from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Webhooks recebidos (idempotencia pelo id do evento)
-- ---------------------------------------------------------------------------
create table if not exists public.financeiro_asaas_eventos (
  id text primary key,
  evento text not null,
  invoice_id text,
  payload jsonb not null,
  status text not null default 'pendente' check (status in ('pendente','processado','erro','ignorado')),
  erro text,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz
);
create index if not exists idx_financeiro_asaas_eventos_pendentes
  on public.financeiro_asaas_eventos (recebido_em) where status in ('pendente','erro');
alter table public.financeiro_asaas_eventos enable row level security;
revoke all on table public.financeiro_asaas_eventos from anon, authenticated;
