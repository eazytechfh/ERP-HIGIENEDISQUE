import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Calendar, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  // Mock data - Em produção, estes dados viriam de uma API/banco de dados
  const metricsData = {
    clientesAtivos: 247,
    clientesVencer: 18,
    totalClientes: 312,
    servicosHoje: 8,
    servicosSemana: 42,
    servicosMes: 156,
    realizadosHoje: 5,
    realizadosSemana: 38,
    realizadosMes: 142,
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Principal</h1>
          <p className="text-muted-foreground">Visão geral do sistema de gestão</p>
        </div>

        {/* Clientes Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Clientes</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clientes Ativos
                </CardTitle>
                <UserCheck className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metricsData.clientesAtivos}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Contratos ativos no sistema
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-destructive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clientes a Vencer
                </CardTitle>
                <Clock className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metricsData.clientesVencer}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Contratos vencendo em breve
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Clientes
                </CardTitle>
                <Users className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metricsData.totalClientes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos os clientes cadastrados
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Serviços Programados Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Serviços Programados</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20 dark:to-background border-blue-200 dark:border-blue-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hoje
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metricsData.servicosHoje}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Serviços agendados para hoje
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20 dark:to-background border-purple-200 dark:border-purple-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Esta Semana
                </CardTitle>
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metricsData.servicosSemana}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Serviços programados na semana
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-background dark:from-indigo-950/20 dark:to-background border-indigo-200 dark:border-indigo-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Este Mês
                </CardTitle>
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metricsData.servicosMes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de serviços no mês
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Serviços Realizados Section */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Serviços Realizados</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20 dark:to-background border-green-200 dark:border-green-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hoje
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metricsData.realizadosHoje}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Serviços concluídos hoje
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-background dark:from-emerald-950/20 dark:to-background border-emerald-200 dark:border-emerald-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Esta Semana
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metricsData.realizadosSemana}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Serviços finalizados na semana
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-background dark:from-teal-950/20 dark:to-background border-teal-200 dark:border-teal-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Este Mês
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metricsData.realizadosMes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total realizado no mês
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
