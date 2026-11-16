// Autenticacao das rotas do financeiro (somente servidor).
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getDefaultPermissionsForRole, normalizePermissions, type AppPermissionKey, type AppRole } from "@/lib/access-control"

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Env ausente: ${name}`)
  return value
}

export class AcessoNegadoError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function supabaseAdmin(): SupabaseClient {
  return createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Valida o token do usuario, o perfil ativo e a permissao exigida. */
export async function autenticarFinanceiro(req: Request, permissao: AppPermissionKey) {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : ""
  if (!token) throw new AcessoNegadoError("Nao autorizado.", 401)

  const anon = createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: authData, error: authError } = await anon.auth.getUser(token)
  if (authError || !authData.user) throw new AcessoNegadoError("Sessao invalida. Entre novamente.", 401)

  const admin = supabaseAdmin()
  const { data: perfil } = await admin
    .from("profiles")
    .select("nome, role, ativo, permissions")
    .eq("user_id", authData.user.id)
    .maybeSingle()

  if (!perfil || perfil.ativo === false) throw new AcessoNegadoError("Seu acesso esta desativado.", 403)
  const permissoes = Array.isArray(perfil.permissions) && perfil.permissions.length > 0
    ? normalizePermissions(perfil.permissions)
    : getDefaultPermissionsForRole((perfil.role || "operacional") as AppRole)
  if (!permissoes.includes(permissao)) throw new AcessoNegadoError("Voce nao possui permissao para esta acao.", 403)

  return { user: authData.user, nome: (perfil.nome as string) || authData.user.email || "", admin }
}
