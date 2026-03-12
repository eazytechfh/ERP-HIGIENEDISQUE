"use client"

import { useEffect, useMemo, useState } from "react"
import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserCheck, Calendar, CheckCircle2, Clock, AlertTriangle, AlertCircle } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { listClientesSupabase } from "@/lib/supabase/clientes-repo"
import { listServicosSupabase, type ServicoSupabaseItem } from "@/lib/supabase/servicos-repo"

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
  pendenciasCriticas: Array<{ cliente: string; texto: string }>
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

function computeMetrics(clientes: any[], servicos: ServicoSupabaseItem[], now = new Date()): DashboardMetrics {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const weekStart = startOfWeekMonday(today)
  const weekEnd = endOfWeekSunday(today)

  const clientesAtivosList = clientes.filter((c) => String(c.status || "Ativo").trim().toLowerCase() === "ativo")
  const clientesComContratoAtivo = clientesAtivosList.filter((c) => c.possuiContrato)

  const getSituacaoContratoCliente = (cliente: any) => {
    if (!cliente.dataFimContrato) return ""
    const dataFim = parseServiceDate(cliente.dataFimContrato)
    if (!dataFim) return ""
    const diffDays = Math.floor((dataFim.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return "Vencido"
    if (diffDays <= 30) return "A vencer"
    return "Em dia"
  }

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

  return {
    programadosHoje: servicosHoje.filter((s) => s.status === "agendado").length,
    realizadosHoje: servicosHoje.filter((s) => s.status === "executado").length,
    pendentesHoje: servicosHoje.filter((s) => s.status === "agendado" || s.status === "em_execucao").length,
    clientesAtivos: clientesAtivosList.length,
    clientesAVencer: clientesComContratoAtivo.filter((c) => getSituacaoContratoCliente(c) === "A vencer").length,
    clientesVencidos: clientesComContratoAtivo.filter((c) => getSituacaoContratoCliente(c) === "Vencido").length,
    totalClientesResumo: clientes.length,
    programadosSemana: servicosSemana.filter((s) => s.status === "agendado").length,
    programadosMes: servicosMes.filter((s) => s.status === "agendado").length,
    realizadosSemana: servicosSemana.filter((s) => s.status === "executado").length,
    realizadosMes: servicosMes.filter((s) => s.status === "executado").length,
    osSemana,
    pendenciasCriticas: clientes
      .flatMap((c) => (Array.isArray(c.pendenciasCriticas) ? c.pendenciasCriticas.map((texto: string) => ({ cliente: c.nome, texto })) : [])),
    alertas: {
      osSemAssinatura: servicos.filter((s) => s.osStatus && s.osStatus !== "assinada_digitalizada").length,
      servicosVencidos: servicos.filter((s) => {
        const data = parseServiceDate(s.data)
        return data ? data < today && s.status !== "executado" && s.status !== "cancelado" : false
      }).length,
      manutencaoVeiculo: 0,
      equipamentoDefeito: 0,
    },
  }
}

export default function DashboardPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [servicos, setServicos] = useState<ServicoSupabaseItem[]>([])

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        const [clientesResult, servicosResult] = await Promise.allSettled([listClientesSupabase(), listServicosSupabase()])
        if (!mounted) return

        if (clientesResult.status === "fulfilled") {
          setClientes(clientesResult.value)
        } else {
          console.error("Falha ao carregar clientes no dashboard", clientesResult.reason)
          setClientes([])
        }

        if (servicosResult.status === "fulfilled") {
          setServicos(servicosResult.value)
        } else {
          console.error("Falha ao carregar servicos no dashboard", servicosResult.reason)
          setServicos([])
        }
      } catch (error) {
        console.error("Falha inesperada ao carregar dashboard do Supabase", error)
        if (!mounted) return
        setClientes([])
        setServicos([])
      }
    }

    void loadData()
    return () => {
      mounted = false
    }
  }, [])

  const metrics = useMemo(() => computeMetrics(clientes, servicos, new Date()), [clientes, servicos])

  const alertas = [
    { tipo: "OS sem assinatura", quantidade: metrics.alertas.osSemAssinatura, cor: "bg-blue-500" },
    { tipo: "Serviços Vencidos", quantidade: metrics.alertas.servicosVencidos, cor: "bg-blue-400" },
    { tipo: "Manutenção de Veículo", quantidade: metrics.alertas.manutencaoVeiculo, cor: "bg-blue-200" },
    { tipo: "Equipamento com defeito", quantidade: metrics.alertas.equipamentoDefeito, cor: "bg-gray-400" },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Dashboard Principal</h1>
          <p className="text-muted-foreground">Visão geral do sistema de gestão</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50"><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Serviços Programados Hoje</p><p className="text-3xl font-bold text-blue-600">{metrics.programadosHoje}</p></CardContent></Card>
          <Card className="border-green-200 bg-green-50"><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Serviços Realizados Hoje</p><p className="text-3xl font-bold text-green-600">{metrics.realizadosHoje}</p></CardContent></Card>
          <Card className="border-amber-200 bg-amber-50"><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Pendentes Hoje</p><p className="text-3xl font-bold text-amber-600">{metrics.pendentesHoje}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Clientes Ativos</p><p className="text-3xl font-bold text-foreground">{metrics.clientesAtivos}</p></CardContent></Card>
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
              <div className="space-y-3">
                {alertas.map((alerta) => (
                  <div key={alerta.tipo} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-sm ${alerta.cor}`}></div>
                    <span className="flex-1 text-sm text-foreground">{alerta.tipo}</span>
                    <span className="text-sm font-semibold text-muted-foreground">({alerta.quantidade})</span>
                  </div>
                ))}
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

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Pendências críticas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Descrição</TableHead></TableRow></TableHeader>
              <TableBody>
                {metrics.pendenciasCriticas.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhuma pendência crítica cadastrada</TableCell></TableRow>
                ) : (
                  metrics.pendenciasCriticas.map((p, idx) => (
                    <TableRow key={`${p.cliente}-${idx}`}><TableCell>{p.cliente}</TableCell><TableCell>{p.texto}</TableCell></TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
