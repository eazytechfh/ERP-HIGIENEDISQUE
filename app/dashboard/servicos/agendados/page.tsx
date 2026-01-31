"use client"

import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  CheckCircle,
  ArrowLeft,
  Eye,
  Printer
} from "lucide-react"
import Link from "next/link"

// Mock data de serviços agendados
const servicosAgendados = [
  {
    id: "1",
    osNumber: "OS-2026-000123",
    cliente: "João Silva",
    servico: "Dedetização Residencial",
    tipo: "Controle de Pragas",
    local: "Residência Principal - Av. Paulista, 1000",
    data: "05/02/2026",
    horario: "09:00 - 11:00",
    tecnico: "Carlos - Técnico",
    status: "agendado",
    osStatus: "gerada"
  },
  {
    id: "2",
    osNumber: "OS-2026-000122",
    cliente: "Empresa ABC Ltda",
    servico: "Dedetização Comercial",
    tipo: "Controle de Pragas",
    local: "Fábrica - Rua das Indústrias, 200",
    data: "04/02/2026",
    horario: "14:00 - 17:00",
    tecnico: "Ana - Técnica",
    status: "em_execucao",
    osStatus: "entregue_tecnico"
  },
  {
    id: "3",
    osNumber: "OS-2026-000121",
    cliente: "Maria Santos",
    servico: "Controle de Cupins",
    tipo: "Controle de Pragas",
    local: "Matriz - Av. Berrini, 1500",
    data: "03/02/2026",
    horario: "08:00 - 12:00",
    tecnico: "Carlos - Técnico",
    status: "concluido",
    osStatus: "assinada_digitalizada"
  }
]

const statusConfig = {
  agendado: { label: "Agendado", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  em_execucao: { label: "Em Execução", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" }
}

const osStatusConfig = {
  gerada: { label: "OS Gerada", color: "secondary" },
  impressa: { label: "OS Impressa", color: "default" },
  entregue_tecnico: { label: "Entregue ao Técnico", color: "default" },
  assinada_digitalizada: { label: "OS Assinada", color: "default" }
}

export default function ServicosAgendadosPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/servicos">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Serviços Agendados</h1>
          <p className="text-muted-foreground">Acompanhe os serviços agendados e suas respectivas Ordens de Serviço.</p>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agendados</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {servicosAgendados.filter(s => s.status === "agendado").length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Execução</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {servicosAgendados.filter(s => s.status === "em_execucao").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {servicosAgendados.filter(s => s.status === "concluido").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Serviços</CardTitle>
            <CardDescription>Todos os serviços agendados com suas ordens de serviço</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {servicosAgendados.map((servico) => (
                <div 
                  key={servico.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">{servico.osNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[servico.status as keyof typeof statusConfig].color}`}>
                          {statusConfig[servico.status as keyof typeof statusConfig].label}
                        </span>
                        <Badge variant={osStatusConfig[servico.osStatus as keyof typeof osStatusConfig]?.color as any || "secondary"}>
                          {osStatusConfig[servico.osStatus as keyof typeof osStatusConfig]?.label || servico.osStatus}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{servico.servico}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{servico.cliente}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{servico.local}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{servico.data}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{servico.horario}</span>
                        </div>
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Técnico:</span> {servico.tecnico}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Eye className="h-4 w-4" />
                        Ver OS
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
