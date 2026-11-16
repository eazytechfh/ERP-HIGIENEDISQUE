-- Parcelas do cartao planejadas na OS/fluxo.
--
-- A 033 so permitia gravar cartao_parcelas na aprovacao da baixa. Agora a OS e o
-- fluxo de caixa informam as parcelas da venda ja na criacao do lancamento
-- (lancamento unico; as parcelas so definem a taxa), e a solicitacao de baixa
-- parte desse valor.
--
-- Continua protegido:
-- * lancamento realizado nao muda (trava principal financeiro_lancamentos_guard_baixa);
-- * a taxa efetiva vem da solicitacao e e copiada na aprovacao.
--
-- Depende da migration 033.

drop trigger if exists trg_financeiro_lancamentos_guard_cartao_parcelas on public.financeiro_lancamentos;
drop function if exists public.financeiro_lancamentos_guard_cartao_parcelas();

alter table public.financeiro_lancamentos
  drop constraint if exists financeiro_lancamentos_cartao_parcelas_check;
alter table public.financeiro_lancamentos
  add constraint financeiro_lancamentos_cartao_parcelas_check
  check (cartao_parcelas is null or cartao_parcelas between 1 and 21);
