"use client"

import { useEffect, useMemo, useState } from "react"
import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserCheck, Calendar, CheckCircle2, Clock, AlertTriangle, AlertCircle, TrendingUp, Package, Wrench, FileSignature, RefreshCw } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { getClientesMetricasSupabase, listClientesContratoAVencerSupabase, type ClientesMetricas, type ClienteContratoAVencer } from "@/lib/supabase/clientes-repo"
import { listServicosSupabaseDashboard, type ServicoSupabaseItem } from "@/lib/supabase/servicos-repo"
import { listProdutosSupabase, type ProdutoSupabaseItem } from "@/lib/supabase/estoque-repo"
import { listManutencoesPreventivasSupabase, listVeiculosSupabase, type ManutencaoPreventivaSupabaseItem, type VeiculoSupabaseItem } from "@/lib/supabase/veiculos-repo"
import { listEquipeMembrosSupabase, type EquipeMembroInput } from "@/lib/supabase/equipe-repo"

type DashboardMetrics = {
  programadosHoje: number
  realizadosHoje: number
  pendentesHoje: number
  clientesAtivos: number
  clientesAVencer: number
  clientesVencidos: number
  totalClientesResumo: number
  programadosSemana: number
  programadosMes: number
  realizadosSemana: number
  realizadosMes: number
  osSemana: Array<{ dia: string; os: number }>
  pendenciasCriticas: Array<{ origem: string; texto: string }>
  alertas: {
    osSemAssinatura: number
    servicosVencidos: number
    manutencaoVeiculo: number
    equipamentoDefeito: number
  }
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfWeekMonday(base: Date): Date {
  const date = new Date(base)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfWeekSunday(base: Date): Date {
  const start = startOfWeekMonday(base)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function parseServiceDate(value: string): Date | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function isPastDate(value: string, today: Date): boolean {
  const parsed = parseServiceDate(value)
  return parsed ? parsed < today : false
}

function computeMetrics(
  clientesMetricas: ClientesMetricas,
  servicos: ServicoSupabaseItem[],
  manutencoes: ManutencaoPreventivaSupabaseItem[],
  veiculos: VeiculoSupabaseItem[],
  produtos: ProdutoSupabaseItem[],
  equipe: EquipeMembroInput[],
  clientesAVencer: ClienteContratoAVencer[] = [],
  now = new Date(),
): DashboardMetrics {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const weekStart = startOfWeekMonday(today)
  const weekEnd = endOfWeekSunday(today)

  const servicosHoje = servicos.filter((s) => {
    const data = parseServiceDate(s.data)
    return data ? sameDay(data, today) : false
  })

  const servicosSemana = servicos.filter((s) => {
    const data = parseServiceDate(s.data)
    return data ? data >= weekStart && data <= weekEnd : false
  })

  const servicosMes = servicos.filter((s) => {
    const data = parseServiceDate(s.data)
    return data ? data.getMonth() === today.getMonth() && data.getFullYear() === today.getFullYear() : false
  })

  const osSemana = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + idx)
    const total = servicos.filter((s) => {
      const data = parseServiceDate(s.data)
      return data ? sameDay(data, d) : false
    }).length

    return {
      dia: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      os: total,
    }
  })

  const pendenciasClientes: { origem: string; texto: string }[] = []

  const pendenciasManutencao = manutencoes
    .filter((m) => m.status === "Pendente")
    .map((m) => {
      const veiculo = veiculos.find((v) => v.id === m.veiculoId)
      const nomeVeiculo = veiculo ? `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`.trim() : "Veiculo nao identificado"
      return {
        origem: nomeVeiculo,
        texto: `Manutencao preventiva pendente: ${m.descricao || "Sem descricao"}${m.dataPrevista ? ` (prevista para ${new Date(`${m.dataPrevista}T00:00:00`).toLocaleDateString("pt-BR")})` : ""}`,
      }
    })

  const pendenciasEstoque = produtos
    .filter((p) => p.ativo && p.estoqueAtual <= p.estoqueMinimo)
    .map((p) => ({
      origem: p.nome || "Item de estoque",
      texto: `Item no estoque com status: Critico (${p.estoqueAtual} ${p.unidade} disponiveis, minimo ${p.estoqueMinimo})`,
    }))

  const pendenciasEquipe = equipe
    .filter((membro) => membro.situacao === "Ativo")
    .flatMap((membro) => {
      const docs = [
        { label: "NR33", data: membro.nr33Validade },
        { label: "NR35", data: membro.nr35Validade },
        { label: "ASO", data: membro.asoValidade },
      ]

      return docs
        .filter((doc) => isPastDate(doc.data, today))
        .map((doc) => ({
          origem: membro.nome || "Membro sem nome",
          texto: `${doc.label} vencido${doc.data ? ` (venceu em ${new Date(`${doc.data}T00:00:00`).toLocaleDateString("pt-BR")})` : ""}`,
        }))
    })

  return {
    programadosHoje: servicosHoje.filter((s) => s.status === "agendado").length,
    realizadosHoje: servicosHoje.filter((s) => s.status === "executado").length,
    pendentesHoje: servicosHoje.filter((s) => s.status === "agendado" || s.status === "em_execucao").length,
    clientesAtivos: clientesMetricas.totalAtivos,
    clientesAVencer: clientesMetricas.totalAVencer,
    clientesVencidos: clientesMetricas.totalVencidos,
    totalClientesResumo: clientesMetricas.total,
    programadosSemana: servicosSemana.filter((s) => s.status === "agendado").length,
    programadosMes: servicosMes.filter((s) => s.status === "agendado").length,
    realizadosSemana: servicosSemana.filter((s) => s.status === "executado").length,
    realizadosMes: servicosMes.filter((s) => s.status === "executado").length,
    osSemana,
    pendenciasCriticas: [...pendenciasClientes, ...pendenciasManutencao, ...pendenciasEstoque, ...pendenciasEquipe],
    alertas: {
      osSemAssinatura: servicos.filter((s) => s.osStatus && s.osStatus !== "assinada_digitalizada").length,
      servicosVencidos: servicos.filter((s) => {
        const data = parseServiceDate(s.data)
        return data ? data < today && s.status !== "executado" && s.status !== "cancelado" : false
      }).length,
      manutencaoVeiculo: manutencoes.filter((m) => m.status === "Pendente").length,
      equipamentoDefeito: produtos.filter((p) => p.ativo && p.estoqueAtual <= p.estoqueMinimo).length,
    },
  }
}

export default function DashboardPage() {
  const [clientesMetricas, setClientesMetricas] = useState<ClientesMetricas>({ totalAtivos: 0, totalAVencer: 0, totalVencidos: 0, total: 0 })
  const [clientesAVencer, setClientesAVencer] = useState<ClienteContratoAVencer[]>([])
  const [servicos, setServicos] = useState<ServicoSupabaseItem[]>([])
  const [manutencoes, setManutencoes] = useState<ManutencaoPreventivaSupabaseItem[]>([])
  const [veiculos, setVeiculos] = useState<VeiculoSupabaseItem[]>([])
  const [produtos, setProdutos] = useState<ProdutoSupabaseItem[]>([])
  const [equipe, setEquipe] = useState<EquipeMembroInput[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        const [clientesResult, clientesAVencerResult, servicosResult, manutencoesResult, veiculosResult, produtosResult, equipeResult] = await Promise.allSettled([
          getClientesMetricasSupabase(),
          listClientesContratoAVencerSupabase(),
          listServicosSupabaseDashboard(),
          listManutencoesPreventivasSupabase(),
          listVeiculosSupabase(),
          listProdutosSupabase(),
          listEquipeMembrosSupabase(),
        ])
        if (!mounted) return

        if (clientesResult.status === "fulfilled") {
          setClientesMetricas(clientesResult.value)
        } else {
          console.error("Falha ao carregar clientes no dashboard", clientesResult.reason)
          setClientesMetricas({ totalAtivos: 0, totalAVencer: 0, totalVencidos: 0, total: 0 })
        }

        if (clientesAVencerResult.status === "fulfilled") {
          setClientesAVencer(clientesAVencerResult.value)
        } else {
          setClientesAVencer([])
        }

        if (servicosResult.status === "fulfilled") {
          setServicos(servicosResult.value)
        } else {
          console.error("Falha ao carregar servicos no dashboard", servicosResult.reason)
          setServicos([])
        }

        if (manutencoesResult.status === "fulfilled") {
          setManutencoes(manutencoesResult.value)
        } else {
          console.error("Falha ao carregar manutencoes no dashboard", manutencoesResult.reason)
          setManutencoes([])
        }

        if (veiculosResult.status === "fulfilled") {
          setVeiculos(veiculosResult.value)
        } else {
          console.error("Falha ao carregar veiculos no dashboard", veiculosResult.reason)
          setVeiculos([])
        }

        if (produtosResult.status === "fulfilled") {
          setProdutos(produtosResult.value)
        } else {
          console.error("Falha ao carregar produtos no dashboard", produtosResult.reason)
          setProdutos([])
        }

        if (equipeResult.status === "fulfilled") {
          setEquipe(equipeResult.value)
        } else {
          console.error("Falha ao carregar equipe no dashboard", equipeResult.reason)
          setEquipe([])
        }
        if (mounted) setLastUpdated(new Date())
      } catch (error) {
        console.error("Falha inesperada ao carregar dashboard do Supabase", error)
        if (!mounted) return
        setClientesMetricas({ totalAtivos: 0, totalAVencer: 0, totalVencidos: 0, total: 0 })
        setClientesAVencer([])
        setServicos([])
        setManutencoes([])
        setVeiculos([])
        setProdutos([])
        setEquipe([])
      }
    }

    void loadData()
    return () => {
      mounted = false
    }
  }, [])

  const hoje = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const metrics = useMemo(
    () => computeMetrics(clientesMetricas, servicos, manutencoes, veiculos, produtos, equipe, clientesAVencer, hoje),
    [clientesMetricas, servicos, manutencoes, veiculos, produtos, equipe, clientesAVencer, hoje],
  )

  const alertas = [
    { tipo: "OS sem assinatura", quantidade: metrics.alertas.osSemAssinatura, icon: FileSignature, cor: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { tipo: "Serviços Vencidos", quantidade: metrics.alertas.servicosVencidos, icon: AlertCircle, cor: "text-red-600", bg: "bg-red-50 border-red-200" },
    { tipo: "Contratos a Vencer (30d)", quantidade: clientesAVencer.length, icon: AlertTriangle, cor: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
    { tipo: "Manutenção de Veículo", quantidade: metrics.alertas.manutencaoVeiculo, icon: Wrench, cor: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    { tipo: "Estoque crítico", quantidade: metrics.alertas.equipamentoDefeito, icon: Package, cor: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  ]

  const taxaConclusaoHoje = metrics.programadosHoje + metrics.realizadosHoje > 0
    ? Math.round((metrics.realizadosHoje / (metrics.programadosHoje + metrics.realizadosHoje)) * 100)
    : 0

  const dataAtual = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Principal</h1>
            <p className="mt-1 text-sm text-muted-foreground capitalize">{dataAtual}</p>
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Programados Hoje</p>
              <p className="text-3xl font-bold text-blue-600">{metrics.programadosHoje}</p>
              <p className="mt-1 text-xs text-blue-500">{metrics.programadosSemana} esta semana</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Realizados Hoje</p>
              <p className="text-3xl font-bold text-green-600">{metrics.realizadosHoje}</p>
              <p className="mt-1 text-xs text-green-500">{metrics.realizadosSemana} esta semana</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Pendentes Hoje</p>
              <p className="text-3xl font-bold text-amber-600">{metrics.pendentesHoje}</p>
              <p className="mt-1 text-xs text-amber-500">aguardando execucao</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Taxa de Conclusao</p>
              <p className="text-3xl font-bold text-purple-600">{taxaConclusaoHoje}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-purple-200">
                <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${taxaConclusaoHoje}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">OS por dia (semana atual)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.osSemana}>
                    <defs><linearGradient id="colorOs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dia" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, "dataMax + 2"]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="os" stroke="#3b82f6" strokeWidth={2} fill="url(#colorOs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base font-semibold"><AlertTriangle className="h-4 w-4 text-amber-500" />Alertas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertas.map((alerta) => {
                  const Icon = alerta.icon
                  return (
                    <div key={alerta.tipo} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${alerta.quantidade > 0 ? alerta.bg : "bg-muted/30 border-border"}`}>
                      <Icon className={`h-4 w-4 shrink-0 ${alerta.quantidade > 0 ? alerta.cor : "text-muted-foreground"}`} />
                      <span className="flex-1 text-sm">{alerta.tipo}</span>
                      <span className={`text-sm font-bold tabular-nums ${alerta.quantidade > 0 ? alerta.cor : "text-muted-foreground"}`}>
                        {alerta.quantidade}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Users className="h-4 w-4 text-primary" />Resumo de Clientes</CardTitle></CardHeader>
            <CardContent><div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center"><UserCheck className="mx-auto mb-2 h-6 w-6 text-primary" /><p className="text-2xl font-bold text-foreground">{metrics.clientesAtivos}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center"><Clock className="mx-auto mb-2 h-6 w-6 text-amber-600" /><p className="text-2xl font-bold text-foreground">{metrics.clientesAVencer}</p><p className="text-xs text-muted-foreground">A vencer</p></div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center"><AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-600" /><p className="text-2xl font-bold text-foreground">{metrics.clientesVencidos}</p><p className="text-xs text-muted-foreground">Vencidos</p></div>
              <div className="rounded-lg border bg-muted p-4 text-center"><Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" /><p className="text-2xl font-bold text-foreground">{metrics.totalClientesResumo}</p><p className="text-xs text-muted-foreground">Total</p></div>
            </div></CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Calendar className="h-4 w-4 text-blue-500" />Serviços Programados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-center"><p className="text-2xl font-bold text-blue-600">{metrics.programadosHoje}</p><p className="text-xs text-muted-foreground">Hoje</p></div>
                <div className="rounded-lg bg-blue-50 p-3 text-center"><p className="text-2xl font-bold text-blue-600">{metrics.programadosSemana}</p><p className="text-xs text-muted-foreground">Semana</p></div>
                <div className="rounded-lg bg-blue-50 p-3 text-center"><p className="text-2xl font-bold text-blue-600">{metrics.programadosMes}</p><p className="text-xs text-muted-foreground">Mês</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base font-semibold"><CheckCircle2 className="h-4 w-4 text-green-500" />Serviços Realizados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-green-50 p-3 text-center"><p className="text-2xl font-bold text-green-600">{metrics.realizadosHoje}</p><p className="text-xs text-muted-foreground">Hoje</p></div>
                <div className="rounded-lg bg-green-50 p-3 text-center"><p className="text-2xl font-bold text-green-600">{metrics.realizadosSemana}</p><p className="text-xs text-muted-foreground">Semana</p></div>
                <div className="rounded-lg bg-green-50 p-3 text-center"><p className="text-2xl font-bold text-green-600">{metrics.realizadosMes}</p><p className="text-xs text-muted-foreground">Mês</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {clientesAVencer.length > 0 && (
          <Card className="mb-6 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Contratos a Vencer nos Próximos 30 Dias
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">{clientesAVencer.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data de Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesAVencer.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{new Date(`${c.dataFimContrato}T00:00:00`).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>Pendências críticas</span>
              {metrics.pendenciasCriticas.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{metrics.pendenciasCriticas.length}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.pendenciasCriticas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                      <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-500" />
                      Nenhuma pendência crítica. Tudo em dia!
                    </TableCell>
                  </TableRow>
                ) : (
                  metrics.pendenciasCriticas.map((p, idx) => {
                    const isManutencao = p.texto.toLowerCase().includes("manutencao")
                    const isContrato = p.texto.toLowerCase().includes("contrato")
                    const isEstoque = p.texto.toLowerCase().includes("estoque") || p.texto.toLowerCase().includes("critico")
                    const isDoc = p.texto.toLowerCase().includes("nr") || p.texto.toLowerCase().includes("aso") || p.texto.toLowerCase().includes("vencido")
                    const badge = isManutencao
                      ? { label: "Veículo", cls: "bg-amber-100 text-amber-700" }
                      : isContrato
                      ? { label: "Contrato", cls: "bg-red-100 text-red-700" }
                      : isEstoque
                      ? { label: "Estoque", cls: "bg-orange-100 text-orange-700" }
                      : isDoc
                      ? { label: "Equipe", cls: "bg-purple-100 text-purple-700" }
                      : { label: "Geral", cls: "bg-gray-100 text-gray-700" }
                    return (
                      <TableRow key={`${p.origem}-${idx}`}>
                        <TableCell className="font-medium">{p.origem}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                            <span>{p.texto}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

