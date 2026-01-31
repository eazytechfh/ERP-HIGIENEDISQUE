"use client"

import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserCheck, Calendar, CheckCircle2, Clock, TrendingUp, AlertTriangle, FileText, Smile } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function DashboardPage() {
  // Mock data - Em produção, estes dados viriam de uma API/banco de dados
  const metricsData = {
    nps: 88,
    clientesAtivos: 247,
    clientesVencer: 18,
    totalClientes: 312,
    servicosProgramadosHoje: 12,
    servicosProgramadosSemana: 42,
    servicosProgramadosMes: 156,
    servicosRealizadosHoje: 8,
    servicosRealizadosSemana: 38,
    servicosRealizadosMes: 142,
  }

  // Cálculo de pendentes (programados - realizados)
  const servicosPendentesHoje = metricsData.servicosProgramadosHoje - metricsData.servicosRealizadosHoje

  // Dados do gráfico OS por dia da semana
  const osPorDiaData = [
    { dia: 'Seg', os: 9 },
    { dia: 'Ter', os: 12 },
    { dia: 'Qua', os: 8 },
    { dia: 'Qui', os: 10 },
    { dia: 'Sex', os: 7 },
    { dia: 'Sáb', os: 11 },
    { dia: 'Dom', os: 8 },
  ]

  // Alertas
  const alertas = [
    { tipo: 'OS sem assinatura', quantidade: 5, cor: 'bg-blue-500' },
    { tipo: 'Preventiva vencida', quantidade: 3, cor: 'bg-blue-400' },
    { tipo: 'Cliente em atraso', quantidade: 2, cor: 'bg-blue-300' },
    { tipo: 'Equipamento com defeito', quantidade: 1, cor: 'bg-gray-400' },
  ]

  // Pendências críticas
  const pendenciasCriticas = [
    { tipo: 'Desentupimento', descricao: 'Desentupir esgoto no cliente A', prazo: '24/01/2026', responsavel: 'Paulo' },
    { tipo: 'Controle de Pragas', descricao: 'Infestação de insetos no depósito', prazo: '25/01/2026', responsavel: 'Ana' },
    { tipo: 'Limpeza de Caixa d\'Água', descricao: 'Limpeza de caixa d\'água do prédio X', prazo: '26/01/2026', responsavel: 'Carlos' },
    { tipo: 'Sanitização', descricao: 'Sanitização completa escritório Y', prazo: '27/01/2026', responsavel: 'Maria' },
  ]

  // Dados da pesquisa de satisfação
  const satisfacaoData = [
    { mes: 'Ago', nps: 82 },
    { mes: 'Set', nps: 85 },
    { mes: 'Out', nps: 84 },
    { mes: 'Nov', nps: 87 },
    { mes: 'Dez', nps: 86 },
    { mes: 'Jan', nps: 88 },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Principal</h1>
          <p className="text-muted-foreground">Visão geral do sistema de gestão</p>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Serviços Programados Hoje</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metricsData.servicosProgramadosHoje}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Serviços Realizados Hoje</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{metricsData.servicosRealizadosHoje}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Pendentes Hoje</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{servicosPendentesHoje}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Clientes Ativos</p>
              <p className="text-3xl font-bold text-foreground">{metricsData.clientesAtivos}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">NPS</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{metricsData.nps}</p>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          {/* OS por dia - Gráfico de linha curva */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">OS por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={osPorDiaData}>
                    <defs>
                      <linearGradient id="colorOs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="dia" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[0, 20]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="os" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fill="url(#colorOs)"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertas.map((alerta, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-sm ${alerta.cor}`}></div>
                    <span className="text-sm text-foreground flex-1">{alerta.tipo}</span>
                    <span className="text-sm font-semibold text-muted-foreground">({alerta.quantidade})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pesquisa de Satisfação e Clientes */}
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          {/* Evolução NPS */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Smile className="h-4 w-4 text-green-500" />
                Pesquisa de Satisfação (NPS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={satisfacaoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="mes" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      domain={[70, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nps" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Clientes Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Resumo de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-3">
                <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <UserCheck className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{metricsData.clientesAtivos}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
                <div className="text-center p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <Clock className="h-6 w-6 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{metricsData.clientesVencer}</p>
                  <p className="text-xs text-muted-foreground">A Vencer</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg border">
                  <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{metricsData.totalClientes}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Serviços Row */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Serviços Programados */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Serviços Programados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-3">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metricsData.servicosProgramadosHoje}</p>
                  <p className="text-xs text-muted-foreground">Hoje</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metricsData.servicosProgramadosSemana}</p>
                  <p className="text-xs text-muted-foreground">Semana</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metricsData.servicosProgramadosMes}</p>
                  <p className="text-xs text-muted-foreground">Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Serviços Realizados */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Serviços Realizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-3">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metricsData.servicosRealizadosHoje}</p>
                  <p className="text-xs text-muted-foreground">Hoje</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metricsData.servicosRealizadosSemana}</p>
                  <p className="text-xs text-muted-foreground">Semana</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metricsData.servicosRealizadosMes}</p>
                  <p className="text-xs text-muted-foreground">Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pendências Críticas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" />
              Pendências críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Prazo</TableHead>
                  <TableHead className="font-semibold">Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendenciasCriticas.map((pendencia, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{pendencia.tipo}</TableCell>
                    <TableCell className="text-muted-foreground">{pendencia.descricao}</TableCell>
                    <TableCell>{pendencia.prazo}</TableCell>
                    <TableCell>{pendencia.responsavel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
