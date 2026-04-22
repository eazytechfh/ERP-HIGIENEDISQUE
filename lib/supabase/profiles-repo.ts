"use client"

import { getDefaultPermissionsForRole, hasPermission, type AppPermissionKey, type AppRole, normalizePermissions } from "@/lib/access-control"
import { isApiMode } from "@/lib/runtime-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { withTimeout } from "@/lib/with-timeout"

export type UserAccessProfile = {
  userId: string
  nome: string
  role: AppRole
  ativo: boolean
  permissions: AppPermissionKey[]
}

let cachedProfile: UserAccessProfile | null = null

function mapProfile(row: any): UserAccessProfile {
  const role = (row.role || "operacional") as AppRole
  const normalizedPermissions = Array.isArray(row.permissions)
    ? normalizePermissions(row.permissions)
    : null
  return {
    userId: String(row.user_id),
    nome: row.nome || "",
    role,
    ativo: row.ativo !== false,
    permissions: normalizedPermissions ?? getDefaultPermissionsForRole(role),
  }
}

async function bootstrapCurrentProfile(): Promise<UserAccessProfile | null> {
  const supabase = getSupabaseBrowserClient()
  const { data: sessionData, error: sessionError } = await withTimeout(
    supabase.auth.getSession(),
    8000,
    "Tempo esgotado ao validar a sessao atual.",
  )

  if (sessionError || !sessionData.session?.access_token) {
    return null
  }

  const response = await withTimeout(
    fetch("/api/auth/bootstrap-profile", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    }),
    8000,
    "Tempo esgotado ao recuperar o perfil de acesso.",
  )

  if (!response.ok) return null

  const payload = (await response.json()) as { profile?: any }
  return payload.profile ? mapProfile(payload.profile) : null
}

export function getCachedCurrentProfile(): UserAccessProfile | null {
  return cachedProfile
}

export function setCachedCurrentProfile(profile: UserAccessProfile | null) {
  cachedProfile = profile
}

export function buildLocalAdminProfile(): UserAccessProfile {
  return {
    userId: "local-admin",
    nome: "Administrador Local",
    role: "admin",
    ativo: true,
    permissions: getDefaultPermissionsForRole("admin"),
  }
}

export async function getCurrentUserAccessProfileSupabase(force = false): Promise<UserAccessProfile | null> {
  if (!isApiMode()) {
    const localProfile = buildLocalAdminProfile()
    setCachedCurrentProfile(localProfile)
    return localProfile
  }

  if (cachedProfile && !force) return cachedProfile

  const supabase = getSupabaseBrowserClient()
  const { data: authData, error: authError } = await withTimeout(
    supabase.auth.getUser(),
    8000,
    "Tempo esgotado ao validar o usuario autenticado.",
  )
  if (authError || !authData.user) return null

  const { data, error } = await withTimeout(
    supabase
      .from("profiles")
      .select("user_id, nome, role, ativo, permissions")
      .eq("user_id", authData.user.id)
      .maybeSingle(),
    8000,
    "Tempo esgotado ao carregar o perfil de acesso.",
  )

  if (error) {
    const recoveredProfile = await bootstrapCurrentProfile()
    if (recoveredProfile) {
      setCachedCurrentProfile(recoveredProfile)
      return recoveredProfile
    }
    throw error
  }
  if (!data) {
    const recoveredProfile = await bootstrapCurrentProfile()
    if (recoveredProfile) {
      setCachedCurrentProfile(recoveredProfile)
      return recoveredProfile
    }
    return null
  }

  const profile = mapProfile(data)
  setCachedCurrentProfile(profile)
  return profile
}

export async function upsertUserAccessProfileSupabase(input: {
  userId: string
  nome: string
  role: AppRole
  ativo: boolean
  permissions: AppPermissionKey[]
}): Promise<UserAccessProfile> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      user_id: input.userId,
      nome: input.nome,
      role: input.role,
      ativo: input.ativo,
      permissions: normalizePermissions(input.permissions),
    })
    .select("user_id, nome, role, ativo, permissions")
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  const profile = mapProfile(data)
  if (cachedProfile?.userId === profile.userId) {
    setCachedCurrentProfile(profile)
  }
  return profile
}

export async function assertPermissionSupabase(permission: AppPermissionKey, fallbackMessage?: string): Promise<void> {
  const profile = await getCurrentUserAccessProfileSupabase()
  if (!profile?.ativo) {
    throw new Error("Seu acesso ao sistema esta desativado.")
  }

  if (!hasPermission(profile.permissions, permission)) {
    throw new Error(fallbackMessage || "Voce nao possui permissao para executar esta acao.")
  }
}
