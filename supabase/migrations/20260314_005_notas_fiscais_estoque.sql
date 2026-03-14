create table if not exists public.notas_fiscais_entrada (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id) on delete restrict,
  numero_nf text not null,
  data_nf date not null,
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.nota_fiscal_itens (
  id uuid primary key default gen_random_uuid(),
  nota_fiscal_id uuid not null references public.notas_fiscais_entrada(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  quantidade numeric not null check (quantidade > 0),
  unidade text,
  custo_unitario numeric not null default 0 check (custo_unitario >= 0),
  created_at timestamptz not null default now()
);

drop trigger if exists trg_notas_fiscais_entrada_updated_at on public.notas_fiscais_entrada;
create trigger trg_notas_fiscais_entrada_updated_at before update on public.notas_fiscais_entrada
for each row execute function public.set_updated_at();

alter table public.notas_fiscais_entrada enable row level security;
alter table public.nota_fiscal_itens enable row level security;

create policy if not exists notas_fiscais_entrada_read_core_fin on public.notas_fiscais_entrada
for select using (
  public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role, 'financeiro'::public.app_role)
  and deleted_at is null
);

create policy if not exists notas_fiscais_entrada_write_core on public.notas_fiscais_entrada
for all using (public.can_operar_core())
with check (public.can_operar_core());

create policy if not exists nota_fiscal_itens_read_core_fin on public.nota_fiscal_itens
for select using (
  public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role, 'financeiro'::public.app_role)
  and exists (
    select 1
    from public.notas_fiscais_entrada nfe
    where nfe.id = nota_fiscal_itens.nota_fiscal_id
      and nfe.deleted_at is null
  )
);

create policy if not exists nota_fiscal_itens_write_core on public.nota_fiscal_itens
for all using (public.can_operar_core())
with check (public.can_operar_core());
