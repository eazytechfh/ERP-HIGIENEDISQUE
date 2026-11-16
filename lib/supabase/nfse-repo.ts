"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"

export type NfseConfig = {
  municipalServiceId: string
  municipalServiceCode: string
  municipalServiceName: string
  descricaoPadrao: string
  observacoesPadrao: string
  issAliquota: number
  issRetido: boolean
  inssAliquota: number
  irAliquota: number
  pisAliquota: number
  cofinsAliquota: number
  csllAliquota: number
  atualizadoPorNome: string
  updatedAt: string
}

export type NotaFiscalItem = {
  id: string
  chave: string
  clienteId: string
  clienteNome: string
  servicoId: string
  servicoNumero: string
  descricao: string
  valor: number
  deducoes: number
  valorIss: number
  valorInss: number
  valorIr: number
  valorLiquidoReceber: number
  issRetido: boolean
  numero: string
  codigoVerificacao: string
  pdfUrl: string
  xmlUrl: string
  status: "pendente" | "emitido" | "cancelado"
  asaasStatus: string
  asaasStatusDescricao: string
  asaasInvoiceId: string
  erroMotivo: string
  emissaoModo: string
  dataEfetiva: string
  createdAt: string
}

export type ServicoParaNfse = {
  id: string
  osNumber: string
  clienteId: string
  clienteNome: string
  servico: string
  data: string
  valorCobranca: number
}

export type EmitirNfseInput = {
  chave: string
  servicoId?: string
  clienteId: string
  categoriaId?: string
  descricao: string
  observacoes?: string
  valor: number
  deducoes: number
  issRetido: boolean
  issAliquota: number
  inssAliquota: number
  irAliquota: number
  modo: "agora" | "agendar"
  dataAgendada?: string
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0)

function mapConfig(row: any): NfseConfig {
  return {
    municipalServiceId: row?.municipal_service_id || "",
    municipalServiceCode: row?.municipal_service_code || "",
    municipalServiceName: row?.municipal_service_name || "",
    descricaoPadrao: row?.descricao_padrao || "",
    observacoesPadrao: row?.observacoes_padrao || "",
    issAliquota: num(row?.iss_aliquota),
    issRetido: Boolean(row?.iss_retido),
    inssAliquota: num(row?.inss_aliquota),
    irAliquota: num(row?.ir_aliquota),
    pisAliquota: num(row?.pis_aliquota),
    cofinsAliquota: num(row?.cofins_aliquota),
    csllAliquota: num(row?.csll_aliquota),
    atualizadoPorNome: row?.atualizado_por_nome || "",
    updatedAt: row?.updated_at || "",
  }
}

function mapNota(row: any): NotaFiscalItem {
  return {
    id: String(row.id),
    chave: String(row.external_reference || "").replace(/^erp-nfse-/, ""),
    clienteId: row.cliente_id ? String(row.cliente_id) : "",
    clienteNome: row.clientes?.nome || "",
    servicoId: row.servico_id ? String(row.servico_id) : "",
    servicoNumero: row.servicos?.os_number || "",
    descricao: row.descricao || "",
    valor: num(row.valor),
    deducoes: num(row.deducoes),
    valorIss: num(row.valor_iss),
    valorInss: num(row.valor_inss),
    valorIr: num(row.valor_ir),
    valorLiquidoReceber: num(row.valor_liquido_receber ?? row.valor),
    issRetido: Boolean(row.iss_retido),
    numero: row.numero || "",
    codigoVerificacao: row.codigo_verificacao || "",
    pdfUrl: row.pdf_url || "",
    xmlUrl: row.xml_url || "",
    status: row.status || "pendente",
    asaasStatus: row.asaas_status || "",
    asaasStatusDescricao: row.asaas_status_descricao || "",
    asaasInvoiceId: row.asaas_invoice_id || "",
    erroMotivo: row.erro_motivo || "",
    emissaoModo: row.emissao_modo || "",
    dataEfetiva: row.data_efetiva || row.data_emissao || "",
    createdAt: row.created_at || "",
  }
}

const NOTA_SELECT = "*, clientes(nome), servicos(os_number)"

export async function getNfseConfigSupabase(): Promise<NfseConfig> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("financeiro_nfse_config").select("*").eq("id", 1).maybeSingle()
  if (error) throw new Error(error.message)
  return mapConfig(data)
}

export async function salvarNfseConfigSupabase(config: NfseConfig): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.rpc("financeiro_salvar_nfse_config", {
    p_config: {
      municipal_service_id: config.municipalServiceId,
      municipal_service_code: config.municipalServiceCode,
      municipal_service_name: config.municipalServiceName,
      descricao_padrao: config.descricaoPadrao,
      observacoes_padrao: config.observacoesPadrao,
      iss_aliquota: config.issAliquota,
      iss_retido: config.issRetido,
      inss_aliquota: config.inssAliquota,
      ir_aliquota: config.irAliquota,
      pis_aliquota: config.pisAliquota,
      cofins_aliquota: config.cofinsAliquota,
      csll_aliquota: config.csllAliquota,
    },
  })
  if (error) throw new Error(error.message)
  await safeAuditLogSupabase({
    action: "update",
    entity: "financeiro_nfse_config",
    entityLabel: "Configuracao NFS-e",
    description: "Configuracao fiscal da NFS-e alterada.",
  })
}

export async function listNotasFiscaisSupabase(limite = 100): Promise<NotaFiscalItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("financeiro_documentos")
    .select(NOTA_SELECT)
    .eq("tipo", "nota_fiscal")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limite)
  if (error) throw new Error(error.message)
  return (data || []).map(mapNota)
}

export async function buscarServicosParaNfseSupabase(termo: string): Promise<ServicoParaNfse[]> {
  const supabase = getSupabaseBrowserClient()
  const t = termo.trim().replace(/[%,()]/g, " ")
  let query = supabase
    .from("servicos")
    .select("id, os_number, cliente_id, cliente, servico, data, valor_cobranca")
    .is("deleted_at", null)
    .order("data", { ascending: false })
    .limit(10)
  if (t) query = query.or(`os_number.ilike.%${t}%,cliente.ilike.%${t}%`)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []).map((row: any) => ({
    id: String(row.id),
    osNumber: row.os_number || "",
    clienteId: row.cliente_id ? String(row.cliente_id) : "",
    clienteNome: row.cliente || "",
    servico: row.servico || "",
    data: row.data || "",
    valorCobranca: num(row.valor_cobranca),
  }))
}

async function chamarRota<T>(caminho: string, corpo: unknown): Promise<T> {
  const supabase = getSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Sessao expirada. Entre novamente.")
  const response = await fetch(caminho, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    const erro = new Error(json?.error || `Erro ${response.status}`) as Error & { documentoId?: string }
    erro.documentoId = json?.documentoId
    throw erro
  }
  return json as T
}

export async function emitirNfseSupabase(input: EmitirNfseInput): Promise<NotaFiscalItem> {
  const { documento } = await chamarRota<{ documento: any }>("/api/financeiro/nfse/emitir", input)
  return mapNota(documento)
}

export async function sincronizarNfseSupabase(documentoId: string): Promise<{ nota: NotaFiscalItem; aviso: string }> {
  const { documento, aviso } = await chamarRota<{ documento: any; aviso?: string }>("/api/financeiro/nfse/sincronizar", { documentoId })
  return { nota: mapNota(documento), aviso: aviso || "" }
}

export type ContaAsaasFiscal = {
  ambiente: "sandbox" | "producao"
  simplesNacional: boolean
  portalNacional: boolean
  certificadoEnviado: boolean
  cnae: string
  itemListaServico: string
  nbsCodigo: string
  nbsDescricao: string
}

export async function getContaAsaasFiscalSupabase(): Promise<ContaAsaasFiscal> {
  return chamarRota<ContaAsaasFiscal>("/api/financeiro/nfse/conta", {})
}
