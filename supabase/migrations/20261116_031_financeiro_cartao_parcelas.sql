-- Fase 2 do plano de evolucao do financeiro: taxa de cartao e parcelas de boleto.
--
-- * Taxas percentuais de credito e debito, versionadas (cada alteracao gera uma
--   linha nova = historico). Somente o aprovador do financeiro altera.
-- * A taxa vigente e gravada na solicitacao de baixa e copiada para o
--   lancamento na aprovacao; mudar a taxa depois nao altera baixas antigas.
-- * Lancamentos ganham grupo/numero de parcela.
--
-- Depende da migration 030 (aprovacao de baixa).

-- ---------------------------------------------------------------------------
-- Taxas de cartao (historico)
-- ---------------------------------------------------------------------------
create table if not exists public.financeiro_taxas_cartao (
  id uuid primary key default gen_random_uuid(),
  modalidade text not null check (modalidade in ('cartao_credito','cartao_debito')),
  percentual numeric(5,2) not null check (percentual >= 0 and percentual < 100),
  vigente_desde timestamptz not null default now(),
  definido_por uuid references auth.users(id),
  definido_por_nome text
);

create index if not exists idx_financeiro_taxas_cartao_vigencia
  on public.financeiro_taxas_cartao (modalidade, vigente_desde desc);

alter table public.financeiro_taxas_cartao enable row level security;

drop policy if exists financeiro_taxas_cartao_read on public.financeiro_taxas_cartao;
create policy financeiro_taxas_cartao_read
on public.financeiro_taxas_cartao
for select
using (public.can_financeiro_read() or public.is_aprovador_financeiro());

revoke insert, update, delete on table public.financeiro_taxas_cartao from anon, authenticated;

create or replace function public.financeiro_taxa_cartao_vigente(p_modalidade text)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select t.percentual
    from public.financeiro_taxas_cartao t
    where t.modalidade = p_modalidade
    order by t.vigente_desde desc, t.id desc
    limit 1
  ), 0)
$$;

create or replace function public.financeiro_definir_taxa_cartao(p_modalidade text, p_percentual numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or not public.is_aprovador_financeiro() then
    raise exception 'Somente o aprovador do financeiro pode alterar as taxas de cartao.' using errcode = '42501';
  end if;
  if p_modalidade not in ('cartao_credito','cartao_debito') then
    raise exception 'Modalidade invalida.' using errcode = 'P0001';
  end if;
  if p_percentual is null or p_percentual < 0 or p_percentual >= 100 then
    raise exception 'Informe um percentual entre 0 e 99,99.' using errcode = 'P0001';
  end if;

  insert into public.financeiro_taxas_cartao (modalidade, percentual, definido_por, definido_por_nome)
  values (p_modalidade, round(p_percentual, 2), auth.uid(), public.financeiro_nome_usuario_atual())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.financeiro_taxa_cartao_vigente(text) from public, anon;
revoke all on function public.financeiro_definir_taxa_cartao(text, numeric) from public, anon;
grant execute on function public.financeiro_taxa_cartao_vigente(text) to authenticated;
grant execute on function public.financeiro_definir_taxa_cartao(text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- Colunas novas
-- ---------------------------------------------------------------------------
alter table public.financeiro_lancamentos
  add column if not exists valor_bruto numeric(12,2),
  add column if not exists taxa_modalidade text,
  add column if not exists taxa_percentual numeric(5,2),
  add column if not exists taxa_valor numeric(12,2),
  add column if not exists valor_liquido numeric(12,2),
  add column if not exists parcela_grupo_id uuid,
  add column if not exists parcela_numero integer,
  add column if not exists parcela_total integer;

alter table public.financeiro_lancamentos
  drop constraint if exists financeiro_lancamentos_parcela_check;
alter table public.financeiro_lancamentos
  add constraint financeiro_lancamentos_parcela_check check (
    (parcela_grupo_id is null and parcela_numero is null and parcela_total is null)
    or (parcela_grupo_id is not null and parcela_total between 1 and 36 and parcela_numero between 1 and parcela_total)
  );

create index if not exists idx_financeiro_lancamentos_parcela_grupo
  on public.financeiro_lancamentos (parcela_grupo_id, parcela_numero)
  where parcela_grupo_id is not null;

alter table public.financeiro_baixa_solicitacoes
  add column if not exists taxa_modalidade text,
  add column if not exists taxa_percentual numeric(5,2),
  add column if not exists taxa_valor numeric(12,2),
  add column if not exists valor_liquido numeric(12,2);

-- Lancamentos ja realizados: liquido = valor (nao havia taxa).
-- A trava so age quando ha auth.uid(); no SQL Editor este update passa.
update public.financeiro_lancamentos
   set valor_bruto = valor,
       valor_liquido = valor
 where status = 'realizado'
   and valor_liquido is null;

-- ---------------------------------------------------------------------------
-- Trava: inclui os campos de taxa (so mudam pela aprovacao)
-- ---------------------------------------------------------------------------
create or replace function public.financeiro_lancamentos_guard_baixa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_via_aprovacao boolean := coalesce(current_setting('app.financeiro_baixa_aprovada', true), '') = 'on';
  v_tem_pendente boolean;
begin
  -- Chamadas de servidor com service role e o SQL Editor nao tem auth.uid().
  if auth.uid() is null or v_via_aprovacao then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    if new.status = 'realizado' or new.data_liquidacao is not null then
      raise exception 'Lancamentos entram como programados. A baixa depende de aprovacao.'
        using errcode = 'P0001';
    end if;
    if new.valor_liquido is not null or new.taxa_valor is not null or new.taxa_percentual is not null then
      raise exception 'Taxa e valor liquido sao calculados na baixa.' using errcode = 'P0001';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'realizado' and not public.is_aprovador_financeiro() then
      raise exception 'Lancamento ja baixado nao pode ser excluido.' using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- UPDATE
  if old.status = 'realizado' then
    raise exception 'Lancamento ja baixado nao pode ser alterado.' using errcode = 'P0001';
  end if;

  if new.status = 'realizado' then
    raise exception 'A baixa precisa ser solicitada e aprovada na aba Aprovacoes.' using errcode = 'P0001';
  end if;

  if new.data_liquidacao is distinct from old.data_liquidacao
     or new.liquidado_por is distinct from old.liquidado_por
     or new.liquidado_em is distinct from old.liquidado_em
     or new.valor_bruto is distinct from old.valor_bruto
     or new.valor_liquido is distinct from old.valor_liquido
     or new.taxa_modalidade is distinct from old.taxa_modalidade
     or new.taxa_percentual is distinct from old.taxa_percentual
     or new.taxa_valor is distinct from old.taxa_valor then
    raise exception 'Dados de liquidacao so mudam pela aprovacao da baixa.' using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.financeiro_baixa_solicitacoes s
    where s.lancamento_id = old.id and s.status = 'pendente'
  ) into v_tem_pendente;

  if v_tem_pendente then
    if new.status = 'cancelado' or new.deleted_at is not null then
      update public.financeiro_baixa_solicitacoes
         set status = 'cancelada',
             decidido_por = auth.uid(),
             decidido_por_nome = public.financeiro_nome_usuario_atual(),
             decidido_em = now(),
             motivo_decisao = 'Lancamento cancelado'
       where lancamento_id = old.id and status = 'pendente';
    elsif new.valor is distinct from old.valor
       or new.forma_pagamento is distinct from old.forma_pagamento
       or new.tipo is distinct from old.tipo then
      raise exception 'Ha uma solicitacao de baixa pendente. Cancele-a antes de alterar valor ou forma de pagamento.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Solicitar baixa: grava a taxa vigente
-- ---------------------------------------------------------------------------
drop function if exists public.financeiro_solicitar_baixa(uuid, date, text, text);

create or replace function public.financeiro_solicitar_baixa(
  p_lancamento_id uuid,
  p_data_liquidacao date,
  p_forma_pagamento text default null,
  p_observacoes text default null,
  p_taxa_esperada numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lancamento public.financeiro_lancamentos%rowtype;
  v_id uuid;
  v_forma text;
  v_modalidade text;
  v_percentual numeric(5,2);
  v_taxa numeric(12,2);
  v_liquido numeric(12,2);
begin
  if auth.uid() is null then
    raise exception 'Nao autenticado.' using errcode = '42501';
  end if;
  if not (public.can_operar_financeiro() or public.is_aprovador_financeiro()) then
    raise exception 'Sem permissao para solicitar baixa.' using errcode = '42501';
  end if;
  if p_data_liquidacao is null then
    raise exception 'Informe a data do recebimento ou pagamento.' using errcode = 'P0001';
  end if;
  if p_data_liquidacao > current_date then
    raise exception 'A data da baixa nao pode ser futura.' using errcode = 'P0001';
  end if;

  select * into v_lancamento
  from public.financeiro_lancamentos
  where id = p_lancamento_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Lancamento nao encontrado.' using errcode = 'P0001';
  end if;
  if v_lancamento.status <> 'programado' then
    raise exception 'Somente lancamentos programados podem ter baixa solicitada.' using errcode = 'P0001';
  end if;

  -- Idempotente: se ja existe pendente, devolve a mesma solicitacao.
  select id into v_id
  from public.financeiro_baixa_solicitacoes
  where lancamento_id = p_lancamento_id and status = 'pendente';

  if v_id is not null then
    return v_id;
  end if;

  v_forma := coalesce(nullif(btrim(p_forma_pagamento), ''), v_lancamento.forma_pagamento);

  -- Taxa so em recebimentos no cartao.
  if v_lancamento.tipo = 'receita' and v_forma in ('cartao_credito','cartao_debito') then
    v_modalidade := v_forma;
    v_percentual := public.financeiro_taxa_cartao_vigente(v_forma);
    if p_taxa_esperada is not null and round(p_taxa_esperada, 2) <> v_percentual then
      raise exception 'A taxa de % mudou para %. Revise os valores e solicite novamente.',
        case when v_forma = 'cartao_credito' then 'credito' else 'debito' end,
        replace(v_percentual::text, '.', ',') || '%'
        using errcode = 'P0001';
    end if;
    v_taxa := round(v_lancamento.valor * v_percentual / 100, 2);
    v_liquido := v_lancamento.valor - v_taxa;
  end if;

  insert into public.financeiro_baixa_solicitacoes (
    lancamento_id, valor, data_liquidacao, forma_pagamento, observacoes, solicitado_por, solicitado_por_nome,
    taxa_modalidade, taxa_percentual, taxa_valor, valor_liquido
  ) values (
    p_lancamento_id,
    v_lancamento.valor,
    p_data_liquidacao,
    v_forma,
    nullif(btrim(p_observacoes), ''),
    auth.uid(),
    public.financeiro_nome_usuario_atual(),
    v_modalidade,
    v_percentual,
    v_taxa,
    v_liquido
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.financeiro_solicitar_baixa(uuid, date, text, text, numeric) from public, anon;
grant execute on function public.financeiro_solicitar_baixa(uuid, date, text, text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- Aprovar: copia taxa e liquido da solicitacao para o lancamento
-- ---------------------------------------------------------------------------
create or replace function public.financeiro_decidir_baixa(
  p_solicitacao_id uuid,
  p_aprovar boolean,
  p_motivo text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_solicitacao public.financeiro_baixa_solicitacoes%rowtype;
  v_lancamento public.financeiro_lancamentos%rowtype;
  v_status_final text := case when p_aprovar then 'aprovada' else 'rejeitada' end;
begin
  if auth.uid() is null or not public.is_aprovador_financeiro() then
    raise exception 'Somente o aprovador do financeiro pode decidir baixas.' using errcode = '42501';
  end if;
  if not p_aprovar and nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo da rejeicao.' using errcode = 'P0001';
  end if;

  select * into v_solicitacao
  from public.financeiro_baixa_solicitacoes
  where id = p_solicitacao_id
  for update;

  if not found then
    raise exception 'Solicitacao nao encontrada.' using errcode = 'P0001';
  end if;

  if v_solicitacao.status <> 'pendente' then
    if v_solicitacao.status = v_status_final then
      return v_solicitacao.status;
    end if;
    raise exception 'Esta solicitacao ja foi %.', v_solicitacao.status using errcode = 'P0001';
  end if;

  if p_aprovar then
    select * into v_lancamento
    from public.financeiro_lancamentos
    where id = v_solicitacao.lancamento_id and deleted_at is null
    for update;

    if not found or v_lancamento.status <> 'programado' then
      raise exception 'O lancamento nao esta mais programado.' using errcode = 'P0001';
    end if;
    if v_lancamento.valor <> v_solicitacao.valor then
      raise exception 'O valor do lancamento mudou depois da solicitacao. Rejeite e solicite novamente.'
        using errcode = 'P0001';
    end if;

    perform set_config('app.financeiro_baixa_aprovada', 'on', true);

    update public.financeiro_lancamentos
       set status = 'realizado',
           data_liquidacao = v_solicitacao.data_liquidacao,
           forma_pagamento = coalesce(v_solicitacao.forma_pagamento, forma_pagamento),
           valor_bruto = v_solicitacao.valor,
           taxa_modalidade = v_solicitacao.taxa_modalidade,
           taxa_percentual = v_solicitacao.taxa_percentual,
           taxa_valor = v_solicitacao.taxa_valor,
           valor_liquido = coalesce(v_solicitacao.valor_liquido, v_solicitacao.valor),
           liquidado_por = auth.uid(),
           liquidado_em = now()
     where id = v_lancamento.id;

    perform set_config('app.financeiro_baixa_aprovada', '', true);
  end if;

  update public.financeiro_baixa_solicitacoes
     set status = v_status_final,
         decidido_por = auth.uid(),
         decidido_por_nome = public.financeiro_nome_usuario_atual(),
         decidido_em = now(),
         motivo_decisao = nullif(btrim(p_motivo), '')
   where id = p_solicitacao_id;

  return v_status_final;
end;
$$;
