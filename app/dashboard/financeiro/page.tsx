"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Search,
  Trash2,
  Wallet,
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
  XAxis,
  YAxis,
} from "recharts"

import { ErpHeader } from "@/components/erp-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { listClientesSupabase, type ClienteInput } from "@/lib/supabase/clientes-repo"
import { listContratosSupabase, type ContratoSupabaseItem } from "@/lib/supabase/contratos-repo"
import {
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

type AbaFinanceira = "dashboard" | "boleto" | "nf" | "relatorios" | "fluxo"

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

const COLORS = ["#15803d", "#22c55e", "#dc2626", "#f97316", "#2563eb", "#7c3aed"]

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
  return Number(String(value || "0").replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
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
    return { key, mes: format(current, "MMM", { locale: ptBR }), entradaRealizada: 0, entradaProgramada: 0, saidaRealizada: 0, saidaProgramada: 0 }
  })
  const bucket = new Map(months.map((item) => [item.key, item]))

  lancamentos.forEach((lancamento) => {
    const monthKey = (lancamento.dataCompetencia || lancamento.dataVencimento).slice(0, 7)
    const target = bucket.get(monthKey)
    if (!target) return
    const key =
      lancamento.tipo === "receita"
        ? lancamento.status === "realizado"
          ? "entradaRealizada"
          : "entradaProgramada"
        : lancamento.status === "realizado"
          ? "saidaRealizada"
          : "saidaProgramada"
    target[key] += lancamento.valor
  })

  return months
}

function buildDistribution(lancamentos: FinanceiroLancamentoItem[], tipos: FinanceiroLancamentoTipo[], labelFallback: string) {
  const grouped = new Map<string, number>()
  lancamentos.filter((item) => tipos.includes(item.tipo) && item.status !== "cancelado").forEach((item) => {
    const key = item.categoria || item.origem || labelFallback
    grouped.set(key, (grouped.get(key) || 0) + item.valor)
  })
  const entries = Array.from(grouped.entries()).map(([nome, valor], index) => ({ nome, valor, cor: COLORS[index % COLORS.length] }))
  return entries.length > 0 ? entries : [{ nome: labelFallback, valor: 0, cor: COLORS[0] }]
}

function getContratoAtual(contratos: ContratoSupabaseItem[], clienteId: string) {
  const today = todayIso()
  return contratos.find((contrato) => contrato.clienteId === clienteId && contrato.status === "ativo" && (!contrato.dataInicio || !contrato.dataTermino || (contrato.dataInicio <= today && contrato.dataTermino >= today))) || null
}

function ResumoCard({ title, value, subtitle, icon: Icon, className }: { title: string; value: string; subtitle: string; icon: React.ComponentType<{ className?: string }>; className: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs mt-1 opacity-80">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function DistributionCard({ title, data }: { title: string; data: Array<{ nome: string; valor: number; cor: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ total: { label: title, color: COLORS[0] } }} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="valor" nameKey="nome" outerRadius={90}>
                {data.map((entry, index) => (
                  <Cell key={`${entry.nome}-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
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
  filterTerm: string
  setFilterTerm: React.Dispatch<React.SetStateAction<string>>
  onEmitir: () => void
  onDelete: (id: string) => void
}

function EmissaoSection({ tipo, title, description, form, setForm, clientes, contratos, categorias, documentos, filterTerm, setFilterTerm, onEmitir, onDelete }: EmissaoSectionProps) {
  const clientesFiltrados = useMemo(() => {
    const term = filterTerm.trim().toLowerCase()
    if (!term) return clientes
    return clientes.filter((cliente) => [cliente.nome, cliente.email, cliente.telefone, cliente.cnpj, cliente.cpf].join(" ").toLowerCase().includes(term))
  }, [clientes, filterTerm])

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px,1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clientes cadastrados</CardTitle>
            <CardDescription>Selecione o cliente para a emissao.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-10" placeholder="Filtrar por nome, email ou telefone..." value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} />
            </div>
            <div className="space-y-2 max-h-[520px] overflow-auto">
              {clientesFiltrados.map((cliente) => (
                <button
                  key={String(cliente.id)}
                  type="button"
                  className={`w-full rounded-lg border p-3 text-left transition ${form.clienteId === String(cliente.id) ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                  onClick={() => setForm((prev) => ({ ...prev, clienteId: String(cliente.id), contratoId: getContratoAtual(contratos, String(cliente.id))?.id || "" }))}
                >
                  <p className="font-medium">{cliente.nome}</p>
                  <p className="text-xs text-muted-foreground">{cliente.email || cliente.telefone || "Sem contato"}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tipo === "boleto" ? "Dados do boleto" : "Dados da nota fiscal"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={form.clienteId || "__none__"} onValueChange={(value) => setForm((prev) => ({ ...prev, clienteId: value === "__none__" ? "" : value, contratoId: value === "__none__" ? "" : getContratoAtual(contratos, value)?.id || "" }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecione</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={String(cliente.id)} value={String(cliente.id)}>{cliente.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contrato vinculado</Label>
                <Select value={form.contratoId || "__none__"} onValueChange={(value) => setForm((prev) => ({ ...prev, contratoId: value === "__none__" ? "" : value }))} disabled={!form.clienteId}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem contrato</SelectItem>
                    {contratosCliente.map((contrato) => (
                      <SelectItem key={contrato.id} value={contrato.id}>{contrato.numero} - {contrato.descricao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contratoAtual ? <p className="text-xs text-muted-foreground">Contrato atual sugerido: {contratoAtual.numero}</p> : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de emissao</Label>
                <Input type="date" value={form.dataEmissao} onChange={(e) => setForm((prev) => ({ ...prev, dataEmissao: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data de vencimento</Label>
                <Input type="date" value={form.dataVencimento} onChange={(e) => setForm((prev) => ({ ...prev, dataVencimento: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor do servico</Label>
                <Input value={form.valorServico} onChange={(e) => setForm((prev) => ({ ...prev, valorServico: e.target.value }))} placeholder="0,00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descricao</Label>
              <Input value={form.descricao} onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))} placeholder="Descricao da cobranca" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{tipo === "boleto" ? "Numero do boleto" : "Numero da NF"}</Label>
                <Input value={form.numero} onChange={(e) => setForm((prev) => ({ ...prev, numero: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Serie</Label>
                <Input value={form.serie} onChange={(e) => setForm((prev) => ({ ...prev, serie: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Categoria financeira</Label>
                <Select value={form.categoriaId || "__none__"} onValueChange={(value) => setForm((prev) => ({ ...prev, categoriaId: value === "__none__" ? "" : value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem categoria</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>{categoria.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipo === "boleto" ? (
              <div className="space-y-2">
                <Label>Linha digitavel</Label>
                <Input value={form.linhaDigitavel} onChange={(e) => setForm((prev) => ({ ...prev, linhaDigitavel: e.target.value }))} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Chave da NF</Label>
                <Input value={form.chaveDocumento} onChange={(e) => setForm((prev) => ({ ...prev, chaveDocumento: e.target.value }))} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 rounded-lg border p-3">
                <Checkbox checked={form.notificacaoEmail} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, notificacaoEmail: checked === true }))} />
                <span className="text-sm">Enviar notificacao por email</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3">
                <Checkbox checked={form.notificacaoWhatsapp} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, notificacaoWhatsapp: checked === true }))} />
                <span className="text-sm">Enviar notificacao por WhatsApp</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))} />
            </div>

            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Integracao externa ainda nao habilitada. Os dados ficam salvos no Supabase com status `nao_enviado`.
            </div>

            <Button className="w-full" onClick={onEmitir}>
              {tipo === "boleto" ? "Salvar emissao de boleto" : "Salvar emissao de NF"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tipo === "boleto" ? "Boletos registrados" : "Notas fiscais registradas"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Numero</TableHead>
                  <TableHead>Descricao</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Notificacoes</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.clienteNome || "-"}</TableCell>
                    <TableCell>{item.numero}</TableCell>
                    <TableCell>{item.descricao || item.lancamentoDescricao}</TableCell>
                    <TableCell>{item.contratoNumero || "-"}</TableCell>
                    <TableCell>{formatDate(item.dataVencimento)}</TableCell>
                    <TableCell>{formatCurrency(item.valorServico || item.valor)}</TableCell>
                    <TableCell>{[item.notificacaoEmail ? "Email" : "", item.notificacaoWhatsapp ? "WhatsApp" : ""].filter(Boolean).join(" / ") || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
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
  const [searchTerm, setSearchTerm] = useState("")
  const [clienteFilterBoleto, setClienteFilterBoleto] = useState("")
  const [clienteFilterNf, setClienteFilterNf] = useState("")
  const [boletoForm, setBoletoForm] = useState<DocumentoEmitirForm>(buildDocumentoInitialForm)
  const [nfForm, setNfForm] = useState<DocumentoEmitirForm>(buildDocumentoInitialForm)
  const [fluxoForm, setFluxoForm] = useState<FluxoForm>(buildFluxoInitialForm)
  const [categoriaForm, setCategoriaForm] = useState<FinanceiroCategoriaInput>({ nome: "", tipo: "despesa", descricao: "", ativo: true })

  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      try {
        const [clientesRows, contratosRows, fornecedoresRows, categoriasRows, lancamentosRows, documentosRows] = await Promise.all([
          listClientesSupabase(),
          listContratosSupabase(),
          listFornecedoresSupabase(),
          listFinanceiroCategoriasSupabase(),
          listFinanceiroLancamentosSupabase(),
          listFinanceiroDocumentosSupabase(),
        ])
        if (!mounted) return
        setClientes(clientesRows)
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
    return { entradasRealizadas, entradasProgramadas, saidasRealizadas, saidasProgramadas, saldoTotal: entradasRealizadas + entradasProgramadas - saidasRealizadas - saidasProgramadas }
  }, [lancamentos])

  const monthlyData = useMemo(() => buildMonthlyData(lancamentos), [lancamentos])
  const distribuicaoEntradas = useMemo(() => buildDistribution(lancamentos, ["receita"], "Entradas"), [lancamentos])
  const distribuicaoSaidas = useMemo(() => buildDistribution(lancamentos, ["despesa", "investimento"], "Saidas"), [lancamentos])
  const boletos = useMemo(() => documentos.filter((item) => item.tipo === "boleto"), [documentos])
  const notasFiscais = useMemo(() => documentos.filter((item) => item.tipo === "nota_fiscal"), [documentos])
  const categoriasReceita = useMemo(() => categorias.filter((item) => item.tipo === "receita" && item.ativo), [categorias])
  const categoriasFluxo = useMemo(() => categorias.filter((item) => item.tipo === fluxoForm.tipo && item.ativo), [categorias, fluxoForm.tipo])
  const lancamentosFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return lancamentos
    return lancamentos.filter((item) => [item.descricao, item.categoria, item.clienteNome, item.fornecedorNome, item.contratoNumero, item.documentoNumero, item.status, item.tipo].join(" ").toLowerCase().includes(term))
  }, [lancamentos, searchTerm])
  const proximosVencimentos = useMemo(() => [...lancamentos].filter((item) => item.status === "programado").sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)).slice(0, 8), [lancamentos])

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
      if (tipo === "boleto") setBoletoForm(buildDocumentoInitialForm())
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
        dataLiquidacao: fluxoForm.status === "realizado" ? fluxoForm.dataLiquidacao || fluxoForm.dataVencimento : "",
        clienteId: fluxoForm.tipo === "receita" ? fluxoForm.clienteId : undefined,
        fornecedorId: fluxoForm.tipo !== "receita" ? fluxoForm.fornecedorId : undefined,
        formaPagamento: fluxoForm.formaPagamento,
        documentoTipo: fluxoForm.documentoTipo,
        documentoNumero: fluxoForm.documentoNumero,
        notificacaoEmail: fluxoForm.notificacaoEmail,
        notificacaoWhatsapp: fluxoForm.notificacaoWhatsapp,
        apiIntegracaoStatus: "nao_enviado",
        observacoes: fluxoForm.observacoes,
      })
      setLancamentos((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)])
      setFluxoForm(buildFluxoInitialForm())
      setPageError("")
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const handleSalvarCategoria = async () => {
    if (!categoriaForm.nome.trim()) return setPageError("Informe o nome da categoria.")
    try {
      const saved = await upsertFinanceiroCategoriaSupabase({ ...categoriaForm, nome: categoriaForm.nome.trim(), descricao: categoriaForm.descricao?.trim() || "" })
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

  const SidebarButton = ({ value, label, icon: Icon }: { value: AbaFinanceira; label: string; icon: React.ComponentType<{ className?: string }> }) => (
    <Button variant={abaAtiva === value ? "default" : "ghost"} className="w-full justify-start gap-2" onClick={() => setAbaAtiva(value)}>
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <div className="flex">
        <aside className="w-64 bg-background border-r border-border min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-2">
            <SidebarButton value="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <SidebarButton value="boleto" label="Emissao de Boleto" icon={Receipt} />
            <SidebarButton value="nf" label="Emissao de NF" icon={FileText} />
            <SidebarButton value="relatorios" label="Relatorios" icon={BarChart3} />
            <SidebarButton value="fluxo" label="Fluxo de Caixa" icon={Wallet} />
          </nav>
        </aside>

        <main className="flex-1 px-8 py-8 space-y-6">
          {pageError ? <Alert variant="destructive"><AlertDescription>{pageError}</AlertDescription></Alert> : null}
          {loading ? <Card><CardContent className="py-12 text-center text-muted-foreground">Carregando dados financeiros do Supabase...</CardContent></Card> : null}

          {!loading && abaAtiva === "dashboard" ? (
            <>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
                <p className="text-sm text-muted-foreground mt-1">Saude financeira com entradas, saidas, investimentos e cobrancas registradas.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <ResumoCard title="Receita Realizada" value={formatCurrency(resumo.entradasRealizadas)} subtitle="Entradas liquidadas" icon={ArrowUpCircle} className="bg-green-50 border-green-200 text-green-900" />
                <ResumoCard title="Receita Programada" value={formatCurrency(resumo.entradasProgramadas)} subtitle="Em aberto" icon={Calendar} className="bg-emerald-50 border-emerald-200 text-emerald-900" />
                <ResumoCard title="Saida Realizada" value={formatCurrency(resumo.saidasRealizadas)} subtitle="Despesas + investimentos pagos" icon={ArrowDownCircle} className="bg-red-50 border-red-200 text-red-900" />
                <ResumoCard title="Saida Programada" value={formatCurrency(resumo.saidasProgramadas)} subtitle="Compromissos futuros" icon={Wallet} className="bg-orange-50 border-orange-200 text-orange-900" />
                <ResumoCard title="Saldo Projetado" value={formatCurrency(resumo.saldoTotal)} subtitle="Entradas menos saidas" icon={DollarSign} className="bg-blue-50 border-blue-200 text-blue-900" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Evolucao mensal</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Area type="monotone" dataKey="entradaRealizada" stroke="#15803d" fill="#86efac" />
                          <Area type="monotone" dataKey="saidaRealizada" stroke="#dc2626" fill="#fca5a5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Comparativo de caixa</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="entradaRealizada" fill="#15803d" />
                          <Bar dataKey="entradaProgramada" fill="#22c55e" />
                          <Bar dataKey="saidaRealizada" fill="#dc2626" />
                          <Bar dataKey="saidaProgramada" fill="#fb923c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionCard title="Distribuicao de entradas" data={distribuicaoEntradas} />
                <DistributionCard title="Distribuicao de saidas" data={distribuicaoSaidas} />
              </div>
              <Card>
                <CardHeader><CardTitle>Proximos vencimentos</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {proximosVencimentos.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.descricao}</p>
                        <p className="text-sm text-muted-foreground">{item.clienteNome || item.fornecedorNome || item.contratoNumero || "-"} | vence em {formatDate(item.dataVencimento)}</p>
                      </div>
                      <div className={item.tipo === "receita" ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>{formatCurrency(item.valor)}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : null}

          {!loading && abaAtiva === "boleto" ? <EmissaoSection tipo="boleto" title="Emissao de Boletos" description="Selecione o cliente, vincule ao contrato atual quando houver e registre a cobranca." form={boletoForm} setForm={setBoletoForm} clientes={clientes} contratos={contratos} categorias={categoriasReceita} documentos={boletos} filterTerm={clienteFilterBoleto} setFilterTerm={setClienteFilterBoleto} onEmitir={() => void emitDocument("boleto", boletoForm)} onDelete={(id) => void handleExcluirDocumento(id)} /> : null}
          {!loading && abaAtiva === "nf" ? <EmissaoSection tipo="nota_fiscal" title="Emissao de Nota Fiscal" description="Registre os dados da NF, vincule contrato se existir e deixe os dados prontos para a futura API." form={nfForm} setForm={setNfForm} clientes={clientes} contratos={contratos} categorias={categoriasReceita} documentos={notasFiscais} filterTerm={clienteFilterNf} setFilterTerm={setClienteFilterNf} onEmitir={() => void emitDocument("nota_fiscal", nfForm)} onDelete={(id) => void handleExcluirDocumento(id)} /> : null}

          {!loading && abaAtiva === "relatorios" ? (
            <>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Relatorios Financeiros</h1>
                <p className="text-sm text-muted-foreground mt-1">Ambiente para filtros, emissoes e analise da saude do negocio.</p>
              </div>
              <Card>
                <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por descricao, cliente, categoria, contrato, numero ou status..." />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Lancamentos</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Descricao</TableHead><TableHead>Categoria</TableHead><TableHead>Vinculo</TableHead><TableHead>Contrato</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Acoes</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {lancamentosFiltrados.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.tipo}</TableCell>
                            <TableCell>{item.descricao}</TableCell>
                            <TableCell>{item.categoria || "-"}</TableCell>
                            <TableCell>{item.clienteNome || item.fornecedorNome || "-"}</TableCell>
                            <TableCell>{item.contratoNumero || "-"}</TableCell>
                            <TableCell>{formatDate(item.dataVencimento)}</TableCell>
                            <TableCell>{item.status}</TableCell>
                            <TableCell>{formatCurrency(item.valor)}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => void handleExcluirLancamento(item.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 xl:grid-cols-[1fr,1.2fr] gap-6">
                <Card>
                  <CardHeader><CardTitle>Nova categoria financeira</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Nome</Label><Input value={categoriaForm.nome} onChange={(e) => setCategoriaForm((prev) => ({ ...prev, nome: e.target.value }))} placeholder="Ex: Compra de Insumos" /></div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={categoriaForm.tipo} onValueChange={(value) => setCategoriaForm((prev) => ({ ...prev, tipo: value as FinanceiroLancamentoTipo }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem><SelectItem value="investimento">Investimento</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Descricao</Label><Textarea value={categoriaForm.descricao || ""} onChange={(e) => setCategoriaForm((prev) => ({ ...prev, descricao: e.target.value }))} /></div>
                    <Button onClick={() => void handleSalvarCategoria()}>Salvar categoria</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Categorias cadastradas</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {categorias.map((categoria) => (
                      <div key={categoria.id} className="rounded-lg border p-3">
                        <p className="font-medium">{categoria.nome}</p>
                        <p className="text-sm text-muted-foreground">{categoria.tipo} | {categoria.descricao || "Sem descricao"}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}

          {!loading && abaAtiva === "fluxo" ? (
            <>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
                <p className="text-sm text-muted-foreground mt-1">Boletos entram automaticamente no caixa. Aqui voce complementa despesas, entradas avulsas e investimentos.</p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-[1fr,1.2fr] gap-6">
                <Card>
                  <CardHeader><CardTitle>Novo registro no caixa</CardTitle><CardDescription>Use para despesas, entradas avulsas e investimentos.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={fluxoForm.tipo} onValueChange={(value) => setFluxoForm((prev) => ({ ...prev, tipo: value as FinanceiroLancamentoTipo, categoriaId: "" }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="receita">Entrada</SelectItem><SelectItem value="despesa">Despesa</SelectItem><SelectItem value="investimento">Investimento</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={fluxoForm.status} onValueChange={(value) => setFluxoForm((prev) => ({ ...prev, status: value as FluxoForm["status"] }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="programado">Programado</SelectItem><SelectItem value="realizado">Realizado</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2"><Label>Descricao</Label><Input value={fluxoForm.descricao} onChange={(e) => setFluxoForm((prev) => ({ ...prev, descricao: e.target.value }))} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={fluxoForm.categoriaId || "__none__"} onValueChange={(value) => setFluxoForm((prev) => ({ ...prev, categoriaId: value === "__none__" ? "" : value }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent><SelectItem value="__none__">Sem categoria</SelectItem>{categoriasFluxo.map((categoria) => <SelectItem key={categoria.id} value={categoria.id}>{categoria.nome}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Valor</Label><Input value={fluxoForm.valor} onChange={(e) => setFluxoForm((prev) => ({ ...prev, valor: e.target.value }))} placeholder="0,00" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Competencia</Label><Input type="date" value={fluxoForm.dataCompetencia} onChange={(e) => setFluxoForm((prev) => ({ ...prev, dataCompetencia: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={fluxoForm.dataVencimento} onChange={(e) => setFluxoForm((prev) => ({ ...prev, dataVencimento: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Liquidacao</Label><Input type="date" value={fluxoForm.dataLiquidacao} onChange={(e) => setFluxoForm((prev) => ({ ...prev, dataLiquidacao: e.target.value }))} /></div>
                    </div>
                    {fluxoForm.tipo === "receita" ? (
                      <div className="space-y-2">
                        <Label>Cliente</Label>
                        <Select value={fluxoForm.clienteId || "__none__"} onValueChange={(value) => setFluxoForm((prev) => ({ ...prev, clienteId: value === "__none__" ? "" : value }))}>
                          <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                          <SelectContent><SelectItem value="__none__">Sem cliente</SelectItem>{clientes.map((cliente) => <SelectItem key={String(cliente.id)} value={String(cliente.id)}>{cliente.nome}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Fornecedor</Label>
                        <Select value={fluxoForm.fornecedorId || "__none__"} onValueChange={(value) => setFluxoForm((prev) => ({ ...prev, fornecedorId: value === "__none__" ? "" : value }))}>
                          <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                          <SelectContent><SelectItem value="__none__">Sem fornecedor</SelectItem>{fornecedores.map((fornecedor) => <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.razaoSocial}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Forma de pagamento</Label><Input value={fluxoForm.formaPagamento} onChange={(e) => setFluxoForm((prev) => ({ ...prev, formaPagamento: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Tipo de documento</Label><Input value={fluxoForm.documentoTipo} onChange={(e) => setFluxoForm((prev) => ({ ...prev, documentoTipo: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Numero do documento</Label><Input value={fluxoForm.documentoNumero} onChange={(e) => setFluxoForm((prev) => ({ ...prev, documentoNumero: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 rounded-lg border p-3"><Checkbox checked={fluxoForm.notificacaoEmail} onCheckedChange={(checked) => setFluxoForm((prev) => ({ ...prev, notificacaoEmail: checked === true }))} /><span className="text-sm">Email</span></label>
                      <label className="flex items-center gap-3 rounded-lg border p-3"><Checkbox checked={fluxoForm.notificacaoWhatsapp} onCheckedChange={(checked) => setFluxoForm((prev) => ({ ...prev, notificacaoWhatsapp: checked === true }))} /><span className="text-sm">WhatsApp</span></label>
                    </div>
                    <div className="space-y-2"><Label>Observacoes</Label><Textarea value={fluxoForm.observacoes} onChange={(e) => setFluxoForm((prev) => ({ ...prev, observacoes: e.target.value }))} /></div>
                    <Button onClick={() => void handleSalvarFluxo()}><PlusCircle className="h-4 w-4 mr-2" />Salvar no fluxo de caixa</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Movimentacoes do caixa</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {lancamentos.map((item) => (
                      <div key={item.id} className="rounded-lg border p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-medium">{item.descricao}</p>
                            <p className="text-sm text-muted-foreground">{item.tipo} | {item.categoria || "Sem categoria"} | {formatDate(item.dataVencimento)}</p>
                            <p className="text-sm text-muted-foreground">{item.clienteNome || item.fornecedorNome || item.contratoNumero || "Sem vinculo"} | {item.status}</p>
                          </div>
                          <div className={item.tipo === "receita" ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>{item.tipo === "receita" ? "+" : "-"} {formatCurrency(item.valor)}</div>
                        </div>
                      </div>
                    ))}
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
