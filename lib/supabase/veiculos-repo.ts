"use client"

import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase } from "@/lib/supabase/profiles-repo"

export type VeiculoSupabaseItem = {
  id: string
  modelo: string
  marca: string
  placa: string
  renavan?: string
  responsavel: string
  ativo: boolean
}

export type VeiculoSupabaseInput = {
  id?: string
  modelo: string
  marca: string
  placa: string
  renavan?: string
  responsavel: string
  ativo: boolean
}

export type StatusManutencaoSupabase = "Pendente" | "Agendada" | "Concluida"

export type ManutencaoPreventivaSupabaseItem = {
  id: string
  veiculoId: string
  descricao: string
  dataPrevista: string
  quilometragem: number
  status: StatusManutencaoSupabase
}

export type ManutencaoPreventivaSupabaseInput = {
  id?: string
  veiculoId: string
  descricao: string
  dataPrevista: string
  quilometragem: number
  status: StatusManutencaoSupabase
}

function mapDbToVeiculo(row: any): VeiculoSupabaseItem {
  return {
    id: String(row.id),
    modelo: row.modelo || "",
    marca: row.marca || "",
    placa: row.placa || "",
    renavan: row.renavan || "",
    responsavel: row.responsavel || "",
    ativo: Boolean(row.ativo ?? true),
  }
}

function mapVeiculoToDb(input: VeiculoSupabaseInput) {
  return {
    id: input.id,
    modelo: input.modelo,
    marca: input.marca,
    placa: input.placa,
    renavan: input.renavan || null,
    responsavel: input.responsavel,
    ativo: Boolean(input.ativo),
    deleted_at: null,
  }
}

function mapDbToManutencao(row: any): ManutencaoPreventivaSupabaseItem {
  return {
    id: String(row.id),
    veiculoId: row.veiculo_id ? String(row.veiculo_id) : "",
    descricao: row.descricao || "",
    dataPrevista: row.data_prevista || "",
    quilometragem: typeof row.quilometragem === "number" ? row.quilometragem : Number(row.quilometragem) || 0,
    status: (row.status || "Pendente") as StatusManutencaoSupabase,
  }
}

function mapManutencaoToDb(input: ManutencaoPreventivaSupabaseInput) {
  return {
    id: input.id,
    veiculo_id: input.veiculoId,
    descricao: input.descricao,
    data_prevista: input.dataPrevista,
    quilometragem: input.quilometragem,
    status: input.status,
    deleted_at: null,
  }
}

export async function listVeiculosSupabase(): Promise<VeiculoSupabaseItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("veiculos")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToVeiculo)
}

export async function upsertVeiculoSupabase(input: VeiculoSupabaseInput): Promise<VeiculoSupabaseItem> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "veiculos.edit" : "veiculos.create",
    "Voce nao possui permissao para salvar veiculos.",
  )

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("veiculos")
    .upsert(mapVeiculoToDb(input))
    .select("*")
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  const veiculo = mapDbToVeiculo(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "veiculo",
    entityId: veiculo.id,
    entityLabel: veiculo.placa,
    description: isEditing ? "Veiculo atualizado no sistema." : "Novo veiculo cadastrado no sistema.",
  })

  return veiculo
}

export async function deleteVeiculoSupabase(id: string): Promise<void> {
  await assertPermissionSupabase("veiculos.delete", "Voce nao possui permissao para excluir veiculos.")

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("veiculos")
    .delete()
    .eq("id", id)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "veiculo",
    entityId: id,
    entityLabel: id,
    description: "Veiculo excluido do sistema.",
  })
}

export async function listManutencoesPreventivasSupabase(): Promise<ManutencaoPreventivaSupabaseItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("manutencoes_preventivas")
    .select("*")
    .is("deleted_at", null)
    .order("data_prevista", { ascending: true })

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToManutencao)
}

export async function upsertManutencaoPreventivaSupabase(
  input: ManutencaoPreventivaSupabaseInput,
): Promise<ManutencaoPreventivaSupabaseItem> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "veiculos.edit" : "veiculos.create",
    "Voce nao possui permissao para salvar manutencoes preventivas.",
  )

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("manutencoes_preventivas")
    .upsert(mapManutencaoToDb(input))
    .select("*")
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  const manutencao = mapDbToManutencao(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "manutencao_preventiva",
    entityId: manutencao.id,
    entityLabel: manutencao.descricao,
    description: isEditing ? "Manutencao preventiva atualizada." : "Manutencao preventiva cadastrada.",
  })

  return manutencao
}

export async function deleteManutencaoPreventivaSupabase(id: string): Promise<void> {
  await assertPermissionSupabase("veiculos.delete", "Voce nao possui permissao para excluir manutencoes preventivas.")

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("manutencoes_preventivas")
    .delete()
    .eq("id", id)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "manutencao_preventiva",
    entityId: id,
    entityLabel: id,
    description: "Manutencao preventiva excluida.",
  })
}
