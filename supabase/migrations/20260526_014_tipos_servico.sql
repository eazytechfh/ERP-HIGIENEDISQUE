-- Tabela de tipos de servico configuravel pelo usuario.
-- Substitui a lista fixa hardcoded no frontend.

create table public.tipos_servico (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  categoria text not null default 'outro'
    check (categoria in ('pragas', 'reservatorio_potavel', 'outro')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Tipos padroes
insert into public.tipos_servico (nome, categoria) values
  ('Controle de Pragas', 'pragas'),
  ('Limpeza de Reservatório (Potável)', 'reservatorio_potavel');

-- RLS
alter table public.tipos_servico enable row level security;

create policy tipos_servico_select on public.tipos_servico
  for select to authenticated
  using (ativo = true);

create policy tipos_servico_insert on public.tipos_servico
  for insert to authenticated
  with check (public.has_permission('servicos.create') or public.has_permission('servicos.edit'));

create policy tipos_servico_update on public.tipos_servico
  for update to authenticated
  using (public.has_permission('servicos.edit'))
  with check (public.has_permission('servicos.edit'));

create policy tipos_servico_delete on public.tipos_servico
  for delete to authenticated
  using (public.has_permission('servicos.delete'));
