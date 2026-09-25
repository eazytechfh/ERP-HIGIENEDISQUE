create table if not exists public.servicos_rascunhos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente text,
  servico text,
  current_step smallint not null default 1 check (current_step between 1 and 3),
  form_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_servicos_rascunhos_user_updated
  on public.servicos_rascunhos (user_id, updated_at desc);

drop trigger if exists trg_servicos_rascunhos_updated_at on public.servicos_rascunhos;
create trigger trg_servicos_rascunhos_updated_at
before update on public.servicos_rascunhos
for each row execute function public.set_updated_at();

alter table public.servicos_rascunhos enable row level security;

drop policy if exists servicos_rascunhos_select_own on public.servicos_rascunhos;
create policy servicos_rascunhos_select_own on public.servicos_rascunhos
for select to authenticated
using (user_id = auth.uid() and public.has_permission('servicos.view'));

drop policy if exists servicos_rascunhos_insert_own on public.servicos_rascunhos;
create policy servicos_rascunhos_insert_own on public.servicos_rascunhos
for insert to authenticated
with check (user_id = auth.uid() and public.has_permission('servicos.create'));

drop policy if exists servicos_rascunhos_update_own on public.servicos_rascunhos;
create policy servicos_rascunhos_update_own on public.servicos_rascunhos
for update to authenticated
using (user_id = auth.uid() and public.has_permission('servicos.create'))
with check (user_id = auth.uid() and public.has_permission('servicos.create'));

drop policy if exists servicos_rascunhos_delete_own on public.servicos_rascunhos;
create policy servicos_rascunhos_delete_own on public.servicos_rascunhos
for delete to authenticated
using (user_id = auth.uid() and public.has_permission('servicos.create'));
