-- Add the vehicle registration field used by the fleet form.
alter table public.veiculos
  add column if not exists renavam text;
