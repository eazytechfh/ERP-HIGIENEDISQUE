"use client"

import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase } from "@/lib/supabase/profiles-repo"

export type ContratoSupabaseItemInput = {
  id?: string
  nome: string
}

export type ContratoSupabaseInput = {
  id?: string
  clienteId: string
  numero: string
  descricao: string
  status: "ativo" | "suspenso" | "encerrado"
  tipoContrato: "recorrente" | "avulso"
  dataInicio: string
  dataTermino: string
  itens: ContratoSupabaseItemInput[]
}

export type ContratoSupabaseItem = {
  id: string
  clienteId: string
  numero: string
  descricao: string
  status: "ativo" | "suspenso" | "encerrado"
  tipoContrato: "recorrente" | "avulso"
  dataInicio: string
  dataTermino: string
  itens: Array<{ id: string; nome: string }>
}

export type ClienteArquivoContratoInput = {
  clienteId: string
  contratoId: string
  nome: string
  mimeType: string
  arquivo: Blob
  origem: string
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function mapDbToContrato(row: any): ContratoSupabaseItem {
  return {
    id: String(row.id),
    clienteId: row.cliente_id ? String(row.cliente_id) : "",
    numero: row.numero || "",
    descricao: row.descricao || "",
    status: (row.status || "ativo") as ContratoSupabaseItem["status"],
    tipoContrato: (row.tipo_contrato || "recorrente") as ContratoSupabaseItem["tipoContrato"],
    dataInicio: row.data_inicio || "",
    dataTermino: row.data_termino || "",
    itens: Array.isArray(row.contrato_itens)
      ? row.contrato_itens.map((item: any) => ({
          id: String(item.id),
          nome: item.nome || "",
        }))
      : [],
  }
}

export async function listContratosSupabase(): Promise<ContratoSupabaseItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("contratos")
    .select("*, contrato_itens(*)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToContrato)
}

export async function upsertContratoSupabase(input: ContratoSupabaseInput): Promise<ContratoSupabaseItem> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "contratos.edit" : "contratos.create",
    "Voce nao possui permissao para salvar contratos.",
  )

  const supabase = getSupabaseBrowserClient()

  const payload = {
    id: input.id,
    cliente_id: input.clienteId,
    numero: input.numero,
    descricao: input.descricao,
    status: input.status,
    tipo_contrato: input.tipoContrato,
    data_inicio: input.dataInicio,
    data_termino: input.dataTermino,
    deleted_at: null,
  }

  const { data: saved, error: saveError } = await supabase
    .from("contratos")
    .upsert(payload)
    .select("id")
    .single()

  if (saveError) throw saveError

  const contratoId = String(saved.id)

  const { error: deleteItemsError } = await supabase
    .from("contrato_itens")
    .delete()
    .eq("contrato_id", contratoId)

  if (deleteItemsError) throw deleteItemsError

  const itensRows = input.itens.map((item) => ({
    contrato_id: contratoId,
    nome: item.nome,
  }))

  if (itensRows.length > 0) {
    const { error: itensError } = await supabase.from("contrato_itens").insert(itensRows)
    if (itensError) throw itensError
  }

  const { data, error } = await supabase
    .from("contratos")
    .select("*, contrato_itens(*)")
    .eq("id", contratoId)
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  const contrato = mapDbToContrato(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "contrato",
    entityId: contratoId,
    entityLabel: contrato.numero,
    description: isEditing ? "Contrato atualizado no sistema." : "Novo contrato cadastrado no sistema.",
    metadata: {
      clienteId: contrato.clienteId,
      status: contrato.status,
      tipoContrato: contrato.tipoContrato,
    },
  })

  return contrato
}

export async function addClienteArquivoContratoSupabase(input: ClienteArquivoContratoInput): Promise<void> {
  await assertPermissionSupabase("contratos.generate", "Voce nao possui permissao para gerar documentos de contrato.")

  const supabase = getSupabaseBrowserClient()
  const bucket = "contratos-docx"
  const path = `${input.clienteId}/${input.contratoId}/${Date.now()}-${sanitizeFileName(input.nome)}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, input.arquivo, {
    upsert: false,
    contentType: input.mimeType || "application/octet-stream",
  })

  if (uploadError) throw uploadError

  const { error } = await supabase.from("cliente_arquivos").insert({
    cliente_id: input.clienteId,
    nome: input.nome,
    mime_type: input.mimeType || null,
    storage_bucket: bucket,
    storage_path: path,
    tamanho: "size" in input.arquivo ? Number((input.arquivo as File).size) || null : null,
    origem: input.origem,
    contrato_id: input.contratoId,
  })

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "generate",
    entity: "contrato_arquivo",
    entityId: input.contratoId,
    entityLabel: input.nome,
    description: "Arquivo de contrato gerado e vinculado ao cliente.",
    metadata: {
      clienteId: input.clienteId,
      contratoId: input.contratoId,
      origem: input.origem,
    },
  })
}
