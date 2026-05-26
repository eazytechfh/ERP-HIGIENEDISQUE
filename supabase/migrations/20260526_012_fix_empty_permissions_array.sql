-- Fix: tratar permissions=[] igual a null, caindo nas permissoes padrao do papel.
-- Tambem adiciona servicos.delete ao papel operacional.

-- 1. Atualiza default_permissions_for_role para incluir servicos.delete no operacional
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
      'servicos.view', 'servicos.create', 'servicos.edit', 'servicos.delete', 'servicos.generate_os',
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

-- 2. Corrige current_user_permissions para tratar array vazio como null
create or replace function public.current_user_permissions()
returns text[]
language sql
stable
as $$
  select coalesce(
    (
      select case
        when p.ativo = false then array[]::text[]
        when p.permissions is null or array_length(p.permissions, 1) is null
          then public.default_permissions_for_role(p.role)
        else p.permissions
      end
      from public.profiles p
      where p.user_id = auth.uid()
    ),
    array[]::text[]
  )
$$;

-- 3. Zera permissions=[] nos perfis existentes para que caiam no padrao do papel
update public.profiles
set permissions = null
where permissions = array[]::text[];
