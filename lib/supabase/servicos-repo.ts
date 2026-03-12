"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type ServicoSupabaseItem = {
  id: string
  osNumber: string
  clienteId: string
  cliente: string
  servico: string
  tipo: string
  local: string
  data: string
  horario: string
  tecnico: string
  status: "agendado" | "em_execucao" | "executado" | "cancelado"
  osStatus: string
  baixaObservacao: string
}

function mapDbToServico(row: any): ServicoSupabaseItem {
  return {
    id: String(row.id),
    osNumber: row.os_number || "",
    clienteId: row.cliente_id ? String(row.cliente_id) : "",
    cliente: row.cliente || "",
    servico: row.servico || "",
    tipo: row.tipo || "",
    local: row.local || "",
    data: row.data || "",
    horario: row.horario || "",
    tecnico: row.tecnico || "",
    status: row.status || "agendado",
    osStatus: row.os_status || "",
    baixaObservacao: row.baixa_observacao || "",
  }
}

export async function listServicosSupabase(): Promise<ServicoSupabaseItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("servicos")
    .select("*")
    .is("deleted_at", null)
    .order("data", { ascending: false })

  if (error) throw error
  return (data || []).map(mapDbToServico)
}
