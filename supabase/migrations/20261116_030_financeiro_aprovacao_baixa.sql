-- Fase 1 do plano de evolucao do financeiro: baixa somente com aprovacao.
--
-- Fluxo: o financeiro solicita a baixa de um lancamento programado; um aprovador
-- (Rachel) aprova ou rejeita. Somente a aprovacao muda o lancamento para
-- "realizado". A trava fica no banco (trigger), entao nem a tela nem a API
-- conseguem marcar um lancamento como realizado diretamente.
--
-- Depois de aplicar, cadastre o e-mail da conta da Rachel:
--   insert into public.financeiro_aprovadores (email) values ('email-da-rachel@dominio.com');

-- ---------------------------------------------------------------------------
-- Aprovadores
-- ---------------------------------------------------------------------------
create table if not exists public.financeiro_aprovadores (
  email text primary key check (email = lower(btrim(email)) and email <> ''),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.financeiro_aprovadores enable row level security;
-- Sem policies: a tabela so e lida pelas funcoes security definer abaixo.
revoke all on table public.financeiro_aprovadores from anon, authenticated;

create or replace function public.is_aprovador_financeiro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.financeiro_aprovadores a on a.email = lower(u.email)
    join public.profiles p on p.user_id = u.id
    where u.id = auth.uid()
      and a.ativo
      and p.ativo is not false
  )
$$;

revoke all on function public.is_aprovador_financeiro() from public, anon;
grant execute on function public.is_aprovador_financeiro() to authenticated;

-- ---------------------------------------------------------------------------
-- Rastreio da liquidacao no lancamento
-- ---------------------------------------------------------------------------
alter table public.financeiro_lancamentos
  add column if not exists liquidado_por uuid references auth.users(id),
  add column if not exists liquidado_em timestamptz;

-- ---------------------------------------------------------------------------
-- Solicitacoes de baixa (historico completo)
-- ---------------------------------------------------------------------------
create table if not exists public.financeiro_baixa_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  lancamento_id uuid not null references public.financeiro_lancamentos(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente','aprovada','rejeitada','cancelada')),
  valor numeric(12,2) not null check (valor >= 0),
  data_liquidacao date not null,
  forma_pagamento text,
  observacoes text,
  solicitado_por uuid not null references auth.users(id),
  solicitado_por_nome text,
  solicitado_em timestamptz not null default now(),
  decidido_por uuid references auth.users(id),
  decidido_por_nome text,
  decidido_em timestamptz,
  motivo_decisao text,
  created_at timestamptz not null default now()
);

-- No maximo uma solicitacao pendente por lancamento: cliques repetidos ou
-- chamadas concorrentes nao geram duas solicitacoes.
create unique index if not exists uq_financeiro_baixa_pendente_por_lancamento
  on public.financeiro_baixa_solicitacoes (lancamento_id)
  where status = 'pendente';

create index if not exists idx_financeiro_baixa_solicitacoes_status
  on public.financeiro_baixa_solicitacoes (status, solicitado_em desc);

alter table public.financeiro_baixa_solicitacoes enable row level security;

drop policy if exists financeiro_baixa_solicitacoes_read on public.financeiro_baixa_solicitacoes;
create policy financeiro_baixa_solicitacoes_read
on public.financeiro_baixa_solicitacoes
for select
using (public.can_financeiro_read() or public.is_aprovador_financeiro());

-- Escrita somente pelas funcoes abaixo.
revoke insert, update, delete on table public.financeiro_baixa_solicitacoes from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Trava: status realizado so via aprovacao
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
     or new.liquidado_em is distinct from old.liquidado_em then
    raise exception 'Dados de liquidacao so mudam pela aprovacao da baixa.' using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.financeiro_baixa_solicitacoes s
    where s.lancamento_id = old.id and s.status = 'pendente'
  ) into v_tem_pendente;

  if v_tem_pendente then
    if new.status = 'cancelado' or new.deleted_at is not null then
      -- Cancelar o lancamento encerra a solicitacao pendente.
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

drop trigger if exists trg_financeiro_lancamentos_guard_baixa on public.financeiro_lancamentos;
create trigger trg_financeiro_lancamentos_guard_baixa
before insert or update or delete on public.financeiro_lancamentos
for each row execute function public.financeiro_lancamentos_guard_baixa();

-- ---------------------------------------------------------------------------
-- Operacoes transacionais
-- ---------------------------------------------------------------------------
create or replace function public.financeiro_nome_usuario_atual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(btrim(p.nome), ''), u.email)
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where u.id = auth.uid()
$$;

revoke all on function public.financeiro_nome_usuario_atual() from public, anon, authenticated;

create or replace function public.financeiro_solicitar_baixa(
  p_lancamento_id uuid,
  p_data_liquidacao date,
  p_forma_pagamento text default null,
  p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lancamento public.financeiro_lancamentos%rowtype;
  v_id uuid;
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

  insert into public.financeiro_baixa_solicitacoes (
    lancamento_id, valor, data_liquidacao, forma_pagamento, observacoes, solicitado_por, solicitado_por_nome
  ) values (
    p_lancamento_id,
    v_lancamento.valor,
    p_data_liquidacao,
    coalesce(nullif(btrim(p_forma_pagamento), ''), v_lancamento.forma_pagamento),
    nullif(btrim(p_observacoes), ''),
    auth.uid(),
    public.financeiro_nome_usuario_atual()
  )
  returning id into v_id;

  return v_id;
end;
$$;

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
    -- Clique repetido com a mesma decisao: nada a fazer.
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

create or replace function public.financeiro_cancelar_solicitacao_baixa(p_solicitacao_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_solicitacao public.financeiro_baixa_solicitacoes%rowtype;
begin
  select * into v_solicitacao
  from public.financeiro_baixa_solicitacoes
  where id = p_solicitacao_id
  for update;

  if not found then
    raise exception 'Solicitacao nao encontrada.' using errcode = 'P0001';
  end if;
  if v_solicitacao.solicitado_por <> auth.uid() and not public.is_aprovador_financeiro() then
    raise exception 'Somente quem solicitou ou o aprovador pode cancelar.' using errcode = '42501';
  end if;
  if v_solicitacao.status = 'cancelada' then
    return;
  end if;
  if v_solicitacao.status <> 'pendente' then
    raise exception 'Esta solicitacao ja foi %.', v_solicitacao.status using errcode = 'P0001';
  end if;

  update public.financeiro_baixa_solicitacoes
     set status = 'cancelada',
         decidido_por = auth.uid(),
         decidido_por_nome = public.financeiro_nome_usuario_atual(),
         decidido_em = now(),
         motivo_decisao = 'Cancelada pelo solicitante'
   where id = p_solicitacao_id;
end;
$$;

revoke all on function public.financeiro_solicitar_baixa(uuid, date, text, text) from public, anon;
revoke all on function public.financeiro_decidir_baixa(uuid, boolean, text) from public, anon;
revoke all on function public.financeiro_cancelar_solicitacao_baixa(uuid) from public, anon;
grant execute on function public.financeiro_solicitar_baixa(uuid, date, text, text) to authenticated;
grant execute on function public.financeiro_decidir_baixa(uuid, boolean, text) to authenticated;
grant execute on function public.financeiro_cancelar_solicitacao_baixa(uuid) to authenticated;
