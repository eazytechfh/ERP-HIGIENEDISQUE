"use client"

import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase } from "@/lib/supabase/profiles-repo"
import { descricaoParcela, planejarCobranca } from "@/lib/financeiro-calculos"
import { normalizarTexto, type LinhaDespesaImportada } from "@/lib/financeiro-importacao"

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
  liquidadoPor: string
  liquidadoEm: string
  valorBruto: number | null
  valorLiquido: number | null
  taxaModalidade: string
  cartaoParcelas: number | null
  taxaPercentual: number | null
  taxaValor: number | null
  /** Valor que efetivamente entra/sai do caixa: liquido quando realizado, senao o valor. */
  valorCaixa: number
  /** Data que conta no periodo: liquidacao se realizado, vencimento se programado. */
  dataReferencia: string
  parcelaGrupoId: string
  parcelaNumero: number | null
  parcelaTotal: number | null
  createdAt: string
}

export type FinanceiroBaixaSolicitacaoStatus = "pendente" | "aprovada" | "rejeitada" | "cancelada"

export type FinanceiroBaixaSolicitacaoItem = {
  id: string
  lancamentoId: string
  status: FinanceiroBaixaSolicitacaoStatus
  valor: number
  dataLiquidacao: string
  formaPagamento: string
  observacoes: string
  solicitadoPor: string
  solicitadoPorNome: string
  solicitadoEm: string
  decididoPor: string
  decididoPorNome: string
  decididoEm: string
  motivoDecisao: string
  taxaModalidade: string
  cartaoParcelas: number | null
  taxaPercentual: number | null
  taxaValor: number | null
  valorLiquido: number | null
  lancamento: FinanceiroLancamentoItem | null
}

export type FinanceiroTaxaCartaoModalidade = "cartao_credito" | "cartao_debito"

export type FinanceiroTaxaCartaoItem = {
  id: string
  modalidade: FinanceiroTaxaCartaoModalidade
  parcelas: number
  percentual: number
  vigenteDesde: string
  definidoPorNome: string
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
  parcelaGrupoId?: string
  parcelaNumero?: number
  parcelaTotal?: number
  /** Parcelas planejadas da venda no cartao (definem a taxa na baixa). */
  cartaoParcelas?: number
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
  parcelaNumero: number | null
  parcelaTotal: number | null
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

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
    liquidadoPor: row.liquidado_por ? String(row.liquidado_por) : "",
    liquidadoEm: row.liquidado_em || "",
    valorBruto: asNullableNumber(row.valor_bruto),
    valorLiquido: asNullableNumber(row.valor_liquido),
    taxaModalidade: row.taxa_modalidade || "",
    cartaoParcelas: asNullableNumber(row.cartao_parcelas),
    taxaPercentual: asNullableNumber(row.taxa_percentual),
    taxaValor: asNullableNumber(row.taxa_valor),
    valorCaixa:
      row.status === "realizado" && asNullableNumber(row.valor_liquido) !== null
        ? asNumber(row.valor_liquido)
        : asNumber(row.valor),
    dataReferencia: row.data_referencia || (row.status === "realizado" ? row.data_liquidacao : row.data_vencimento) || "",
    parcelaGrupoId: row.parcela_grupo_id ? String(row.parcela_grupo_id) : "",
    parcelaNumero: asNullableNumber(row.parcela_numero),
    parcelaTotal: asNullableNumber(row.parcela_total),
    createdAt: row.created_at || "",
  }
}

function mapDbToBaixaSolicitacao(row: any): FinanceiroBaixaSolicitacaoItem {
  return {
    id: String(row.id),
    lancamentoId: String(row.lancamento_id),
    status: row.status || "pendente",
    valor: asNumber(row.valor),
    dataLiquidacao: row.data_liquidacao || "",
    formaPagamento: row.forma_pagamento || "",
    observacoes: row.observacoes || "",
    solicitadoPor: row.solicitado_por ? String(row.solicitado_por) : "",
    solicitadoPorNome: row.solicitado_por_nome || "",
    solicitadoEm: row.solicitado_em || "",
    decididoPor: row.decidido_por ? String(row.decidido_por) : "",
    decididoPorNome: row.decidido_por_nome || "",
    decididoEm: row.decidido_em || "",
    motivoDecisao: row.motivo_decisao || "",
    taxaModalidade: row.taxa_modalidade || "",
    cartaoParcelas: asNullableNumber(row.cartao_parcelas),
    taxaPercentual: asNullableNumber(row.taxa_percentual),
    taxaValor: asNullableNumber(row.taxa_valor),
    valorLiquido: asNullableNumber(row.valor_liquido),
    lancamento: row.financeiro_lancamentos ? mapDbToLancamento(row.financeiro_lancamentos) : null,
  }
}

function toError(error: unknown): Error {
  const e = error as { message?: string; code?: string } | null
  return new Error(e?.message || e?.code || JSON.stringify(error))
}

const LANCAMENTO_SELECT =
  "*, clientes(id,nome), fornecedores(id,razao_social), servicos(id,os_number), contratos(id,numero), financeiro_categorias(id,nome)"

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
    cartao_parcelas: input.cartaoParcelas ?? null,
    ...(input.parcelaGrupoId
      ? {
          parcela_grupo_id: input.parcelaGrupoId,
          parcela_numero: input.parcelaNumero ?? null,
          parcela_total: input.parcelaTotal ?? null,
        }
      : {}),
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
    parcelaNumero: asNullableNumber(row.financeiro_lancamentos?.parcela_numero),
    parcelaTotal: asNullableNumber(row.financeiro_lancamentos?.parcela_total),
    createdAt: row.created_at || "",
  }
}

const DOCUMENTO_SELECT =
  "*, contratos(numero), financeiro_lancamentos(descricao, cliente_id, contrato_id, parcela_numero, parcela_total, clientes(nome), contratos(numero))"

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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle()
  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  if (!data) throw new Error("O lancamento nao foi excluido. Atualize a pagina e confira suas permissoes.")

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
    .select(DOCUMENTO_SELECT)
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
    .select(DOCUMENTO_SELECT)
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
  /** Parcelas da cobranca (qualquer forma). Cartao = lancamento unico; demais = 1 lancamento por parcela. */
  quantidadeParcelas?: number
  documentoTipo?: string
  notificacaoEmail?: boolean
  notificacaoWhatsapp?: boolean
  observacoes?: string
}): Promise<{ lancamentos: FinanceiroLancamentoItem[]; alterado: boolean; bloqueado: boolean }> {
  const supabase = getSupabaseBrowserClient()
  const { data: existentes, error: existenteError } = await supabase
    .from("financeiro_lancamentos")
    .select(`${LANCAMENTO_SELECT}, financeiro_baixa_solicitacoes(status)`)
    .eq("servico_id", input.servicoId)
    .eq("tipo", "receita")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  if (existenteError) throw toError(existenteError)

  const ativos = (existentes || []).filter((row: any) => row.status !== "cancelado")
  const ativosItens = ativos.map(mapDbToLancamento)
  const existente = ativos.find(
    (row: any) => row.status === "realizado" || (row.financeiro_baixa_solicitacoes || []).some((s: any) => s.status === "pendente"),
  )
  const temBaixaPendente = Boolean(existente && existente.status !== "realizado")

  // Receita ja recebida ou aguardando aprovacao (mesmo que so uma parcela) nao e reescrita pela OS.
  if (existente && (existente.status === "realizado" || temBaixaPendente)) {
    return { lancamentos: ativosItens, alterado: false, bloqueado: true }
  }

  const plano = planejarCobranca({
    total: input.valor,
    quantidade: Math.max(1, input.quantidadeParcelas || 1),
    primeiroVencimento: input.dataVencimento,
    formaPagamento: input.formaPagamento || "",
  })
  const varias = plano.lancamentos.length > 1
  const grupoAtual = ativosItens[0]?.parcelaGrupoId || ""
  const grupoId = varias ? grupoAtual || crypto.randomUUID() : undefined

  const desejados: FinanceiroLancamentoInput[] = plano.lancamentos.map((parcela) => ({
    tipo: "receita",
    status: "programado",
    origem: "servico",
    descricao: descricaoParcela(input.descricao, parcela.numero, parcela.total),
    categoriaId: input.categoriaId,
    categoria: input.categoria,
    valor: parcela.valor,
    dataCompetencia: input.dataCompetencia,
    dataVencimento: parcela.dataVencimento,
    clienteId: input.clienteId,
    contratoId: input.contratoId,
    servicoId: input.servicoId,
    formaPagamento: input.formaPagamento,
    cartaoParcelas: plano.cartaoParcelas ?? undefined,
    documentoTipo: input.documentoTipo,
    notificacaoEmail: input.notificacaoEmail,
    notificacaoWhatsapp: input.notificacaoWhatsapp,
    observacoes: input.observacoes,
    parcelaGrupoId: grupoId,
    parcelaNumero: grupoId ? parcela.numero : undefined,
    parcelaTotal: grupoId ? parcela.total : undefined,
  }))

  // Mesmo plano (quantidade, valores, vencimentos, forma): atualiza so os textos, mantendo os ids.
  const mesmaEstrutura =
    ativosItens.length === desejados.length &&
    desejados.every((d) => {
      const atual = ativosItens.find((l) => (l.parcelaNumero ?? 1) === (d.parcelaNumero ?? 1))
      return (
        atual &&
        Math.round(atual.valor * 100) === Math.round(d.valor * 100) &&
        atual.dataVencimento === d.dataVencimento &&
        (atual.formaPagamento || "") === (d.formaPagamento || "") &&
        (atual.cartaoParcelas ?? null) === (d.cartaoParcelas ?? null) &&
        (atual.parcelaTotal ?? null) === (d.parcelaTotal ?? null)
      )
    })

  if (mesmaEstrutura) {
    const atualizados: FinanceiroLancamentoItem[] = []
    for (const d of desejados) {
      const atual = ativosItens.find((l) => (l.parcelaNumero ?? 1) === (d.parcelaNumero ?? 1))!
      atualizados.push(await upsertFinanceiroLancamentoSupabase({ ...d, id: atual.id, parcelaGrupoId: atual.parcelaGrupoId || undefined }))
    }
    return { lancamentos: atualizados, alterado: false, bloqueado: false }
  }

  // Lancamento unico continua unico: atualiza o mesmo registro.
  if (ativosItens.length === 1 && desejados.length === 1 && !ativosItens[0].parcelaGrupoId) {
    const salvo = await upsertFinanceiroLancamentoSupabase({ ...desejados[0], id: ativosItens[0].id })
    return { lancamentos: [salvo], alterado: true, bloqueado: false }
  }

  // Plano mudou: cancela as receitas programadas antigas e cria as novas.
  if (ativosItens.length > 0) {
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .update({ status: "cancelado", observacoes: "Substituido por novo parcelamento da OS." })
      .in("id", ativosItens.map((l) => l.id))
      .eq("status", "programado")
    if (error) throw toError(error)
  }
  const novoGrupo = varias ? crypto.randomUUID() : undefined
  const novos = await criarLancamentosSupabase(desejados.map((d) => ({ ...d, parcelaGrupoId: novoGrupo })))
  return { lancamentos: novos, alterado: true, bloqueado: false }
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
    .eq("status", "programado")
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

/**
 * OS coberta pelo contrato nao gera receita propria. Se a OS ja teve cobranca
 * adicional e voltou para contrato, a receita ainda programada e cancelada.
 */
export async function cancelReceitaProgramadaServicoSupabase(servicoId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient()
  const { data: pendentes, error: listError } = await supabase
    .from("financeiro_lancamentos")
    .select("id")
    .eq("servico_id", servicoId)
    .eq("tipo", "receita")
    .eq("status", "programado")
    .is("deleted_at", null)

  if (listError) throw toError(listError)
  if (!pendentes?.length) return 0

  await cancelLancamentoServicoSupabase(servicoId, "OS coberta pelo contrato: cobranca adicional removida.")
  return pendentes.length
}

export async function cancelarLancamentoSupabase(id: string): Promise<FinanceiroLancamentoItem> {
  await assertPermissionSupabase("financeiro.edit", "Voce nao possui permissao para cancelar lancamentos.")

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("status", "programado")
    .select(LANCAMENTO_SELECT)
    .maybeSingle()

  if (error) throw toError(error)
  if (!data) throw new Error("Somente lancamentos programados podem ser cancelados.")
  const lancamento = mapDbToLancamento(data)

  await safeAuditLogSupabase({
    action: "cancel",
    entity: "financeiro_lancamento",
    entityId: lancamento.id,
    entityLabel: lancamento.descricao,
    description: "Lancamento financeiro cancelado.",
    metadata: { valor: lancamento.valor },
  })

  return lancamento
}

export async function isAprovadorFinanceiroSupabase(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("is_aprovador_financeiro")
  if (error) {
    console.warn("Nao foi possivel verificar o aprovador do financeiro:", error)
    return false
  }
  return data === true
}

export async function listFinanceiroBaixaSolicitacoesSupabase(options: {
  status?: FinanceiroBaixaSolicitacaoStatus | "decididas"
  limit?: number
} = {}): Promise<FinanceiroBaixaSolicitacaoItem[]> {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("financeiro_baixa_solicitacoes")
    .select(`*, financeiro_lancamentos(${LANCAMENTO_SELECT})`, { count: "exact" })

  if (options.status === "decididas") {
    query = query.neq("status", "pendente").order("decidido_em", { ascending: false, nullsFirst: false })
  } else {
    if (options.status) query = query.eq("status", options.status)
    query = query.order("solicitado_em", { ascending: true })
  }

  const pageSize = options.limit ?? 200
  const rows: FinanceiroBaixaSolicitacaoItem[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query.range(from, from + pageSize - 1)
    if (error) throw toError(error)
    const page = (data || []).map(mapDbToBaixaSolicitacao)
    rows.push(...page)
    if (page.length < pageSize) break
  }
  return rows
}

export async function solicitarBaixaLancamentoSupabase(input: {
  lancamentoId: string
  dataLiquidacao: string
  formaPagamento?: string
  observacoes?: string
  /** Taxa mostrada na tela; o banco recusa se a vigente for outra. */
  taxaEsperada?: number | null
  /** Parcelas da venda no credito (define a taxa). */
  cartaoParcelas?: number | null
}): Promise<string> {
  await assertPermissionSupabase("financeiro.edit", "Voce nao possui permissao para solicitar baixas.")

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("financeiro_solicitar_baixa", {
    p_lancamento_id: input.lancamentoId,
    p_data_liquidacao: input.dataLiquidacao,
    p_forma_pagamento: input.formaPagamento || null,
    p_observacoes: input.observacoes || null,
    p_taxa_esperada: input.taxaEsperada ?? null,
    p_cartao_parcelas: input.cartaoParcelas ?? null,
  })
  if (error) throw toError(error)

  await safeAuditLogSupabase({
    action: "request",
    entity: "financeiro_baixa",
    entityId: String(data),
    entityLabel: input.lancamentoId,
    description: "Baixa de lancamento solicitada.",
    metadata: { lancamentoId: input.lancamentoId, dataLiquidacao: input.dataLiquidacao },
  })

  return String(data)
}

export async function decidirBaixaSolicitacaoSupabase(input: {
  solicitacaoId: string
  aprovar: boolean
  motivo?: string
}): Promise<FinanceiroBaixaSolicitacaoStatus> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("financeiro_decidir_baixa", {
    p_solicitacao_id: input.solicitacaoId,
    p_aprovar: input.aprovar,
    p_motivo: input.motivo || null,
  })
  if (error) throw toError(error)

  await safeAuditLogSupabase({
    action: input.aprovar ? "approve" : "reject",
    entity: "financeiro_baixa",
    entityId: input.solicitacaoId,
    entityLabel: input.solicitacaoId,
    description: input.aprovar ? "Baixa aprovada." : "Baixa rejeitada.",
    metadata: { motivo: input.motivo || "" },
  })

  return data as FinanceiroBaixaSolicitacaoStatus
}

export async function cancelarSolicitacaoBaixaSupabase(solicitacaoId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.rpc("financeiro_cancelar_solicitacao_baixa", { p_solicitacao_id: solicitacaoId })
  if (error) throw toError(error)

  await safeAuditLogSupabase({
    action: "cancel",
    entity: "financeiro_baixa",
    entityId: solicitacaoId,
    entityLabel: solicitacaoId,
    description: "Solicitacao de baixa cancelada.",
  })
}

// ---------------------------------------------------------------------------
// Fase 2: taxas de cartao, forma de pagamento e parcelas
// ---------------------------------------------------------------------------

export async function listTaxasCartaoSupabase(): Promise<FinanceiroTaxaCartaoItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("financeiro_taxas_cartao")
    .select("id, modalidade, parcelas, percentual, vigente_desde, definido_por_nome")
    .order("vigente_desde", { ascending: false })
    .limit(500)

  if (error) throw toError(error)
  return (data || []).map((row: any) => ({
    id: String(row.id),
    modalidade: row.modalidade,
    parcelas: asNumber(row.parcelas) || 1,
    percentual: asNumber(row.percentual),
    vigenteDesde: row.vigente_desde || "",
    definidoPorNome: row.definido_por_nome || "",
  }))
}

/**
 * Taxa vigente por chave `modalidade:parcelas` (a mais recente do historico).
 * Combinacao ausente = nao configurada (o banco recusa a baixa).
 */
export function taxasVigentes(historico: FinanceiroTaxaCartaoItem[]): Record<string, number> {
  const vigentes: Record<string, { percentual: number; vigenteDesde: string }> = {}
  for (const item of historico) {
    const chave = `${item.modalidade}:${item.parcelas}`
    const atual = vigentes[chave]
    if (!atual || item.vigenteDesde > atual.vigenteDesde) vigentes[chave] = { percentual: item.percentual, vigenteDesde: item.vigenteDesde }
  }
  return Object.fromEntries(Object.entries(vigentes).map(([chave, v]) => [chave, v.percentual]))
}

export async function definirTaxaCartaoSupabase(
  modalidade: FinanceiroTaxaCartaoModalidade,
  percentual: number,
  parcelas = 1,
): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.rpc("financeiro_definir_taxa_cartao", {
    p_modalidade: modalidade,
    p_percentual: percentual,
    p_parcelas: modalidade === "cartao_debito" ? 1 : parcelas,
  })
  if (error) throw toError(error)

  await safeAuditLogSupabase({
    action: "update",
    entity: "financeiro_taxa_cartao",
    entityLabel: `${modalidade}:${parcelas}`,
    description: `Taxa de ${modalidade === "cartao_credito" ? `credito ${parcelas}x` : "debito"} alterada para ${percentual}%.`,
    metadata: { modalidade, parcelas, percentual },
  })
}

export async function atualizarFormaPagamentoLancamentoSupabase(id: string, formaPagamento: string): Promise<FinanceiroLancamentoItem> {
  await assertPermissionSupabase("financeiro.edit", "Voce nao possui permissao para editar lancamentos.")

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .update({ forma_pagamento: formaPagamento || null })
    .eq("id", id)
    .eq("status", "programado")
    .select(LANCAMENTO_SELECT)
    .maybeSingle()

  if (error) throw toError(error)
  if (!data) throw new Error("Somente lancamentos programados podem ter a forma de pagamento alterada.")
  const lancamento = mapDbToLancamento(data)

  await safeAuditLogSupabase({
    action: "update",
    entity: "financeiro_lancamento",
    entityId: lancamento.id,
    entityLabel: lancamento.descricao,
    description: "Forma de pagamento alterada.",
    metadata: { formaPagamento },
  })

  return lancamento
}

/**
 * Cria varios lancamentos (ex.: parcelas) numa unica insercao: ou todos sao
 * gravados, ou nenhum.
 */
export async function criarLancamentosSupabase(inputs: FinanceiroLancamentoInput[]): Promise<FinanceiroLancamentoItem[]> {
  if (inputs.length === 0) return []
  await assertPermissionSupabase("financeiro.create", "Voce nao possui permissao para salvar lancamentos financeiros.")

  const supabase = getSupabaseBrowserClient()
  const rows = inputs.map((input) => {
    const { id: _ignored, ...row } = mapLancamentoToDb({ ...input, id: undefined })
    return row
  })
  const { data, error } = await supabase.from("financeiro_lancamentos").insert(rows).select(LANCAMENTO_SELECT)
  if (error) throw toError(error)

  const lancamentos = (data || []).map(mapDbToLancamento)
  lancamentos.sort((a, b) => (a.parcelaNumero ?? 0) - (b.parcelaNumero ?? 0))

  await safeAuditLogSupabase({
    action: "create",
    entity: "financeiro_lancamento",
    entityId: lancamentos[0]?.parcelaGrupoId || lancamentos[0]?.id,
    entityLabel: inputs[0]?.descricao || "",
    description: lancamentos.length > 1 ? `${lancamentos.length} parcelas criadas.` : "Lancamento financeiro criado.",
    metadata: { quantidade: lancamentos.length, total: lancamentos.reduce((s, l) => s + l.valor, 0) },
  })

  return lancamentos
}

export type ResultadoImportacaoDespesas = {
  criadas: number
  categoriasCriadas: FinanceiroCategoriaItem[]
}

/**
 * Importa despesas de planilha ja revisada: entram direto como "realizado", na
 * data de pagamento da planilha. Quem importa precisa ser o aprovador do
 * financeiro (a funcao financeiro_importar_despesas confere no banco); a
 * importacao equivale a aprovacao das baixas.
 */
export async function importarDespesasSupabase(input: {
  linhas: LinhaDespesaImportada[]
  categorias: FinanceiroCategoriaItem[]
  arquivo: string
  onProgresso?: (etapa: string) => void
}): Promise<ResultadoImportacaoDespesas> {
  await assertPermissionSupabase("financeiro.create", "Voce nao possui permissao para importar despesas.")
  if (input.linhas.length === 0) return { criadas: 0, categoriasCriadas: [] }

  // 1) Categorias de despesa: usa a existente (ignora acento/maiuscula) ou cria.
  const porNome = new Map<string, FinanceiroCategoriaItem>()
  for (const categoria of input.categorias) {
    if (categoria.tipo === "despesa") porNome.set(normalizarTexto(categoria.nome), categoria)
  }
  const categoriasCriadas: FinanceiroCategoriaItem[] = []
  for (const linha of input.linhas) {
    const chave = normalizarTexto(linha.categoria)
    if (porNome.has(chave)) continue
    input.onProgresso?.(`Criando categoria ${linha.categoria}...`)
    const criada = await upsertFinanceiroCategoriaSupabase({
      nome: linha.categoria,
      tipo: "despesa",
      descricao: "Criada na importacao de despesas",
      ativo: true,
    })
    porNome.set(chave, criada)
    categoriasCriadas.push(criada)
  }

  // 2) Todas as despesas numa unica chamada (tudo-ou-nada).
  input.onProgresso?.(`Gravando ${input.linhas.length} despesas...`)
  const payload = input.linhas.map((linha) => {
    const categoria = porNome.get(normalizarTexto(linha.categoria))
    return {
      descricao: linha.descricao,
      categoria_id: categoria?.id ?? null,
      categoria: categoria?.nome || linha.categoria,
      valor: linha.valor,
      data: linha.dataPagamento,
      forma_pagamento: linha.formaPagamento || null,
      observacoes: [
        `Importado da planilha "${input.arquivo}" (linha ${linha.linhaPlanilha}).`,
        linha.recebedor ? `Quem recebeu: ${linha.recebedor}.` : "",
      ].filter(Boolean).join(" "),
    }
  })

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("financeiro_importar_despesas", { p_linhas: payload })
  if (error) throw toError(error)
  const criadas = Number(data) || 0

  await safeAuditLogSupabase({
    action: "create",
    entity: "financeiro_lancamento",
    entityId: input.arquivo,
    entityLabel: input.arquivo,
    description: `${criadas} despesas importadas da planilha ja baixadas.`,
    metadata: {
      quantidade: criadas,
      total: input.linhas.reduce((soma, l) => soma + l.valor, 0),
      categoriasCriadas: categoriasCriadas.map((c) => c.nome),
    },
  })

  return { criadas, categoriasCriadas }
}

export async function criarDocumentosSupabase(inputs: FinanceiroDocumentoInput[]): Promise<FinanceiroDocumentoItem[]> {
  if (inputs.length === 0) return []
  await assertPermissionSupabase("financeiro.create", "Voce nao possui permissao para salvar documentos financeiros.")

  const supabase = getSupabaseBrowserClient()
  const rows = inputs.map((input) => {
    const { id: _ignored, ...row } = mapDocumentoToDb({ ...input, id: undefined })
    return row
  })
  const { data, error } = await supabase.from("financeiro_documentos").insert(rows).select(DOCUMENTO_SELECT)
  if (error) throw toError(error)
  return (data || []).map(mapDbToDocumento)
}

/** Registra o resultado do envio do boleto para a integracao (n8n). Nao lanca erro. */
export async function registrarIntegracaoDocumentoSupabase(id: string, status: FinanceiroApiIntegracaoStatus, referencia?: string): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from("financeiro_documentos")
      .update({ api_integracao_status: status, api_integracao_referencia: referencia || null })
      .eq("id", id)
    if (error) console.warn("Nao foi possivel registrar o status da integracao do boleto:", error)
  } catch (err) {
    console.warn("Nao foi possivel registrar o status da integracao do boleto:", err)
  }
}

/** Registra o resultado do envio do boleto de um lancamento (fluxo de caixa). Nao lanca erro. */
export async function registrarIntegracaoLancamentoSupabase(id: string, status: FinanceiroApiIntegracaoStatus): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from("financeiro_lancamentos").update({ api_integracao_status: status }).eq("id", id)
    if (error) console.warn("Nao foi possivel registrar o status da integracao do boleto:", error)
  } catch (err) {
    console.warn("Nao foi possivel registrar o status da integracao do boleto:", err)
  }
}

// ---------------------------------------------------------------------------
// Fase 3: periodo, consultas paginadas e agregacoes no banco
// ---------------------------------------------------------------------------

export type FiltrosLancamentos = {
  dataInicio?: string
  dataFim?: string
  tipo?: FinanceiroLancamentoTipo | ""
  status?: FinanceiroLancamentoStatus | ""
  origem?: string
  categoriaId?: string
  busca?: string
}

export type TotaisLancamentos = {
  entradasRealizadas: number
  saidasRealizadas: number
  entradasProgramadas: number
  saidasProgramadas: number
  quantidade: number
  quantidadeEntradasRealizadas: number
  quantidadeSaidasRealizadas: number
}

function filtrosParaRpc(filtros: FiltrosLancamentos) {
  return {
    p_inicio: filtros.dataInicio || null,
    p_fim: filtros.dataFim || null,
    p_tipo: filtros.tipo || null,
    p_status: filtros.status || null,
    p_origem: filtros.origem || null,
    p_categoria_id: filtros.categoriaId || null,
    p_busca: filtros.busca?.trim() || null,
  }
}

/** Uma pagina de lancamentos filtrados, mais recentes primeiro. */
export async function buscarLancamentosPaginaSupabase(
  filtros: FiltrosLancamentos,
  pagina: number,
  tamanhoPagina: number,
): Promise<{ data: FinanceiroLancamentoItem[]; count: number }> {
  const supabase = getSupabaseBrowserClient()
  const inicio = (Math.max(1, pagina) - 1) * tamanhoPagina
  const { data, error, count } = await supabase
    .rpc("financeiro_lancamentos_filtrados", filtrosParaRpc(filtros), { count: "exact" })
    .select(LANCAMENTO_SELECT)
    .order("data_referencia", { ascending: false })
    .order("id", { ascending: true })
    .range(inicio, inicio + tamanhoPagina - 1)

  if (error) throw toError(error)
  return { data: (data || []).map(mapDbToLancamento), count: count ?? 0 }
}

/** Todos os lancamentos do filtro, em lotes (sem limite fixo). Usado na exportacao. */
export async function listarTodosLancamentosSupabase(
  filtros: FiltrosLancamentos,
  onProgresso?: (carregados: number, total: number) => void,
): Promise<FinanceiroLancamentoItem[]> {
  const LOTE = 1000
  const todos: FinanceiroLancamentoItem[] = []
  let pagina = 1
  let total = Infinity
  while (todos.length < total) {
    const { data, count } = await buscarLancamentosPaginaSupabase(filtros, pagina, LOTE)
    total = count
    todos.push(...data)
    onProgresso?.(todos.length, total)
    if (data.length < LOTE) break
    pagina += 1
  }
  return todos
}

export async function totaisLancamentosSupabase(filtros: FiltrosLancamentos): Promise<TotaisLancamentos> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("financeiro_totais_filtrados", filtrosParaRpc(filtros))
  if (error) throw toError(error)

  const totais: TotaisLancamentos = {
    entradasRealizadas: 0,
    saidasRealizadas: 0,
    entradasProgramadas: 0,
    saidasProgramadas: 0,
    quantidade: 0,
    quantidadeEntradasRealizadas: 0,
    quantidadeSaidasRealizadas: 0,
  }
  for (const row of (data || []) as any[]) {
    const total = asNumber(row.total)
    const quantidade = asNumber(row.quantidade)
    const entrada = row.tipo === "receita"
    totais.quantidade += quantidade
    if (row.status === "realizado") {
      if (entrada) { totais.entradasRealizadas += total; totais.quantidadeEntradasRealizadas += quantidade }
      else { totais.saidasRealizadas += total; totais.quantidadeSaidasRealizadas += quantidade }
    } else if (row.status === "programado") {
      if (entrada) totais.entradasProgramadas += total
      else totais.saidasProgramadas += total
    }
  }
  return totais
}

export type ResumoPeriodoLinha = { periodo: string; tipo: FinanceiroLancamentoTipo; status: FinanceiroLancamentoStatus; total: number; quantidade: number }
export type ResumoCategoriaLinha = { tipo: FinanceiroLancamentoTipo; categoria: string; total: number }

export async function resumoPeriodoSupabase(inicio: string, fim: string, agrupamento: "mes" | "dia"): Promise<ResumoPeriodoLinha[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("financeiro_resumo_periodo", { p_inicio: inicio, p_fim: fim, p_agrupamento: agrupamento })
  if (error) throw toError(error)
  return ((data || []) as any[]).map((row) => ({
    periodo: String(row.periodo),
    tipo: row.tipo,
    status: row.status,
    total: asNumber(row.total),
    quantidade: asNumber(row.quantidade),
  }))
}

export async function resumoCategoriasSupabase(inicio: string, fim: string): Promise<ResumoCategoriaLinha[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("financeiro_resumo_categorias", { p_inicio: inicio, p_fim: fim })
  if (error) throw toError(error)
  return ((data || []) as any[]).map((row) => ({ tipo: row.tipo, categoria: String(row.categoria), total: asNumber(row.total) }))
}

export async function listProximosVencimentosSupabase(limite = 8): Promise<FinanceiroLancamentoItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select(LANCAMENTO_SELECT)
    .is("deleted_at", null)
    .eq("status", "programado")
    .order("data_vencimento", { ascending: true })
    .limit(limite)
  if (error) throw toError(error)
  return (data || []).map(mapDbToLancamento)
}

export async function getLancamentoSupabase(id: string): Promise<FinanceiroLancamentoItem | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("financeiro_lancamentos").select(LANCAMENTO_SELECT).eq("id", id).maybeSingle()
  if (error) throw toError(error)
  return data ? mapDbToLancamento(data) : null
}
