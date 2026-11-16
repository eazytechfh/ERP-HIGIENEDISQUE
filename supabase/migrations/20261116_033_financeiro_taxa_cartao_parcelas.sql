-- Taxa de cartao por numero de parcelas da venda (credito 1x..21x; debito sempre 1x).
-- A venda no cartao continua sendo UM lancamento; o numero de parcelas so define a taxa.
--
-- Mudancas em relacao a 031:
-- * financeiro_taxas_cartao ganha a coluna parcelas.
-- * Combinacao sem taxa configurada bloqueia a solicitacao (antes valia 0%).
-- * Solicitacao e lancamento guardam cartao_parcelas.
-- * Carga inicial com as taxas da maquininha informadas em 2026-11-16 (debito e credito 1x-10x).
--
-- Depende das migrations 030, 031 e 032.

alter table public.financeiro_taxas_cartao
  add column if not exists parcelas integer not null default 1;

alter table public.financeiro_taxas_cartao
  drop constraint if exists financeiro_taxas_cartao_parcelas_check;
alter table public.financeiro_taxas_cartao
  add constraint financeiro_taxas_cartao_parcelas_check check (
    (modalidade = 'cartao_debito' and parcelas = 1)
    or (modalidade = 'cartao_credito' and parcelas between 1 and 21)
  );

drop index if exists public.idx_financeiro_taxas_cartao_vigencia;
create index if not exists idx_financeiro_taxas_cartao_vigencia
  on public.financeiro_taxas_cartao (modalidade, parcelas, vigente_desde desc);

alter table public.financeiro_lancamentos
  add column if not exists cartao_parcelas integer;
alter table public.financeiro_baixa_solicitacoes
  add column if not exists cartao_parcelas integer;

-- ---------------------------------------------------------------------------
-- Taxa vigente: null quando nao configurada
-- ---------------------------------------------------------------------------
drop function if exists public.financeiro_taxa_cartao_vigente(text);

create or replace function public.financeiro_taxa_cartao_vigente(p_modalidade text, p_parcelas integer default 1)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select t.percentual
  from public.financeiro_taxas_cartao t
  where t.modalidade = p_modalidade
    and t.parcelas = coalesce(p_parcelas, 1)
  order by t.vigente_desde desc, t.id desc
  limit 1
$$;

revoke all on function public.financeiro_taxa_cartao_vigente(text, integer) from public, anon;
grant execute on function public.financeiro_taxa_cartao_vigente(text, integer) to authenticated;

drop function if exists public.financeiro_definir_taxa_cartao(text, numeric);

create or replace function public.financeiro_definir_taxa_cartao(
  p_modalidade text,
  p_percentual numeric,
  p_parcelas integer default 1
)
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
  if p_modalidade = 'cartao_debito' and coalesce(p_parcelas, 1) <> 1 then
    raise exception 'Debito nao tem parcelas.' using errcode = 'P0001';
  end if;
  if coalesce(p_parcelas, 1) not between 1 and 21 then
    raise exception 'Parcelas devem ser entre 1 e 21.' using errcode = 'P0001';
  end if;
  if p_percentual is null or p_percentual < 0 or p_percentual >= 100 then
    raise exception 'Informe um percentual entre 0 e 99,99.' using errcode = 'P0001';
  end if;

  insert into public.financeiro_taxas_cartao (modalidade, parcelas, percentual, definido_por, definido_por_nome)
  values (p_modalidade, coalesce(p_parcelas, 1), round(p_percentual, 2), auth.uid(), public.financeiro_nome_usuario_atual())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.financeiro_definir_taxa_cartao(text, numeric, integer) from public, anon;
grant execute on function public.financeiro_definir_taxa_cartao(text, numeric, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Solicitar baixa com parcelas do cartao
-- ---------------------------------------------------------------------------
drop function if exists public.financeiro_solicitar_baixa(uuid, date, text, text, numeric);

create or replace function public.financeiro_solicitar_baixa(
  p_lancamento_id uuid,
  p_data_liquidacao date,
  p_forma_pagamento text default null,
  p_observacoes text default null,
  p_taxa_esperada numeric default null,
  p_cartao_parcelas integer default null
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
  v_parcelas integer;
  v_percentual numeric(5,2);
  v_taxa numeric(12,2);
  v_liquido numeric(12,2);
  v_rotulo text;
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

  select id into v_id
  from public.financeiro_baixa_solicitacoes
  where lancamento_id = p_lancamento_id and status = 'pendente';

  if v_id is not null then
    return v_id;
  end if;

  v_forma := coalesce(nullif(btrim(p_forma_pagamento), ''), v_lancamento.forma_pagamento);

  if v_lancamento.tipo = 'receita' and v_forma in ('cartao_credito','cartao_debito') then
    v_modalidade := v_forma;
    v_parcelas := case when v_forma = 'cartao_debito' then 1 else coalesce(p_cartao_parcelas, 1) end;
    if v_parcelas not between 1 and 21 then
      raise exception 'Parcelas do cartao devem ser entre 1 e 21.' using errcode = 'P0001';
    end if;
    v_rotulo := case when v_forma = 'cartao_debito' then 'debito'
                     when v_parcelas = 1 then 'credito a vista'
                     else 'credito ' || v_parcelas || 'x' end;
    v_percentual := public.financeiro_taxa_cartao_vigente(v_forma, v_parcelas);
    if v_percentual is null then
      raise exception 'Taxa de % nao configurada. Peca ao aprovador para cadastrar em Taxas de cartao.', v_rotulo
        using errcode = 'P0001';
    end if;
    if p_taxa_esperada is not null and round(p_taxa_esperada, 2) <> v_percentual then
      raise exception 'A taxa de % mudou para %. Revise os valores e solicite novamente.',
        v_rotulo, replace(v_percentual::text, '.', ',') || '%'
        using errcode = 'P0001';
    end if;
    v_taxa := round(v_lancamento.valor * v_percentual / 100, 2);
    v_liquido := v_lancamento.valor - v_taxa;
  end if;

  insert into public.financeiro_baixa_solicitacoes (
    lancamento_id, valor, data_liquidacao, forma_pagamento, observacoes, solicitado_por, solicitado_por_nome,
    taxa_modalidade, cartao_parcelas, taxa_percentual, taxa_valor, valor_liquido
  ) values (
    p_lancamento_id,
    v_lancamento.valor,
    p_data_liquidacao,
    v_forma,
    nullif(btrim(p_observacoes), ''),
    auth.uid(),
    public.financeiro_nome_usuario_atual(),
    v_modalidade,
    v_parcelas,
    v_percentual,
    v_taxa,
    v_liquido
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.financeiro_solicitar_baixa(uuid, date, text, text, numeric, integer) from public, anon;
grant execute on function public.financeiro_solicitar_baixa(uuid, date, text, text, numeric, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Aprovar: copia tambem as parcelas do cartao
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
           cartao_parcelas = v_solicitacao.cartao_parcelas,
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

-- ---------------------------------------------------------------------------
-- Trava: cartao_parcelas tambem so muda pela aprovacao
-- ---------------------------------------------------------------------------
create or replace function public.financeiro_lancamentos_guard_cartao_parcelas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(current_setting('app.financeiro_baixa_aprovada', true), '') = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' and new.cartao_parcelas is not null then
    raise exception 'Parcelas do cartao sao definidas na baixa.' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and new.cartao_parcelas is distinct from old.cartao_parcelas then
    raise exception 'Dados de liquidacao so mudam pela aprovacao da baixa.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_financeiro_lancamentos_guard_cartao_parcelas on public.financeiro_lancamentos;
create trigger trg_financeiro_lancamentos_guard_cartao_parcelas
before insert or update on public.financeiro_lancamentos
for each row execute function public.financeiro_lancamentos_guard_cartao_parcelas();

-- ---------------------------------------------------------------------------
-- Carga inicial (print da maquininha, 2026-11-16). So insere combinacoes
-- que ainda nao tem taxa; nao sobrescreve o que a aprovadora ja cadastrou.
-- ---------------------------------------------------------------------------
insert into public.financeiro_taxas_cartao (modalidade, parcelas, percentual, definido_por_nome)
select v.modalidade, v.parcelas, v.percentual, 'Carga inicial (taxas da maquininha)'
from (values
  ('cartao_debito',  1, 1.64),
  ('cartao_credito', 1, 3.53),
  ('cartao_credito', 2, 7.58),
  ('cartao_credito', 3, 8.94),
  ('cartao_credito', 4, 9.94),
  ('cartao_credito', 5, 10.94),
  ('cartao_credito', 6, 11.94),
  ('cartao_credito', 7, 12.94),
  ('cartao_credito', 8, 13.15),
  ('cartao_credito', 9, 13.16),
  ('cartao_credito', 10, 13.17)
) as v(modalidade, parcelas, percentual)
where not exists (
  select 1 from public.financeiro_taxas_cartao t
  where t.modalidade = v.modalidade and t.parcelas = v.parcelas
);
