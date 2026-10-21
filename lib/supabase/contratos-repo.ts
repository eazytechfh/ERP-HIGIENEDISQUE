"use client"

import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase } from "@/lib/supabase/profiles-repo"
import { buildContratoItensPayload } from "@/lib/contratos-items"

export type ContratoSupabaseItemInput = {
  id?: string
  nome: string
  frequencia?: string
  limites?: string
}

export type ContratoSupabaseInput = {
  id?: string
  expectedUpdatedAt?: string
  clienteId: string
  numero: string
  descricao: string
  status: "ativo" | "suspenso" | "encerrado"
  tipoContrato: "recorrente" | "avulso"
  dataInicio: string
  dataTermino: string
  diaVencimento: string
  valorMensal: string
  reajusteAnual: string
  multaContratual: string
  exigeAprovacao: boolean
  adicionalDescricao: string
  observacoesContratuais: string
  observacoesInternas: string
  situacaoCliente: string
  itens: ContratoSupabaseItemInput[]
}

export type ContratoSupabaseItem = {
  id: string
  updatedAt: string
  clienteId: string
  numero: string
  descricao: string
  status: "ativo" | "suspenso" | "encerrado"
  tipoContrato: "recorrente" | "avulso"
  dataInicio: string
  dataTermino: string
  diaVencimento: string
  valorMensal: string
  reajusteAnual: string
  multaContratual: string
  exigeAprovacao: boolean
  adicionalDescricao: string
  observacoesContratuais: string
  observacoesInternas: string
  itens: Array<{ id: string; nome: string; frequencia: string; limites: string }>
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
    updatedAt: row.updated_at || "",
    clienteId: row.cliente_id ? String(row.cliente_id) : "",
    numero: row.numero || "",
    descricao: row.descricao || "",
    status: (row.status || "ativo") as ContratoSupabaseItem["status"],
    tipoContrato: (row.tipo_contrato || "recorrente") as ContratoSupabaseItem["tipoContrato"],
    dataInicio: row.data_inicio || "",
    dataTermino: row.data_termino || "",
    diaVencimento: row.dia_vencimento == null ? "" : String(row.dia_vencimento),
    valorMensal: row.valor_mensal || "",
    reajusteAnual: row.reajuste_anual || "",
    multaContratual: row.multa_contratual || "",
    exigeAprovacao: Boolean(row.exige_aprovacao),
    adicionalDescricao: row.adicional_descricao || "",
    observacoesContratuais: row.observacoes_contratuais || "",
    observacoesInternas: row.observacoes_internas || "",
    itens: Array.isArray(row.contrato_itens)
      ? row.contrato_itens.map((item: any) => ({
          id: String(item.id),
          nome: item.nome || "",
          frequencia: item.frequencia || "",
          limites: item.limites || "",
        }))
      : [],
  }
}

export async function listContratosSupabase(
  options: { clienteIds?: string[] } = {},
): Promise<ContratoSupabaseItem[]> {
  if (options.clienteIds && options.clienteIds.length === 0) return []

  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("contratos")
    .select("*, contrato_itens(*)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (options.clienteIds) {
    query = query.in("cliente_id", options.clienteIds)
  } else {
    query = query.limit(200)
  }

  const { data, error } = await query

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToContrato)
}

export async function getContratoSupabase(id: string): Promise<ContratoSupabaseItem> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("contratos")
    .select("*, contrato_itens(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return mapDbToContrato(data)
}

export async function assertContratoSavePermissionsSupabase(isEditing: boolean): Promise<void> {
  await Promise.all([
    assertPermissionSupabase(
      isEditing ? "contratos.edit" : "contratos.create",
      "Voce nao possui permissao para salvar contratos.",
    ),
    assertPermissionSupabase(
      "clientes.edit",
      "Voce nao possui permissao para atualizar o resumo contratual do cliente.",
    ),
    assertPermissionSupabase(
      "contratos.generate",
      "Voce nao possui permissao para gerar documentos de contrato.",
    ),
  ])
}

export async function upsertContratoSupabase(input: ContratoSupabaseInput): Promise<ContratoSupabaseItem> {
  const isEditing = Boolean(input.id)
  await assertContratoSavePermissionsSupabase(isEditing)

  const supabase = getSupabaseBrowserClient()

  const { data: savedId, error: saveError } = await supabase.rpc("upsert_contrato_com_itens", {
    p_id: input.id || null,
    p_expected_updated_at: input.expectedUpdatedAt || null,
    p_cliente_id: input.clienteId,
    p_numero: input.numero,
    p_descricao: input.descricao,
    p_status: input.status,
    p_tipo_contrato: input.tipoContrato,
    p_data_inicio: input.dataInicio,
    p_data_termino: input.dataTermino,
    p_dia_vencimento: input.diaVencimento ? Number(input.diaVencimento) : null,
    p_valor_mensal: input.valorMensal || null,
    p_reajuste_anual: input.reajusteAnual || null,
    p_multa_contratual: input.multaContratual || null,
    p_exige_aprovacao: input.exigeAprovacao,
    p_adicional_descricao: input.adicionalDescricao || null,
    p_observacoes_contratuais: input.observacoesContratuais || null,
    p_observacoes_internas: input.observacoesInternas || null,
    p_situacao_cliente: input.situacaoCliente || null,
    p_itens: buildContratoItensPayload(input.itens),
  })

  if (saveError) {
    if (String((saveError as any).message || "").includes("CONTRATO_CONFLICT")) {
      throw new Error("Este contrato foi alterado por outro usuário. Recarregue a página antes de salvar novamente.")
    }
    throw saveError
  }

  const contratoId = String(savedId)

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
