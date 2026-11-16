"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ArrowDownCircle, ArrowUpCircle, Calendar, DollarSign, Loader2, Wallet } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MESES_NOME, intervaloPeriodo, rotuloBalde, type PeriodoSelecionado } from "@/lib/financeiro-periodo"
import {
  resumoCategoriasSupabase,
  resumoPeriodoSupabase,
  type ResumoCategoriaLinha,
  type ResumoPeriodoLinha,
} from "@/lib/supabase/financeiro-repo"

const CHART_COLORS = ["#16a34a", "#22c55e", "#dc2626", "#f97316", "#2563eb", "#7c3aed", "#0891b2", "#ca8a04"]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)
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

function Distribuicao({ titulo, dados }: { titulo: string; dados: Array<{ nome: string; valor: number; cor: string }> }) {
  const vazio = dados.length === 0
  const exibidos = vazio ? [{ nome: "Sem movimentacao", valor: 1, cor: "#e5e7eb" }] : dados
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{titulo}</CardTitle>
        <CardDescription>Por categoria, no periodo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="h-[200px] w-[200px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={exibidos} dataKey="valor" nameKey="nome" outerRadius={80} innerRadius={48}>
                  {exibidos.map((entry, index) => <Cell key={`${entry.nome}-${index}`} fill={entry.cor} />)}
                </Pie>
                {vazio ? null : <Tooltip formatter={(value: number) => formatCurrency(value)} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            {vazio ? <p className="text-sm text-muted-foreground">Nenhuma movimentacao no periodo.</p> : null}
            {dados.map((entry) => (
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
  )
}

export function DashboardFinanceiro({
  versao,
  onErro,
  proximosVencimentos,
}: {
  /** Incrementar para recarregar apos alteracoes. */
  versao: number
  onErro: (mensagem: string) => void
  /** Bloco de proximos vencimentos (independe do periodo). */
  proximosVencimentos: ReactNode
}) {
  const anoAtual = new Date().getFullYear()
  const [ano, setAno] = useState(anoAtual)
  const [periodo, setPeriodo] = useState<PeriodoSelecionado>("mes_atual")
  const [resumo, setResumo] = useState<ResumoPeriodoLinha[]>([])
  const [categorias, setCategorias] = useState<ResumoCategoriaLinha[]>([])
  const [carregando, setCarregando] = useState(true)

  const intervalo = useMemo(() => intervaloPeriodo(ano, periodo), [ano, periodo])
  const anos = useMemo(() => Array.from({ length: 6 }, (_, i) => anoAtual - 4 + i), [anoAtual])

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    Promise.all([
      resumoPeriodoSupabase(intervalo.inicio, intervalo.fim, intervalo.agrupamento),
      resumoCategoriasSupabase(intervalo.inicio, intervalo.fim),
    ])
      .then(([linhas, cats]) => {
        if (!ativo) return
        setResumo(linhas)
        setCategorias(cats)
      })
      .catch((error) => { if (ativo) onErro(error instanceof Error ? error.message : "Falha ao carregar o dashboard.") })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalo.inicio, intervalo.fim, intervalo.agrupamento, versao])

  const kpis = useMemo(() => {
    const soma = (tipoReceita: boolean, status: string) =>
      resumo.filter((l) => (l.tipo === "receita") === tipoReceita && l.status === status).reduce((s, l) => s + l.total, 0)
    const entradasRealizadas = soma(true, "realizado")
    const entradasProgramadas = soma(true, "programado")
    const saidasRealizadas = soma(false, "realizado")
    const saidasProgramadas = soma(false, "programado")
    return {
      entradasRealizadas,
      entradasProgramadas,
      saidasRealizadas,
      saidasProgramadas,
      saldo: entradasRealizadas + entradasProgramadas - saidasRealizadas - saidasProgramadas,
    }
  }, [resumo])

  const serie = useMemo(() => {
    const baldes = new Map(
      intervalo.baldes.map((chave) => [
        chave,
        { chave, rotulo: rotuloBalde(chave), "Receita Realizada": 0, "Receita Programada": 0, "Despesa Realizada": 0, "Despesa Programada": 0 },
      ]),
    )
    for (const linha of resumo) {
      const alvo = baldes.get(linha.periodo)
      if (!alvo) continue
      const chave = `${linha.tipo === "receita" ? "Receita" : "Despesa"} ${linha.status === "realizado" ? "Realizada" : "Programada"}` as
        | "Receita Realizada" | "Receita Programada" | "Despesa Realizada" | "Despesa Programada"
      alvo[chave] += linha.total
    }
    return Array.from(baldes.values())
  }, [resumo, intervalo.baldes])

  const distribuicao = (receita: boolean) =>
    categorias
      .filter((c) => (c.tipo === "receita") === receita && c.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((c, i) => ({ nome: c.categoria, valor: c.total, cor: CHART_COLORS[i % CHART_COLORS.length] }))

  const eixoMoeda = (v: number) => (Math.abs(v) >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v.toFixed(0)}`)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            {intervalo.rotulo} · realizados pela data da baixa, programados pelo vencimento
            {carregando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))} disabled={periodo === "mes_atual"}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoSelecionado)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Mes atual</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
              {MESES_NOME.map((nome, i) => (
                <SelectItem key={nome} value={String(i + 1).padStart(2, "0")}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard title="Receita Realizada" value={formatCurrency(kpis.entradasRealizadas)} subtitle="Recebido (liquido)" icon={ArrowUpCircle} colorClass="border-l-green-500" iconBg="bg-green-100 text-green-700" />
        <KpiCard title="Receita Programada" value={formatCurrency(kpis.entradasProgramadas)} subtitle="A receber no periodo" icon={Calendar} colorClass="border-l-emerald-400" iconBg="bg-emerald-100 text-emerald-700" />
        <KpiCard title="Saida Realizada" value={formatCurrency(kpis.saidasRealizadas)} subtitle="Pago no periodo" icon={ArrowDownCircle} colorClass="border-l-red-500" iconBg="bg-red-100 text-red-700" />
        <KpiCard title="Saida Programada" value={formatCurrency(kpis.saidasProgramadas)} subtitle="A pagar no periodo" icon={Wallet} colorClass="border-l-orange-400" iconBg="bg-orange-100 text-orange-700" />
        <KpiCard title="Saldo Projetado" value={formatCurrency(kpis.saldo)} subtitle="Entradas menos saidas" icon={DollarSign} colorClass={kpis.saldo >= 0 ? "border-l-blue-500" : "border-l-red-500"} iconBg="bg-blue-100 text-blue-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolucao {intervalo.agrupamento === "mes" ? "mensal" : "diaria"}</CardTitle>
            <CardDescription>Receitas e despesas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
                  <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} interval={intervalo.agrupamento === "dia" ? 2 : 0} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={eixoMoeda} />
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
            <CardDescription>Realizado vs. programado</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} interval={intervalo.agrupamento === "dia" ? 2 : 0} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={eixoMoeda} />
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
        <Distribuicao titulo="Distribuicao de entradas" dados={distribuicao(true)} />
        <Distribuicao titulo="Distribuicao de saidas" dados={distribuicao(false)} />
      </div>

      {proximosVencimentos}
    </>
  )
}
