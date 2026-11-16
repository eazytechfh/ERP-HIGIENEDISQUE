-- Fase 3 do plano de evolucao do financeiro: periodo, agregacoes no banco e
-- consultas paginadas (fim do limite de 500 lancamentos na tela).
--
-- Regra de data: realizado conta na data da liquidacao; programado no vencimento.
-- Regra de valor: realizado conta pelo liquido (apos taxa); programado pelo valor.
-- Cancelados ficam fora dos indicadores do dashboard.
--
-- As funcoes sao SECURITY INVOKER: respeitam o RLS de financeiro_lancamentos.
-- O indice de data_referencia fica na migration 036 (CREATE INDEX CONCURRENTLY
-- precisa rodar sozinho, fora de transacao).

alter table public.financeiro_lancamentos
  add column if not exists data_referencia date
    generated always as (
      case when status = 'realizado' then coalesce(data_liquidacao, data_vencimento) else data_vencimento end
    ) stored;

alter table public.financeiro_lancamentos
  add column if not exists valor_caixa numeric(12,2)
    generated always as (
      case when status = 'realizado' then coalesce(valor_liquido, valor) else valor end
    ) stored;

-- ---------------------------------------------------------------------------
-- Filtro unico (lista, totais e exportacao usam o mesmo)
-- ---------------------------------------------------------------------------
create or replace function public.financeiro_lancamentos_filtrados(
  p_inicio date default null,
  p_fim date default null,
  p_tipo text default null,
  p_status text default null,
  p_origem text default null,
  p_categoria_id uuid default null,
  p_busca text default null
)
returns setof public.financeiro_lancamentos
language sql
stable
security invoker
set search_path = public
as $$
  select l.*
  from public.financeiro_lancamentos l
  left join public.clientes c on c.id = l.cliente_id
  left join public.fornecedores f on f.id = l.fornecedor_id
  where l.deleted_at is null
    and (p_inicio is null or l.data_referencia >= p_inicio)
    and (p_fim is null or l.data_referencia <= p_fim)
    and (p_tipo is null or l.tipo = p_tipo)
    and (p_status is null or l.status = p_status)
    and (p_origem is null or l.origem = p_origem)
    and (p_categoria_id is null or l.categoria_id = p_categoria_id)
    and (
      nullif(btrim(p_busca), '') is null
      or concat_ws(' ', l.descricao, l.categoria, l.documento_numero, c.nome, f.razao_social)
         ilike '%' || btrim(p_busca) || '%'
    )
$$;

create or replace function public.financeiro_totais_filtrados(
  p_inicio date default null,
  p_fim date default null,
  p_tipo text default null,
  p_status text default null,
  p_origem text default null,
  p_categoria_id uuid default null,
  p_busca text default null
)
returns table (tipo text, status text, total numeric, quantidade bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select l.tipo, l.status, coalesce(sum(l.valor_caixa), 0), count(*)
  from public.financeiro_lancamentos_filtrados(p_inicio, p_fim, p_tipo, p_status, p_origem, p_categoria_id, p_busca) l
  group by l.tipo, l.status
$$;

-- ---------------------------------------------------------------------------
-- Dashboard
-- ---------------------------------------------------------------------------
create or replace function public.financeiro_resumo_periodo(
  p_inicio date,
  p_fim date,
  p_agrupamento text default 'mes'
)
returns table (periodo text, tipo text, status text, total numeric, quantidade bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    case when p_agrupamento = 'dia' then to_char(l.data_referencia, 'YYYY-MM-DD') else to_char(l.data_referencia, 'YYYY-MM') end,
    l.tipo,
    l.status,
    coalesce(sum(l.valor_caixa), 0),
    count(*)
  from public.financeiro_lancamentos l
  where l.deleted_at is null
    and l.status <> 'cancelado'
    and l.data_referencia between p_inicio and p_fim
  group by 1, 2, 3
$$;

create or replace function public.financeiro_resumo_categorias(p_inicio date, p_fim date)
returns table (tipo text, categoria text, total numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    l.tipo,
    coalesce(nullif(c.nome, ''), nullif(l.categoria, ''), initcap(replace(l.origem, '_', ' ')), 'Sem categoria'),
    coalesce(sum(l.valor_caixa), 0)
  from public.financeiro_lancamentos l
  left join public.financeiro_categorias c on c.id = l.categoria_id
  where l.deleted_at is null
    and l.status <> 'cancelado'
    and l.data_referencia between p_inicio and p_fim
  group by 1, 2
$$;

revoke all on function public.financeiro_lancamentos_filtrados(date, date, text, text, text, uuid, text) from public, anon;
revoke all on function public.financeiro_totais_filtrados(date, date, text, text, text, uuid, text) from public, anon;
revoke all on function public.financeiro_resumo_periodo(date, date, text) from public, anon;
revoke all on function public.financeiro_resumo_categorias(date, date) from public, anon;
grant execute on function public.financeiro_lancamentos_filtrados(date, date, text, text, text, uuid, text) to authenticated;
grant execute on function public.financeiro_totais_filtrados(date, date, text, text, text, uuid, text) to authenticated;
grant execute on function public.financeiro_resumo_periodo(date, date, text) to authenticated;
grant execute on function public.financeiro_resumo_categorias(date, date) to authenticated;
