"use client"

import { useEffect, useMemo, useState } from "react"
import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserCheck, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { buildDashboardMetrics, loadFlowStore } from "@/lib/flow-store"

export default function DashboardPage() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const onFocus = () => setTick((v) => v + 1)
    const onStorage = () => setTick((v) => v + 1)
    window.addEventListener("focus", onFocus)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const store = useMemo(() => loadFlowStore(), [tick])
  const metrics = useMemo(() => buildDashboardMetrics(store, new Date()), [store])

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Principal</h1>
          <p className="text-muted-foreground">Visão geral do sistema de gestão</p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-6">
          <Card className="bg-blue-50 border-blue-200"><CardContent className="p-4"><p className="text-xs text-muted-foreground font-medium">Serviços Programados Hoje</p><p className="text-3xl font-bold text-blue-600">{metrics.programadosHoje}</p></CardContent></Card>
          <Card className="bg-green-50 border-green-200"><CardContent className="p-4"><p className="text-xs text-muted-foreground font-medium">Serviços Realizados Hoje</p><p className="text-3xl font-bold text-green-600">{metrics.realizadosHoje}</p></CardContent></Card>
          <Card className="bg-amber-50 border-amber-200"><CardContent className="p-4"><p className="text-xs text-muted-foreground font-medium">Pendentes Hoje</p><p className="text-3xl font-bold text-amber-600">{metrics.pendentesHoje}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground font-medium">Clientes Ativos</p><p className="text-3xl font-bold text-foreground">{metrics.clientesAtivos}</p></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-6">
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
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Alertas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertas.map((alerta) => (
                  <div key={alerta.tipo} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-sm ${alerta.cor}`}></div>
                    <span className="text-sm text-foreground flex-1">{alerta.tipo}</span>
                    <span className="text-sm font-semibold text-muted-foreground">({alerta.quantidade})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Resumo de Clientes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-3">
                <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20"><UserCheck className="h-6 w-6 text-primary mx-auto mb-2" /><p className="text-2xl font-bold text-foreground">{metrics.clientesAtivos}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
                <div className="text-center p-4 bg-destructive/5 rounded-lg border border-destructive/20"><Clock className="h-6 w-6 text-destructive mx-auto mb-2" /><p className="text-2xl font-bold text-foreground">{metrics.clientesAVencer}</p><p className="text-xs text-muted-foreground">A vencer</p></div>
                <div className="text-center p-4 bg-muted rounded-lg border"><Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><p className="text-2xl font-bold text-foreground">{metrics.totalClientesResumo}</p><p className="text-xs text-muted-foreground">Total</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" />Serviços Programados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-2xl font-bold text-blue-600">{metrics.programadosHoje}</p><p className="text-xs text-muted-foreground">Hoje</p></div>
                <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-2xl font-bold text-blue-600">{metrics.programadosSemana}</p><p className="text-xs text-muted-foreground">Semana</p></div>
                <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-2xl font-bold text-blue-600">{metrics.programadosMes}</p><p className="text-xs text-muted-foreground">Mês</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Serviços Realizados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-3">
                <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{metrics.realizadosHoje}</p><p className="text-xs text-muted-foreground">Hoje</p></div>
                <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{metrics.realizadosSemana}</p><p className="text-xs text-muted-foreground">Semana</p></div>
                <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{metrics.realizadosMes}</p><p className="text-xs text-muted-foreground">Mês</p></div>
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
