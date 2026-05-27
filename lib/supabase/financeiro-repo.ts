"use client"

import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase } from "@/lib/supabase/profiles-repo"

export type FinanceiroLancamentoTipo = "receita" | "despesa" | "investimento"
export type FinanceiroLancamentoStatus = "programado" | "realizado" | "cancelado"
export type FinanceiroLancamentoOrigem = "manual" | "servico" | "contrato" | "boleto" | "nota_fiscal" | "ajuste"
export type FinanceiroDocumentoTipo = "boleto" | "nota_fiscal"
export type FinanceiroDocumentoStatus = "pendente" | "emitido" | "cancelado"
export type FinanceiroApiIntegracaoStatus = "nao_enviado" | "pendente" | "enviado" | "erro"

export type FinanceiroCategoriaItem = {
  id: string
  nome: string
  tipo: FinanceiroLancamentoTipo
  descricao: string
  ativo: boolean
}

export type FinanceiroCategoriaInput = {
  id?: string
  nome: string
  tipo: FinanceiroLancamentoTipo
  descricao?: string
  ativo: boolean
}

export type FinanceiroLancamentoItem = {
  id: string
  tipo: FinanceiroLancamentoTipo
  status: FinanceiroLancamentoStatus
  origem: FinanceiroLancamentoOrigem
  descricao: string
  categoriaId: string
  categoria: string
  valor: number
  dataCompetencia: string
  dataVencimento: string
  dataLiquidacao: string
  clienteId: string
  clienteNome: string
  fornecedorId: string
  fornecedorNome: string
  servicoId: string
  servicoNumero: string
  contratoId: string
  contratoNumero: string
  formaPagamento: string
  documentoTipo: string
  documentoNumero: string
  notificacaoEmail: boolean
  notificacaoWhatsapp: boolean
  apiIntegracaoStatus: FinanceiroApiIntegracaoStatus
  apiIntegracaoReferencia: string
  observacoes: string
  createdAt: string
}

export type FinanceiroLancamentoInput = {
  id?: string
  tipo: FinanceiroLancamentoTipo
  status: FinanceiroLancamentoStatus
  origem?: FinanceiroLancamentoOrigem
  descricao: string
  categoriaId?: string
  categoria?: string
  valor: number
  dataCompetencia: string
  dataVencimento: string
  dataLiquidacao?: string
  clienteId?: string
  fornecedorId?: string
  servicoId?: string
  contratoId?: string
  formaPagamento?: string
  documentoTipo?: string
  documentoNumero?: string
  notificacaoEmail?: boolean
  notificacaoWhatsapp?: boolean
  apiIntegracaoStatus?: FinanceiroApiIntegracaoStatus
  apiIntegracaoReferencia?: string
  observacoes?: string
}

export type FinanceiroDocumentoItem = {
  id: string
  lancamentoId: string
  lancamentoDescricao: string
  clienteNome: string
  clienteId: string
  contratoId: string
  contratoNumero: string
  tipo: FinanceiroDocumentoTipo
  status: FinanceiroDocumentoStatus
  descricao: string
  numero: string
  serie: string
  chaveDocumento: string
  linhaDigitavel: string
  dataEmissao: string
  dataVencimento: string
  valor: number
  valorServico: number
  notificacaoEmail: boolean
  notificacaoWhatsapp: boolean
  apiIntegracaoStatus: FinanceiroApiIntegracaoStatus
  apiIntegracaoReferencia: string
  observacoes: string
  createdAt: string
}

export type FinanceiroDocumentoInput = {
  id?: string
  lancamentoId: string
  tipo: FinanceiroDocumentoTipo
  status: FinanceiroDocumentoStatus
  clienteId?: string
  contratoId?: string
  descricao?: string
  numero: string
  serie?: string
  chaveDocumento?: string
  linhaDigitavel?: string
  dataEmissao: string
  dataVencimento?: string
  valor: number
  valorServico?: number
  notificacaoEmail?: boolean
  notificacaoWhatsapp?: boolean
  apiIntegracaoStatus?: FinanceiroApiIntegracaoStatus
  apiIntegracaoReferencia?: string
  observacoes?: string
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0
}

function mapDbToCategoria(row: any): FinanceiroCategoriaItem {
  return {
    id: String(row.id),
    nome: row.nome || "",
    tipo: row.tipo || "receita",
    descricao: row.descricao || "",
    ativo: Boolean(row.ativo ?? true),
  }
}

function mapCategoriaToDb(input: FinanceiroCategoriaInput) {
  return {
    id: input.id,
    nome: input.nome,
    tipo: input.tipo,
    descricao: input.descricao || null,
    ativo: Boolean(input.ativo),
    deleted_at: null,
  }
}

function mapDbToLancamento(row: any): FinanceiroLancamentoItem {
  return {
    id: String(row.id),
    tipo: row.tipo || "receita",
    status: row.status || "programado",
    origem: row.origem || "manual",
    descricao: row.descricao || "",
    categoriaId: row.categoria_id ? String(row.categoria_id) : "",
    categoria: row.financeiro_categorias?.nome || row.categoria || "",
    valor: asNumber(row.valor),
    dataCompetencia: row.data_competencia || "",
    dataVencimento: row.data_vencimento || "",
    dataLiquidacao: row.data_liquidacao || "",
    clienteId: row.cliente_id ? String(row.cliente_id) : "",
    clienteNome: row.clientes?.nome || "",
    fornecedorId: row.fornecedor_id ? String(row.fornecedor_id) : "",
    fornecedorNome: row.fornecedores?.razao_social || "",
    servicoId: row.servico_id ? String(row.servico_id) : "",
    servicoNumero: row.servicos?.os_number || "",
    contratoId: row.contrato_id ? String(row.contrato_id) : "",
    contratoNumero: row.contratos?.numero || "",
    formaPagamento: row.forma_pagamento || "",
    documentoTipo: row.documento_tipo || "",
    documentoNumero: row.documento_numero || "",
    notificacaoEmail: Boolean(row.notificacao_email ?? false),
    notificacaoWhatsapp: Boolean(row.notificacao_whatsapp ?? false),
    apiIntegracaoStatus: row.api_integracao_status || "nao_enviado",
    apiIntegracaoReferencia: row.api_integracao_referencia || "",
    observacoes: row.observacoes || "",
    createdAt: row.created_at || "",
  }
}

function mapLancamentoToDb(input: FinanceiroLancamentoInput) {
  return {
    id: input.id,
    tipo: input.tipo,
    status: input.status,
    origem: input.origem || "manual",
    descricao: input.descricao,
    categoria_id: input.categoriaId || null,
    categoria: input.categoria || null,
    valor: input.valor,
    data_competencia: input.dataCompetencia,
    data_vencimento: input.dataVencimento,
    data_liquidacao: input.dataLiquidacao || null,
    cliente_id: input.clienteId || null,
    fornecedor_id: input.fornecedorId || null,
    servico_id: input.servicoId || null,
    contrato_id: input.contratoId || null,
    forma_pagamento: input.formaPagamento || null,
    documento_tipo: input.documentoTipo || null,
    documento_numero: input.documentoNumero || null,
    notificacao_email: Boolean(input.notificacaoEmail),
    notificacao_whatsapp: Boolean(input.notificacaoWhatsapp),
    observacoes: input.observacoes || null,
    deleted_at: null,
  }
}

function mapDbToDocumento(row: any): FinanceiroDocumentoItem {
  return {
    id: String(row.id),
    lancamentoId: row.lancamento_id ? String(row.lancamento_id) : "",
    lancamentoDescricao: row.financeiro_lancamentos?.descricao || "",
    clienteNome: row.financeiro_lancamentos?.clientes?.nome || "",
    clienteId: row.cliente_id ? String(row.cliente_id) : row.financeiro_lancamentos?.cliente_id ? String(row.financeiro_lancamentos.cliente_id) : "",
    contratoId: row.contrato_id ? String(row.contrato_id) : row.financeiro_lancamentos?.contrato_id ? String(row.financeiro_lancamentos.contrato_id) : "",
    contratoNumero: row.contratos?.numero || row.financeiro_lancamentos?.contratos?.numero || "",
    tipo: row.tipo || "boleto",
    status: row.status || "pendente",
    descricao: row.descricao || "",
    numero: row.numero || "",
    serie: row.serie || "",
    chaveDocumento: row.chave_documento || "",
    linhaDigitavel: row.linha_digitavel || "",
    dataEmissao: row.data_emissao || "",
    dataVencimento: row.data_vencimento || "",
    valor: asNumber(row.valor),
    valorServico: asNumber(row.valor_servico),
    notificacaoEmail: Boolean(row.notificacao_email ?? false),
    notificacaoWhatsapp: Boolean(row.notificacao_whatsapp ?? false),
    apiIntegracaoStatus: row.api_integracao_status || "nao_enviado",
    apiIntegracaoReferencia: row.api_integracao_referencia || "",
    observacoes: row.observacoes || "",
    createdAt: row.created_at || "",
  }
}

function mapDocumentoToDb(input: FinanceiroDocumentoInput) {
  return {
    id: input.id,
    lancamento_id: input.lancamentoId,
    tipo: input.tipo,
    status: input.status,
    // cliente_id, contrato_id, descricao, valor_servico, notificacao_email,
    // notificacao_whatsapp, api_integracao_status, api_integracao_referencia
    // adicionados na migration 009 — omitidos enquanto nao aplicada
    numero: input.numero,
    serie: input.serie || null,
    chave_documento: input.chaveDocumento || null,
    linha_digitavel: input.linhaDigitavel || null,
    data_emissao: input.dataEmissao,
    data_vencimento: input.dataVencimento || null,
    valor: input.valor,
    observacoes: input.observacoes || null,
    deleted_at: null,
  }
}

export async function listFinanceiroCategoriasSupabase(tipo?: FinanceiroLancamentoTipo): Promise<FinanceiroCategoriaItem[]> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("financeiro_categorias")
    .select("*")
    .is("deleted_at", null)
    .order("nome", { ascending: true })

  if (tipo) {
    query = query.eq("tipo", tipo)
  }

  const { data, error } = await query
  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToCategoria)
}

export async function upsertFinanceiroCategoriaSupabase(input: FinanceiroCategoriaInput): Promise<FinanceiroCategoriaItem> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "financeiro.edit" : "financeiro.create",
    "Voce nao possui permissao para salvar categorias do financeiro.",
  )

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("financeiro_categorias")
    .upsert(mapCategoriaToDb(input))
    .select("*")
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  const categoria = mapDbToCategoria(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "financeiro_categoria",
    entityId: categoria.id,
    entityLabel: categoria.nome,
    description: isEditing ? "Categoria financeira atualizada." : "Categoria financeira criada.",
    metadata: { tipo: categoria.tipo },
  })

  return categoria
}

export async function deleteFinanceiroCategoriaSupabase(id: string): Promise<void> {
  await assertPermissionSupabase("financeiro.delete", "Voce nao possui permissao para excluir categorias financeiras.")

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("financeiro_categorias")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "financeiro_categoria",
    entityId: id,
    entityLabel: id,
    description: "Categoria financeira excluida.",
  })
}

export async function listFinanceiroLancamentosSupabase(): Promise<FinanceiroLancamentoItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select("*, clientes(id,nome), fornecedores(id,razao_social), servicos(id,os_number), contratos(id,numero), financeiro_categorias(id,nome)")
    .is("deleted_at", null)
    .order("data_vencimento", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToLancamento)
}

export async function upsertFinanceiroLancamentoSupabase(input: FinanceiroLancamentoInput): Promise<FinanceiroLancamentoItem> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "financeiro.edit" : "financeiro.create",
    "Voce nao possui permissao para salvar lancamentos financeiros.",
  )

  const supabase = getSupabaseBrowserClient()
  const { data: saved, error: saveError } = await supabase
    .from("financeiro_lancamentos")
    .upsert(mapLancamentoToDb(input))
    .select("id")
    .single()

  if (saveError) throw new Error((saveError as any).message || (saveError as any).code || JSON.stringify(saveError))

  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select("*, clientes(id,nome), fornecedores(id,razao_social), servicos(id,os_number), contratos(id,numero), financeiro_categorias(id,nome)")
    .eq("id", saved.id)
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  const lancamento = mapDbToLancamento(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "financeiro_lancamento",
    entityId: lancamento.id,
    entityLabel: lancamento.descricao,
    description: isEditing ? "Lancamento financeiro atualizado." : "Lancamento financeiro criado.",
    metadata: {
      tipo: lancamento.tipo,
      status: lancamento.status,
      valor: lancamento.valor,
    },
  })

  return lancamento
}

export async function deleteFinanceiroLancamentoSupabase(id: string): Promise<void> {
  await assertPermissionSupabase("financeiro.delete", "Voce nao possui permissao para excluir lancamentos financeiros.")

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("financeiro_lancamentos").delete().eq("id", id)
  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "financeiro_lancamento",
    entityId: id,
    entityLabel: id,
    description: "Lancamento financeiro excluido.",
  })
}

export async function listFinanceiroDocumentosSupabase(tipo?: FinanceiroDocumentoTipo): Promise<FinanceiroDocumentoItem[]> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("financeiro_documentos")
    .select("*, contratos(numero), financeiro_lancamentos(descricao, cliente_id, contrato_id, clientes(nome), contratos(numero))")
    .is("deleted_at", null)
    .order("data_emissao", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300)

  if (tipo) {
    query = query.eq("tipo", tipo)
  }

  const { data, error } = await query
  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToDocumento)
}

export async function upsertFinanceiroDocumentoSupabase(input: FinanceiroDocumentoInput): Promise<FinanceiroDocumentoItem> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "financeiro.edit" : "financeiro.create",
    "Voce nao possui permissao para salvar documentos financeiros.",
  )

  const supabase = getSupabaseBrowserClient()
  const { data: saved, error: saveError } = await supabase
    .from("financeiro_documentos")
    .upsert(mapDocumentoToDb(input))
    .select("id")
    .single()

  if (saveError) throw saveError

  const { data, error } = await supabase
    .from("financeiro_documentos")
    .select("*, contratos(numero), financeiro_lancamentos(descricao, cliente_id, contrato_id, clientes(nome), contratos(numero))")
    .eq("id", saved.id)
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  const documento = mapDbToDocumento(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "financeiro_documento",
    entityId: documento.id,
    entityLabel: documento.numero,
    description: isEditing ? "Documento financeiro atualizado." : "Documento financeiro criado.",
    metadata: {
      tipo: documento.tipo,
      valorServico: documento.valorServico,
    },
  })

  return documento
}

export async function deleteFinanceiroDocumentoSupabase(id: string): Promise<void> {
  await assertPermissionSupabase("financeiro.delete", "Voce nao possui permissao para excluir documentos financeiros.")

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("financeiro_documentos").delete().eq("id", id)
  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "financeiro_documento",
    entityId: id,
    entityLabel: id,
    description: "Documento financeiro excluido.",
  })
}

export async function upsertReceitaServicoSupabase(input: {
  servicoId: string
  clienteId?: string
  contratoId?: string
  categoriaId?: string
  categoria?: string
  descricao: string
  valor: number
  dataCompetencia: string
  dataVencimento: string
  formaPagamento?: string
  documentoTipo?: string
  notificacaoEmail?: boolean
  notificacaoWhatsapp?: boolean
  observacoes?: string
  status?: FinanceiroLancamentoStatus
}): Promise<FinanceiroLancamentoItem> {
  const supabase = getSupabaseBrowserClient()
  const { data: existente, error: existenteError } = await supabase
    .from("financeiro_lancamentos")
    .select("id")
    .eq("servico_id", input.servicoId)
    .eq("tipo", "receita")
    .is("deleted_at", null)
    .maybeSingle()

  if (existenteError) throw new Error((existenteError as any).message || (existenteError as any).code || JSON.stringify(existenteError))

  return upsertFinanceiroLancamentoSupabase({
    id: existente?.id ? String(existente.id) : undefined,
    tipo: "receita",
    status: input.status || "programado",
    origem: "servico",
    descricao: input.descricao,
    categoriaId: input.categoriaId,
    categoria: input.categoria,
    valor: input.valor,
    dataCompetencia: input.dataCompetencia,
    dataVencimento: input.dataVencimento,
    clienteId: input.clienteId,
    contratoId: input.contratoId,
    servicoId: input.servicoId,
    formaPagamento: input.formaPagamento,
    documentoTipo: input.documentoTipo,
    notificacaoEmail: input.notificacaoEmail,
    notificacaoWhatsapp: input.notificacaoWhatsapp,
    observacoes: input.observacoes,
  })
}

export async function upsertDespesaNotaFiscalSupabase(input: {
  numeroDocumento: string
  fornecedorId?: string
  descricao: string
  categoriaId?: string
  categoria?: string
  valor: number
  dataCompetencia: string
  dataVencimento: string
  observacoes?: string
}): Promise<FinanceiroLancamentoItem> {
  return upsertFinanceiroLancamentoSupabase({
    tipo: "despesa",
    status: "programado",
    origem: "nota_fiscal",
    descricao: input.descricao,
    categoriaId: input.categoriaId,
    categoria: input.categoria,
    valor: input.valor,
    dataCompetencia: input.dataCompetencia,
    dataVencimento: input.dataVencimento,
    fornecedorId: input.fornecedorId,
    documentoTipo: "nota_fiscal",
    documentoNumero: input.numeroDocumento,
    observacoes: input.observacoes,
  })
}

export async function cancelLancamentoServicoSupabase(servicoId: string, observacao?: string): Promise<void> {
  await assertPermissionSupabase("financeiro.edit", "Voce nao possui permissao para cancelar lancamentos do servico.")

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("financeiro_lancamentos")
    .update({
      status: "cancelado",
      observacoes: observacao || null,
    })
    .eq("servico_id", servicoId)
    .eq("tipo", "receita")
    .is("deleted_at", null)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "cancel",
    entity: "financeiro_lancamento",
    entityId: servicoId,
    entityLabel: servicoId,
    description: "Lancamento financeiro de servico cancelado.",
    metadata: { observacao: observacao || "" },
  })
}
