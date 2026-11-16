"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { differenceInDays, format } from "date-fns"
import {
  Settings,
  AlertCircle,
  ArrowLeftRight,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  List,
  PlusCircle,
  Pencil,
  Loader2,
  Receipt,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  Wallet,
  X,
} from "lucide-react"

import { ErpHeader } from "@/components/erp-header"
import { useAccess } from "@/components/access-provider"
import { AprovacoesSection, SolicitarBaixaDialog, formaPagamentoLabel, type SolicitarBaixaPayload } from "@/components/financeiro/aprovacoes-baixa"
import { AlterarFormaPagamentoDialog, TaxasCartaoSection, formatPercent } from "@/components/financeiro/taxas-cartao"
import { DashboardFinanceiro } from "@/components/financeiro/dashboard-financeiro"
import { LancamentosExplorer } from "@/components/financeiro/lancamentos-explorer"
import { NfseConfigSection, NfseSection } from "@/components/financeiro/nfse"
import { MAX_PARCELAS, MAX_PARCELAS_CARTAO, descricaoParcela, isFormaCartao, isModalidadeCartao, planejarCobranca, rotuloTaxaCartao, planejarParcelas, type ParcelaPlanejada } from "@/lib/financeiro-calculos"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { listClientesSupabase, type ClienteInput } from "@/lib/supabase/clientes-repo"
import { listContratosSupabase, type ContratoSupabaseItem } from "@/lib/supabase/contratos-repo"
import {
  atualizarFormaPagamentoLancamentoSupabase,
  criarDocumentosSupabase,
  criarLancamentosSupabase,
  definirTaxaCartaoSupabase,
  listTaxasCartaoSupabase,
  registrarIntegracaoDocumentoSupabase,
  registrarIntegracaoLancamentoSupabase,
  taxasVigentes,
  type FinanceiroTaxaCartaoItem,
  type FinanceiroTaxaCartaoModalidade,
  cancelarLancamentoSupabase,
  cancelarSolicitacaoBaixaSupabase,
  decidirBaixaSolicitacaoSupabase,
  isAprovadorFinanceiroSupabase,
  listFinanceiroBaixaSolicitacoesSupabase,
  solicitarBaixaLancamentoSupabase,
  type FinanceiroBaixaSolicitacaoItem,
  deleteFinanceiroCategoriaSupabase,
  deleteFinanceiroDocumentoSupabase,
  deleteFinanceiroLancamentoSupabase,
  listFinanceiroCategoriasSupabase,
  listFinanceiroDocumentosSupabase,
  listProximosVencimentosSupabase,
  totaisLancamentosSupabase,
  type TotaisLancamentos,
  type FinanceiroCategoriaInput,
  type FinanceiroCategoriaItem,
  type FinanceiroDocumentoInput,
  type FinanceiroDocumentoItem,
  type FinanceiroDocumentoTipo,
  type FinanceiroLancamentoInput,
  type FinanceiroLancamentoItem,
  type FinanceiroLancamentoTipo,
  upsertFinanceiroCategoriaSupabase,
  upsertFinanceiroDocumentoSupabase,
  upsertFinanceiroLancamentoSupabase,
} from "@/lib/supabase/financeiro-repo"
import { listFornecedoresSupabase, type FornecedorSupabaseItem } from "@/lib/supabase/estoque-repo"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"

type AbaFinanceira = "dashboard" | "aprovacoes" | "boleto" | "nf" | "nfse_config" | "relatorios" | "fluxo" | "categorias" | "taxas"

type DocumentoEmitirForm = {
  clienteId: string
  contratoId: string
  descricao: string
  numero: string
  serie: string
  chaveDocumento: string
  linhaDigitavel: string
  dataEmissao: string
  dataVencimento: string
  valorServico: string
  categoriaId: string
  notificacaoEmail: boolean
  notificacaoWhatsapp: boolean
  observacoes: string
  quantidadeParcelas: string
}

type FluxoForm = {
  tipo: FinanceiroLancamentoTipo
  descricao: string
  categoriaId: string
  clienteId: string
  fornecedorId: string
  valor: string
  dataCompetencia: string
  dataVencimento: string
  formaPagamento: string
  documentoTipo: string
  documentoNumero: string
  notificacaoEmail: boolean
  notificacaoWhatsapp: boolean
  observacoes: string
  quantidadeParcelas: string
}

const CHART_COLORS = ["#16a34a", "#22c55e", "#dc2626", "#f97316", "#2563eb", "#7c3aed"]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)
}

function formatDate(value: string) {
  if (!value) return "-"
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("pt-BR")
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; details?: unknown }
    if (typeof maybeError.message === "string") return maybeError.message
    if (typeof maybeError.details === "string") return maybeError.details
  }
  return "Ocorreu um erro inesperado."
}

function toNumber(value: string) {
  const s = String(value || "0").replace(/[^\d,.-]/g, "")
  // Formato BR (vírgula = decimal, ponto = milhar): "2.000,50" → 2000.5
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", ".")) || 0
  return Number(s) || 0
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function buildDocumentoInitialForm(): DocumentoEmitirForm {
  const today = todayIso()
  return {
    clienteId: "",
    contratoId: "",
    descricao: "",
    numero: "",
    serie: "",
    chaveDocumento: "",
    linhaDigitavel: "",
    dataEmissao: today,
    dataVencimento: today,
    valorServico: "",
    categoriaId: "",
    notificacaoEmail: false,
    notificacaoWhatsapp: false,
    observacoes: "",
    quantidadeParcelas: "1",
  }
}

function buildFluxoInitialForm(): FluxoForm {
  const today = todayIso()
  return {
    tipo: "receita",
    descricao: "",
    categoriaId: "",
    clienteId: "",
    fornecedorId: "",
    valor: "",
    dataCompetencia: today,
    dataVencimento: today,
    formaPagamento: "",
    documentoTipo: "",
    documentoNumero: "",
    notificacaoEmail: false,
    notificacaoWhatsapp: false,
    observacoes: "",
    quantidadeParcelas: "1",
  }
}

const BOLETO_WEBHOOK_URL = "https://eazytech-n8n.gsl3ku.easypanel.host/webhook/d2af06ee-ccc9-449d-bb2c-feb6fe8de0d4"

/** Envia uma cobranca (parcela) para a integracao de boleto. Retorna se o envio foi aceito. */
async function enviarBoletoWebhook(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch(BOLETO_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "boleto", ...payload, geradoEm: new Date().toISOString() }),
    })
    return response.ok
  } catch (error) {
    console.warn("Webhook boleto falhou (dados salvos no banco):", error)
    return false
  }
}

function parseQuantidadeParcelas(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

/** Previa das parcelas; devolve erro em vez de lancar. */
function previaParcelas(total: number, quantidadeTexto: string, primeiroVencimento: string): { parcelas: ParcelaPlanejada[]; erro: string } {
  const quantidade = parseQuantidadeParcelas(quantidadeTexto)
  if (!total || !primeiroVencimento) return { parcelas: [], erro: "" }
  try {
    return { parcelas: planejarParcelas({ total, quantidade, primeiroVencimento }), erro: "" }
  } catch (error) {
    return { parcelas: [], erro: error instanceof Error ? error.message : "Parcelamento invalido." }
  }
}

/** Previa pela regra geral: cartao = lancamento unico; demais formas = 1 lancamento por parcela. */
function previaCobranca(total: number, quantidadeTexto: string, primeiroVencimento: string, formaPagamento: string): {
  parcelas: ParcelaPlanejada[]
  cartaoParcelas: number | null
  erro: string
} {
  const quantidade = parseQuantidadeParcelas(quantidadeTexto)
  if (!total || !primeiroVencimento) return { parcelas: [], cartaoParcelas: null, erro: "" }
  try {
    const plano = planejarCobranca({ total, quantidade, primeiroVencimento, formaPagamento })
    return { parcelas: plano.lancamentos, cartaoParcelas: plano.cartaoParcelas, erro: "" }
  } catch (error) {
    return { parcelas: [], cartaoParcelas: null, erro: error instanceof Error ? error.message : "Parcelamento invalido." }
  }
}

function ParcelasPreview({ parcelas, erro }: { parcelas: ParcelaPlanejada[]; erro: string }) {
  if (erro) return <p className="text-xs text-red-600">{erro}</p>
  if (parcelas.length <= 1) return null
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {parcelas.length} parcelas mensais · cada uma tem baixa e aprovacao proprias
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
        {parcelas.map((parcela) => (
          <div key={parcela.numero} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{parcela.numero}/{parcela.total} · {formatDate(parcela.dataVencimento)}</span>
            <span className="font-medium">{formatCurrency(parcela.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getContratoAtual(contratos: ContratoSupabaseItem[], clienteId: string) {
  const today = todayIso()
  return (
    contratos.find(
      (contrato) =>
        contrato.clienteId === clienteId &&
        contrato.status === "ativo" &&
        (!contrato.dataInicio || !contrato.dataTermino || (contrato.dataInicio <= today && contrato.dataTermino >= today)),
    ) || null
  )
}

function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === "receita") return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Receita</Badge>
  if (tipo === "despesa") return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Despesa</Badge>
  if (tipo === "investimento") return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Investimento</Badge>
  return <Badge variant="secondary">{tipo}</Badge>
}

function StatusBadge({ status }: { status: string }) {
  if (status === "realizado") return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100"><CheckCircle2 className="h-3 w-3 mr-1" />Realizado</Badge>
  if (status === "programado") return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"><Clock className="h-3 w-3 mr-1" />Programado</Badge>
  if (status === "cancelado") return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">Cancelado</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

function UrgenciaBadge({ dataVencimento }: { dataVencimento: string }) {
  if (!dataVencimento) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dataVencimento}T00:00:00`)
  const diff = differenceInDays(due, today)
  if (diff < 0) return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Vencido há {Math.abs(diff)}d</span>
  if (diff === 0) return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Vence hoje</span>
  if (diff <= 7) return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Em {diff}d</span>
  return <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">Em {diff}d</span>
}

type EmissaoSectionProps = {
  tipo: FinanceiroDocumentoTipo
  title: string
  description: string
  form: DocumentoEmitirForm
  setForm: React.Dispatch<React.SetStateAction<DocumentoEmitirForm>>
  clientes: ClienteInput[]
  contratos: ContratoSupabaseItem[]
  categorias: FinanceiroCategoriaItem[]
  documentos: FinanceiroDocumentoItem[]
  onEmitir: () => void
  onDelete: (id: string) => void
}

function EmissaoSection({
  tipo,
  title,
  description,
  form,
  setForm,
  clientes,
  contratos,
  categorias,
  documentos,
  onEmitir,
  onDelete,
}: EmissaoSectionProps) {
  const [clienteSearch, setClienteSearch] = useState("")
  const [clienteResults, setClienteResults] = useState<ClienteInput[]>([])
  const [clienteSearching, setClienteSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<{ id: string; nome: string } | null>(() => {
    if (!form.clienteId) return null
    const found = clientes.find((c) => String(c.id) === form.clienteId)
    return found ? { id: String(found.id), nome: found.nome } : null
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    const term = clienteSearch.trim()
    if (term.length < 2) {
      setClienteResults([])
      setShowDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      setClienteSearching(true)
      try {
        const result = await listClientesSupabase({ pageSize: 8, search: term })
        setClienteResults(result.data || [])
        setShowDropdown(true)
      } finally {
        setClienteSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [clienteSearch])

  const handleSelectCliente = (cliente: ClienteInput) => {
    const id = String(cliente.id)
    setSelectedCliente({ id, nome: cliente.nome })
    setClienteSearch("")
    setShowDropdown(false)
    setForm((prev) => ({
      ...prev,
      clienteId: id,
      contratoId: getContratoAtual(contratos, id)?.id || "",
    }))
  }

  const handleClearCliente = () => {
    setSelectedCliente(null)
    setForm((prev) => ({ ...prev, clienteId: "", contratoId: "" }))
  }

  const contratoAtual = getContratoAtual(contratos, form.clienteId)
  const contratosCliente = contratos.filter((contrato) => contrato.clienteId === form.clienteId && contrato.status === "ativo")

  useEffect(() => {
    if (!form.clienteId) return
    const contrato = getContratoAtual(contratos, form.clienteId)
    if (contrato && !form.contratoId) {
      setForm((prev) => ({ ...prev, contratoId: contrato.id }))
    }
  }, [contratos, form.clienteId, form.contratoId, setForm])

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          {tipo === "boleto" ? <Receipt className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{tipo === "boleto" ? "Dados do Boleto" : "Dados da Nota Fiscal"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2" ref={dropdownRef}>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</Label>
                {selectedCliente ? (
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-primary/5 border-primary/30">
                    <span className="flex-1 text-sm font-medium text-primary">{selectedCliente.nome}</span>
                    <button type="button" onClick={handleClearCliente} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                    <Input
                      className="pl-9 pr-9"
                      placeholder="Digite o nome do cliente..."
                      value={clienteSearch}
                      onChange={(e) => setClienteSearch(e.target.value)}
                      autoComplete="off"
                    />
                    {clienteSearching && (
                      <Loader2 className="h-4 w-4 absolute right-3 top-2.5 animate-spin text-muted-foreground" />
                    )}
                    {showDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                        {clienteResults.length > 0 ? clienteResults.map((cliente) => (
                          <button
                            key={String(cliente.id)}
                            type="button"
                            className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/60 flex flex-col border-b last:border-0"
                            onMouseDown={(e) => { e.preventDefault(); handleSelectCliente(cliente) }}
                          >
                            <span className="font-medium">{cliente.nome}</span>
                            <span className="text-xs text-muted-foreground">{cliente.email || cliente.telefone || ""}</span>
                          </button>
                        )) : (
                          <p className="px-3 py-2.5 text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contrato vinculado</Label>
                <Select
                  value={form.contratoId || "__none__"}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, contratoId: value === "__none__" ? "" : value }))}
                  disabled={!form.clienteId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem contrato</SelectItem>
                    {contratosCliente.map((contrato) => (
                      <SelectItem key={contrato.id} value={contrato.id}>
                        {contrato.numero} — {contrato.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contratoAtual ? (
                  <p className="text-xs text-muted-foreground">Contrato sugerido: {contratoAtual.numero}</p>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className={`grid grid-cols-1 gap-4 ${tipo === "boleto" ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emissao</Label>
                <Input type="date" value={form.dataEmissao} onChange={(e) => setForm((prev) => ({ ...prev, dataEmissao: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tipo === "boleto" && parseQuantidadeParcelas(form.quantidadeParcelas) > 1 ? "1º vencimento" : "Vencimento"}
                </Label>
                <Input type="date" value={form.dataVencimento} onChange={(e) => setForm((prev) => ({ ...prev, dataVencimento: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tipo === "boleto" && parseQuantidadeParcelas(form.quantidadeParcelas) > 1 ? "Valor total" : "Valor do servico"}
                </Label>
                <Input value={form.valorServico} onChange={(e) => setForm((prev) => ({ ...prev, valorServico: e.target.value }))} placeholder="0,00" />
              </div>
              {tipo === "boleto" ? (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parcelas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={MAX_PARCELAS}
                    value={form.quantidadeParcelas}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantidadeParcelas: e.target.value }))}
                  />
                </div>
              ) : null}
            </div>

            {tipo === "boleto" ? (
              <ParcelasPreview {...previaParcelas(toNumber(form.valorServico), form.quantidadeParcelas, form.dataVencimento)} />
            ) : null}

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descricao</Label>
              <Input value={form.descricao} onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))} placeholder="Descricao da cobranca" />
            </div>

            {tipo === "boleto" ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria financeira</Label>
                <Select
                  value={form.categoriaId || "__none__"}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, categoriaId: value === "__none__" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem categoria</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Numero da NF</Label>
                  <Input value={form.numero} onChange={(e) => setForm((prev) => ({ ...prev, numero: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serie</Label>
                  <Input value={form.serie} onChange={(e) => setForm((prev) => ({ ...prev, serie: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</Label>
                  <Select
                    value={form.categoriaId || "__none__"}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, categoriaId: value === "__none__" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem categoria</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {tipo === "nota_fiscal" ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chave da NF</Label>
                <Input value={form.chaveDocumento} onChange={(e) => setForm((prev) => ({ ...prev, chaveDocumento: e.target.value }))} />
              </div>
            ) : null}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <Checkbox checked={form.notificacaoEmail} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, notificacaoEmail: checked === true }))} />
                <span className="text-sm">Notificar por e-mail</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <Checkbox checked={form.notificacaoWhatsapp} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, notificacaoWhatsapp: checked === true }))} />
                <span className="text-sm">Notificar por WhatsApp</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observacoes</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))} rows={3} />
            </div>

            <Button className="w-full h-11 font-semibold" onClick={onEmitir}>
              {tipo === "boleto" ? "Gerar Boleto" : "Salvar emissao de NF"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">{tipo === "boleto" ? "Boletos registrados" : "Notas fiscais registradas"}</CardTitle>
            <CardDescription>{documentos.length} registro{documentos.length !== 1 ? "s" : ""}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Cliente</TableHead>
                  <TableHead>Numero</TableHead>
                  <TableHead>Descricao</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Notificacoes</TableHead>
                  <TableHead className="text-right pr-6">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  documentos.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20">
                      <TableCell className="pl-6 font-medium">{item.clienteNome || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.numero}
                        {item.parcelaTotal && item.parcelaTotal > 1 ? (
                          <span className="ml-2 font-sans text-xs text-muted-foreground">Parcela {item.parcelaNumero}/{item.parcelaTotal}</span>
                        ) : null}
                        {item.apiIntegracaoStatus === "erro" ? (
                          <span className="ml-2 font-sans text-xs text-red-600">envio falhou</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.descricao || item.lancamentoDescricao}</TableCell>
                      <TableCell>{item.contratoNumero || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatDate(item.dataVencimento)}</span>
                          <UrgenciaBadge dataVencimento={item.dataVencimento} />
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.valorServico || item.valor)}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {[item.notificacaoEmail ? "Email" : "", item.notificacaoWhatsapp ? "WhatsApp" : ""].filter(Boolean).join(" / ") || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

type FluxoCaixaSectionProps = {
  totaisGerais: TotaisLancamentos
  versao: number
  onErro: (mensagem: string) => void
  categorias: FinanceiroCategoriaItem[]
  clientes: ClienteInput[]
  fornecedores: FornecedorSupabaseItem[]
  fluxoForm: FluxoForm
  setFluxoForm: React.Dispatch<React.SetStateAction<FluxoForm>>
  categoriasFluxo: FinanceiroCategoriaItem[]
  lancamentosComBaixaPendente: Set<string>
  onAlterarForma: (item: FinanceiroLancamentoItem) => void
  onSalvar: () => void
  onExcluir: (id: string) => Promise<void>
  onDarBaixa: (item: FinanceiroLancamentoItem) => Promise<void>
  onCancelar: (item: FinanceiroLancamentoItem) => Promise<void>
}

function ClienteSearchInput({
  clientes,
  value,
  onChange,
}: {
  clientes: ClienteInput[]
  value: string
  onChange: (id: string) => void
}) {
  const selected = clientes.find((c) => String(c.id) === value)
  const [query, setQuery] = useState(selected?.nome ?? "")
  const [open, setOpen] = useState(false)

  // Sync display name when external value changes (e.g. form reset)
  useEffect(() => {
    setQuery(selected?.nome ?? "")
  }, [value, selected?.nome])

  const filtered = useMemo(() => {
    const unicos = clientes.filter(
      (c, idx, arr) => arr.findIndex((x) => String(x.id) === String(c.id)) === idx
    )
    const q = query.trim().toLowerCase()
    if (!q) return unicos
    return unicos.filter((c) =>
      [c.nome, c.cpf, c.cnpj, c.locais?.[0]?.endereco, c.locais?.[0]?.cidade].join(" ").toLowerCase().includes(q)
    )
  }, [clientes, query])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9 pr-8"
          placeholder="Buscar por nome, CPF ou endereço..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value) onChange("")
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            onClick={() => { onChange(""); setQuery(""); setOpen(false) }}
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
          ) : (
            filtered.map((c) => (
              <button
                key={String(c.id)}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex flex-col"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(String(c.id))
                  setQuery(c.nome)
                  setOpen(false)
                }}
              >
                <span className="font-medium">{c.nome}</span>
                {(c.cpf || c.cnpj || c.locais?.[0]?.cidade) && (
                  <span className="text-xs text-muted-foreground">
                    {[c.cpf || c.cnpj, c.locais?.[0]?.cidade].filter(Boolean).join(" · ")}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function OrigemBadge({ origem }: { origem: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    manual:     { label: "Manual",    cls: "bg-slate-100 text-slate-600 border-slate-200" },
    servico:    { label: "Servico",   cls: "bg-purple-100 text-purple-700 border-purple-200" },
    contrato:   { label: "Contrato",  cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    boleto:     { label: "Boleto",    cls: "bg-amber-100 text-amber-700 border-amber-200" },
    nota_fiscal:{ label: "Nota Fiscal", cls: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    ajuste:     { label: "Ajuste",    cls: "bg-rose-100 text-rose-700 border-rose-200" },
  }
  const info = map[origem] ?? { label: origem, cls: "bg-slate-100 text-slate-600 border-slate-200" }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${info.cls}`}>
      <ArrowLeftRight className="h-2.5 w-2.5" />
      {info.label}
    </span>
  )
}

function MovimentacaoCard({
  item,
  baixaPendente,
  onDarBaixa,
  onAlterarForma,
  onCancelar,
  onExcluir,
}: {
  item: FinanceiroLancamentoItem
  baixaPendente: boolean
  onAlterarForma: (item: FinanceiroLancamentoItem) => void
  onDarBaixa: (item: FinanceiroLancamentoItem) => Promise<void>
  onCancelar: (item: FinanceiroLancamentoItem) => Promise<void>
  onExcluir: (id: string) => Promise<void>
}) {
  const isCancelado = item.status === "cancelado"
  const isRealizado = item.status === "realizado"
  const borderColor =
    isCancelado ? "border-l-gray-300" :
    item.tipo === "receita" ? "border-l-green-500" :
    item.tipo === "investimento" ? "border-l-blue-500" :
    "border-l-red-500"

  return (
    <Card className={`border-l-4 ${borderColor} ${isCancelado ? "opacity-60" : ""}`}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <TipoBadge tipo={item.tipo} />
              <StatusBadge status={item.status} />
              <OrigemBadge origem={item.origem} />
            </div>
            <p className="font-semibold text-sm leading-snug">{item.descricao}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
              {item.categoria ? <span>{item.categoria}</span> : null}
              {item.clienteNome || item.fornecedorNome ? <span>{item.clienteNome || item.fornecedorNome}</span> : null}
              {item.contratoNumero ? <span>Contrato {item.contratoNumero}</span> : null}
              <span>Venc. {formatDate(item.dataVencimento)}</span>
              {item.parcelaTotal && item.parcelaTotal > 1 ? <span className="font-medium">Parcela {item.parcelaNumero}/{item.parcelaTotal}</span> : null}
              {item.status === "programado" && !baixaPendente ? (
                <button type="button" className="inline-flex items-center gap-1 hover:text-foreground underline-offset-2 hover:underline" onClick={() => onAlterarForma(item)}>
                  {formaPagamentoLabel(item.formaPagamento)}<Pencil className="h-3 w-3" />
                </button>
              ) : item.formaPagamento ? (
                <span>{formaPagamentoLabel(item.formaPagamento)}</span>
              ) : null}
            </div>
            {!isRealizado && !isCancelado ? (
              <div className="mt-1.5"><UrgenciaBadge dataVencimento={item.dataVencimento} /></div>
            ) : null}
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-bold ${item.tipo === "receita" ? "text-green-700" : isCancelado ? "text-muted-foreground line-through" : "text-red-700"}`}>
              {item.tipo === "receita" ? "+" : "-"}{formatCurrency(item.valor)}
            </p>
            {isRealizado && item.taxaValor !== null ? (
              <p className="text-xs text-muted-foreground">
                Liquido {formatCurrency(item.valorCaixa)} · {isModalidadeCartao(item.taxaModalidade) ? rotuloTaxaCartao(item.taxaModalidade, item.cartaoParcelas ?? 1).toLowerCase() : "taxa"} {formatPercent(item.taxaPercentual ?? 0)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          {item.status === "programado" && baixaPendente ? (
            <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />Baixa aguardando aprovacao
            </span>
          ) : null}
          {item.status === "programado" && !baixaPendente ? (
            <>
              <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={() => void onDarBaixa(item)}>
                <CheckCircle2 className="h-3.5 w-3.5" />Solicitar baixa
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs text-amber-700 border-amber-300 hover:bg-amber-50 gap-1.5" onClick={() => void onCancelar(item)}>
                <Clock className="h-3.5 w-3.5" />Cancelar
              </Button>
            </>
          ) : null}
          {isRealizado ? (
            <span className="text-xs text-green-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />Baixa aprovada{item.dataLiquidacao ? ` · ${formatDate(item.dataLiquidacao)}` : ""}
            </span>
          ) : null}
          {isCancelado ? (
            <span className="text-xs text-muted-foreground font-medium">Cancelado</span>
          ) : null}
          {!isRealizado ? (
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5" onClick={() => void onExcluir(item.id)}>
                <Trash2 className="h-3.5 w-3.5" />Excluir
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function FluxoCaixaSection({
  totaisGerais,
  versao,
  onErro,
  categorias,
  clientes,
  fornecedores,
  fluxoForm,
  setFluxoForm,
  categoriasFluxo,
  lancamentosComBaixaPendente,
  onAlterarForma,
  onSalvar,
  onExcluir,
  onDarBaixa,
  onCancelar,
}: FluxoCaixaSectionProps) {
  const isTipoEntrada = fluxoForm.tipo === "receita"

  const totalEntradas = totaisGerais.entradasRealizadas
  const totalSaidas = totaisGerais.saidasRealizadas
  const totalProgramado = totaisGerais.entradasProgramadas - totaisGerais.saidasProgramadas
  const saldoRealizado = totalEntradas - totalSaidas

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">Registre entradas e saidas e acompanhe todas as movimentacoes do sistema.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entradas realizadas</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalEntradas)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{totaisGerais.quantidadeEntradasRealizadas} lancamentos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saidas realizadas</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(totalSaidas)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{totaisGerais.quantidadeSaidasRealizadas} lancamentos</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${saldoRealizado >= 0 ? "border-l-blue-500" : "border-l-red-600"}`}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo realizado</p>
            <p className={`text-2xl font-bold mt-1 ${saldoRealizado >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatCurrency(saldoRealizado)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalProgramado >= 0 ? "+" : ""}{formatCurrency(totalProgramado)} projetado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs defaultValue="novo">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="novo" className="gap-2 flex-1 sm:flex-none">
            <PlusCircle className="h-4 w-4" />
            Novo Lancamento
          </TabsTrigger>
          <TabsTrigger value="movimentacoes" className="gap-2 flex-1 sm:flex-none">
            <List className="h-4 w-4" />
            Movimentacoes
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 h-5">{totaisGerais.quantidade}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── ABA: NOVO LANÇAMENTO ─────────────────────────── */}
        <TabsContent value="novo" className="mt-6">
          <div className="max-w-2xl">
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-primary" />
                  Novo lancamento
                </CardTitle>
                <CardDescription>Registre manualmente uma entrada, despesa ou investimento</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">

                {/* Tipo */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de movimentacao</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "receita",     label: "Entrada",      color: "text-green-700 border-green-300 bg-green-50" },
                      { value: "despesa",     label: "Despesa",      color: "text-red-700 border-red-300 bg-red-50" },
                      { value: "investimento",label: "Investimento", color: "text-blue-700 border-blue-300 bg-blue-50" },
                    ] as const).map(({ value, label, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFluxoForm((prev) => ({ ...prev, tipo: value, categoriaId: "" }))}
                        className={`rounded-lg border-2 px-3 py-3 text-sm font-semibold transition-all ${
                          fluxoForm.tipo === value ? `${color} shadow-sm` : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  O lancamento entra como programado. Quando o valor for recebido ou pago, use <strong>Solicitar baixa</strong> em Movimentacoes; a baixa vale apos a aprovacao.
                </p>

                <Separator />

                {/* Descricao */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descricao *</Label>
                  <Input
                    value={fluxoForm.descricao}
                    onChange={(e) => setFluxoForm((prev) => ({ ...prev, descricao: e.target.value }))}
                    placeholder={isTipoEntrada ? "Ex: Recebimento de servico" : "Ex: Compra de insumos de limpeza"}
                  />
                </div>

                {/* Valor + Categoria */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor (R$) *</Label>
                    <Input value={fluxoForm.valor} onChange={(e) => setFluxoForm((prev) => ({ ...prev, valor: e.target.value }))} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</Label>
                    <Select value={fluxoForm.categoriaId || "__none__"} onValueChange={(v) => setFluxoForm((prev) => ({ ...prev, categoriaId: v === "__none__" ? "" : v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem categoria</SelectItem>
                        {categoriasFluxo.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Competencia *</Label>
                    <Input type="date" value={fluxoForm.dataCompetencia} onChange={(e) => setFluxoForm((prev) => ({ ...prev, dataCompetencia: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vencimento *</Label>
                    <Input type="date" value={fluxoForm.dataVencimento} onChange={(e) => setFluxoForm((prev) => ({ ...prev, dataVencimento: e.target.value }))} />
                  </div>
                </div>

                {/* Vinculo */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {isTipoEntrada ? "Cliente (opcional)" : "Fornecedor (opcional)"}
                  </Label>
                  {isTipoEntrada ? (
                    <ClienteSearchInput
                      clientes={clientes}
                      value={fluxoForm.clienteId}
                      onChange={(id) => setFluxoForm((prev) => ({ ...prev, clienteId: id }))}
                    />
                  ) : (
                    <Select value={fluxoForm.fornecedorId || "__none__"} onValueChange={(v) => setFluxoForm((prev) => ({ ...prev, fornecedorId: v === "__none__" ? "" : v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem fornecedor</SelectItem>
                        {fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.razaoSocial}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Forma de pagamento */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Forma de pagamento</Label>
                  <Select value={fluxoForm.formaPagamento || "__none__"} onValueChange={(v) => setFluxoForm((prev) => ({ ...prev, formaPagamento: v === "__none__" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nao informado</SelectItem>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="cartao_credito">Cartao de credito</SelectItem>
                      <SelectItem value="cartao_debito">Cartao de debito</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parcelas</Label>
                      <Input
                        type="number"
                        min={1}
                        max={isFormaCartao(fluxoForm.formaPagamento) ? MAX_PARCELAS_CARTAO : MAX_PARCELAS}
                        disabled={fluxoForm.formaPagamento === "cartao_debito"}
                        value={fluxoForm.formaPagamento === "cartao_debito" ? "1" : fluxoForm.quantidadeParcelas}
                        onChange={(e) => setFluxoForm((prev) => ({ ...prev, quantidadeParcelas: e.target.value }))}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground self-end pb-2">
                      {isFormaCartao(fluxoForm.formaPagamento)
                        ? "Cartao: um lancamento com baixa unica; as parcelas definem a taxa."
                        : "O valor informado e o total; o vencimento acima e o da 1ª parcela. Cada parcela tem baixa propria."}
                    </p>
                  </div>
                  <ParcelasPreview {...previaCobranca(toNumber(fluxoForm.valor), fluxoForm.quantidadeParcelas, fluxoForm.dataVencimento, fluxoForm.formaPagamento)} />
                </div>

                {/* Observacoes */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observacoes</Label>
                  <Textarea value={fluxoForm.observacoes} onChange={(e) => setFluxoForm((prev) => ({ ...prev, observacoes: e.target.value }))} rows={3} placeholder="Informacoes adicionais..." />
                </div>

                <Button className="w-full h-12 text-base font-semibold" onClick={onSalvar}>
                  <PlusCircle className="h-5 w-5 mr-2" />
                  {fluxoForm.tipo === "receita" ? "Registrar Entrada" : fluxoForm.tipo === "despesa" ? "Registrar Despesa" : "Registrar Investimento"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ABA: MOVIMENTAÇÕES ───────────────────────────── */}
        <TabsContent value="movimentacoes" className="mt-6">
          <LancamentosExplorer categorias={categorias} versao={versao} onErro={onErro}>
            {(itens) =>
              itens.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-25" />
                    <p className="text-sm font-medium">Nenhuma movimentacao encontrada</p>
                    <p className="text-xs mt-1">Ajuste os filtros ou registre um novo lancamento</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {itens.map((item) => (
                    <MovimentacaoCard key={item.id} item={item} baixaPendente={lancamentosComBaixaPendente.has(item.id)} onAlterarForma={onAlterarForma} onDarBaixa={onDarBaixa} onCancelar={onCancelar} onExcluir={onExcluir} />
                  ))}
                </div>
              )
            }
          </LancamentosExplorer>
        </TabsContent>
      </Tabs>
    </>
  )
}

function RelatoriosSection({
  categorias,
  versao,
  onErro,
  onExcluir,
}: {
  categorias: FinanceiroCategoriaItem[]
  versao: number
  onErro: (mensagem: string) => void
  onExcluir: (id: string) => Promise<void>
}) {
  const filtrosIniciais = useMemo(() => {
    const hoje = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
    return {
      dataInicio: `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-01`,
      dataFim: `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(ultimo)}`,
    }
  }, [])

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatorios Financeiros</h1>
          <p className="text-sm text-muted-foreground">Filtre, totalize e exporte (CSV/PDF) todos os lancamentos do sistema.</p>
        </div>
      </div>

      <LancamentosExplorer categorias={categorias} versao={versao} onErro={onErro} filtrosIniciais={filtrosIniciais} tamanhoPagina={25}>
        {(itens) => (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-6">Tipo</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vinculo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right pr-6">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-14 text-muted-foreground">
                        Nenhum lancamento encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    itens.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/20">
                        <TableCell className="pl-6"><TipoBadge tipo={item.tipo} /></TableCell>
                        <TableCell className="font-medium max-w-[220px] truncate">{item.descricao}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{item.categoria || "—"}</TableCell>
                        <TableCell className="text-sm">{item.clienteNome || item.fornecedorNome || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{formatDate(item.dataReferencia)}</span>
                            {item.status === "programado" && <UrgenciaBadge dataVencimento={item.dataVencimento} />}
                          </div>
                        </TableCell>
                        <TableCell><StatusBadge status={item.status} /></TableCell>
                        <TableCell className={`text-right font-semibold ${item.tipo === "receita" ? "text-green-700" : "text-red-700"}`}>
                          {item.tipo === "receita" ? "+" : "-"}{formatCurrency(item.valorCaixa)}
                          {item.taxaValor !== null ? <div className="text-xs font-normal text-muted-foreground">bruto {formatCurrency(item.valor)}</div> : null}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {item.status !== "realizado" ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => void onExcluir(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </LancamentosExplorer>
    </>
  )
}

export default function FinanceiroPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaFinanceira>("dashboard")
  const [clientes, setClientes] = useState<ClienteInput[]>([])
  const [contratos, setContratos] = useState<ContratoSupabaseItem[]>([])
  const [fornecedores, setFornecedores] = useState<FornecedorSupabaseItem[]>([])
  const [categorias, setCategorias] = useState<FinanceiroCategoriaItem[]>([])
  // Os lancamentos nao ficam mais todos em memoria: cada tela consulta o banco
  // (paginado/agregado). "versaoLancamentos" avisa as telas para recarregar.
  const [versaoLancamentos, setVersaoLancamentos] = useState(0)
  const [totaisGerais, setTotaisGerais] = useState<TotaisLancamentos>({
    entradasRealizadas: 0, saidasRealizadas: 0, entradasProgramadas: 0, saidasProgramadas: 0,
    quantidade: 0, quantidadeEntradasRealizadas: 0, quantidadeSaidasRealizadas: 0,
  })
  const [proximosVencimentos, setProximosVencimentos] = useState<FinanceiroLancamentoItem[]>([])
  const atualizarLancamentos = () => setVersaoLancamentos((v) => v + 1)
  const [documentos, setDocumentos] = useState<FinanceiroDocumentoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [boletoForm, setBoletoForm] = useState<DocumentoEmitirForm>(buildDocumentoInitialForm)
  const [fluxoForm, setFluxoForm] = useState<FluxoForm>(buildFluxoInitialForm)
  const [categoriaForm, setCategoriaForm] = useState<FinanceiroCategoriaInput>({ nome: "", tipo: "despesa", descricao: "", ativo: true })
  const [confirmFluxo, setConfirmFluxo] = useState(false)
  const [isSavingFluxo, setIsSavingFluxo] = useState(false)
  const [isEmitindo, setIsEmitindo] = useState(false)
  const { profile } = useAccess()
  const [isAprovador, setIsAprovador] = useState(false)
  const [baixasPendentes, setBaixasPendentes] = useState<FinanceiroBaixaSolicitacaoItem[]>([])
  const [baixasDecididas, setBaixasDecididas] = useState<FinanceiroBaixaSolicitacaoItem[]>([])
  const [lancamentoParaBaixa, setLancamentoParaBaixa] = useState<FinanceiroLancamentoItem | null>(null)
  const [pageNotice, setPageNotice] = useState("")
  const [taxasHistorico, setTaxasHistorico] = useState<FinanceiroTaxaCartaoItem[]>([])
  const [lancamentoAlterarForma, setLancamentoAlterarForma] = useState<FinanceiroLancamentoItem | null>(null)
  const taxasCartao = useMemo(() => taxasVigentes(taxasHistorico), [taxasHistorico])

  const carregarTaxas = async () => {
    try {
      setTaxasHistorico(await listTaxasCartaoSupabase())
    } catch (error) {
      // Nao derruba a pagina se a migration de taxas ainda nao foi aplicada.
      console.warn("Falha ao carregar taxas de cartao:", error)
    }
  }

  const carregarAprovacoes = async () => {
    try {
      const [pendentes, decididas, aprovador] = await Promise.all([
        listFinanceiroBaixaSolicitacoesSupabase({ status: "pendente" }),
        listFinanceiroBaixaSolicitacoesSupabase({ status: "decididas", limit: 30 }),
        isAprovadorFinanceiroSupabase(),
      ])
      setBaixasPendentes(pendentes)
      setBaixasDecididas(decididas)
      setIsAprovador(aprovador)
    } catch (error) {
      // Nao derruba a pagina se a migration de aprovacoes ainda nao foi aplicada.
      console.warn("Falha ao carregar aprovacoes de baixa:", error)
    }
  }

  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      try {
        const [clientesResult, contratosRows, fornecedoresRows, categoriasRows, documentosRows] = await Promise.all([
          listClientesSupabase({ pageSize: 100 }),
          listContratosSupabase(),
          listFornecedoresSupabase(),
          listFinanceiroCategoriasSupabase(),
          listFinanceiroDocumentosSupabase(),
        ])
        if (!mounted) return
        // Deduplicar clientes por ID (evita duplicatas no banco)
        const clientesUnicos = clientesResult.data.filter(
          (c, idx, arr) => arr.findIndex((x) => String(x.id) === String(c.id)) === idx
        )
        setClientes(clientesUnicos)
        setContratos(contratosRows)
        setFornecedores(fornecedoresRows)
        setCategorias(categoriasRows)
        setDocumentos(documentosRows)
        setPageError("")
      } catch (error) {
        if (mounted) setPageError(getErrorMessage(error))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void loadData()
    void carregarAprovacoes()
    void carregarTaxas()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let ativo = true
    Promise.all([totaisLancamentosSupabase({}), listProximosVencimentosSupabase(8)])
      .then(([totais, proximos]) => {
        if (!ativo) return
        setTotaisGerais(totais)
        setProximosVencimentos(proximos)
      })
      .catch((error) => { if (ativo) setPageError(getErrorMessage(error)) })
    return () => { ativo = false }
  }, [versaoLancamentos])

  const lancamentosComBaixaPendente = useMemo(
    () => new Set(baixasPendentes.map((item) => item.lancamentoId)),
    [baixasPendentes],
  )

  const boletos = useMemo(() => documentos.filter((item) => item.tipo === "boleto"), [documentos])
  const categoriasReceita = useMemo(() => categorias.filter((item) => item.tipo === "receita" && item.ativo), [categorias])
  const categoriasFluxo = useMemo(() => categorias.filter((item) => item.tipo === fluxoForm.tipo && item.ativo), [categorias, fluxoForm.tipo])
  const emitDocument = async (tipo: FinanceiroDocumentoTipo, form: DocumentoEmitirForm) => {
    const cliente = clientes.find((item) => String(item.id) === form.clienteId)
    if (!cliente) return setPageError("Selecione um cliente para emitir o documento.")
    const valor = toNumber(form.valorServico)
    if (!form.descricao.trim() || !valor || !form.dataVencimento) return setPageError("Preencha cliente, descricao, vencimento e valor do servico.")
    if (isEmitindo) return

    const quantidade = tipo === "boleto" ? parseQuantidadeParcelas(form.quantidadeParcelas) : 1
    const { parcelas, erro } = previaParcelas(valor, String(quantidade), form.dataVencimento)
    if (erro || parcelas.length === 0) return setPageError(erro || "Parcelamento invalido.")
    if (quantidade > 1) {
      const ok = window.confirm(`Gerar ${quantidade} boletos mensais somando ${formatCurrency(valor)}?`)
      if (!ok) return
    }

    setIsEmitindo(true)
    let lancamentosCriados: FinanceiroLancamentoItem[] = []
    try {
      const categoriaSelecionada = categorias.find((item) => item.id === form.categoriaId)
      const grupoId = parcelas.length > 1 ? crypto.randomUUID() : undefined
      const descricao = form.descricao.trim()

      lancamentosCriados = await criarLancamentosSupabase(
        parcelas.map((parcela) => ({
          tipo: "receita",
          status: "programado",
          origem: tipo,
          descricao: descricaoParcela(descricao, parcela.numero, parcela.total),
          categoriaId: form.categoriaId,
          categoria: categoriaSelecionada?.nome,
          valor: parcela.valor,
          dataCompetencia: form.dataEmissao,
          dataVencimento: parcela.dataVencimento,
          clienteId: form.clienteId,
          contratoId: form.contratoId || undefined,
          formaPagamento: tipo === "boleto" ? "boleto" : undefined,
          documentoTipo: tipo,
          documentoNumero: form.numero,
          notificacaoEmail: form.notificacaoEmail,
          notificacaoWhatsapp: form.notificacaoWhatsapp,
          observacoes: form.observacoes,
          parcelaGrupoId: grupoId,
          parcelaNumero: grupoId ? parcela.numero : undefined,
          parcelaTotal: grupoId ? parcela.total : undefined,
        })),
      )

      let documentosCriados: FinanceiroDocumentoItem[]
      try {
        const base = Date.now()
        documentosCriados = await criarDocumentosSupabase(
          lancamentosCriados.map((lancamento, index) => ({
            lancamentoId: lancamento.id,
            tipo,
            status: "pendente",
            clienteId: form.clienteId,
            contratoId: form.contratoId || undefined,
            descricao: lancamento.descricao,
            numero: form.numero
              ? `${form.numero}${lancamentosCriados.length > 1 ? `-${index + 1}` : ""}`
              : `${tipo === "boleto" ? "BLT" : "NF"}-${base}${lancamentosCriados.length > 1 ? `-${index + 1}` : ""}`,
            serie: form.serie,
            chaveDocumento: form.chaveDocumento,
            linhaDigitavel: form.linhaDigitavel,
            dataEmissao: form.dataEmissao,
            dataVencimento: lancamento.dataVencimento,
            valor: lancamento.valor,
            valorServico: lancamento.valor,
            notificacaoEmail: form.notificacaoEmail,
            notificacaoWhatsapp: form.notificacaoWhatsapp,
            apiIntegracaoStatus: "nao_enviado",
            observacoes: form.observacoes,
          })),
        )
      } catch (docError) {
        // Desfaz os lancamentos para nao deixar parcelas sem documento.
        await Promise.allSettled(lancamentosCriados.map((l) => deleteFinanceiroLancamentoSupabase(l.id)))
        lancamentosCriados = []
        throw docError
      }
      atualizarLancamentos()
      setDocumentos((prev) => [...documentosCriados, ...prev])

      if (tipo === "boleto") {
        let falhas = 0
        for (const documento of documentosCriados) {
          const lancamento = lancamentosCriados.find((l) => l.id === documento.lancamentoId)
          const enviado = await enviarBoletoWebhook({
            documentoId: documento.id,
            lancamentoId: documento.lancamentoId,
            parcelaGrupoId: lancamento?.parcelaGrupoId || null,
            parcelaNumero: lancamento?.parcelaNumero ?? 1,
            parcelaTotal: lancamento?.parcelaTotal ?? 1,
            valorTotal: valor,
            clienteId: form.clienteId,
            clienteNome: cliente.nome,
            clienteEmail: cliente.email || null,
            clienteTelefone: cliente.telefone || null,
            clienteCnpj: cliente.cnpj || null,
            clienteCpf: cliente.cpf || null,
            contratoId: form.contratoId || null,
            descricao: documento.descricao,
            valor: documento.valor,
            dataEmissao: form.dataEmissao,
            dataVencimento: documento.dataVencimento,
            notificacaoEmail: form.notificacaoEmail,
            notificacaoWhatsapp: form.notificacaoWhatsapp,
            observacoes: form.observacoes || null,
          })
          if (!enviado) falhas += 1
          const status = enviado ? "enviado" : "erro"
          await registrarIntegracaoDocumentoSupabase(documento.id, status)
          setDocumentos((prev) => prev.map((d) => (d.id === documento.id ? { ...d, apiIntegracaoStatus: status } : d)))
        }
        setBoletoForm(buildDocumentoInitialForm())
        setPageNotice(
          falhas > 0
            ? `${documentosCriados.length} boleto(s) registrado(s), mas ${falhas} envio(s) para a integracao falharam.`
            : `${documentosCriados.length} boleto(s) registrado(s) e enviado(s) para a integracao.`,
        )
      }

      setPageError("")
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsEmitindo(false)
    }
  }

  const handleOpenConfirmFluxo = () => {
    const valor = toNumber(fluxoForm.valor)
    if (!fluxoForm.descricao.trim() || !valor || !fluxoForm.dataCompetencia || !fluxoForm.dataVencimento) {
      setPageError("Preencha descricao, valor, competencia e vencimento.")
      return
    }
    setPageError("")
    setConfirmFluxo(true)
  }

  const handleSalvarFluxo = async () => {
    const valor = toNumber(fluxoForm.valor)
    if (!fluxoForm.descricao.trim() || !valor || !fluxoForm.dataCompetencia || !fluxoForm.dataVencimento) {
      setPageError("Preencha descricao, valor, competencia e vencimento.")
      return
    }
    const quantidadeTexto = fluxoForm.formaPagamento === "cartao_debito" ? "1" : fluxoForm.quantidadeParcelas
    const { parcelas, cartaoParcelas, erro } = previaCobranca(valor, quantidadeTexto, fluxoForm.dataVencimento, fluxoForm.formaPagamento)
    if (erro || parcelas.length === 0) {
      setPageError(erro || "Parcelamento invalido.")
      return
    }
    if (isSavingFluxo) return
    setIsSavingFluxo(true)
    try {
      const categoriaSelecionada = categorias.find((item) => item.id === fluxoForm.categoriaId)
      const grupoId = parcelas.length > 1 ? crypto.randomUUID() : undefined
      const descricao = fluxoForm.descricao.trim()
      const criados = await criarLancamentosSupabase(
        parcelas.map((parcela) => ({
          tipo: fluxoForm.tipo,
          status: "programado",
          origem: "manual",
          descricao: descricaoParcela(descricao, parcela.numero, parcela.total),
          categoriaId: fluxoForm.categoriaId,
          categoria: categoriaSelecionada?.nome,
          valor: parcela.valor,
          dataCompetencia: fluxoForm.dataCompetencia,
          dataVencimento: parcela.dataVencimento,
          clienteId: fluxoForm.tipo === "receita" ? fluxoForm.clienteId : undefined,
          fornecedorId: fluxoForm.tipo !== "receita" ? fluxoForm.fornecedorId : undefined,
          formaPagamento: fluxoForm.formaPagamento,
          cartaoParcelas: cartaoParcelas ?? undefined,
          notificacaoEmail: fluxoForm.notificacaoEmail,
          notificacaoWhatsapp: fluxoForm.notificacaoWhatsapp,
          observacoes: fluxoForm.observacoes,
          parcelaGrupoId: grupoId,
          parcelaNumero: grupoId ? parcela.numero : undefined,
          parcelaTotal: grupoId ? parcela.total : undefined,
        })),
      )
      atualizarLancamentos()

      // Boleto para cliente: uma cobranca por parcela na integracao.
      let falhas = 0
      if (fluxoForm.formaPagamento === "boleto" && fluxoForm.tipo === "receita" && fluxoForm.clienteId) {
        const cliente = clientes.find((c) => String(c.id) === fluxoForm.clienteId)
        if (cliente) {
          for (const lancamento of criados) {
            const enviado = await enviarBoletoWebhook({
              lancamentoId: lancamento.id,
              parcelaGrupoId: lancamento.parcelaGrupoId || null,
              parcelaNumero: lancamento.parcelaNumero ?? 1,
              parcelaTotal: lancamento.parcelaTotal ?? 1,
              valorTotal: valor,
              clienteId: String(cliente.id),
              clienteNome: cliente.nome,
              clienteEmail: cliente.email || null,
              clienteTelefone: cliente.telefone || null,
              clienteCnpj: cliente.cnpj || null,
              clienteCpf: cliente.cpf || null,
              descricao: lancamento.descricao,
              valor: lancamento.valor,
              dataEmissao: fluxoForm.dataCompetencia,
              dataVencimento: lancamento.dataVencimento,
              notificacaoEmail: fluxoForm.notificacaoEmail,
              notificacaoWhatsapp: fluxoForm.notificacaoWhatsapp,
              observacoes: fluxoForm.observacoes || null,
            })
            if (!enviado) falhas += 1
            await registrarIntegracaoLancamentoSupabase(lancamento.id, enviado ? "enviado" : "erro")
          }
        }
      }

      setFluxoForm(buildFluxoInitialForm())
      setConfirmFluxo(false)
      setPageError("")
      setPageNotice(
        falhas > 0
          ? `${criados.length} lancamento(s) registrado(s), mas ${falhas} envio(s) de boleto para a integracao falharam.`
          : criados.length > 1
            ? `${criados.length} parcelas registradas.`
            : "Lancamento registrado.",
      )
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsSavingFluxo(false)
    }
  }

  const handleDarBaixa = async (item: FinanceiroLancamentoItem) => {
    setPageNotice("")
    setLancamentoParaBaixa(item)
  }

  const handleConfirmarSolicitacaoBaixa = async (payload: SolicitarBaixaPayload) => {
    await solicitarBaixaLancamentoSupabase(payload)
    setLancamentoParaBaixa(null)
    setPageError("")
    setPageNotice("Baixa solicitada. Ela aparece na aba Aprovacoes ate ser aprovada.")
    await carregarAprovacoes()
  }

  const recarregarLancamento = async (_lancamentoId: string) => {
    atualizarLancamentos()
  }

  const handleAprovarBaixa = async (solicitacao: FinanceiroBaixaSolicitacaoItem) => {
    try {
      await decidirBaixaSolicitacaoSupabase({ solicitacaoId: solicitacao.id, aprovar: true })
      setPageError("")
      setPageNotice("Baixa aprovada.")
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
    await Promise.all([carregarAprovacoes(), recarregarLancamento(solicitacao.lancamentoId)])
  }

  const handleRejeitarBaixa = async (solicitacao: FinanceiroBaixaSolicitacaoItem, motivo: string) => {
    await decidirBaixaSolicitacaoSupabase({ solicitacaoId: solicitacao.id, aprovar: false, motivo })
    setPageError("")
    setPageNotice("Baixa rejeitada. O lancamento continua programado.")
    await carregarAprovacoes()
  }

  const handleCancelarSolicitacaoBaixa = async (solicitacao: FinanceiroBaixaSolicitacaoItem) => {
    const ok = window.confirm(`Cancelar a solicitacao de baixa de "${solicitacao.lancamento?.descricao || ""}"?`)
    if (!ok) return
    try {
      await cancelarSolicitacaoBaixaSupabase(solicitacao.id)
      setPageError("")
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
    await carregarAprovacoes()
  }

  const handleCancelarLancamento = async (item: FinanceiroLancamentoItem) => {
    const ok = window.confirm(`Cancelar o lancamento "${item.descricao}"?`)
    if (!ok) return
    try {
      const saved = await cancelarLancamentoSupabase(item.id)
      atualizarLancamentos()
      setPageError("")
      if (lancamentosComBaixaPendente.has(item.id)) await carregarAprovacoes()
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const handleConfirmarAlterarForma = async (item: FinanceiroLancamentoItem, formaPagamento: string) => {
    const saved = await atualizarFormaPagamentoLancamentoSupabase(item.id, formaPagamento)
    atualizarLancamentos()
    setLancamentoAlterarForma(null)
    setPageError("")
    setPageNotice("Forma de pagamento atualizada.")
  }

  const handleSalvarTaxa = async (modalidade: FinanceiroTaxaCartaoModalidade, percentual: number, parcelas: number) => {
    await definirTaxaCartaoSupabase(modalidade, percentual, parcelas)
    await carregarTaxas()
    setPageNotice(`Taxa de ${rotuloTaxaCartao(modalidade, parcelas).toLowerCase()} atualizada para ${formatPercent(percentual)}.`)
  }

  const handleSalvarCategoria = async () => {
    if (!categoriaForm.nome.trim()) return setPageError("Informe o nome da categoria.")
    try {
      const saved = await upsertFinanceiroCategoriaSupabase({
        ...categoriaForm,
        nome: categoriaForm.nome.trim(),
        descricao: categoriaForm.descricao?.trim() || "",
      })
      setCategorias((prev) => [...prev.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.nome.localeCompare(b.nome)))
      setCategoriaForm({ nome: "", tipo: "despesa", descricao: "", ativo: true })
      setPageError("")
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const handleExcluirLancamento = async (id: string) => {
    const ok = window.confirm("Deseja excluir este lancamento financeiro?")
    if (!ok) return
    try {
      await deleteFinanceiroLancamentoSupabase(id)
      atualizarLancamentos()
      setDocumentos((prev) => prev.filter((item) => item.lancamentoId !== id))
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const handleExcluirDocumento = async (id: string) => {
    const ok = window.confirm("Deseja excluir este documento?")
    if (!ok) return
    try {
      await deleteFinanceiroDocumentoSupabase(id)
      setDocumentos((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const handleExcluirCategoria = async (id: string, nome: string) => {
    const ok = window.confirm(`Deseja excluir a categoria "${nome}"?`)
    if (!ok) return
    try {
      await deleteFinanceiroCategoriaSupabase(id)
      setCategorias((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const navGroups = [
    {
      label: "Visao Geral",
      items: [
        { value: "dashboard" as AbaFinanceira, label: "Dashboard", icon: LayoutDashboard },
        { value: "aprovacoes" as AbaFinanceira, label: "Aprovacoes", icon: ShieldCheck },
      ],
    },
    {
      label: "Documentos",
      items: [
        { value: "boleto" as AbaFinanceira, label: "Emissao de Boleto", icon: Receipt },
        { value: "nf" as AbaFinanceira, label: "Emissao de NFS-e", icon: FileText },
        { value: "nfse_config" as AbaFinanceira, label: "Config. NFS-e", icon: Settings },
      ],
    },
    {
      label: "Gestao",
      items: [
        { value: "relatorios" as AbaFinanceira, label: "Relatorios", icon: BarChart3 },
        { value: "fluxo" as AbaFinanceira, label: "Fluxo de Caixa", icon: Wallet },
        { value: "categorias" as AbaFinanceira, label: "Categorias", icon: Tag },
        { value: "taxas" as AbaFinanceira, label: "Taxas de cartao", icon: CreditCard },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <div className="flex">
        <aside className="w-60 bg-background border-r border-border min-h-[calc(100vh-4rem)] p-3 flex flex-col gap-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 mb-1.5">{group.label}</p>
              <nav className="space-y-0.5">
                {group.items.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAbaAtiva(value)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left ${
                      abaAtiva === value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                    {value === "aprovacoes" && baixasPendentes.length > 0 ? (
                      <span className={`ml-auto rounded-full px-1.5 text-[10px] font-bold ${abaAtiva === value ? "bg-primary-foreground text-primary" : "bg-amber-500 text-white"}`}>
                        {baixasPendentes.length}
                      </span>
                    ) : null}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </aside>

        <main className="flex-1 px-8 py-8 space-y-6 min-w-0">
          {pageError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{pageError}</AlertDescription>
            </Alert>
          ) : null}

          {pageNotice && !pageError ? (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-3">
                {pageNotice}
                <button type="button" className="text-green-700 hover:text-green-900" onClick={() => setPageNotice("")}><X className="h-4 w-4" /></button>
              </AlertDescription>
            </Alert>
          ) : null}

          {loading ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm">Carregando dados financeiros...</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ── DASHBOARD ─────────────────────────────────────────── */}
          {!loading && abaAtiva === "dashboard" ? (
            <DashboardFinanceiro
              versao={versaoLancamentos}
              onErro={setPageError}
              proximosVencimentos={
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Proximos vencimentos</CardTitle>
                        <CardDescription>Lancamentos programados ordenados por data</CardDescription>
                      </div>
                      <Badge variant="secondary">{proximosVencimentos.length} pendente{proximosVencimentos.length !== 1 ? "s" : ""}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {proximosVencimentos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhum vencimento programado.</p>
                    ) : (
                      proximosVencimentos.map((item) => {
                        const today = new Date(); today.setHours(0, 0, 0, 0)
                        const diff = differenceInDays(new Date(`${item.dataVencimento}T00:00:00`), today)
                        const borderColor = diff < 0 ? "border-l-red-500" : diff <= 7 ? "border-l-amber-400" : "border-l-slate-200"
                        return (
                          <div key={item.id} className={`flex items-center justify-between gap-4 rounded-lg border border-l-4 ${borderColor} bg-background p-3`}>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.descricao}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.clienteNome || item.fornecedorNome || item.contratoNumero || "Sem vinculo"} &middot; {formatDate(item.dataVencimento)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <UrgenciaBadge dataVencimento={item.dataVencimento} />
                              <span className={`font-semibold text-sm ${item.tipo === "receita" ? "text-green-700" : "text-red-700"}`}>
                                {item.tipo === "receita" ? "+" : "-"}{formatCurrency(item.valor)}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              }
            />
          ) : null}

          {/* ── APROVACOES ─────────────────────────────────────────── */}
          {!loading && abaAtiva === "aprovacoes" ? (
            <AprovacoesSection
              pendentes={baixasPendentes}
              decididas={baixasDecididas}
              isAprovador={isAprovador}
              currentUserId={profile?.userId || ""}
              onAprovar={handleAprovarBaixa}
              onRejeitar={handleRejeitarBaixa}
              onCancelarSolicitacao={handleCancelarSolicitacaoBaixa}
            />
          ) : null}

          {/* ── BOLETO / NF ───────────────────────────────────────── */}
          {!loading && abaAtiva === "boleto" ? (
            <EmissaoSection
              tipo="boleto"
              title="Emissao de Boletos"
              description="Selecione o cliente, vincule ao contrato e registre a cobranca."
              form={boletoForm}
              setForm={setBoletoForm}
              clientes={clientes}
              contratos={contratos}
              categorias={categoriasReceita}
              documentos={boletos}
              onEmitir={() => void emitDocument("boleto", boletoForm)}
              onDelete={(id) => void handleExcluirDocumento(id)}
            />
          ) : null}

          {!loading && abaAtiva === "nf" ? (
            <NfseSection
              categoriasReceita={categoriasReceita}
              onErro={setPageError}
              onAviso={(mensagem) => { setPageError(""); setPageNotice(mensagem); atualizarLancamentos() }}
              onAbrirConfig={() => setAbaAtiva("nfse_config")}
            />
          ) : null}

          {!loading && abaAtiva === "nfse_config" ? (
            <NfseConfigSection
              isAprovador={isAprovador}
              onErro={setPageError}
              onAviso={(mensagem) => { setPageError(""); setPageNotice(mensagem) }}
            />
          ) : null}

          {/* ── RELATORIOS ────────────────────────────────────────── */}
          {!loading && abaAtiva === "relatorios" ? (
            <RelatoriosSection
              versao={versaoLancamentos}
              onErro={setPageError}
              categorias={categorias}
              onExcluir={handleExcluirLancamento}
            />
          ) : null}

          {/* ── FLUXO DE CAIXA ────────────────────────────────────── */}
          {!loading && abaAtiva === "fluxo" ? (
            <FluxoCaixaSection
              totaisGerais={totaisGerais}
              versao={versaoLancamentos}
              onErro={setPageError}
              categorias={categorias}
              clientes={clientes}
              fornecedores={fornecedores}
              fluxoForm={fluxoForm}
              setFluxoForm={setFluxoForm}
              categoriasFluxo={categoriasFluxo}
              lancamentosComBaixaPendente={lancamentosComBaixaPendente}
              onAlterarForma={(item) => { setPageNotice(""); setLancamentoAlterarForma(item) }}
              onSalvar={handleOpenConfirmFluxo}
              onExcluir={handleExcluirLancamento}
              onDarBaixa={handleDarBaixa}
              onCancelar={handleCancelarLancamento}
            />
          ) : null}

          {/* ── TAXAS DE CARTAO ─────────────────────────────────────── */}
          {!loading && abaAtiva === "taxas" ? (
            <TaxasCartaoSection
              historico={taxasHistorico}
              vigentes={taxasCartao}
              isAprovador={isAprovador}
              onSalvar={handleSalvarTaxa}
            />
          ) : null}

          {/* ── CATEGORIAS ───────────────────────────────────────── */}
          {!loading && abaAtiva === "categorias" ? (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Categorias Financeiras</h1>
                  <p className="text-sm text-muted-foreground">Organize seus lancamentos classificando-os por categoria.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[400px,1fr] gap-6 items-start">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Nova categoria</CardTitle>
                    <CardDescription>Preencha os dados e salve</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome</Label>
                      <Input
                        value={categoriaForm.nome}
                        onChange={(e) => setCategoriaForm((prev) => ({ ...prev, nome: e.target.value }))}
                        placeholder="Ex: Compra de Insumos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo</Label>
                      <Select
                        value={categoriaForm.tipo}
                        onValueChange={(value) => setCategoriaForm((prev) => ({ ...prev, tipo: value as FinanceiroLancamentoTipo }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                          <SelectItem value="investimento">Investimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descricao</Label>
                      <Textarea
                        value={categoriaForm.descricao || ""}
                        onChange={(e) => setCategoriaForm((prev) => ({ ...prev, descricao: e.target.value }))}
                        rows={3}
                        placeholder="Descricao opcional..."
                      />
                    </div>
                    <Button className="w-full h-10 font-semibold" onClick={() => void handleSalvarCategoria()}>
                      <PlusCircle className="h-4 w-4 mr-2" />Salvar categoria
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Categorias cadastradas</CardTitle>
                        <CardDescription>{categorias.length} categoria{categorias.length !== 1 ? "s" : ""}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categorias.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">Nenhuma categoria cadastrada ainda.</p>
                    ) : (
                      <>
                        {(["receita", "despesa", "investimento"] as FinanceiroLancamentoTipo[]).map((tipo) => {
                          const grupo = categorias.filter((c) => c.tipo === tipo)
                          if (grupo.length === 0) return null
                          return (
                            <div key={tipo} className="space-y-1.5">
                              <div className="flex items-center gap-2 pt-2">
                                <TipoBadge tipo={tipo} />
                                <span className="text-xs text-muted-foreground">{grupo.length} categoria{grupo.length !== 1 ? "s" : ""}</span>
                              </div>
                              {grupo.map((categoria) => (
                                <div key={categoria.id} className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                  <div>
                                    <p className="font-medium text-sm">{categoria.nome}</p>
                                    {categoria.descricao ? (
                                      <p className="text-xs text-muted-foreground mt-0.5">{categoria.descricao}</p>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoria.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                      {categoria.ativo ? "Ativa" : "Inativa"}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => void handleExcluirCategoria(categoria.id, categoria.nome)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </main>
      </div>

      {/* Diálogo de confirmação de lançamento financeiro */}
      <ConfirmActionDialog
        open={confirmFluxo}
        title="Confirmar lançamento financeiro"
        description="Revise os dados abaixo antes de registrar o lançamento."
        details={[
          { label: "Tipo", value: fluxoForm.tipo === "receita" ? "Receita" : fluxoForm.tipo === "despesa" ? "Despesa" : "Investimento" },
          { label: "Descrição", value: fluxoForm.descricao || "" },
          { label: "Valor", value: fluxoForm.valor ? `R$ ${fluxoForm.valor}` : "" },
          ...(parseQuantidadeParcelas(fluxoForm.quantidadeParcelas) > 1 && fluxoForm.formaPagamento !== "cartao_debito"
            ? [{
                label: "Parcelas",
                value: isFormaCartao(fluxoForm.formaPagamento)
                  ? `${parseQuantidadeParcelas(fluxoForm.quantidadeParcelas)}x no cartao (lancamento unico)`
                  : `${parseQuantidadeParcelas(fluxoForm.quantidadeParcelas)}x mensais (valor total)`,
              }]
            : []),
          { label: "Status", value: "Programado (baixa depende de aprovacao)" },
          { label: "Competência", value: fluxoForm.dataCompetencia || "" },
          { label: "Vencimento", value: fluxoForm.dataVencimento || "" },
          ...(fluxoForm.formaPagamento ? [{ label: "Forma pgto", value: formaPagamentoLabel(fluxoForm.formaPagamento) }] : []),
        ]}
        confirmLabel={isSavingFluxo ? "Salvando..." : "Confirmar lançamento"}
        isLoading={isSavingFluxo}
        onConfirm={() => void handleSalvarFluxo()}
        onCancel={() => setConfirmFluxo(false)}
      />

      <AlterarFormaPagamentoDialog
        lancamento={lancamentoAlterarForma}
        onCancel={() => setLancamentoAlterarForma(null)}
        onConfirm={handleConfirmarAlterarForma}
      />

      <SolicitarBaixaDialog
        lancamento={lancamentoParaBaixa}
        taxas={taxasCartao}
        onCancel={() => setLancamentoParaBaixa(null)}
        onConfirm={handleConfirmarSolicitacaoBaixa}
      />
    </div>
  )
}
