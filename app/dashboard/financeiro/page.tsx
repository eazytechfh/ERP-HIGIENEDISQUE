"use client"

import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpCircle, ArrowDownCircle, LayoutDashboard, FileText, Receipt, BarChart3, Wallet } from 'lucide-react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useState } from "react"

const receitaRealizada = 125000
const receitaProgramada = 89000
const despesaRealizada = 45000
const despesaProgramada = 38000
const saldoTotal = receitaRealizada - despesaRealizada + (receitaProgramada - despesaProgramada)

// Dados para gráfico mensal
const dadosMensais = [
  { mes: "Jan", receitaRealizada: 95000, receitaProgramada: 75000, despesaRealizada: 35000, despesaProgramada: 30000 },
  { mes: "Fev", receitaRealizada: 105000, receitaProgramada: 82000, despesaRealizada: 38000, despesaProgramada: 32000 },
  { mes: "Mar", receitaRealizada: 115000, receitaProgramada: 85000, despesaRealizada: 42000, despesaProgramada: 35000 },
  { mes: "Abr", receitaRealizada: 120000, receitaProgramada: 87000, despesaRealizada: 44000, despesaProgramada: 36000 },
  { mes: "Mai", receitaRealizada: 125000, receitaProgramada: 89000, despesaRealizada: 45000, despesaProgramada: 38000 },
]

// Dados para gráfico de pizza
const distribuicaoReceitas = [
  { nome: "Serviços Realizados", valor: receitaRealizada, cor: "hsl(142, 76%, 36%)" },
  { nome: "Serviços Programados", valor: receitaProgramada, cor: "hsl(142, 76%, 56%)" },
]

const distribuicaoDespesas = [
  { nome: "Despesas Realizadas", valor: despesaRealizada, cor: "hsl(0, 84%, 60%)" },
  { nome: "Despesas Programadas", valor: despesaProgramada, cor: "hsl(0, 84%, 80%)" },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default function FinanceiroPage() {
  const [abaAtiva, setAbaAtiva] = useState("dashboard")

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <div className="flex">
        {/* Sidebar de navegação financeira */}
        <aside className="w-64 bg-background border-r border-border min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-2">
            <Button
              variant={abaAtiva === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setAbaAtiva("dashboard")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={abaAtiva === "boleto" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setAbaAtiva("boleto")}
            >
              <Receipt className="h-4 w-4" />
              Emissão de Boleto
            </Button>
            <Button
              variant={abaAtiva === "nf" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setAbaAtiva("nf")}
            >
              <FileText className="h-4 w-4" />
              Emissão de NF
            </Button>
            <Button
              variant={abaAtiva === "relatorios" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setAbaAtiva("relatorios")}
            >
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </Button>
            <Button
              variant={abaAtiva === "fluxo" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setAbaAtiva("fluxo")}
            >
              <Wallet className="h-4 w-4" />
              Fluxo de Caixa
            </Button>
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 px-8 py-8">
          {abaAtiva === "dashboard" && (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard Financeiro</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4" />
                      Receita Realizada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">{formatCurrency(receitaRealizada)}</div>
                    <p className="text-xs text-green-600 mt-1">Serviços concluídos</p>
                  </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Receita Programada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-900">{formatCurrency(receitaProgramada)}</div>
                    <p className="text-xs text-emerald-600 mt-1">Serviços agendados</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4" />
                      Despesa Realizada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-900">{formatCurrency(despesaRealizada)}</div>
                    <p className="text-xs text-red-600 mt-1">Despesas pagas</p>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Despesa Programada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">{formatCurrency(despesaProgramada)}</div>
                    <p className="text-xs text-orange-600 mt-1">A pagar</p>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Saldo Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${saldoTotal >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                      {formatCurrency(saldoTotal)}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Receitas - Despesas</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Evolução Financeira Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        receitaRealizada: {
                          label: "Receita Realizada",
                          color: "hsl(142, 76%, 36%)",
                        },
                        despesaRealizada: {
                          label: "Despesa Realizada",
                          color: "hsl(0, 84%, 60%)",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dadosMensais}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="receitaRealizada" 
                            stackId="1"
                            stroke="hsl(142, 76%, 36%)" 
                            fill="hsl(142, 76%, 36%)" 
                            name="Receita Realizada"
                            opacity={0.8}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="despesaRealizada" 
                            stackId="2"
                            stroke="hsl(0, 84%, 60%)" 
                            fill="hsl(0, 84%, 60%)" 
                            name="Despesa Realizada"
                            opacity={0.8}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Comparativo Realizado vs Programado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        receitaRealizada: {
                          label: "Receita Realizada",
                          color: "hsl(142, 76%, 36%)",
                        },
                        receitaProgramada: {
                          label: "Receita Programada",
                          color: "hsl(142, 76%, 56%)",
                        },
                        despesaRealizada: {
                          label: "Despesa Realizada",
                          color: "hsl(0, 84%, 60%)",
                        },
                        despesaProgramada: {
                          label: "Despesa Programada",
                          color: "hsl(0, 84%, 80%)",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosMensais}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="receitaRealizada" fill="hsl(142, 76%, 36%)" name="Receita Realizada" />
                          <Bar dataKey="receitaProgramada" fill="hsl(142, 76%, 56%)" name="Receita Programada" />
                          <Bar dataKey="despesaRealizada" fill="hsl(0, 84%, 60%)" name="Despesa Realizada" />
                          <Bar dataKey="despesaProgramada" fill="hsl(0, 84%, 80%)" name="Despesa Programada" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                      Distribuição de Receitas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        realizadas: {
                          label: "Realizadas",
                          color: "hsl(142, 76%, 36%)",
                        },
                        programadas: {
                          label: "Programadas",
                          color: "hsl(142, 76%, 56%)",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distribuicaoReceitas}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ nome, valor }) => `${nome}: ${formatCurrency(valor)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="valor"
                          >
                            {distribuicaoReceitas.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.cor} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                          <span>Realizadas</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(receitaRealizada)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <span>Programadas</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(receitaProgramada)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                      Distribuição de Despesas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        realizadas: {
                          label: "Realizadas",
                          color: "hsl(0, 84%, 60%)",
                        },
                        programadas: {
                          label: "Programadas",
                          color: "hsl(0, 84%, 80%)",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distribuicaoDespesas}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ nome, valor }) => `${nome}: ${formatCurrency(valor)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="valor"
                          >
                            {distribuicaoDespesas.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.cor} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-600"></div>
                          <span>Realizadas</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(despesaRealizada)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <span>Programadas</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(despesaProgramada)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {abaAtiva === "boleto" && (
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-6">Emissão de Boleto</h1>
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de emissão de boletos em desenvolvimento</p>
                </CardContent>
              </Card>
            </div>
          )}

          {abaAtiva === "nf" && (
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-6">Emissão de Nota Fiscal</h1>
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de emissão de notas fiscais em desenvolvimento</p>
                </CardContent>
              </Card>
            </div>
          )}

          {abaAtiva === "relatorios" && (
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-6">Relatórios Financeiros</h1>
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de relatórios financeiros em desenvolvimento</p>
                </CardContent>
              </Card>
            </div>
          )}

          {abaAtiva === "fluxo" && (
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-6">Fluxo de Caixa</h1>
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Wallet className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de fluxo de caixa em desenvolvimento</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
