"use client"

import { getDefaultPermissionsForRole, hasPermission, type AppPermissionKey, type AppRole, normalizePermissions } from "@/lib/access-control"
import { isApiMode } from "@/lib/runtime-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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
  const normalizedPermissions = normalizePermissions(row.permissions)
  return {
    userId: String(row.user_id),
    nome: row.nome || "",
    role,
    ativo: row.ativo !== false,
    permissions: normalizedPermissions.length > 0 ? normalizedPermissions : getDefaultPermissionsForRole(role),
  }
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
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, nome, role, ativo, permissions")
    .eq("user_id", authData.user.id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

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

  if (error) throw error

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
