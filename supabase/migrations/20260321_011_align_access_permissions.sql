-- Align app permissions and Supabase RLS to a single source of truth.
-- Profiles.permissions becomes the effective authorization matrix.

create or replace function public.default_permissions_for_role(target_role public.app_role)
returns text[]
language sql
immutable
as $$
  select case target_role
    when 'admin'::public.app_role then array[
      'dashboard.view',
      'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.delete',
      'contratos.view', 'contratos.create', 'contratos.edit', 'contratos.delete', 'contratos.generate',
      'servicos.view', 'servicos.create', 'servicos.edit', 'servicos.delete', 'servicos.generate_os',
      'estoque.view', 'estoque.create', 'estoque.edit', 'estoque.delete',
      'equipe.view', 'equipe.create', 'equipe.edit', 'equipe.delete', 'equipe.manage_access',
      'veiculos.view', 'veiculos.create', 'veiculos.edit', 'veiculos.delete',
      'financeiro.view', 'financeiro.create', 'financeiro.edit', 'financeiro.delete',
      'logs.view'
    ]::text[]
    when 'operacional'::public.app_role then array[
      'dashboard.view',
      'clientes.view', 'clientes.create', 'clientes.edit',
      'contratos.view', 'contratos.create', 'contratos.edit', 'contratos.generate',
      'servicos.view', 'servicos.create', 'servicos.edit', 'servicos.generate_os',
      'estoque.view', 'estoque.create', 'estoque.edit',
      'equipe.view', 'equipe.create', 'equipe.edit',
      'veiculos.view', 'veiculos.create', 'veiculos.edit'
    ]::text[]
    when 'financeiro'::public.app_role then array[
      'dashboard.view',
      'clientes.view',
      'contratos.view',
      'servicos.view',
      'financeiro.view', 'financeiro.create', 'financeiro.edit', 'financeiro.delete'
    ]::text[]
    when 'tecnico'::public.app_role then array[
      'dashboard.view',
      'servicos.view', 'servicos.edit',
      'estoque.view'
    ]::text[]
    else array[]::text[]
  end
$$;

create or replace function public.current_user_permissions()
returns text[]
language sql
stable
as $$
  select coalesce(
    (
      select case
        when p.ativo = false then array[]::text[]
        when p.permissions is null then public.default_permissions_for_role(p.role)
        else p.permissions
      end
      from public.profiles p
      where p.user_id = auth.uid()
    ),
    array[]::text[]
  )
$$;

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
as $$
  select permission_key = any(coalesce(public.current_user_permissions(), array[]::text[]))
$$;

create or replace function public.has_any_permission(permission_keys text[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from unnest(coalesce(permission_keys, array[]::text[])) as permission_key
    where public.has_permission(permission_key)
  )
$$;

create or replace function public.can_operar_core()
returns boolean
language sql
stable
as $$
  select public.has_any_permission(array[
    'clientes.create', 'clientes.edit', 'clientes.delete',
    'contratos.create', 'contratos.edit', 'contratos.delete',
    'servicos.create', 'servicos.edit', 'servicos.delete',
    'estoque.create', 'estoque.edit', 'estoque.delete',
    'equipe.create', 'equipe.edit', 'equipe.delete',
    'veiculos.create', 'veiculos.edit', 'veiculos.delete'
  ]::text[])
$$;

create or replace function public.can_financeiro_read()
returns boolean
language sql
stable
as $$
  select public.has_permission('financeiro.view')
$$;

create or replace function public.can_operar_financeiro()
returns boolean
language sql
stable
as $$
  select public.has_any_permission(array[
    'financeiro.create', 'financeiro.edit', 'financeiro.delete'
  ]::text[])
$$;

update public.profiles
set permissions = public.default_permissions_for_role(role)
where permissions is null;

update public.profiles
set permissions = public.default_permissions_for_role(role)
where role = 'operacional'::public.app_role
  and permissions = array[
    'dashboard.view',
    'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.delete',
    'contratos.view', 'contratos.create', 'contratos.edit', 'contratos.delete', 'contratos.generate',
    'servicos.view', 'servicos.create', 'servicos.edit', 'servicos.delete', 'servicos.generate_os',
    'estoque.view', 'estoque.create', 'estoque.edit', 'estoque.delete',
    'equipe.view', 'equipe.create', 'equipe.edit', 'equipe.delete',
    'veiculos.view', 'veiculos.create', 'veiculos.edit', 'veiculos.delete',
    'financeiro.view'
  ]::text[];

drop policy if exists profiles_select_self_or_admin on public.profiles;
drop policy if exists profiles_update_self_or_admin on public.profiles;
drop policy if exists profiles_insert_admin on public.profiles;

create policy profiles_select_self_or_access_manager on public.profiles
for select to authenticated
using (
  user_id = auth.uid()
  or public.has_permission('equipe.manage_access')
);

create policy profiles_update_access_manager on public.profiles
for update to authenticated
using (public.has_permission('equipe.manage_access'))
with check (public.has_permission('equipe.manage_access'));

create policy profiles_insert_access_manager on public.profiles
for insert to authenticated
with check (public.has_permission('equipe.manage_access'));

drop policy if exists clientes_read_core_fin on public.clientes;
drop policy if exists clientes_write_core on public.clientes;
create policy clientes_read_permission on public.clientes
for select to authenticated
using (deleted_at is null and public.has_permission('clientes.view'));
create policy clientes_insert_permission on public.clientes
for insert to authenticated
with check (public.has_permission('clientes.create'));
create policy clientes_update_permission on public.clientes
for update to authenticated
using (public.has_permission('clientes.edit'))
with check (public.has_permission('clientes.edit'));

drop policy if exists cliente_locais_read_core_fin on public.cliente_locais;
drop policy if exists cliente_locais_write_core on public.cliente_locais;
create policy cliente_locais_read_permission on public.cliente_locais
for select to authenticated
using (public.has_permission('clientes.view'));
create policy cliente_locais_insert_permission on public.cliente_locais
for insert to authenticated
with check (public.has_any_permission(array['clientes.create', 'clientes.edit']::text[]));
create policy cliente_locais_update_permission on public.cliente_locais
for update to authenticated
using (public.has_permission('clientes.edit'))
with check (public.has_permission('clientes.edit'));
create policy cliente_locais_delete_permission on public.cliente_locais
for delete to authenticated
using (public.has_any_permission(array['clientes.edit', 'clientes.delete']::text[]));

drop policy if exists cliente_contatos_read_core_fin on public.cliente_contatos;
drop policy if exists cliente_contatos_write_core on public.cliente_contatos;
create policy cliente_contatos_read_permission on public.cliente_contatos
for select to authenticated
using (public.has_permission('clientes.view'));
create policy cliente_contatos_insert_permission on public.cliente_contatos
for insert to authenticated
with check (public.has_any_permission(array['clientes.create', 'clientes.edit']::text[]));
create policy cliente_contatos_update_permission on public.cliente_contatos
for update to authenticated
using (public.has_permission('clientes.edit'))
with check (public.has_permission('clientes.edit'));
create policy cliente_contatos_delete_permission on public.cliente_contatos
for delete to authenticated
using (public.has_any_permission(array['clientes.edit', 'clientes.delete']::text[]));

drop policy if exists cliente_arquivos_read_core_fin on public.cliente_arquivos;
drop policy if exists cliente_arquivos_write_core on public.cliente_arquivos;
create policy cliente_arquivos_read_permission on public.cliente_arquivos
for select to authenticated
using (public.has_permission('clientes.view'));
create policy cliente_arquivos_insert_permission on public.cliente_arquivos
for insert to authenticated
with check (public.has_any_permission(array['clientes.create', 'clientes.edit']::text[]));
create policy cliente_arquivos_update_permission on public.cliente_arquivos
for update to authenticated
using (public.has_permission('clientes.edit'))
with check (public.has_permission('clientes.edit'));
create policy cliente_arquivos_delete_permission on public.cliente_arquivos
for delete to authenticated
using (public.has_any_permission(array['clientes.edit', 'clientes.delete']::text[]));

drop policy if exists contratos_read_core_fin on public.contratos;
drop policy if exists contratos_write_core on public.contratos;
create policy contratos_read_permission on public.contratos
for select to authenticated
using (deleted_at is null and public.has_permission('contratos.view'));
create policy contratos_insert_permission on public.contratos
for insert to authenticated
with check (public.has_permission('contratos.create'));
create policy contratos_update_permission on public.contratos
for update to authenticated
using (public.has_permission('contratos.edit'))
with check (public.has_permission('contratos.edit'));

drop policy if exists contrato_itens_read_core_fin on public.contrato_itens;
drop policy if exists contrato_itens_write_core on public.contrato_itens;
create policy contrato_itens_read_permission on public.contrato_itens
for select to authenticated
using (public.has_permission('contratos.view'));
create policy contrato_itens_insert_permission on public.contrato_itens
for insert to authenticated
with check (public.has_any_permission(array['contratos.create', 'contratos.edit']::text[]));
create policy contrato_itens_update_permission on public.contrato_itens
for update to authenticated
using (public.has_permission('contratos.edit'))
with check (public.has_permission('contratos.edit'));
create policy contrato_itens_delete_permission on public.contrato_itens
for delete to authenticated
using (public.has_any_permission(array['contratos.edit', 'contratos.delete']::text[]));

drop policy if exists servicos_read_core_fin on public.servicos;
drop policy if exists servicos_read_tecnico_assigned on public.servicos;
drop policy if exists servicos_write_core on public.servicos;
drop policy if exists servicos_update_tecnico_assigned on public.servicos;
create policy servicos_read_permission on public.servicos
for select to authenticated
using (deleted_at is null and public.has_permission('servicos.view'));
create policy servicos_read_tecnico_assigned on public.servicos
for select to authenticated
using (
  deleted_at is null
  and public.has_permission('servicos.view')
  and exists (
    select 1
    from public.servico_responsaveis sr
    where sr.servico_id = servicos.id
      and sr.user_id = auth.uid()
  )
);
create policy servicos_insert_permission on public.servicos
for insert to authenticated
with check (public.has_permission('servicos.create'));
create policy servicos_update_permission on public.servicos
for update to authenticated
using (public.has_permission('servicos.edit'))
with check (public.has_permission('servicos.edit'));
create policy servicos_update_tecnico_assigned on public.servicos
for update to authenticated
using (
  public.has_permission('servicos.edit')
  and exists (
    select 1
    from public.servico_responsaveis sr
    where sr.servico_id = servicos.id
      and sr.user_id = auth.uid()
  )
)
with check (
  public.has_permission('servicos.edit')
  and exists (
    select 1
    from public.servico_responsaveis sr
    where sr.servico_id = servicos.id
      and sr.user_id = auth.uid()
  )
);

drop policy if exists servico_resp_read_core_or_self on public.servico_responsaveis;
drop policy if exists servico_resp_write_core on public.servico_responsaveis;
create policy servico_resp_read_permission on public.servico_responsaveis
for select to authenticated
using (public.has_permission('servicos.view') or user_id = auth.uid());
create policy servico_resp_insert_permission on public.servico_responsaveis
for insert to authenticated
with check (public.has_any_permission(array['servicos.create', 'servicos.edit']::text[]));
create policy servico_resp_update_permission on public.servico_responsaveis
for update to authenticated
using (public.has_permission('servicos.edit'))
with check (public.has_permission('servicos.edit'));
create policy servico_resp_delete_permission on public.servico_responsaveis
for delete to authenticated
using (public.has_any_permission(array['servicos.edit', 'servicos.delete']::text[]));

drop policy if exists produtos_read_all_roles on public.produtos;
drop policy if exists produtos_write_core on public.produtos;
create policy produtos_read_permission on public.produtos
for select to authenticated
using (deleted_at is null and public.has_permission('estoque.view'));
create policy produtos_insert_permission on public.produtos
for insert to authenticated
with check (public.has_permission('estoque.create'));
create policy produtos_update_permission on public.produtos
for update to authenticated
using (public.has_permission('estoque.edit'))
with check (public.has_permission('estoque.edit'));
create policy produtos_delete_permission on public.produtos
for delete to authenticated
using (public.has_permission('estoque.delete'));

drop policy if exists equipe_membros_read_core_fin on public.equipe_membros;
drop policy if exists equipe_membros_write_core on public.equipe_membros;
create policy equipe_membros_read_permission on public.equipe_membros
for select to authenticated
using (deleted_at is null and public.has_permission('equipe.view'));
create policy equipe_membros_insert_permission on public.equipe_membros
for insert to authenticated
with check (public.has_permission('equipe.create'));
create policy equipe_membros_update_permission on public.equipe_membros
for update to authenticated
using (public.has_permission('equipe.edit'))
with check (public.has_permission('equipe.edit'));
create policy equipe_membros_delete_permission on public.equipe_membros
for delete to authenticated
using (public.has_permission('equipe.delete'));

drop policy if exists fornecedores_read_core_fin on public.fornecedores;
drop policy if exists fornecedores_write_core on public.fornecedores;
create policy fornecedores_read_permission on public.fornecedores
for select to authenticated
using (deleted_at is null and public.has_permission('estoque.view'));
create policy fornecedores_insert_permission on public.fornecedores
for insert to authenticated
with check (public.has_permission('estoque.create'));
create policy fornecedores_update_permission on public.fornecedores
for update to authenticated
using (public.has_permission('estoque.edit'))
with check (public.has_permission('estoque.edit'));
create policy fornecedores_delete_permission on public.fornecedores
for delete to authenticated
using (public.has_permission('estoque.delete'));

drop policy if exists veiculos_read_core_fin on public.veiculos;
drop policy if exists veiculos_write_core on public.veiculos;
create policy veiculos_read_permission on public.veiculos
for select to authenticated
using (deleted_at is null and public.has_permission('veiculos.view'));
create policy veiculos_insert_permission on public.veiculos
for insert to authenticated
with check (public.has_permission('veiculos.create'));
create policy veiculos_update_permission on public.veiculos
for update to authenticated
using (public.has_permission('veiculos.edit'))
with check (public.has_permission('veiculos.edit'));
create policy veiculos_delete_permission on public.veiculos
for delete to authenticated
using (public.has_permission('veiculos.delete'));

drop policy if exists manutencoes_read_core_fin on public.manutencoes_preventivas;
drop policy if exists manutencoes_write_core on public.manutencoes_preventivas;
create policy manutencoes_read_permission on public.manutencoes_preventivas
for select to authenticated
using (deleted_at is null and public.has_permission('veiculos.view'));
create policy manutencoes_insert_permission on public.manutencoes_preventivas
for insert to authenticated
with check (public.has_any_permission(array['veiculos.create', 'veiculos.edit']::text[]));
create policy manutencoes_update_permission on public.manutencoes_preventivas
for update to authenticated
using (public.has_permission('veiculos.edit'))
with check (public.has_permission('veiculos.edit'));
create policy manutencoes_delete_permission on public.manutencoes_preventivas
for delete to authenticated
using (public.has_any_permission(array['veiculos.edit', 'veiculos.delete']::text[]));

drop policy if exists notas_fiscais_entrada_read_core_fin on public.notas_fiscais_entrada;
drop policy if exists notas_fiscais_entrada_write_core on public.notas_fiscais_entrada;
create policy notas_fiscais_entrada_read_permission on public.notas_fiscais_entrada
for select to authenticated
using (deleted_at is null and public.has_permission('estoque.view'));
create policy notas_fiscais_entrada_insert_permission on public.notas_fiscais_entrada
for insert to authenticated
with check (public.has_permission('estoque.create'));
create policy notas_fiscais_entrada_update_permission on public.notas_fiscais_entrada
for update to authenticated
using (public.has_permission('estoque.edit'))
with check (public.has_permission('estoque.edit'));
create policy notas_fiscais_entrada_delete_permission on public.notas_fiscais_entrada
for delete to authenticated
using (public.has_permission('estoque.delete'));

drop policy if exists nota_fiscal_itens_read_core_fin on public.nota_fiscal_itens;
drop policy if exists nota_fiscal_itens_write_core on public.nota_fiscal_itens;
create policy nota_fiscal_itens_read_permission on public.nota_fiscal_itens
for select to authenticated
using (
  public.has_permission('estoque.view')
  and exists (
    select 1
    from public.notas_fiscais_entrada nfe
    where nfe.id = nota_fiscal_itens.nota_fiscal_id
      and nfe.deleted_at is null
  )
);
create policy nota_fiscal_itens_insert_permission on public.nota_fiscal_itens
for insert to authenticated
with check (public.has_any_permission(array['estoque.create', 'estoque.edit']::text[]));
create policy nota_fiscal_itens_update_permission on public.nota_fiscal_itens
for update to authenticated
using (public.has_permission('estoque.edit'))
with check (public.has_permission('estoque.edit'));
create policy nota_fiscal_itens_delete_permission on public.nota_fiscal_itens
for delete to authenticated
using (public.has_any_permission(array['estoque.edit', 'estoque.delete']::text[]));

drop policy if exists financeiro_lancamentos_read on public.financeiro_lancamentos;
drop policy if exists financeiro_lancamentos_write on public.financeiro_lancamentos;
create policy financeiro_lancamentos_read_permission on public.financeiro_lancamentos
for select to authenticated
using (deleted_at is null and public.has_permission('financeiro.view'));
create policy financeiro_lancamentos_insert_permission on public.financeiro_lancamentos
for insert to authenticated
with check (public.has_permission('financeiro.create'));
create policy financeiro_lancamentos_update_permission on public.financeiro_lancamentos
for update to authenticated
using (public.has_permission('financeiro.edit'))
with check (public.has_permission('financeiro.edit'));
create policy financeiro_lancamentos_delete_permission on public.financeiro_lancamentos
for delete to authenticated
using (public.has_permission('financeiro.delete'));

drop policy if exists financeiro_documentos_read on public.financeiro_documentos;
drop policy if exists financeiro_documentos_write on public.financeiro_documentos;
create policy financeiro_documentos_read_permission on public.financeiro_documentos
for select to authenticated
using (
  deleted_at is null
  and public.has_permission('financeiro.view')
  and exists (
    select 1
    from public.financeiro_lancamentos fl
    where fl.id = financeiro_documentos.lancamento_id
      and fl.deleted_at is null
  )
);
create policy financeiro_documentos_insert_permission on public.financeiro_documentos
for insert to authenticated
with check (public.has_permission('financeiro.create'));
create policy financeiro_documentos_update_permission on public.financeiro_documentos
for update to authenticated
using (public.has_permission('financeiro.edit'))
with check (public.has_permission('financeiro.edit'));
create policy financeiro_documentos_delete_permission on public.financeiro_documentos
for delete to authenticated
using (public.has_permission('financeiro.delete'));

drop policy if exists financeiro_categorias_read on public.financeiro_categorias;
drop policy if exists financeiro_categorias_write on public.financeiro_categorias;
create policy financeiro_categorias_read_permission on public.financeiro_categorias
for select to authenticated
using (deleted_at is null and public.has_permission('financeiro.view'));
create policy financeiro_categorias_insert_permission on public.financeiro_categorias
for insert to authenticated
with check (public.has_permission('financeiro.create'));
create policy financeiro_categorias_update_permission on public.financeiro_categorias
for update to authenticated
using (public.has_permission('financeiro.edit'))
with check (public.has_permission('financeiro.edit'));
create policy financeiro_categorias_delete_permission on public.financeiro_categorias
for delete to authenticated
using (public.has_permission('financeiro.delete'));

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs
for select to authenticated
using (public.has_permission('logs.view'));

drop policy if exists storage_read_private_docs on storage.objects;
drop policy if exists storage_write_private_docs on storage.objects;
drop policy if exists storage_update_private_docs on storage.objects;
drop policy if exists storage_delete_private_docs on storage.objects;

create policy storage_read_private_docs on storage.objects
for select to authenticated
using (
  (
    bucket_id = 'os-documentos'
    and public.has_permission('servicos.view')
  )
  or (
    bucket_id = 'contratos-docx'
    and public.has_permission('contratos.view')
  )
);

create policy storage_write_private_docs on storage.objects
for insert to authenticated
with check (
  (
    bucket_id = 'os-documentos'
    and public.has_any_permission(array['servicos.generate_os', 'servicos.edit']::text[])
  )
  or (
    bucket_id = 'contratos-docx'
    and public.has_any_permission(array['contratos.generate', 'contratos.edit']::text[])
  )
);

create policy storage_update_private_docs on storage.objects
for update to authenticated
using (
  (
    bucket_id = 'os-documentos'
    and public.has_any_permission(array['servicos.generate_os', 'servicos.edit']::text[])
  )
  or (
    bucket_id = 'contratos-docx'
    and public.has_any_permission(array['contratos.generate', 'contratos.edit']::text[])
  )
)
with check (
  (
    bucket_id = 'os-documentos'
    and public.has_any_permission(array['servicos.generate_os', 'servicos.edit']::text[])
  )
  or (
    bucket_id = 'contratos-docx'
    and public.has_any_permission(array['contratos.generate', 'contratos.edit']::text[])
  )
);

create policy storage_delete_private_docs on storage.objects
for delete to authenticated
using (
  (
    bucket_id = 'os-documentos'
    and public.has_any_permission(array['servicos.generate_os', 'servicos.delete']::text[])
  )
  or (
    bucket_id = 'contratos-docx'
    and public.has_any_permission(array['contratos.generate', 'contratos.delete']::text[])
  )
);
