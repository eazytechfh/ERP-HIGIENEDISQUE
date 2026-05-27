-- =============================================================
-- DIAGNÓSTICO: Por que lançamentos financeiros não aparecem
-- Execute este script no Supabase SQL Editor (como service_role)
-- =============================================================

-- 1. Verificar lançamentos criados via serviço
SELECT
  fl.id,
  fl.tipo,
  fl.status,
  fl.descricao,
  fl.valor,
  fl.data_competencia,
  fl.servico_id,
  fl.created_at
FROM public.financeiro_lancamentos fl
WHERE fl.deleted_at IS NULL
ORDER BY fl.created_at DESC
LIMIT 20;

-- 2. Verificar perfis de usuário e permissões
SELECT
  p.user_id,
  p.nome,
  p.role,
  p.ativo,
  p.permissions,
  array_length(p.permissions, 1) as qtd_permissoes
FROM public.profiles p;

-- 3. Verificar se a função current_user_permissions trata array vazio
-- (migration 012 aplicada = a função deve ter "array_length" check)
SELECT prosrc
FROM pg_proc
WHERE proname = 'current_user_permissions'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Verificar políticas RLS da tabela financeiro_lancamentos
SELECT
  polname AS policy_name,
  polcmd AS command,
  pg_get_expr(polqual, polrelid) AS using_expr,
  pg_get_expr(polwithcheck, polrelid) AS with_check_expr
FROM pg_policy
WHERE polrelid = 'public.financeiro_lancamentos'::regclass;

-- =============================================================
-- SE permissions = '{}' (array vazio) para algum perfil:
-- Execute este FIX para corrigir (migration 012):
-- =============================================================
/*
UPDATE public.profiles
SET permissions = NULL
WHERE permissions = array[]::text[];

-- Após setar NULL, a função current_user_permissions usará as
-- permissões padrão do papel (role). Mas para isso a função
-- precisa estar atualizada. Se não estiver, cole o conteúdo
-- completo da migration 012 abaixo:
*/
