-- Modelo e responsavel podem ser informados posteriormente.
alter table public.veiculos
  alter column modelo drop not null,
  alter column responsavel drop not null;
