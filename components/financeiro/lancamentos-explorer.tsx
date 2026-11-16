"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, Download, FileText, Filter, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formaPagamentoLabel } from "@/components/financeiro/aprovacoes-baixa"
import { gerarCsvLancamentos, totaisDasLinhas, type LinhaExportacao, type TotaisExportacao } from "@/lib/financeiro-periodo"
import {
  buscarLancamentosPaginaSupabase,
  listarTodosLancamentosSupabase,
  totaisLancamentosSupabase,
  type FiltrosLancamentos,
  type FinanceiroCategoriaItem,
  type FinanceiroLancamentoItem,
  type TotaisLancamentos,
} from "@/lib/supabase/financeiro-repo"

const ORIGENS = [
  { value: "manual", label: "Manual" },
  { value: "servico", label: "Servico" },
  { value: "contrato", label: "Contrato" },
  { value: "boleto", label: "Boleto" },
  { value: "nota_fiscal", label: "Nota fiscal" },
  { value: "ajuste", label: "Ajuste" },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)
}

function dataBr(iso: string) {
  if (!iso) return ""
  const [a, m, d] = iso.slice(0, 10).split("-")
  return d ? `${d}/${m}/${a}` : iso
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)
}

const TIPO_LABEL: Record<string, string> = { receita: "Receita", despesa: "Despesa", investimento: "Investimento" }
const STATUS_LABEL: Record<string, string> = { programado: "Programado", realizado: "Realizado", cancelado: "Cancelado" }

function paraLinhaExportacao(item: FinanceiroLancamentoItem): LinhaExportacao {
  return {
    dataReferencia: item.dataReferencia,
    dataVencimento: item.dataVencimento,
    dataLiquidacao: item.dataLiquidacao,
    tipo: TIPO_LABEL[item.tipo] || item.tipo,
    status: STATUS_LABEL[item.status] || item.status,
    descricao: item.descricao,
    categoria: item.categoria,
    vinculo: item.clienteNome || item.fornecedorNome || "",
    formaPagamento: item.formaPagamento ? formaPagamentoLabel(item.formaPagamento) : "",
    parcela: item.parcelaTotal && item.parcelaTotal > 1 ? `${item.parcelaNumero}/${item.parcelaTotal}` : "",
    valor: item.valor,
    taxa: item.taxaValor,
    valorCaixa: item.valorCaixa,
  }
}

export function descreverFiltros(filtros: FiltrosLancamentos, categorias: FinanceiroCategoriaItem[]): string {
  const partes: string[] = []
  if (filtros.dataInicio || filtros.dataFim) partes.push(`Periodo ${dataBr(filtros.dataInicio || "") || "inicio"} a ${dataBr(filtros.dataFim || "") || "hoje"}`)
  if (filtros.tipo) partes.push(`Tipo ${TIPO_LABEL[filtros.tipo] || filtros.tipo}`)
  if (filtros.status) partes.push(`Status ${STATUS_LABEL[filtros.status] || filtros.status}`)
  if (filtros.origem) partes.push(`Origem ${ORIGENS.find((o) => o.value === filtros.origem)?.label || filtros.origem}`)
  if (filtros.categoriaId) partes.push(`Categoria ${categorias.find((c) => c.id === filtros.categoriaId)?.nome || ""}`)
  if (filtros.busca?.trim()) partes.push(`Busca "${filtros.busca.trim()}"`)
  return partes.length ? partes.join(" · ") : "Todos os lancamentos"
}

function baixarArquivo(conteudo: string, nome: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function abrirPdf(linhas: LinhaExportacao[], totais: TotaisExportacao, filtroDescricao: string) {
  const janela = window.open("", "_blank")
  if (!janela) throw new Error("O navegador bloqueou a janela do PDF. Permita pop-ups para este site.")
  const linhasHtml = linhas
    .map(
      (l) => `<tr>
        <td>${dataBr(l.dataReferencia)}</td><td>${escapeHtml(l.tipo)}</td><td>${escapeHtml(l.status)}</td>
        <td>${escapeHtml(l.descricao)}${l.parcela ? ` (${l.parcela})` : ""}</td><td>${escapeHtml(l.categoria)}</td>
        <td>${escapeHtml(l.vinculo)}</td><td>${escapeHtml(l.formaPagamento)}</td>
        <td class="n">${formatCurrency(l.valor)}</td><td class="n">${l.taxa !== null ? formatCurrency(l.taxa) : ""}</td>
        <td class="n">${formatCurrency(l.valorCaixa)}</td>
      </tr>`,
    )
    .join("")
  const saldo = totais.entradasRealizadas - totais.saidasRealizadas
  janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Movimentacoes financeiras</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: Arial, sans-serif; font-size: 10px; color: #111; }
      h1 { font-size: 16px; margin: 0 0 4px; } p { margin: 0 0 10px; color: #555; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #ddd; padding: 4px 5px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; } td.n, th.n { text-align: right; white-space: nowrap; }
      .totais { margin-top: 14px; width: 50%; } .totais td { border: none; padding: 2px 5px; }
      .totais tr.s td { font-weight: bold; border-top: 1px solid #111; }
    </style></head><body>
    <h1>Movimentacoes financeiras</h1>
    <p>${escapeHtml(filtroDescricao)} · ${linhas.length} lancamento(s) · gerado em ${new Date().toLocaleString("pt-BR")}</p>
    <table><thead><tr><th>Data</th><th>Tipo</th><th>Status</th><th>Descricao</th><th>Categoria</th><th>Cliente/Fornecedor</th><th>Forma</th>
    <th class="n">Valor bruto</th><th class="n">Taxa</th><th class="n">No caixa</th></tr></thead><tbody>${linhasHtml}</tbody></table>
    <table class="totais">
      <tr><td>Entradas realizadas</td><td class="n">${formatCurrency(totais.entradasRealizadas)}</td></tr>
      <tr><td>Saidas realizadas</td><td class="n">${formatCurrency(totais.saidasRealizadas)}</td></tr>
      <tr class="s"><td>Saldo realizado</td><td class="n">${formatCurrency(saldo)}</td></tr>
      <tr><td>Entradas programadas</td><td class="n">${formatCurrency(totais.entradasProgramadas)}</td></tr>
      <tr><td>Saidas programadas</td><td class="n">${formatCurrency(totais.saidasProgramadas)}</td></tr>
    </table>
    <script>window.onload = function () { window.print() }</script>
    </body></html>`)
  janela.document.close()
}

const TOTAIS_VAZIOS: TotaisLancamentos = {
  entradasRealizadas: 0, saidasRealizadas: 0, entradasProgramadas: 0, saidasProgramadas: 0,
  quantidade: 0, quantidadeEntradasRealizadas: 0, quantidadeSaidasRealizadas: 0,
}

/**
 * Filtros + totais (agregados no banco) + paginacao no servidor + exportacao
 * CSV/PDF de TODAS as linhas do filtro. A exibicao de cada pagina fica com quem usa.
 */
export function LancamentosExplorer({
  categorias,
  versao,
  filtrosIniciais,
  tamanhoPagina = 20,
  onErro,
  children,
}: {
  categorias: FinanceiroCategoriaItem[]
  /** Incrementar para recarregar apos criar/alterar lancamentos. */
  versao: number
  filtrosIniciais?: FiltrosLancamentos
  tamanhoPagina?: number
  onErro: (mensagem: string) => void
  children: (itens: FinanceiroLancamentoItem[]) => ReactNode
}) {
  const [filtros, setFiltros] = useState<FiltrosLancamentos>(filtrosIniciais || {})
  const [buscaDigitada, setBuscaDigitada] = useState(filtrosIniciais?.busca || "")
  const [pagina, setPagina] = useState(1)
  const [itens, setItens] = useState<FinanceiroLancamentoItem[]>([])
  const [count, setCount] = useState(0)
  const [totais, setTotais] = useState<TotaisLancamentos>(TOTAIS_VAZIOS)
  const [carregando, setCarregando] = useState(true)
  const [exportando, setExportando] = useState<"" | "csv" | "pdf">("")
  const [progresso, setProgresso] = useState("")
  const requisicao = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros((prev) => (prev.busca === buscaDigitada ? prev : { ...prev, busca: buscaDigitada }))
      setPagina(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [buscaDigitada])

  const filtrosChave = JSON.stringify(filtros)

  // Totais so mudam com filtros/versao, nao com a pagina.
  useEffect(() => {
    let ativo = true
    totaisLancamentosSupabase(filtros)
      .then((t) => { if (ativo) setTotais(t) })
      .catch((error) => { if (ativo) onErro(error instanceof Error ? error.message : "Falha ao calcular totais.") })
    return () => { ativo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosChave, versao])

  useEffect(() => {
    const id = ++requisicao.current
    setCarregando(true)
    buscarLancamentosPaginaSupabase(filtros, pagina, tamanhoPagina)
      .then(({ data, count: total }) => {
        if (id !== requisicao.current) return
        setItens(data)
        setCount(total)
        // Pagina ficou alem do fim (ex.: apos excluir): volta para a ultima.
        const ultima = Math.max(1, Math.ceil(total / tamanhoPagina))
        if (pagina > ultima) setPagina(ultima)
      })
      .catch((error) => { if (id === requisicao.current) onErro(error instanceof Error ? error.message : "Falha ao carregar lancamentos.") })
      .finally(() => { if (id === requisicao.current) setCarregando(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosChave, pagina, versao, tamanhoPagina])

  const totalPaginas = Math.max(1, Math.ceil(count / tamanhoPagina))
  const saldoRealizado = totais.entradasRealizadas - totais.saidasRealizadas
  const programadoLiquido = totais.entradasProgramadas - totais.saidasProgramadas

  const setFiltro = <K extends keyof FiltrosLancamentos>(key: K, value: FiltrosLancamentos[K]) => {
    setFiltros((prev) => ({ ...prev, [key]: value }))
    setPagina(1)
  }

  const limpar = () => {
    setFiltros({})
    setBuscaDigitada("")
    setPagina(1)
  }

  const exportar = async (formato: "csv" | "pdf") => {
    if (exportando) return
    setExportando(formato)
    setProgresso("")
    try {
      const filtrosAtuais = { ...filtros, busca: buscaDigitada }
      const todos = await listarTodosLancamentosSupabase(filtrosAtuais, (carregados, total) => setProgresso(`${carregados}/${total}`))
      const linhas = todos.map(paraLinhaExportacao)
      const totaisLinhas = totaisDasLinhas(todos)
      const descricao = descreverFiltros(filtrosAtuais, categorias)
      if (formato === "csv") {
        const hoje = new Date().toISOString().slice(0, 10)
        baixarArquivo(gerarCsvLancamentos(linhas, totaisLinhas, descricao), `movimentacoes-${hoje}.csv`, "text/csv;charset=utf-8")
      } else {
        abrirPdf(linhas, totaisLinhas, descricao)
      }
    } catch (error) {
      onErro(error instanceof Error ? error.message : "Falha ao exportar.")
    } finally {
      setExportando("")
      setProgresso("")
    }
  }

  const paginacao = useMemo(
    () =>
      totalPaginas > 1 ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-3" disabled={pagina <= 1 || carregando} onClick={() => setPagina((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />Anterior
          </Button>
          <span className="text-sm text-muted-foreground">{pagina}/{totalPaginas}</span>
          <Button variant="outline" size="sm" className="h-8 px-3" disabled={pagina >= totalPaginas || carregando} onClick={() => setPagina((p) => p + 1)}>
            Proxima<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      ) : null,
    [pagina, totalPaginas, carregando],
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Filtros</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled={Boolean(exportando) || count === 0} onClick={() => void exportar("csv")}>
                {exportando === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}CSV
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled={Boolean(exportando) || count === 0} onClick={() => void exportar("pdf")}>
                {exportando === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}PDF
              </Button>
              {progresso ? <span className="text-xs text-muted-foreground">{progresso}</span> : null}
              <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground" onClick={limpar}>Limpar filtros</Button>
            </div>
          </div>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" value={buscaDigitada} onChange={(e) => setBuscaDigitada(e.target.value)} placeholder="Buscar por descricao, cliente, fornecedor, categoria, documento..." />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">De</span>
              <Input type="date" className="h-9 text-xs" value={filtros.dataInicio || ""} onChange={(e) => setFiltro("dataInicio", e.target.value)} />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Ate</span>
              <Input type="date" className="h-9 text-xs" value={filtros.dataFim || ""} onChange={(e) => setFiltro("dataFim", e.target.value)} />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select value={filtros.status || "todos"} onValueChange={(v) => setFiltro("status", v === "todos" ? "" : (v as FiltrosLancamentos["status"]))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Tipo</span>
              <Select value={filtros.tipo || "todos"} onValueChange={(v) => setFiltro("tipo", v === "todos" ? "" : (v as FiltrosLancamentos["tipo"]))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Origem</span>
              <Select value={filtros.origem || "todos"} onValueChange={(v) => setFiltro("origem", v === "todos" ? "" : v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {ORIGENS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Categoria</span>
              <Select value={filtros.categoriaId || "todos"} onValueChange={(v) => setFiltro("categoriaId", v === "todos" ? "" : v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            O periodo usa a data da liquidacao para lancamentos realizados e o vencimento para os programados.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entradas realizadas</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(totais.entradasRealizadas)}</p>
            <p className="text-xs text-muted-foreground">{totais.quantidadeEntradasRealizadas} lancamentos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saidas realizadas</p>
            <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(totais.saidasRealizadas)}</p>
            <p className="text-xs text-muted-foreground">{totais.quantidadeSaidasRealizadas} lancamentos</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${saldoRealizado >= 0 ? "border-l-blue-500" : "border-l-red-600"}`}>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo realizado</p>
            <p className={`text-xl font-bold mt-1 ${saldoRealizado >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatCurrency(saldoRealizado)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Programado (a receber - a pagar)</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(programadoLiquido)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          {carregando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {count} lancamento{count !== 1 ? "s" : ""}
          {count > 0 ? <> · exibindo {(pagina - 1) * tamanhoPagina + 1}–{Math.min(pagina * tamanhoPagina, count)}</> : null}
        </p>
        {paginacao}
      </div>

      <div className={carregando ? "opacity-60 transition-opacity" : ""}>{children(itens)}</div>

      {totalPaginas > 1 ? <div className="flex justify-end pt-2 border-t">{paginacao}</div> : null}
    </div>
  )
}
