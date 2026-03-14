"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type VeiculoSupabaseItem = {
  id: string
  modelo: string
  marca: string
  placa: string
  responsavel: string
  ativo: boolean
}

export type VeiculoSupabaseInput = {
  id?: string
  modelo: string
  marca: string
  placa: string
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

  if (error) throw error
  return (data || []).map(mapDbToVeiculo)
}

export async function upsertVeiculoSupabase(input: VeiculoSupabaseInput): Promise<VeiculoSupabaseItem> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("veiculos")
    .upsert(mapVeiculoToDb(input))
    .select("*")
    .single()

  if (error) throw error
  return mapDbToVeiculo(data)
}

export async function deleteVeiculoSupabase(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("veiculos")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function listManutencoesPreventivasSupabase(): Promise<ManutencaoPreventivaSupabaseItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("manutencoes_preventivas")
    .select("*")
    .is("deleted_at", null)
    .order("data_prevista", { ascending: true })

  if (error) throw error
  return (data || []).map(mapDbToManutencao)
}

export async function upsertManutencaoPreventivaSupabase(
  input: ManutencaoPreventivaSupabaseInput,
): Promise<ManutencaoPreventivaSupabaseItem> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("manutencoes_preventivas")
    .upsert(mapManutencaoToDb(input))
    .select("*")
    .single()

  if (error) throw error
  return mapDbToManutencao(data)
}

export async function deleteManutencaoPreventivaSupabase(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("manutencoes_preventivas")
    .delete()
    .eq("id", id)

  if (error) throw error
}
