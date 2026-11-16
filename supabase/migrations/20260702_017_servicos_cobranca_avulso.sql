alter table public.servicos
  drop constraint if exists servicos_cobranca_modo_check;

alter table public.servicos
  add constraint servicos_cobranca_modo_check
  check (cobranca_modo in ('contrato','adicional','avulso'));
