"use client"

import { useEffect, useState } from "react"
import { CreditCard, Loader2, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FORMAS_PAGAMENTO } from "@/components/financeiro/aprovacoes-baixa"
import { MAX_PARCELAS_CARTAO, chaveTaxaCartao, rotuloTaxaCartao } from "@/lib/financeiro-calculos"
import type {
  FinanceiroLancamentoItem,
  FinanceiroTaxaCartaoItem,
  FinanceiroTaxaCartaoModalidade,
} from "@/lib/supabase/financeiro-repo"

export function formatPercent(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function parsePercent(value: string): number | null {
  const normalized = value.trim().replace("%", "").replace(",", ".")
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

type LinhaTaxa = { modalidade: FinanceiroTaxaCartaoModalidade; parcelas: number }

const LINHAS: LinhaTaxa[] = [
  { modalidade: "cartao_debito", parcelas: 1 },
  ...Array.from({ length: MAX_PARCELAS_CARTAO }, (_, i) => ({ modalidade: "cartao_credito" as const, parcelas: i + 1 })),
]

export function TaxasCartaoSection({
  historico,
  vigentes,
  isAprovador,
  onSalvar,
}: {
  historico: FinanceiroTaxaCartaoItem[]
  /** Taxas vigentes por chaveTaxaCartao(modalidade, parcelas). */
  vigentes: Record<string, number>
  isAprovador: boolean
  onSalvar: (modalidade: FinanceiroTaxaCartaoModalidade, percentual: number, parcelas: number) => Promise<void>
}) {
  const [valores, setValores] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState<string | null>(null)
  const [erro, setErro] = useState("")

  const salvar = async (linha: LinhaTaxa) => {
    const chave = chaveTaxaCartao(linha.modalidade, linha.parcelas)
    const percentual = parsePercent(valores[chave] || "")
    if (percentual === null || percentual < 0 || percentual >= 100) {
      setErro("Informe um percentual entre 0 e 99,99.")
      return
    }
    const atual = vigentes[chave]
    if (atual !== undefined && Math.round(percentual * 100) === Math.round(atual * 100)) {
      setErro("O percentual informado e igual ao vigente.")
      return
    }
    const rotulo = rotuloTaxaCartao(linha.modalidade, linha.parcelas).toLowerCase()
    const ok = window.confirm(
      `Alterar a taxa de ${rotulo} de ${atual !== undefined ? formatPercent(atual) : "(nao configurada)"} para ${formatPercent(percentual)}?\n\nVale para as proximas solicitacoes de baixa. Baixas ja solicitadas mantem a taxa anterior.`,
    )
    if (!ok) return
    setSalvando(chave)
    setErro("")
    try {
      await onSalvar(linha.modalidade, percentual, linha.parcelas)
      setValores((prev) => ({ ...prev, [chave]: "" }))
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Nao foi possivel salvar a taxa.")
    } finally {
      setSalvando(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Taxas de cartao</h1>
          <p className="text-sm text-muted-foreground">
            Percentual descontado dos recebimentos no cartao. No credito a taxa depende das parcelas da venda; a taxa vigente na solicitacao fica gravada na baixa.
          </p>
        </div>
      </div>

      {!isAprovador ? (
        <p className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />Somente o aprovador do financeiro pode alterar as taxas.
        </p>
      ) : null}

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Taxas vigentes</CardTitle>
          <CardDescription>Sem taxa cadastrada, a baixa naquela modalidade fica bloqueada.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {LINHAS.map((linha) => {
              const chave = chaveTaxaCartao(linha.modalidade, linha.parcelas)
              const atual = vigentes[chave]
              return (
                <div key={chave} className={`flex items-center gap-3 px-6 py-2 ${linha.modalidade === "cartao_debito" ? "bg-muted/20" : ""}`}>
                  <span className="text-sm w-36">{rotuloTaxaCartao(linha.modalidade, linha.parcelas)}</span>
                  <span className={`text-sm font-semibold w-20 text-right ${atual === undefined ? "text-muted-foreground font-normal" : ""}`}>
                    {atual !== undefined ? formatPercent(atual) : "—"}
                  </span>
                  {isAprovador ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        className="h-8 w-24"
                        inputMode="decimal"
                        placeholder="Nova %"
                        value={valores[chave] || ""}
                        onChange={(e) => setValores((prev) => ({ ...prev, [chave]: e.target.value }))}
                      />
                      <Button size="sm" className="h-8" onClick={() => void salvar(linha)} disabled={Boolean(salvando) || !(valores[chave] || "").trim()}>
                        {salvando === chave ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historico de alteracoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma taxa configurada.</p>
          ) : (
            historico.slice(0, 50).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border bg-background px-3 py-2 text-sm">
                <span className="w-36">{rotuloTaxaCartao(item.modalidade, item.parcelas)}</span>
                <span className="font-semibold">{formatPercent(item.percentual)}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {item.definidoPorNome || "-"} · {item.vigenteDesde ? new Date(item.vigenteDesde).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}

export function AlterarFormaPagamentoDialog({
  lancamento,
  onCancel,
  onConfirm,
}: {
  lancamento: FinanceiroLancamentoItem | null
  onCancel: () => void
  onConfirm: (lancamento: FinanceiroLancamentoItem, formaPagamento: string) => Promise<void>
}) {
  const [forma, setForma] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!lancamento) return
    setForma(lancamento.formaPagamento || "")
    setSaving(false)
    setError("")
  }, [lancamento])

  const confirmar = async () => {
    if (!lancamento || saving) return
    setSaving(true)
    setError("")
    try {
      await onConfirm(lancamento, forma)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel alterar.")
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(lancamento)} onOpenChange={(open) => (!open && !saving ? onCancel() : undefined)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Forma de pagamento</DialogTitle>
          <DialogDescription>{lancamento?.descricao}</DialogDescription>
        </DialogHeader>
        <Select value={forma || "__none__"} onValueChange={(v) => setForma(v === "__none__" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Nao informado</SelectItem>
            {FORMAS_PAGAMENTO.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>Voltar</Button>
          <Button onClick={() => void confirmar()} disabled={saving || forma === (lancamento?.formaPagamento || "")}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
