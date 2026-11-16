alter table public.servicos
add column if not exists os_form_data jsonb;

comment on column public.servicos.os_form_data is
  'Dados estruturados usados para reabrir e editar a OS no formulario de criacao.';
