"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase } from "@/lib/supabase/profiles-repo"

export type ServicoRascunho = {
  id: string
  clienteId: string
  cliente: string
  servico: string
  currentStep: 1 | 2 | 3
  formData: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

function mapRascunho(row: any): ServicoRascunho {
  const step = Number(row.current_step)
  return {
    id: String(row.id),
    clienteId: row.cliente_id ? String(row.cliente_id) : "",
    cliente: row.cliente || "",
    servico: row.servico || "",
    currentStep: step === 2 || step === 3 ? step : 1,
    formData: row.form_data && typeof row.form_data === "object" ? row.form_data : {},
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  }
}

export async function listServicosRascunhosSupabase(): Promise<ServicoRascunho[]> {
  await assertPermissionSupabase("servicos.view", "Você não possui permissão para visualizar rascunhos.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("servicos_rascunhos")
    .select("id, cliente_id, cliente, servico, current_step, form_data, created_at, updated_at")
    .order("updated_at", { ascending: false })

  if (error) throw new Error(error.message || JSON.stringify(error))
  return (data || []).map(mapRascunho)
}

export async function upsertServicoRascunhoSupabase(input: {
  id?: string
  clienteId?: string
  cliente?: string
  servico?: string
  currentStep: 1 | 2 | 3
  formData: Record<string, unknown>
}): Promise<ServicoRascunho> {
  await assertPermissionSupabase("servicos.create", "Você não possui permissão para salvar rascunhos.")
  const supabase = getSupabaseBrowserClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw new Error("Sua sessão terminou. Entre novamente para salvar o rascunho.")

  const { data, error } = await supabase
    .from("servicos_rascunhos")
    .upsert({
      id: input.id || undefined,
      user_id: authData.user.id,
      cliente_id: input.clienteId || null,
      cliente: input.cliente || null,
      servico: input.servico || null,
      current_step: input.currentStep,
      form_data: input.formData,
    })
    .select("id, cliente_id, cliente, servico, current_step, form_data, created_at, updated_at")
    .single()

  if (error) throw new Error(error.message || JSON.stringify(error))
  return mapRascunho(data)
}

export async function deleteServicoRascunhoSupabase(id: string): Promise<void> {
  await assertPermissionSupabase("servicos.create", "Você não possui permissão para excluir rascunhos.")
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("servicos_rascunhos").delete().eq("id", id)
  if (error) throw new Error(error.message || JSON.stringify(error))
}
