"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Printer, Eye, Truck } from "lucide-react"

export type OSStatus = "a_gerar" | "gerada" | "impressa" | "entregue_tecnico" | "assinada_digitalizada"

type OSHeaderCardProps = {
  osNumber: string
  osType: string
  status: OSStatus
  dataGeracao: string | null
  onGerarOS: () => void
  onVisualizarPDF: () => void
  onImprimir: () => void
  onMarcarEntregue: () => void
  clienteSelecionado: boolean
  agendamentoCompleto: boolean
}

const statusConfig: Record<OSStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  a_gerar: { label: "A gerar", variant: "outline" },
  gerada: { label: "Gerada", variant: "secondary" },
  impressa: { label: "Impressa", variant: "default" },
  entregue_tecnico: { label: "Entregue ao tecnico", variant: "default" },
  assinada_digitalizada: { label: "Assinada (digitalizada)", variant: "default" },
}

export function OSHeaderCard({
  osNumber,
  osType,
  status,
  dataGeracao,
  onGerarOS,
  onVisualizarPDF,
  onImprimir,
  onMarcarEntregue,
  clienteSelecionado,
  agendamentoCompleto,
}: OSHeaderCardProps) {
  const statusInfo = statusConfig[status]
  const canGenerate = clienteSelecionado && agendamentoCompleto && status === "a_gerar"
  const canVisualize = status !== "a_gerar"
  const canPrint = status !== "a_gerar"
  const canMarkDelivered = status === "impressa"

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Identificacao e Status da OS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Numero da OS</p>
              <p className="font-semibold">{osNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de OS</p>
              <p className="font-medium">{osType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={statusInfo.variant} className="mt-1">
                {statusInfo.label}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de geracao</p>
              <p className="font-medium">{dataGeracao || "-"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onGerarOS}
              disabled={!canGenerate}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Gerar OS
            </Button>
            <Button
              variant="outline"
              onClick={onVisualizarPDF}
              disabled={!canVisualize}
              className="gap-2 bg-transparent"
            >
              <Eye className="h-4 w-4" />
              Visualizar PDF
            </Button>
            <Button
              variant="outline"
              onClick={onImprimir}
              disabled={!canPrint}
              className="gap-2 bg-transparent"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={onMarcarEntregue}
              disabled={!canMarkDelivered}
              className="gap-2 bg-transparent"
            >
              <Truck className="h-4 w-4" />
              Marcar como entregue ao tecnico
            </Button>
          </div>
        </div>

        {!clienteSelecionado && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
            Selecione um cliente para gerar a OS.
          </div>
        )}
        {clienteSelecionado && !agendamentoCompleto && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
            Complete o agendamento para gerar a OS.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
