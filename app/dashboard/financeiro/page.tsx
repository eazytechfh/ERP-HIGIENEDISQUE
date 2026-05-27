"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { differenceInDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Filter,
  LayoutDashboard,
  List,
  PlusCircle,
  Loader2,
  Receipt,
  Search,
  Tag,
  Trash2,
  Wallet,
  X,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ErpHeader } from "@/components/erp-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
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
  deleteFinanceiroCategoriaSupabase,
  deleteFinanceiroDocumentoSupabase,
  deleteFinanceiroLancamentoSupabase,
  listFinanceiroCategoriasSupabase,
  listFinanceiroDocumentosSupabase,
  listFinanceiroLancamentosSupabase,
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

type AbaFinanceira = "dashboard" | "boleto" | "nf" | "relatorios" | "fluxo" | "categorias"

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
}

type FluxoForm = {
  tipo: FinanceiroLancamentoTipo
  status: "programado" | "realizado"
  descricao: string
  categoriaId: string
  clienteId: string
  fornecedorId: string
  valor: string
  dataCompetencia: string
  dataVencimento: string
  dataLiquidacao: string
  formaPagamento: string
  documentoTipo: string
  documentoNumero: string
  notificacaoEmail: boolean
  notificacaoWhatsapp: boolean
  observacoes: string
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
  }
}

function buildFluxoInitialForm(): FluxoForm {
  const today = todayIso()
  return {
    tipo: "receita",
    status: "programado",
    descricao: "",
    categoriaId: "",
    clienteId: "",
    fornecedorId: "",
    valor: "",
    dataCompetencia: today,
    dataVencimento: today,
    dataLiquidacao: "",
    formaPagamento: "",
    documentoTipo: "",
    documentoNumero: "",
    notificacaoEmail: false,
    notificacaoWhatsapp: false,
    observacoes: "",
  }
}

function buildMonthlyData(lancamentos: FinanceiroLancamentoItem[]) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const current = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`
    return {
      key,
      mes: format(current, "MMM", { locale: ptBR }),
      "Receita Realizada": 0,
      "Receita Programada": 0,
      "Despesa Realizada": 0,
      "Despesa Programada": 0,
    }
  })
  const bucket = new Map(months.map((item) => [item.key, item]))

  lancamentos.forEach((lancamento) => {
    const monthKey = (lancamento.dataCompetencia || lancamento.dataVencimento).slice(0, 7)
    const target = bucket.get(monthKey)
    if (!target) return
    const key =
      lancamento.tipo === "receita"
        ? lancamento.status === "realizado"
          ? "Receita Realizada"
          : "Receita Programada"
        : lancamento.status === "realizado"
          ? "Despesa Realizada"
          : "Despesa Programada"
    ;(target as any)[key] += lancamento.valor
  })

  return months
}

function buildDistribution(lancamentos: FinanceiroLancamentoItem[], tipos: FinanceiroLancamentoTipo[], labelFallback: string) {
  const grouped = new Map<string, number>()
  lancamentos.filter((item) => tipos.includes(item.tipo) && item.status !== "cancelado").forEach((item) => {
    const key = item.categoria || item.origem || labelFallback
    grouped.set(key, (grouped.get(key) || 0) + item.valor)
  })
  const entries = Array.from(grouped.entries()).map(([nome, valor], index) => ({ nome, valor, cor: CHART_COLORS[index % CHART_COLORS.length] }))
  return entries.length > 0 ? entries : [{ nome: labelFallback, valor: 0, cor: CHART_COLORS[0] }]
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

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  iconBg,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  iconBg: string
}) {
  return (
    <Card className={`border-l-4 ${colorClass}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1 leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`flex-shrink-0 rounded-xl p-2.5 ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emissao</Label>
                <Input type="date" value={form.dataEmissao} onChange={(e) => setForm((prev) => ({ ...prev, dataEmissao: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vencimento</Label>
                <Input type="date" value={form.dataVencimento} onChange={(e) => setForm((prev) => ({ ...prev, dataVencimento: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor do servico</Label>
                <Input value={form.valorServico} onChange={(e) => setForm((prev) => ({ ...prev, valorServico: e.target.value }))} placeholder="0,00" />
              </div>
            </div>

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
                      <TableCell className="font-mono text-sm">{item.numero}</TableCell>
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

const PAGE_SIZE_RELATORIOS = 20

type RelatoriosFiltros = {
  dataInicio: string
  dataFim: string
  tipo: FinanceiroLancamentoTipo | "todos"
  categoriaId: string
  status: "todos" | "programado" | "realizado" | "cancelado"
  busca: string
}

function buildFiltrosIniciais(): RelatoriosFiltros {
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { dataInicio: primeiroDia, dataFim: ultimoDia, tipo: "todos", categoriaId: "todos", status: "todos", busca: "" }
}

type FluxoCaixaSectionProps = {
  lancamentos: FinanceiroLancamentoItem[]
  categorias: FinanceiroCategoriaItem[]
  clientes: ClienteInput[]
  fornecedores: FornecedorSupabaseItem[]
  fluxoForm: FluxoForm
  setFluxoForm: React.Dispatch<React.SetStateAction<FluxoForm>>
  categoriasFluxo: FinanceiroCategoriaItem[]
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
  onDarBaixa,
  onCancelar,
  onExcluir,
}: {
  item: FinanceiroLancamentoItem
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
              {item.formaPagamento ? <span className="capitalize">{item.formaPagamento.replace("_", " ")}</span> : null}
            </div>
            {!isRealizado && !isCancelado ? (
              <div className="mt-1.5"><UrgenciaBadge dataVencimento={item.dataVencimento} /></div>
            ) : null}
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-bold ${item.tipo === "receita" ? "text-green-700" : isCancelado ? "text-muted-foreground line-through" : "text-red-700"}`}>
              {item.tipo === "receita" ? "+" : "-"}{formatCurrency(item.valor)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          {item.status === "programado" ? (
            <>
              <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={() => void onDarBaixa(item)}>
                <CheckCircle2 className="h-3.5 w-3.5" />Dar Baixa
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs text-amber-700 border-amber-300 hover:bg-amber-50 gap-1.5" onClick={() => void onCancelar(item)}>
                <Clock className="h-3.5 w-3.5" />Cancelar
              </Button>
            </>
          ) : null}
          {isRealizado ? (
            <span className="text-xs text-green-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />Baixa realizada
            </span>
          ) : null}
          {isCancelado ? (
            <span className="text-xs text-muted-foreground font-medium">Cancelado</span>
          ) : null}
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5" onClick={() => void onExcluir(item.id)}>
              <Trash2 className="h-3.5 w-3.5" />Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const PAGE_SIZE_FLUXO = 20

function FluxoCaixaSection({
  lancamentos,
  categorias,
  clientes,
  fornecedores,
  fluxoForm,
  setFluxoForm,
  categoriasFluxo,
  onSalvar,
  onExcluir,
  onDarBaixa,
  onCancelar,
}: FluxoCaixaSectionProps) {
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "programado" | "realizado" | "cancelado">("todos")
  const [filtroTipo, setFiltroTipo] = useState<"todos" | FinanceiroLancamentoTipo>("todos")
  const [filtroOrigem, setFiltroOrigem] = useState<string>("todos")
  const [buscaMovim, setBuscaMovim] = useState("")
  const [dataInicioMovim, setDataInicioMovim] = useState("")
  const [dataFimMovim, setDataFimMovim] = useState("")
  const [paginaMovim, setPaginaMovim] = useState(1)

  const isTipoEntrada = fluxoForm.tipo === "receita"

  const totalEntradas = lancamentos.filter((i) => i.tipo === "receita" && i.status === "realizado").reduce((s, i) => s + i.valor, 0)
  const totalSaidas = lancamentos.filter((i) => i.tipo !== "receita" && i.status === "realizado").reduce((s, i) => s + i.valor, 0)
  const totalProgramado = lancamentos.filter((i) => i.status === "programado").reduce((s, i) => s + (i.tipo === "receita" ? i.valor : -i.valor), 0)
  const saldoRealizado = totalEntradas - totalSaidas

  const origensDisponiveis = useMemo(() => {
    const set = new Set(lancamentos.map((i) => i.origem).filter(Boolean))
    return Array.from(set)
  }, [lancamentos])

  const movimentacoesFiltradas = useMemo(() => {
    return lancamentos.filter((item) => {
      if (filtroStatus !== "todos" && item.status !== filtroStatus) return false
      if (filtroTipo !== "todos" && item.tipo !== filtroTipo) return false
      if (filtroOrigem !== "todos" && item.origem !== filtroOrigem) return false
      if (dataInicioMovim) {
        const ref = item.dataVencimento || item.dataCompetencia
        if (!ref || ref < dataInicioMovim) return false
      }
      if (dataFimMovim) {
        const ref = item.dataVencimento || item.dataCompetencia
        if (!ref || ref > dataFimMovim) return false
      }
      if (buscaMovim.trim()) {
        const term = buscaMovim.trim().toLowerCase()
        if (![item.descricao, item.categoria, item.clienteNome, item.fornecedorNome, item.contratoNumero, item.origem].join(" ").toLowerCase().includes(term)) return false
      }
      return true
    })
  }, [lancamentos, filtroStatus, filtroTipo, filtroOrigem, dataInicioMovim, dataFimMovim, buscaMovim])

  const totalPaginasMovim = Math.max(1, Math.ceil(movimentacoesFiltradas.length / PAGE_SIZE_FLUXO))
  const paginaAtualMovim = Math.min(paginaMovim, totalPaginasMovim)
  const itensPaginaMovim = movimentacoesFiltradas.slice((paginaAtualMovim - 1) * PAGE_SIZE_FLUXO, paginaAtualMovim * PAGE_SIZE_FLUXO)

  const resetFiltros = () => {
    setFiltroStatus("todos"); setFiltroTipo("todos"); setFiltroOrigem("todos"); setBuscaMovim(""); setDataInicioMovim(""); setDataFimMovim(""); setPaginaMovim(1)
  }

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
            <p className="text-xs text-muted-foreground mt-0.5">{lancamentos.filter((i) => i.tipo === "receita" && i.status === "realizado").length} lancamentos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saidas realizadas</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(totalSaidas)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{lancamentos.filter((i) => i.tipo !== "receita" && i.status === "realizado").length} lancamentos</p>
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
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 h-5">{lancamentos.length}</Badge>
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

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status inicial</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "programado", label: "Programado (a pagar/receber)" },
                      { value: "realizado",  label: "Ja realizado" },
                    ] as const).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFluxoForm((prev) => ({ ...prev, status: value }))}
                        className={`rounded-lg border-2 px-3 py-2.5 text-xs font-semibold transition-all ${
                          fluxoForm.status === value
                            ? value === "realizado"
                              ? "border-green-300 bg-green-50 text-green-700 shadow-sm"
                              : "border-amber-300 bg-amber-50 text-amber-700 shadow-sm"
                            : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

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
        <TabsContent value="movimentacoes" className="mt-6 space-y-4">

          {/* Filtros */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Filtros</span>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={resetFiltros}>
                  Limpar filtros
                </Button>
              </div>

              <div className="space-y-3">
                {/* Busca */}
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={buscaMovim}
                    onChange={(e) => { setBuscaMovim(e.target.value); setPaginaMovim(1) }}
                    placeholder="Buscar por descricao, cliente, fornecedor..."
                  />
                </div>

                {/* Período */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Período:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground">De</label>
                      <Input
                        type="date"
                        className="h-8 w-36 text-xs"
                        value={dataInicioMovim}
                        onChange={(e) => { setDataInicioMovim(e.target.value); setPaginaMovim(1) }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground">Até</label>
                      <Input
                        type="date"
                        className="h-8 w-36 text-xs"
                        value={dataFimMovim}
                        onChange={(e) => { setDataFimMovim(e.target.value); setPaginaMovim(1) }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filtros em pills */}
                <div className="flex flex-wrap gap-y-2 gap-x-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                    {(["todos", "programado", "realizado", "cancelado"] as const).map((s) => (
                      <button key={s} type="button" onClick={() => { setFiltroStatus(s); setPaginaMovim(1) }}
                        className={`text-xs rounded-full px-2.5 py-0.5 font-medium border transition-colors ${filtroStatus === s ? "bg-foreground text-background border-foreground" : "text-muted-foreground border-border hover:bg-muted"}`}>
                        {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Tipo:</span>
                    {(["todos", "receita", "despesa", "investimento"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => { setFiltroTipo(t); setPaginaMovim(1) }}
                        className={`text-xs rounded-full px-2.5 py-0.5 font-medium border transition-colors ${filtroTipo === t ? "bg-foreground text-background border-foreground" : "text-muted-foreground border-border hover:bg-muted"}`}>
                        {t === "todos" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                  {origensDisponiveis.length > 1 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">Origem:</span>
                      <button type="button" onClick={() => { setFiltroOrigem("todos"); setPaginaMovim(1) }}
                        className={`text-xs rounded-full px-2.5 py-0.5 font-medium border transition-colors ${filtroOrigem === "todos" ? "bg-foreground text-background border-foreground" : "text-muted-foreground border-border hover:bg-muted"}`}>
                        Todas
                      </button>
                      {origensDisponiveis.map((o) => (
                        <button key={o} type="button" onClick={() => { setFiltroOrigem(o); setPaginaMovim(1) }}
                          className={`text-xs rounded-full px-2.5 py-0.5 font-medium border transition-colors ${filtroOrigem === o ? "bg-foreground text-background border-foreground" : "text-muted-foreground border-border hover:bg-muted"}`}>
                          {o.charAt(0).toUpperCase() + o.slice(1).replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cabeçalho da lista */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {movimentacoesFiltradas.length} movimentacao{movimentacoesFiltradas.length !== 1 ? "es" : ""}
              {movimentacoesFiltradas.length > PAGE_SIZE_FLUXO && <> &middot; pagina {paginaAtualMovim} de {totalPaginasMovim}</>}
            </p>
            {totalPaginasMovim > 1 ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3" disabled={paginaAtualMovim <= 1} onClick={() => setPaginaMovim((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <span className="text-sm text-muted-foreground">{paginaAtualMovim}/{totalPaginasMovim}</span>
                <Button variant="outline" size="sm" className="h-8 px-3" disabled={paginaAtualMovim >= totalPaginasMovim} onClick={() => setPaginaMovim((p) => p + 1)}>
                  Proxima<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : null}
          </div>

          {/* Lista */}
          {itensPaginaMovim.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-25" />
                <p className="text-sm font-medium">Nenhuma movimentacao encontrada</p>
                <p className="text-xs mt-1">Ajuste os filtros ou registre um novo lancamento</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {itensPaginaMovim.map((item) => (
                <MovimentacaoCard key={item.id} item={item} onDarBaixa={onDarBaixa} onCancelar={onCancelar} onExcluir={onExcluir} />
              ))}
            </div>
          )}

          {/* Paginação rodapé */}
          {totalPaginasMovim > 1 ? (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Exibindo {((paginaAtualMovim - 1) * PAGE_SIZE_FLUXO) + 1}–{Math.min(paginaAtualMovim * PAGE_SIZE_FLUXO, movimentacoesFiltradas.length)} de {movimentacoesFiltradas.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3" disabled={paginaAtualMovim <= 1} onClick={() => setPaginaMovim((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3" disabled={paginaAtualMovim >= totalPaginasMovim} onClick={() => setPaginaMovim((p) => p + 1)}>
                  Proxima<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </>
  )
}

function RelatoriosSection({
  lancamentos,
  categorias,
  onExcluir,
}: {
  lancamentos: FinanceiroLancamentoItem[]
  categorias: FinanceiroCategoriaItem[]
  onExcluir: (id: string) => Promise<void>
}) {
  const [filtros, setFiltros] = useState<RelatoriosFiltros>(buildFiltrosIniciais)
  const [pagina, setPagina] = useState(1)

  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((item) => {
      if (filtros.tipo !== "todos" && item.tipo !== filtros.tipo) return false
      if (filtros.status !== "todos" && item.status !== filtros.status) return false
      if (filtros.categoriaId !== "todos" && item.categoriaId !== filtros.categoriaId) return false
      if (filtros.dataInicio) {
        const venc = item.dataVencimento || item.dataCompetencia || ""
        if (venc < filtros.dataInicio) return false
      }
      if (filtros.dataFim) {
        const venc = item.dataVencimento || item.dataCompetencia || ""
        if (venc > filtros.dataFim) return false
      }
      if (filtros.busca.trim()) {
        const term = filtros.busca.trim().toLowerCase()
        const haystack = [item.descricao, item.categoria, item.clienteNome, item.fornecedorNome, item.contratoNumero, item.documentoNumero, item.status, item.tipo].join(" ").toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [lancamentos, categorias, filtros])

  const totalPaginas = Math.max(1, Math.ceil(lancamentosFiltrados.length / PAGE_SIZE_RELATORIOS))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const itensPagina = lancamentosFiltrados.slice((paginaAtual - 1) * PAGE_SIZE_RELATORIOS, paginaAtual * PAGE_SIZE_RELATORIOS)

  const totalReceitas = lancamentosFiltrados.filter((i) => i.tipo === "receita").reduce((s, i) => s + i.valor, 0)
  const totalDespesas = lancamentosFiltrados.filter((i) => i.tipo !== "receita").reduce((s, i) => s + i.valor, 0)
  const saldo = totalReceitas - totalDespesas

  const limparFiltros = () => { setFiltros(buildFiltrosIniciais()); setPagina(1) }
  const setFiltro = <K extends keyof RelatoriosFiltros>(key: K, value: RelatoriosFiltros[K]) => {
    setFiltros((prev) => ({ ...prev, [key]: value }))
    setPagina(1)
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatorios Financeiros</h1>
          <p className="text-sm text-muted-foreground">Filtre e analise todos os lancamentos do sistema.</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filtros</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Periodo — Inicio</Label>
              <Input type="date" value={filtros.dataInicio} onChange={(e) => setFiltro("dataInicio", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Periodo — Fim</Label>
              <Input type="date" value={filtros.dataFim} onChange={(e) => setFiltro("dataFim", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo</Label>
              <Select value={filtros.tipo} onValueChange={(v) => setFiltro("tipo", v as RelatoriosFiltros["tipo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</Label>
              <Select value={filtros.categoriaId} onValueChange={(v) => setFiltro("categoriaId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
              <Select value={filtros.status} onValueChange={(v) => setFiltro("status", v as RelatoriosFiltros["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Busca livre</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input className="pl-9" value={filtros.busca} onChange={(e) => setFiltro("busca", e.target.value)} placeholder="Descricao, cliente, contrato..." />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totalizadores */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Receitas</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(totalReceitas)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{lancamentosFiltrados.filter((i) => i.tipo === "receita").length} lancamentos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Saidas</p>
            <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(totalDespesas)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{lancamentosFiltrados.filter((i) => i.tipo !== "receita").length} lancamentos</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${saldo >= 0 ? "border-l-blue-500" : "border-l-red-500"}`}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo do Periodo</p>
            <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatCurrency(saldo)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{lancamentosFiltrados.length} lancamentos no total</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela paginada */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base">Lancamentos</CardTitle>
              <CardDescription>
                {lancamentosFiltrados.length} resultado{lancamentosFiltrados.length !== 1 ? "s" : ""}
                {lancamentosFiltrados.length > PAGE_SIZE_RELATORIOS && (
                  <> &middot; pagina {paginaAtual} de {totalPaginas}</>
                )}
              </CardDescription>
            </div>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3" disabled={paginaAtual <= 1} onClick={() => setPagina((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <span className="text-sm text-muted-foreground">{paginaAtual} / {totalPaginas}</span>
                <Button variant="outline" size="sm" className="h-8 px-3" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                  Proxima<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Tipo</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vinculo</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right pr-6">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itensPagina.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-14 text-muted-foreground">
                    Nenhum lancamento encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                itensPagina.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20">
                    <TableCell className="pl-6"><TipoBadge tipo={item.tipo} /></TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{item.descricao}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.categoria || "—"}</TableCell>
                    <TableCell className="text-sm">{item.clienteNome || item.fornecedorNome || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{formatDate(item.dataVencimento)}</span>
                        {item.status === "programado" && <UrgenciaBadge dataVencimento={item.dataVencimento} />}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className={`text-right font-semibold ${item.tipo === "receita" ? "text-green-700" : "text-red-700"}`}>
                      {item.tipo === "receita" ? "+" : "-"}{formatCurrency(item.valor)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => void onExcluir(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Exibindo {((paginaAtual - 1) * PAGE_SIZE_RELATORIOS) + 1}–{Math.min(paginaAtual * PAGE_SIZE_RELATORIOS, lancamentosFiltrados.length)} de {lancamentosFiltrados.length} lancamentos
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 px-3" disabled={paginaAtual <= 1} onClick={() => setPagina((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />Anterior
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                Proxima<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  )
}

export default function FinanceiroPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaFinanceira>("dashboard")
  const [clientes, setClientes] = useState<ClienteInput[]>([])
  const [contratos, setContratos] = useState<ContratoSupabaseItem[]>([])
  const [fornecedores, setFornecedores] = useState<FornecedorSupabaseItem[]>([])
  const [categorias, setCategorias] = useState<FinanceiroCategoriaItem[]>([])
  const [lancamentos, setLancamentos] = useState<FinanceiroLancamentoItem[]>([])
  const [documentos, setDocumentos] = useState<FinanceiroDocumentoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [boletoForm, setBoletoForm] = useState<DocumentoEmitirForm>(buildDocumentoInitialForm)
  const [nfForm, setNfForm] = useState<DocumentoEmitirForm>(buildDocumentoInitialForm)
  const [fluxoForm, setFluxoForm] = useState<FluxoForm>(buildFluxoInitialForm)
  const [categoriaForm, setCategoriaForm] = useState<FinanceiroCategoriaInput>({ nome: "", tipo: "despesa", descricao: "", ativo: true })

  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      try {
        const [clientesResult, contratosRows, fornecedoresRows, categoriasRows, lancamentosRows, documentosRows] = await Promise.all([
          listClientesSupabase({ pageSize: 100 }),
          listContratosSupabase(),
          listFornecedoresSupabase(),
          listFinanceiroCategoriasSupabase(),
          listFinanceiroLancamentosSupabase(),
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
        setLancamentos(lancamentosRows)
        setDocumentos(documentosRows)
        setPageError("")
      } catch (error) {
        if (mounted) setPageError(getErrorMessage(error))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void loadData()
    return () => {
      mounted = false
    }
  }, [])

  const resumo = useMemo(() => {
    const entradasRealizadas = lancamentos.filter((item) => item.tipo === "receita" && item.status === "realizado").reduce((sum, item) => sum + item.valor, 0)
    const entradasProgramadas = lancamentos.filter((item) => item.tipo === "receita" && item.status === "programado").reduce((sum, item) => sum + item.valor, 0)
    const saidasRealizadas = lancamentos.filter((item) => item.tipo !== "receita" && item.status === "realizado").reduce((sum, item) => sum + item.valor, 0)
    const saidasProgramadas = lancamentos.filter((item) => item.tipo !== "receita" && item.status === "programado").reduce((sum, item) => sum + item.valor, 0)
    return {
      entradasRealizadas,
      entradasProgramadas,
      saidasRealizadas,
      saidasProgramadas,
      saldoTotal: entradasRealizadas + entradasProgramadas - saidasRealizadas - saidasProgramadas,
    }
  }, [lancamentos])

  const monthlyData = useMemo(() => buildMonthlyData(lancamentos), [lancamentos])
  const distribuicaoEntradas = useMemo(() => buildDistribution(lancamentos, ["receita"], "Entradas"), [lancamentos])
  const distribuicaoSaidas = useMemo(() => buildDistribution(lancamentos, ["despesa", "investimento"], "Saidas"), [lancamentos])
  const boletos = useMemo(() => documentos.filter((item) => item.tipo === "boleto"), [documentos])
  const notasFiscais = useMemo(() => documentos.filter((item) => item.tipo === "nota_fiscal"), [documentos])
  const categoriasReceita = useMemo(() => categorias.filter((item) => item.tipo === "receita" && item.ativo), [categorias])
  const categoriasFluxo = useMemo(() => categorias.filter((item) => item.tipo === fluxoForm.tipo && item.ativo), [categorias, fluxoForm.tipo])
  const proximosVencimentos = useMemo(
    () =>
      [...lancamentos]
        .filter((item) => item.status === "programado")
        .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
        .slice(0, 8),
    [lancamentos],
  )

  const emitDocument = async (tipo: FinanceiroDocumentoTipo, form: DocumentoEmitirForm) => {
    const cliente = clientes.find((item) => String(item.id) === form.clienteId)
    if (!cliente) return setPageError("Selecione um cliente para emitir o documento.")
    const valor = toNumber(form.valorServico)
    if (!form.descricao.trim() || !valor || !form.dataVencimento) return setPageError("Preencha cliente, descricao, vencimento e valor do servico.")
    try {
      const categoriaSelecionada = categorias.find((item) => item.id === form.categoriaId)
      const lancamento = await upsertFinanceiroLancamentoSupabase({
        tipo: "receita",
        status: "programado",
        origem: tipo,
        descricao: form.descricao.trim(),
        categoriaId: form.categoriaId,
        categoria: categoriaSelecionada?.nome,
        valor,
        dataCompetencia: form.dataEmissao,
        dataVencimento: form.dataVencimento,
        clienteId: form.clienteId,
        contratoId: form.contratoId || undefined,
        documentoTipo: tipo,
        documentoNumero: form.numero,
        notificacaoEmail: form.notificacaoEmail,
        notificacaoWhatsapp: form.notificacaoWhatsapp,
        apiIntegracaoStatus: "nao_enviado",
        observacoes: form.observacoes,
      })
      const documento = await upsertFinanceiroDocumentoSupabase({
        lancamentoId: lancamento.id,
        tipo,
        status: "pendente",
        clienteId: form.clienteId,
        contratoId: form.contratoId || undefined,
        descricao: form.descricao.trim(),
        numero: form.numero || `${tipo === "boleto" ? "BLT" : "NF"}-${Date.now()}`,
        serie: form.serie,
        chaveDocumento: form.chaveDocumento,
        linhaDigitavel: form.linhaDigitavel,
        dataEmissao: form.dataEmissao,
        dataVencimento: form.dataVencimento,
        valor,
        valorServico: valor,
        notificacaoEmail: form.notificacaoEmail,
        notificacaoWhatsapp: form.notificacaoWhatsapp,
        apiIntegracaoStatus: "nao_enviado",
        observacoes: form.observacoes,
      })
      setLancamentos((prev) => [lancamento, ...prev.filter((item) => item.id !== lancamento.id)])
      setDocumentos((prev) => [documento, ...prev.filter((item) => item.id !== documento.id)])

      if (tipo === "boleto") {
        try {
          await fetch("https://eazytech-n8n.gsl3ku.easypanel.host/webhook/d2af06ee-ccc9-449d-bb2c-feb6fe8de0d4", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "boleto",
              documentoId: documento.id,
              lancamentoId: lancamento.id,
              clienteId: form.clienteId,
              clienteNome: cliente.nome,
              clienteEmail: cliente.email || null,
              clienteTelefone: cliente.telefone || null,
              clienteCnpj: cliente.cnpj || null,
              clienteCpf: cliente.cpf || null,
              contratoId: form.contratoId || null,
              descricao: form.descricao.trim(),
              valor,
              dataEmissao: form.dataEmissao,
              dataVencimento: form.dataVencimento,
              notificacaoEmail: form.notificacaoEmail,
              notificacaoWhatsapp: form.notificacaoWhatsapp,
              observacoes: form.observacoes || null,
              geradoEm: new Date().toISOString(),
            }),
          })
        } catch (webhookErr) {
          console.warn("Webhook boleto falhou (dados salvos no banco):", webhookErr)
        }
        setBoletoForm(buildDocumentoInitialForm())
      }

      if (tipo === "nota_fiscal") setNfForm(buildDocumentoInitialForm())
      setPageError("")
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const handleSalvarFluxo = async () => {
    const valor = toNumber(fluxoForm.valor)
    if (!fluxoForm.descricao.trim() || !valor || !fluxoForm.dataCompetencia || !fluxoForm.dataVencimento) {
      setPageError("Preencha descricao, valor, competencia e vencimento.")
      return
    }
    try {
      const categoriaSelecionada = categorias.find((item) => item.id === fluxoForm.categoriaId)
      const saved = await upsertFinanceiroLancamentoSupabase({
        tipo: fluxoForm.tipo,
        status: fluxoForm.status,
        origem: "manual",
        descricao: fluxoForm.descricao.trim(),
        categoriaId: fluxoForm.categoriaId,
        categoria: categoriaSelecionada?.nome,
        valor,
        dataCompetencia: fluxoForm.dataCompetencia,
        dataVencimento: fluxoForm.dataVencimento,
        clienteId: fluxoForm.tipo === "receita" ? fluxoForm.clienteId : undefined,
        fornecedorId: fluxoForm.tipo !== "receita" ? fluxoForm.fornecedorId : undefined,
        formaPagamento: fluxoForm.formaPagamento,
        notificacaoEmail: fluxoForm.notificacaoEmail,
        notificacaoWhatsapp: fluxoForm.notificacaoWhatsapp,
        apiIntegracaoStatus: "nao_enviado",
        observacoes: fluxoForm.observacoes,
      })
      setLancamentos((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)])

      // Boleto webhook quando forma de pagamento = boleto e cliente selecionado
      if (fluxoForm.formaPagamento === "boleto" && fluxoForm.clienteId) {
        const cliente = clientes.find((c) => String(c.id) === fluxoForm.clienteId)
        if (cliente) {
          try {
            await fetch("https://eazytech-n8n.gsl3ku.easypanel.host/webhook/d2af06ee-ccc9-449d-bb2c-feb6fe8de0d4", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tipo: "boleto",
                lancamentoId: saved.id,
                clienteId: String(cliente.id),
                clienteNome: cliente.nome,
                clienteEmail: cliente.email || null,
                clienteTelefone: cliente.telefone || null,
                clienteCnpj: cliente.cnpj || null,
                clienteCpf: cliente.cpf || null,
                descricao: saved.descricao,
                valor,
                dataEmissao: fluxoForm.dataCompetencia,
                dataVencimento: fluxoForm.dataVencimento,
                notificacaoEmail: fluxoForm.notificacaoEmail,
                notificacaoWhatsapp: fluxoForm.notificacaoWhatsapp,
                observacoes: fluxoForm.observacoes || null,
                geradoEm: new Date().toISOString(),
              }),
            })
          } catch (webhookErr) {
            console.warn("Webhook boleto falhou (lancamento salvo):", webhookErr)
          }
        }
      }

      setFluxoForm(buildFluxoInitialForm())
      setPageError("")
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const handleDarBaixa = async (item: FinanceiroLancamentoItem) => {
    const ok = window.confirm(`Confirmar baixa de "${item.descricao}" (${formatCurrency(item.valor)})?`)
    if (!ok) return
    try {
      const saved = await upsertFinanceiroLancamentoSupabase({
        id: item.id,
        tipo: item.tipo,
        status: "realizado",
        origem: item.origem,
        descricao: item.descricao,
        categoriaId: item.categoriaId,
        valor: item.valor,
        dataCompetencia: item.dataCompetencia,
        dataVencimento: item.dataVencimento,
        dataLiquidacao: todayIso(),
        clienteId: item.clienteId,
        fornecedorId: item.fornecedorId,
        observacoes: item.observacoes,
      })
      setLancamentos((prev) => prev.map((l) => (l.id === saved.id ? saved : l)))
      setPageError("")
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const handleCancelarLancamento = async (item: FinanceiroLancamentoItem) => {
    const ok = window.confirm(`Cancelar o lancamento "${item.descricao}"?`)
    if (!ok) return
    try {
      const saved = await upsertFinanceiroLancamentoSupabase({
        id: item.id,
        tipo: item.tipo,
        status: "cancelado",
        origem: item.origem,
        descricao: item.descricao,
        categoriaId: item.categoriaId,
        valor: item.valor,
        dataCompetencia: item.dataCompetencia,
        dataVencimento: item.dataVencimento,
        clienteId: item.clienteId,
        fornecedorId: item.fornecedorId,
        observacoes: item.observacoes,
      })
      setLancamentos((prev) => prev.map((l) => (l.id === saved.id ? saved : l)))
      setPageError("")
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
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
      setLancamentos((prev) => prev.filter((item) => item.id !== id))
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
      items: [{ value: "dashboard" as AbaFinanceira, label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Documentos",
      items: [
        { value: "boleto" as AbaFinanceira, label: "Emissao de Boleto", icon: Receipt },
        { value: "nf" as AbaFinanceira, label: "Emissao de NF", icon: FileText },
      ],
    },
    {
      label: "Gestao",
      items: [
        { value: "relatorios" as AbaFinanceira, label: "Relatorios", icon: BarChart3 },
        { value: "fluxo" as AbaFinanceira, label: "Fluxo de Caixa", icon: Wallet },
        { value: "categorias" as AbaFinanceira, label: "Categorias", icon: Tag },
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
            <>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard Financeiro</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Saude financeira do negocio — entradas, saidas e saldo projetado.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <KpiCard title="Receita Realizada" value={formatCurrency(resumo.entradasRealizadas)} subtitle="Entradas liquidadas" icon={ArrowUpCircle} colorClass="border-l-green-500" iconBg="bg-green-100 text-green-700" />
                <KpiCard title="Receita Programada" value={formatCurrency(resumo.entradasProgramadas)} subtitle="Em aberto" icon={Calendar} colorClass="border-l-emerald-400" iconBg="bg-emerald-100 text-emerald-700" />
                <KpiCard title="Saida Realizada" value={formatCurrency(resumo.saidasRealizadas)} subtitle="Despesas pagas" icon={ArrowDownCircle} colorClass="border-l-red-500" iconBg="bg-red-100 text-red-700" />
                <KpiCard title="Saida Programada" value={formatCurrency(resumo.saidasProgramadas)} subtitle="Compromissos futuros" icon={Wallet} colorClass="border-l-orange-400" iconBg="bg-orange-100 text-orange-700" />
                <KpiCard title="Saldo Projetado" value={formatCurrency(resumo.saldoTotal)} subtitle="Entradas menos saidas" icon={DollarSign} colorClass={resumo.saldoTotal >= 0 ? "border-l-blue-500" : "border-l-red-500"} iconBg="bg-blue-100 text-blue-700" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Evolucao mensal</CardTitle>
                    <CardDescription>Receitas e despesas realizadas nos ultimos 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="receita" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="despesa" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Area type="monotone" dataKey="Receita Realizada" stroke="#16a34a" strokeWidth={2} fill="url(#receita)" />
                          <Area type="monotone" dataKey="Despesa Realizada" stroke="#dc2626" strokeWidth={2} fill="url(#despesa)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Comparativo de caixa</CardTitle>
                    <CardDescription>Realizado vs. programado por mes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="Receita Realizada" fill="#16a34a" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Receita Programada" fill="#86efac" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Despesa Realizada" fill="#dc2626" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Despesa Programada" fill="#fca5a5" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Distribuicao de entradas</CardTitle>
                    <CardDescription>Por categoria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="h-[200px] w-[200px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={distribuicaoEntradas} dataKey="valor" nameKey="nome" outerRadius={80} innerRadius={48}>
                              {distribuicaoEntradas.map((entry, index) => (
                                <Cell key={`${entry.nome}-${index}`} fill={entry.cor} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-2 min-w-0">
                        {distribuicaoEntradas.map((entry) => (
                          <div key={entry.nome} className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: entry.cor }} />
                            <span className="text-sm truncate">{entry.nome}</span>
                            <span className="text-sm font-medium ml-auto pl-2">{formatCurrency(entry.valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Distribuicao de saidas</CardTitle>
                    <CardDescription>Por categoria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="h-[200px] w-[200px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={distribuicaoSaidas} dataKey="valor" nameKey="nome" outerRadius={80} innerRadius={48}>
                              {distribuicaoSaidas.map((entry, index) => (
                                <Cell key={`${entry.nome}-${index}`} fill={entry.cor} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-2 min-w-0">
                        {distribuicaoSaidas.map((entry) => (
                          <div key={entry.nome} className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: entry.cor }} />
                            <span className="text-sm truncate">{entry.nome}</span>
                            <span className="text-sm font-medium ml-auto pl-2">{formatCurrency(entry.valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                      const due = new Date(`${item.dataVencimento}T00:00:00`)
                      const diff = differenceInDays(due, today)
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
            </>
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
            <EmissaoSection
              tipo="nota_fiscal"
              title="Emissao de Nota Fiscal"
              description="Registre os dados da NF, vincule ao contrato e salve para a integracao."
              form={nfForm}
              setForm={setNfForm}
              clientes={clientes}
              contratos={contratos}
              categorias={categoriasReceita}
              documentos={notasFiscais}
              onEmitir={() => void emitDocument("nota_fiscal", nfForm)}
              onDelete={(id) => void handleExcluirDocumento(id)}
            />
          ) : null}

          {/* ── RELATORIOS ────────────────────────────────────────── */}
          {!loading && abaAtiva === "relatorios" ? (
            <RelatoriosSection
              lancamentos={lancamentos}
              categorias={categorias}
              onExcluir={handleExcluirLancamento}
            />
          ) : null}

          {/* ── FLUXO DE CAIXA ────────────────────────────────────── */}
          {!loading && abaAtiva === "fluxo" ? (
            <FluxoCaixaSection
              lancamentos={lancamentos}
              categorias={categorias}
              clientes={clientes}
              fornecedores={fornecedores}
              fluxoForm={fluxoForm}
              setFluxoForm={setFluxoForm}
              categoriasFluxo={categoriasFluxo}
              onSalvar={() => void handleSalvarFluxo()}
              onExcluir={handleExcluirLancamento}
              onDarBaixa={handleDarBaixa}
              onCancelar={handleCancelarLancamento}
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
    </div>
  )
}
