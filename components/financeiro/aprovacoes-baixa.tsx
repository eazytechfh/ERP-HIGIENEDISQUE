"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MAX_PARCELAS_CARTAO, calcularTaxa, chaveTaxaCartao, isModalidadeCartao, rotuloTaxaCartao } from "@/lib/financeiro-calculos"
import type {
  FinanceiroBaixaSolicitacaoItem,
  FinanceiroLancamentoItem,
} from "@/lib/supabase/financeiro-repo"

export const FORMAS_PAGAMENTO: Array<{ value: string; label: string }> = [
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferencia" },
  { value: "cartao_credito", label: "Cartao de credito" },
  { value: "cartao_debito", label: "Cartao de debito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cheque", label: "Cheque" },
]

export function formaPagamentoLabel(value: string) {
  return FORMAS_PAGAMENTO.find((item) => item.value === value)?.label || value || "Nao informado"
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)
}

function formatDate(value: string) {
  if (!value) return "-"
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("pt-BR")
}

function formatPercentLocal(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function formatDateTime(value: string) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

function localTodayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

// ---------------------------------------------------------------------------
// Dialogo: solicitar baixa
// ---------------------------------------------------------------------------

export type SolicitarBaixaPayload = {
  lancamentoId: string
  dataLiquidacao: string
  formaPagamento: string
  observacoes: string
  taxaEsperada: number | null
  cartaoParcelas: number | null
}

export function SolicitarBaixaDialog({
  lancamento,
  taxas,
  onCancel,
  onConfirm,
}: {
  lancamento: FinanceiroLancamentoItem | null
  /** Taxas vigentes por chaveTaxaCartao(modalidade, parcelas). */
  taxas: Record<string, number>
  onCancel: () => void
  onConfirm: (payload: SolicitarBaixaPayload) => Promise<void>
}) {
  const [dataLiquidacao, setDataLiquidacao] = useState(localTodayIso())
  const [formaPagamento, setFormaPagamento] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [cartaoParcelas, setCartaoParcelas] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!lancamento) return
    setDataLiquidacao(localTodayIso())
    // "cartao" generico (OS antigas) vira credito; a pessoa ajusta se foi debito.
    setFormaPagamento(lancamento.formaPagamento === "cartao" ? "cartao_credito" : lancamento.formaPagamento || "")
    setObservacoes("")
    setCartaoParcelas(lancamento.cartaoParcelas || 1)
    setError("")
    setSaving(false)
  }, [lancamento])

  const isReceita = lancamento?.tipo === "receita"
  const usaTaxa = Boolean(lancamento && isReceita && isModalidadeCartao(formaPagamento))
  const parcelasEfetivas = formaPagamento === "cartao_credito" ? cartaoParcelas : 1
  const taxaPercentual = usaTaxa && isModalidadeCartao(formaPagamento) ? taxas[chaveTaxaCartao(formaPagamento, parcelasEfetivas)] : undefined
  const taxaNaoConfigurada = usaTaxa && taxaPercentual === undefined
  const calculoTaxa = usaTaxa && lancamento && taxaPercentual !== undefined ? calcularTaxa(lancamento.valor, taxaPercentual) : null
  const rotuloTaxa = isModalidadeCartao(formaPagamento) ? rotuloTaxaCartao(formaPagamento, parcelasEfetivas) : ""

  const handleConfirm = async () => {
    if (!lancamento || saving) return
    if (!dataLiquidacao) return setError("Informe a data.")
    if (dataLiquidacao > localTodayIso()) return setError("A data nao pode ser futura.")
    if (taxaNaoConfigurada) return setError(`Taxa de ${rotuloTaxa.toLowerCase()} nao configurada.`)
    setSaving(true)
    setError("")
    try {
      await onConfirm({
        lancamentoId: lancamento.id,
        dataLiquidacao,
        formaPagamento,
        observacoes,
        taxaEsperada: calculoTaxa ? calculoTaxa.taxaPercentual : null,
        cartaoParcelas: usaTaxa ? parcelasEfetivas : null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel solicitar a baixa.")
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(lancamento)} onOpenChange={(open) => (!open && !saving ? onCancel() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar baixa</DialogTitle>
          <DialogDescription>
            O lancamento so passa a realizado depois da aprovacao na aba Aprovacoes.
          </DialogDescription>
        </DialogHeader>

        {lancamento ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{lancamento.descricao}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {lancamento.clienteNome || lancamento.fornecedorNome || "Sem vinculo"} · Venc. {formatDate(lancamento.dataVencimento)}
              </p>
              <p className={`mt-2 text-lg font-bold ${isReceita ? "text-green-700" : "text-red-700"}`}>
                {formatCurrency(lancamento.valor)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {isReceita ? "Recebido em" : "Pago em"}
                </Label>
                <Input type="date" max={localTodayIso()} value={dataLiquidacao} onChange={(e) => setDataLiquidacao(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Forma de pagamento</Label>
                <Select value={formaPagamento || "__none__"} onValueChange={(v) => setFormaPagamento(v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nao informado</SelectItem>
                    {FORMAS_PAGAMENTO.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {usaTaxa && formaPagamento === "cartao_credito" ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parcelas da venda no cartao</Label>
                <Select value={String(cartaoParcelas)} onValueChange={(v) => setCartaoParcelas(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: MAX_PARCELAS_CARTAO }, (_, i) => i + 1).map((n) => {
                      const pct = taxas[chaveTaxaCartao("cartao_credito", n)]
                      return (
                        <SelectItem key={n} value={String(n)}>
                          {n === 1 ? "A vista" : `${n}x`} {pct !== undefined ? `· ${formatPercentLocal(pct)}` : "· sem taxa cadastrada"}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Continua sendo um lancamento unico; as parcelas so definem a taxa.</p>
              </div>
            ) : null}

            {taxaNaoConfigurada ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Taxa de {rotuloTaxa.toLowerCase()} nao configurada. Peca ao aprovador para cadastrar em Taxas de cartao.
              </p>
            ) : null}

            {calculoTaxa ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Valor bruto</span><span className="font-medium">{formatCurrency(calculoTaxa.valorBruto)}</span></div>
                <div className="flex justify-between text-red-700">
                  <span>Taxa {rotuloTaxa.toLowerCase()} ({formatPercentLocal(calculoTaxa.taxaPercentual)})</span>
                  <span className="font-medium">- {formatCurrency(calculoTaxa.taxaValor)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1 font-semibold">
                  <span>Valor liquido no caixa</span><span>{formatCurrency(calculoTaxa.valorLiquido)}</span>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observacao</Label>
              <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Comprovante, conta de destino..." />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>Voltar</Button>
          <Button onClick={() => void handleConfirm()} disabled={saving || taxaNaoConfigurada}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Solicitar baixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Aba Aprovacoes
// ---------------------------------------------------------------------------

function DecisaoBadge({ status }: { status: FinanceiroBaixaSolicitacaoItem["status"] }) {
  if (status === "aprovada") return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Aprovada</Badge>
  if (status === "rejeitada") return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Rejeitada</Badge>
  if (status === "cancelada") return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">Cancelada</Badge>
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Pendente</Badge>
}

export function AprovacoesSection({
  pendentes,
  decididas,
  isAprovador,
  currentUserId,
  onAprovar,
  onRejeitar,
  onCancelarSolicitacao,
}: {
  pendentes: FinanceiroBaixaSolicitacaoItem[]
  decididas: FinanceiroBaixaSolicitacaoItem[]
  isAprovador: boolean
  currentUserId: string
  onAprovar: (solicitacao: FinanceiroBaixaSolicitacaoItem) => Promise<void>
  onRejeitar: (solicitacao: FinanceiroBaixaSolicitacaoItem, motivo: string) => Promise<void>
  onCancelarSolicitacao: (solicitacao: FinanceiroBaixaSolicitacaoItem) => Promise<void>
}) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejeitando, setRejeitando] = useState<FinanceiroBaixaSolicitacaoItem | null>(null)
  const [motivo, setMotivo] = useState("")
  const [rejeitarError, setRejeitarError] = useState("")

  const run = async (id: string, action: () => Promise<void>) => {
    if (busyId) return
    setBusyId(id)
    try {
      await action()
    } finally {
      setBusyId(null)
    }
  }

  const totalPendente = pendentes.reduce((sum, item) => {
    const valor = item.valorLiquido ?? item.valor
    return sum + (item.lancamento?.tipo === "receita" ? valor : -valor)
  }, 0)

  const confirmarRejeicao = async () => {
    if (!rejeitando) return
    if (!motivo.trim()) return setRejeitarError("Informe o motivo da rejeicao.")
    const alvo = rejeitando
    await run(alvo.id, async () => {
      try {
        await onRejeitar(alvo, motivo.trim())
        setRejeitando(null)
      } catch (err) {
        setRejeitarError(err instanceof Error ? err.message : "Nao foi possivel rejeitar.")
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aprovacoes de baixa</h1>
          <p className="text-sm text-muted-foreground">
            {isAprovador
              ? "Confira cada recebimento ou pagamento informado e aprove ou rejeite a baixa."
              : "Acompanhe as baixas que aguardam aprovacao. Somente o aprovador do financeiro pode decidir."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aguardando aprovacao</p>
            <p className="text-2xl font-bold mt-1">{pendentes.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Efeito no caixa se aprovado</p>
            <p className={`text-2xl font-bold mt-1 ${totalPendente >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatCurrency(totalPendente)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pendentes</CardTitle>
          <CardDescription>Mais antigas primeiro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nenhuma baixa aguardando aprovacao.</p>
          ) : (
            pendentes.map((item) => {
              const lancamento = item.lancamento
              const isReceita = lancamento?.tipo === "receita"
              const busy = busyId === item.id
              const podeCancelar = item.solicitadoPor === currentUserId || isAprovador
              return (
                <div key={item.id} className={`rounded-lg border border-l-4 ${isReceita ? "border-l-green-500" : "border-l-red-500"} bg-background p-4`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{lancamento?.descricao || "Lancamento removido"}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        <span>{isReceita ? "Receita" : lancamento?.tipo === "investimento" ? "Investimento" : "Despesa"}</span>
                        {lancamento?.clienteNome || lancamento?.fornecedorNome ? <span>{lancamento?.clienteNome || lancamento?.fornecedorNome}</span> : null}
                        {lancamento?.servicoNumero ? <span>{lancamento.servicoNumero}</span> : null}
                        <span>Venc. {formatDate(lancamento?.dataVencimento || "")}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs">
                        <span><strong>{isReceita ? "Recebido em" : "Pago em"}:</strong> {formatDate(item.dataLiquidacao)}</span>
                        <span><strong>Forma:</strong> {formaPagamentoLabel(item.formaPagamento)}</span>
                        <span><strong>Solicitado por:</strong> {item.solicitadoPorNome || "-"} em {formatDateTime(item.solicitadoEm)}</span>
                      </div>
                      {item.observacoes ? <p className="text-xs text-muted-foreground mt-1.5 italic">{item.observacoes}</p> : null}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${isReceita ? "text-green-700" : "text-red-700"}`}>
                        {isReceita ? "+" : "-"}{formatCurrency(item.valorLiquido ?? item.valor)}
                      </p>
                      {item.taxaValor !== null ? (
                        <p className="text-xs text-muted-foreground">
                          Bruto {formatCurrency(item.valor)} · {isModalidadeCartao(item.taxaModalidade) ? rotuloTaxaCartao(item.taxaModalidade, item.cartaoParcelas ?? 1).toLowerCase() : "taxa"} {formatPercentLocal(item.taxaPercentual ?? 0)} ({formatCurrency(item.taxaValor)})
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    {isAprovador ? (
                      <>
                        <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5" disabled={Boolean(busyId)} onClick={() => void run(item.id, () => onAprovar(item))}>
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}Aprovar baixa
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-red-700 border-red-300 hover:bg-red-50 gap-1.5" disabled={Boolean(busyId)} onClick={() => { setRejeitando(item); setMotivo(""); setRejeitarError("") }}>
                          <XCircle className="h-3.5 w-3.5" />Rejeitar
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-amber-700 font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Aguardando aprovacao</span>
                    )}
                    {podeCancelar ? (
                      <Button size="sm" variant="ghost" className="h-8 text-xs ml-auto text-muted-foreground" disabled={Boolean(busyId)} onClick={() => void run(item.id, () => onCancelarSolicitacao(item))}>
                        Cancelar solicitacao
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historico recente</CardTitle>
          <CardDescription>Ultimas decisoes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {decididas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma decisao registrada.</p>
          ) : (
            decididas.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DecisaoBadge status={item.status} />
                    <p className="font-medium text-sm truncate">{item.lancamento?.descricao || "Lancamento removido"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solicitado por {item.solicitadoPorNome || "-"} · decidido por {item.decididoPorNome || "-"} em {formatDateTime(item.decididoEm)}
                    {item.motivoDecisao ? ` · ${item.motivoDecisao}` : ""}
                  </p>
                </div>
                <span className="font-semibold text-sm flex-shrink-0">{formatCurrency(item.valor)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(rejeitando)} onOpenChange={(open) => (!open && !busyId ? setRejeitando(null) : undefined)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar baixa</DialogTitle>
            <DialogDescription>O lancamento continua programado e pode receber nova solicitacao.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motivo *</Label>
            <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: valor nao localizado no extrato" />
            {rejeitarError ? <p className="text-sm text-red-600">{rejeitarError}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejeitando(null)} disabled={Boolean(busyId)}>Voltar</Button>
            <Button variant="destructive" onClick={() => void confirmarRejeicao()} disabled={Boolean(busyId)}>
              {busyId ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Rejeitar baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
