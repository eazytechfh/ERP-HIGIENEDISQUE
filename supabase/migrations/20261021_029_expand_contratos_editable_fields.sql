alter table public.contratos
  add column if not exists dia_vencimento smallint,
  add column if not exists valor_mensal text,
  add column if not exists reajuste_anual text,
  add column if not exists multa_contratual text,
  add column if not exists exige_aprovacao boolean not null default false,
  add column if not exists adicional_descricao text,
  add column if not exists observacoes_contratuais text,
  add column if not exists observacoes_internas text;

alter table public.contratos
  drop constraint if exists contratos_dia_vencimento_check;

alter table public.contratos
  add constraint contratos_dia_vencimento_check
  check (dia_vencimento is null or dia_vencimento between 1 and 30);

alter table public.contrato_itens
  add column if not exists frequencia text,
  add column if not exists limites text;

create or replace function public.upsert_contrato_com_itens(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_cliente_id uuid,
  p_numero text,
  p_descricao text,
  p_status text,
  p_tipo_contrato text,
  p_data_inicio date,
  p_data_termino date,
  p_dia_vencimento smallint,
  p_valor_mensal text,
  p_reajuste_anual text,
  p_multa_contratual text,
  p_exige_aprovacao boolean,
  p_adicional_descricao text,
  p_observacoes_contratuais text,
  p_observacoes_internas text,
  p_situacao_cliente text,
  p_itens jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_contrato_id uuid;
  v_item jsonb;
  v_item_id uuid;
  v_item_ids uuid[] := array[]::uuid[];
begin
  if p_id is null then
    insert into public.contratos (
      cliente_id,
      numero,
      descricao,
      status,
      tipo_contrato,
      data_inicio,
      data_termino,
      dia_vencimento,
      valor_mensal,
      reajuste_anual,
      multa_contratual,
      exige_aprovacao,
      adicional_descricao,
      observacoes_contratuais,
      observacoes_internas
    ) values (
      p_cliente_id,
      p_numero,
      p_descricao,
      p_status,
      p_tipo_contrato,
      p_data_inicio,
      p_data_termino,
      p_dia_vencimento,
      p_valor_mensal,
      p_reajuste_anual,
      p_multa_contratual,
      coalesce(p_exige_aprovacao, false),
      p_adicional_descricao,
      p_observacoes_contratuais,
      p_observacoes_internas
    )
    returning id into v_contrato_id;
  else
    if p_expected_updated_at is null then
      raise exception 'CONTRATO_CONFLICT'
        using errcode = '40001',
              detail = 'A versao carregada do contrato e obrigatoria para editar.';
    end if;

    update public.contratos
    set cliente_id = p_cliente_id,
        numero = p_numero,
        descricao = p_descricao,
        status = p_status,
        tipo_contrato = p_tipo_contrato,
        data_inicio = p_data_inicio,
        data_termino = p_data_termino,
        dia_vencimento = p_dia_vencimento,
        valor_mensal = p_valor_mensal,
        reajuste_anual = p_reajuste_anual,
        multa_contratual = p_multa_contratual,
        exige_aprovacao = coalesce(p_exige_aprovacao, false),
        adicional_descricao = p_adicional_descricao,
        observacoes_contratuais = p_observacoes_contratuais,
        observacoes_internas = p_observacoes_internas
    where id = p_id
      and deleted_at is null
      and updated_at = p_expected_updated_at
    returning id into v_contrato_id;

    if v_contrato_id is null then
      raise exception 'CONTRATO_CONFLICT'
        using errcode = '40001',
              detail = 'O contrato foi alterado por outro usuario ou nao esta mais disponivel.';
    end if;
  end if;

  for v_item in
    select value from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) as items(value)
  loop
    v_item_id := null;
    select id
      into v_item_id
      from public.contrato_itens
     where contrato_id = v_contrato_id
       and id::text = coalesce(v_item ->> 'id', '')
     limit 1;

    if v_item_id is null then
      insert into public.contrato_itens (contrato_id, nome, frequencia, limites)
      values (
        v_contrato_id,
        coalesce(v_item ->> 'nome', ''),
        nullif(v_item ->> 'frequencia', ''),
        nullif(v_item ->> 'limites', '')
      )
      returning id into v_item_id;
    else
      update public.contrato_itens
         set nome = coalesce(v_item ->> 'nome', ''),
             frequencia = nullif(v_item ->> 'frequencia', ''),
             limites = nullif(v_item ->> 'limites', '')
       where id = v_item_id
         and contrato_id = v_contrato_id;
    end if;

    v_item_ids := array_append(v_item_ids, v_item_id);
  end loop;

  delete from public.contrato_itens
   where contrato_id = v_contrato_id
     and not (id = any(v_item_ids));

  update public.clientes
     set possui_contrato = true,
         tipo_contrato = case p_tipo_contrato when 'recorrente' then 'Recorrente' else 'Avulso' end,
         data_inicio_contrato = p_data_inicio,
         data_fim_contrato = p_data_termino,
         situacao_contrato = p_situacao_cliente
   where id = p_cliente_id
     and deleted_at is null;

  if not found then
    raise exception 'CLIENTE_NOT_FOUND'
      using errcode = 'P0002', detail = 'Cliente do contrato nao encontrado.';
  end if;

  return v_contrato_id;
end;
$$;

revoke all on function public.upsert_contrato_com_itens(
  uuid, timestamptz, uuid, text, text, text, text, date, date, smallint,
  text, text, text, boolean, text, text, text, text, jsonb
) from public;

grant execute on function public.upsert_contrato_com_itens(
  uuid, timestamptz, uuid, text, text, text, text, date, date, smallint,
  text, text, text, boolean, text, text, text, text, jsonb
) to authenticated;
