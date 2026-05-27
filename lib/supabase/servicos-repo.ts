"use client"

import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase } from "@/lib/supabase/profiles-repo"

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
  osAssinada: boolean
  baixaObservacao: string
  osFingerprint: string
  osDocumentoHtml: string
  responsavelBaixa: string
  osAssinadaNome: string
  osAssinadaMimeType: string
  osAssinadaStorageBucket: string
  osAssinadaStoragePath: string
  osAssinadaTamanho: number
  cobrancaModo: "contrato" | "adicional"
  contratoId: string
  contratoItemId: string
  valorCobranca: number
  formaPagamento: string
  tipoDocumentoCobranca: string
  motivoAdicional: string
  cobrancaAprovada: boolean
}

export type ServicoSupabaseInput = {
  id?: string
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
  osAssinada?: boolean
  baixaObservacao?: string
  osFingerprint?: string
  osDocumentoHtml?: string
  responsavelBaixa?: string
  osAssinadaNome?: string
  osAssinadaMimeType?: string
  osAssinadaStorageBucket?: string
  osAssinadaStoragePath?: string
  osAssinadaTamanho?: number
  cobrancaModo?: "contrato" | "adicional"
  contratoId?: string
  contratoItemId?: string
  valorCobranca?: number
  formaPagamento?: string
  tipoDocumentoCobranca?: string
  motivoAdicional?: string
  cobrancaAprovada?: boolean
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
    osAssinada: Boolean(row.os_assinada ?? false),
    baixaObservacao: row.baixa_observacao || "",
    osFingerprint: row.os_fingerprint || "",
    osDocumentoHtml: row.os_documento_html || "",
    responsavelBaixa: row.responsavel_baixa || "",
    osAssinadaNome: row.os_assinada_nome || "",
    osAssinadaMimeType: row.os_assinada_mime_type || "",
    osAssinadaStorageBucket: row.os_assinada_storage_bucket || "",
    osAssinadaStoragePath: row.os_assinada_storage_path || "",
    osAssinadaTamanho: typeof row.os_assinada_tamanho === "number" ? row.os_assinada_tamanho : Number(row.os_assinada_tamanho) || 0,
    cobrancaModo: row.cobranca_modo === "adicional" ? "adicional" : "contrato",
    contratoId: row.contrato_id ? String(row.contrato_id) : "",
    contratoItemId: row.contrato_item_id ? String(row.contrato_item_id) : "",
    valorCobranca: typeof row.valor_cobranca === "number" ? row.valor_cobranca : Number(row.valor_cobranca) || 0,
    formaPagamento: row.forma_pagamento || "",
    tipoDocumentoCobranca: row.tipo_documento_cobranca || "",
    motivoAdicional: row.motivo_adicional || "",
    cobrancaAprovada: Boolean(row.cobranca_aprovada ?? false),
  }
}

function mapServicoToDb(input: ServicoSupabaseInput) {
  return {
    id: input.id || undefined,
    os_number: input.osNumber,
    cliente_id: input.clienteId || null,
    cliente: input.cliente,
    servico: input.servico,
    tipo: input.tipo || null,
    local: input.local,
    data: input.data,
    horario: input.horario,
    tecnico: input.tecnico || null,
    status: input.status,
    os_status: input.osStatus || null,
    os_assinada: Boolean(input.osAssinada),
    baixa_observacao: input.baixaObservacao || null,
    os_fingerprint: input.osFingerprint || null,
    os_documento_html: input.osDocumentoHtml || null,
    responsavel_baixa: input.responsavelBaixa || null,
    os_assinada_nome: input.osAssinadaNome || null,
    os_assinada_mime_type: input.osAssinadaMimeType || null,
    os_assinada_storage_bucket: input.osAssinadaStorageBucket || null,
    os_assinada_storage_path: input.osAssinadaStoragePath || null,
    os_assinada_tamanho: input.osAssinadaTamanho ?? null,
    cobranca_modo: input.cobrancaModo || "contrato",
    contrato_id: input.contratoId || null,
    contrato_item_id: input.contratoItemId || null,
    valor_cobranca: input.valorCobranca ?? null,
    forma_pagamento: input.formaPagamento || null,
    tipo_documento_cobranca: input.tipoDocumentoCobranca || null,
    motivo_adicional: input.motivoAdicional || null,
    cobranca_aprovada: Boolean(input.cobrancaAprovada),
    deleted_at: null,
  }
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export async function listServicosSupabase(): Promise<ServicoSupabaseItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("servicos")
    .select("*")
    .is("deleted_at", null)
    .order("data", { ascending: false })
    .limit(300)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToServico)
}

export async function upsertServicoSupabase(input: ServicoSupabaseInput): Promise<ServicoSupabaseItem> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "servicos.edit" : "servicos.create",
    "Voce nao possui permissao para salvar servicos.",
  )

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("servicos")
    .upsert(mapServicoToDb(input))
    .select("*")
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  const servico = mapDbToServico(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "servico",
    entityId: servico.id,
    entityLabel: servico.osNumber,
    description: isEditing ? "Servico/OS atualizado no sistema." : "Novo servico/OS cadastrado no sistema.",
    metadata: {
      cliente: servico.cliente,
      status: servico.status,
      osStatus: servico.osStatus,
    },
  })

  return servico
}

export async function deleteServicoSupabase(id: string): Promise<void> {
  await assertPermissionSupabase("servicos.delete", "Voce nao possui permissao para excluir servicos.")

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("servicos")
    .delete()
    .eq("id", id)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "servico",
    entityId: id,
    entityLabel: id,
    description: "Servico/OS excluido do sistema.",
  })
}

// ── Tipos de Serviço ────────────────────────────────────────────────────────

export type TipoServico = {
  id: string
  nome: string
  categoria: "pragas" | "reservatorio_potavel" | "outro"
  ativo: boolean
}

export async function listTiposServicoSupabase(): Promise<TipoServico[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("tipos_servico")
    .select("id, nome, categoria, ativo")
    .eq("ativo", true)
    .order("nome", { ascending: true })
  if (error) throw new Error(error.message || JSON.stringify(error))
  return (data || []) as TipoServico[]
}

export async function upsertTipoServicoSupabase(input: {
  id?: string
  nome: string
  categoria: string
}): Promise<TipoServico> {
  await assertPermissionSupabase("servicos.edit", "Voce nao possui permissao para gerenciar tipos de servico.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("tipos_servico")
    .upsert({ id: input.id, nome: input.nome.trim(), categoria: input.categoria, ativo: true })
    .select("id, nome, categoria, ativo")
    .single()
  if (error) throw new Error(error.message || JSON.stringify(error))
  return data as TipoServico
}

export async function deleteTipoServicoSupabase(id: string): Promise<void> {
  await assertPermissionSupabase("servicos.edit", "Voce nao possui permissao para excluir tipos de servico.")
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("tipos_servico")
    .update({ ativo: false })
    .eq("id", id)
  if (error) throw new Error(error.message || JSON.stringify(error))
}

// ────────────────────────────────────────────────────────────────────────────

export async function uploadOSAssinadaServicoSupabase(input: {
  servicoId: string
  clienteId?: string
  arquivo: File
}): Promise<{
  nome: string
  mimeType: string
  storageBucket: string
  storagePath: string
  tamanho: number
}> {
  await assertPermissionSupabase("servicos.generate_os", "Voce nao possui permissao para gerar ou anexar OS.")

  const supabase = getSupabaseBrowserClient()
  const bucket = "os-documentos"
  const path = `${input.clienteId || "sem-cliente"}/${input.servicoId}/assinada-${Date.now()}-${sanitizeFileName(input.arquivo.name)}`

  const { error } = await supabase.storage.from(bucket).upload(path, input.arquivo, {
    upsert: false,
    contentType: input.arquivo.type || "application/octet-stream",
  })

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "generate",
    entity: "servico_os",
    entityId: input.servicoId,
    entityLabel: input.arquivo.name,
    description: "OS assinada anexada ao servico.",
    metadata: {
      clienteId: input.clienteId || "",
      arquivo: input.arquivo.name,
    },
  })

  return {
    nome: input.arquivo.name,
    mimeType: input.arquivo.type || "application/octet-stream",
    storageBucket: bucket,
    storagePath: path,
    tamanho: Number(input.arquivo.size) || 0,
  }
}

export async function getOSAssinadaArquivoUrl(storageBucket: string, storagePath: string): Promise<string> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from(storageBucket).createSignedUrl(storagePath, 60)
  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return data.signedUrl
}
