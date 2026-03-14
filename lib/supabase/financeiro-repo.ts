"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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
    api_integracao_status: input.apiIntegracaoStatus || "nao_enviado",
    api_integracao_referencia: input.apiIntegracaoReferencia || null,
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
    cliente_id: input.clienteId || null,
    contrato_id: input.contratoId || null,
    descricao: input.descricao || null,
    numero: input.numero,
    serie: input.serie || null,
    chave_documento: input.chaveDocumento || null,
    linha_digitavel: input.linhaDigitavel || null,
    data_emissao: input.dataEmissao,
    data_vencimento: input.dataVencimento || null,
    valor: input.valor,
    valor_servico: input.valorServico ?? input.valor,
    notificacao_email: Boolean(input.notificacaoEmail),
    notificacao_whatsapp: Boolean(input.notificacaoWhatsapp),
    api_integracao_status: input.apiIntegracaoStatus || "nao_enviado",
    api_integracao_referencia: input.apiIntegracaoReferencia || null,
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
  if (error) throw error
  return (data || []).map(mapDbToCategoria)
}

export async function upsertFinanceiroCategoriaSupabase(input: FinanceiroCategoriaInput): Promise<FinanceiroCategoriaItem> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("financeiro_categorias")
    .upsert(mapCategoriaToDb(input))
    .select("*")
    .single()

  if (error) throw error
  return mapDbToCategoria(data)
}

export async function listFinanceiroLancamentosSupabase(): Promise<FinanceiroLancamentoItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select("*, clientes(id,nome), fornecedores(id,razao_social), servicos(id,os_number), contratos(id,numero), financeiro_categorias(id,nome)")
    .is("deleted_at", null)
    .order("data_vencimento", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data || []).map(mapDbToLancamento)
}

export async function upsertFinanceiroLancamentoSupabase(input: FinanceiroLancamentoInput): Promise<FinanceiroLancamentoItem> {
  const supabase = getSupabaseBrowserClient()
  const { data: saved, error: saveError } = await supabase
    .from("financeiro_lancamentos")
    .upsert(mapLancamentoToDb(input))
    .select("id")
    .single()

  if (saveError) throw saveError

  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select("*, clientes(id,nome), fornecedores(id,razao_social), servicos(id,os_number), contratos(id,numero), financeiro_categorias(id,nome)")
    .eq("id", saved.id)
    .single()

  if (error) throw error
  return mapDbToLancamento(data)
}

export async function deleteFinanceiroLancamentoSupabase(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("financeiro_lancamentos").delete().eq("id", id)
  if (error) throw error
}

export async function listFinanceiroDocumentosSupabase(tipo?: FinanceiroDocumentoTipo): Promise<FinanceiroDocumentoItem[]> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("financeiro_documentos")
    .select("*, contratos(numero), financeiro_lancamentos(descricao, cliente_id, contrato_id, clientes(nome), contratos(numero))")
    .is("deleted_at", null)
    .order("data_emissao", { ascending: false })
    .order("created_at", { ascending: false })

  if (tipo) {
    query = query.eq("tipo", tipo)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapDbToDocumento)
}

export async function upsertFinanceiroDocumentoSupabase(input: FinanceiroDocumentoInput): Promise<FinanceiroDocumentoItem> {
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

  if (error) throw error
  return mapDbToDocumento(data)
}

export async function deleteFinanceiroDocumentoSupabase(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("financeiro_documentos").delete().eq("id", id)
  if (error) throw error
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

  if (existenteError) throw existenteError

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

  if (error) throw error
}
