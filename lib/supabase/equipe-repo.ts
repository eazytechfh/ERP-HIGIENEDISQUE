"use client"

import { hasPermission, type AppPermissionKey, type AppRole } from "@/lib/access-control"
import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase, getCurrentUserAccessProfileSupabase } from "@/lib/supabase/profiles-repo"

export type EquipeRole = AppRole

export type EquipeMembroInput = {
  id?: string
  userId?: string
  nome: string
  telefone: string
  cargo: string
  endereco: string
  cpf: string
  cnh: "Sim" | "Nao"
  cnhValidade: string
  nr33Validade: string
  nr35Validade: string
  asoValidade: string
  situacao: "Ativo" | "Inativo"
  emailAcesso: string
  perfilAcesso: EquipeRole | ""
  permissions?: AppPermissionKey[]
}

function mapDbToEquipe(row: any): EquipeMembroInput {
  return {
    id: String(row.id),
    userId: row.user_id || undefined,
    nome: row.nome || "",
    telefone: row.telefone || "",
    cargo: row.cargo || "",
    endereco: row.endereco || "",
    cpf: row.cpf || "",
    cnh: row.cnh ? "Sim" : "Nao",
    cnhValidade: row.cnh_validade || "",
    nr33Validade: row.nr33_validade || "",
    nr35Validade: row.nr35_validade || "",
    asoValidade: row.aso_validade || "",
    situacao: (row.situacao || "Ativo") as EquipeMembroInput["situacao"],
    emailAcesso: row.email_acesso || "",
    perfilAcesso: (row.perfil_acesso || "") as EquipeMembroInput["perfilAcesso"],
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  }
}

function mapEquipeToDb(input: EquipeMembroInput) {
  return {
    id: input.id,
    user_id: input.userId || null,
    nome: input.nome,
    telefone: input.telefone || null,
    cargo: input.cargo || null,
    endereco: input.endereco || null,
    cpf: input.cpf || null,
    cnh: input.cnh === "Sim",
    cnh_validade: input.cnhValidade || null,
    nr33_validade: input.nr33Validade || null,
    nr35_validade: input.nr35Validade || null,
    aso_validade: input.asoValidade || null,
    situacao: input.situacao,
    email_acesso: input.emailAcesso || null,
    perfil_acesso: input.perfilAcesso || null,
    deleted_at: null,
  }
}

export async function listEquipeMembrosSupabase(): Promise<EquipeMembroInput[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("equipe_membros")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) throw error

  const membros = (data || []).map(mapDbToEquipe)
  const currentProfile = await getCurrentUserAccessProfileSupabase()
  const canManageAccess = hasPermission(currentProfile?.permissions, "equipe.manage_access")
  if (!canManageAccess) {
    return membros
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, nome, role, ativo, permissions")

  if (profilesError) throw profilesError

  const existingUserIds = new Set(membros.map((item) => item.userId).filter(Boolean))
  const perfisSemFicha = (profiles || [])
    .filter((profile: any) => profile.user_id && !existingUserIds.has(profile.user_id))
    .map(
      (profile: any): EquipeMembroInput => ({
        userId: String(profile.user_id),
        nome: profile.nome || "",
        telefone: "",
        cargo: "",
        endereco: "",
        cpf: "",
        cnh: "Nao",
        cnhValidade: "",
        nr33Validade: "",
        nr35Validade: "",
        asoValidade: "",
        situacao: profile.ativo === false ? "Inativo" : "Ativo",
        emailAcesso: "",
        perfilAcesso: (profile.role || "") as EquipeMembroInput["perfilAcesso"],
        permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
      })
    )

  return [...membros, ...perfisSemFicha]
}

export async function upsertEquipeMembroSupabase(input: EquipeMembroInput): Promise<EquipeMembroInput> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "equipe.edit" : "equipe.create",
    "Voce nao possui permissao para salvar membros da equipe.",
  )

  const supabase = getSupabaseBrowserClient()
  const payload = mapEquipeToDb(input)

  const { data, error } = await supabase
    .from("equipe_membros")
    .upsert(payload)
    .select("*")
    .single()

  if (error) throw error
  const membro = mapDbToEquipe(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "equipe_membro",
    entityId: membro.id || membro.userId || "",
    entityLabel: membro.nome,
    description: isEditing ? "Cadastro de equipe atualizado." : "Novo membro cadastrado na equipe.",
    metadata: {
      perfilAcesso: membro.perfilAcesso,
      situacao: membro.situacao,
    },
  })

  return membro
}

export async function deleteEquipeMembroSupabase(id: string): Promise<void> {
  await assertPermissionSupabase("equipe.delete", "Voce nao possui permissao para excluir membros da equipe.")

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("equipe_membros")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw error

  await safeAuditLogSupabase({
    action: "delete",
    entity: "equipe_membro",
    entityId: id,
    entityLabel: id,
    description: "Membro removido da equipe.",
  })
}
