"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type EquipeRole = "admin" | "operacional" | "financeiro" | "tecnico"

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
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, nome, role, ativo")

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
      })
    )

  return [...membros, ...perfisSemFicha]
}

export async function upsertEquipeMembroSupabase(input: EquipeMembroInput): Promise<EquipeMembroInput> {
  const supabase = getSupabaseBrowserClient()
  const payload = mapEquipeToDb(input)

  const { data, error } = await supabase
    .from("equipe_membros")
    .upsert(payload)
    .select("*")
    .single()

  if (error) throw error
  return mapDbToEquipe(data)
}

export async function deleteEquipeMembroSupabase(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("equipe_membros")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw error
}
