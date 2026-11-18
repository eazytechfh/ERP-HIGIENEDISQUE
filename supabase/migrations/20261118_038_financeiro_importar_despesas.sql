-- Importacao de despesas de planilha (extrato ja revisado e aprovado).
--
-- O banco nao deixa criar lancamento ja "realizado" (trigger
-- financeiro_lancamentos_guard_baixa). Esta funcao e a unica excecao: quem a
-- executa precisa ser o aprovador do financeiro, e a importacao conta como a
-- aprovacao (liquidado_por/liquidado_em guardam quem e quando). Todas as linhas
-- entram na mesma transacao: ou todas, ou nenhuma.
--
-- So despesas, sem taxa de cartao (valor_liquido = valor), data de pagamento
-- nao futura.

create or replace function public.financeiro_importar_despesas(p_linhas jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_invalidas integer;
  v_inseridas integer;
begin
  if auth.uid() is null or not public.is_aprovador_financeiro() then
    raise exception 'Somente o aprovador do financeiro pode importar despesas ja pagas.' using errcode = '42501';
  end if;

  if p_linhas is null or jsonb_typeof(p_linhas) <> 'array' then
    raise exception 'Envie as despesas como uma lista.' using errcode = 'P0001';
  end if;

  v_total := jsonb_array_length(p_linhas);
  if v_total = 0 then
    return 0;
  end if;
  if v_total > 1000 then
    raise exception 'Importe no maximo 1000 despesas por vez.' using errcode = 'P0001';
  end if;

  select count(*) into v_invalidas
  from jsonb_to_recordset(p_linhas) as r(
    descricao text, categoria_id uuid, categoria text, valor numeric, data date, forma_pagamento text, observacoes text
  )
  where nullif(btrim(r.descricao), '') is null
     or r.valor is null or r.valor <= 0
     or r.data is null or r.data > current_date;

  if v_invalidas > 0 then
    raise exception '% linha(s) invalida(s): informe descricao, valor maior que zero e data de pagamento que nao seja futura.', v_invalidas
      using errcode = 'P0001';
  end if;

  perform set_config('app.financeiro_baixa_aprovada', 'on', true);

  insert into public.financeiro_lancamentos (
    tipo, status, origem, descricao, categoria_id, categoria, valor,
    data_competencia, data_vencimento, data_liquidacao, forma_pagamento, observacoes,
    valor_bruto, valor_liquido, liquidado_por, liquidado_em, created_by
  )
  select
    'despesa', 'realizado', 'manual', btrim(r.descricao), r.categoria_id, nullif(btrim(r.categoria), ''), round(r.valor, 2),
    r.data, r.data, r.data, nullif(btrim(r.forma_pagamento), ''), nullif(btrim(r.observacoes), ''),
    round(r.valor, 2), round(r.valor, 2), auth.uid(), now(), auth.uid()
  from jsonb_to_recordset(p_linhas) as r(
    descricao text, categoria_id uuid, categoria text, valor numeric, data date, forma_pagamento text, observacoes text
  );

  get diagnostics v_inseridas = row_count;

  perform set_config('app.financeiro_baixa_aprovada', '', true);

  return v_inseridas;
end;
$$;

revoke all on function public.financeiro_importar_despesas(jsonb) from public, anon;
grant execute on function public.financeiro_importar_despesas(jsonb) to authenticated;
