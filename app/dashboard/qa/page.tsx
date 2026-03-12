"use client"

import { useEffect, useMemo, useState } from "react"
import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  buildDashboardMetrics,
  buildFlowValidationChecklist,
  ensureFlowStoreInitialized,
  getCurrentDataMode,
  loadFlowStore,
  resetFlowStore,
  setCurrentDataMode,
  type DataMode,
  type FlowScenario,
} from "@/lib/flow-store"

export default function QaFluxoPage() {
  const [tick, setTick] = useState(0)
  const [mode, setMode] = useState<DataMode>("local")

  useEffect(() => {
    ensureFlowStoreInitialized("operacional")
    setMode(getCurrentDataMode())

    const onStorage = () => setTick((v) => v + 1)
    const onFocus = () => setTick((v) => v + 1)

    window.addEventListener("storage", onStorage)
    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  const store = useMemo(() => loadFlowStore(), [tick])
  const metrics = useMemo(() => buildDashboardMetrics(store), [store])
  const checklist = useMemo(() => buildFlowValidationChecklist(store), [store])

  const applyScenario = (scenario: FlowScenario) => {
    resetFlowStore(scenario)
    setTick((v) => v + 1)
  }

  const toggleMode = (checked: boolean) => {
    const next = checked ? "api" : "local"
    setCurrentDataMode(next)
    setMode(next)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Validacao do Fluxo (Sem Backend)</h1>
          <p className="text-muted-foreground">
            Ambiente para homologar o fluxo completo com dados interligados locais antes da API real.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Modo de dados</CardTitle>
            <CardDescription>
              Em "local", o sistema usa o backend simulado no navegador. Em "api", fica pronto para futura integracao.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Switch id="mode" checked={mode === "api"} onCheckedChange={toggleMode} />
            <Label htmlFor="mode">{mode === "api" ? "API" : "Local"}</Label>
            <Badge variant={mode === "api" ? "default" : "secondary"}>{mode.toUpperCase()}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cenarios de homologacao</CardTitle>
            <CardDescription>Troque o dataset para validar regras e alertas do negocio.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => applyScenario("operacional")}>Carregar cenario operacional</Button>
            <Button variant="outline" onClick={() => applyScenario("critico")}>Carregar cenario critico</Button>
            <Button variant="outline" onClick={() => applyScenario("vazio")}>Limpar dados (cenario vazio)</Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Clientes ativos</p><p className="text-2xl font-bold">{metrics.clientesAtivos}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Programados hoje</p><p className="text-2xl font-bold">{metrics.programadosHoje}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Executados hoje</p><p className="text-2xl font-bold">{metrics.realizadosHoje}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendentes hoje</p><p className="text-2xl font-bold">{metrics.pendentesHoje}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Checklist do fluxo</CardTitle>
            <CardDescription>Itens que devem ficar validos para iniciar o backend com mais seguranca.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item) => (
              <div key={item.id} className="rounded-lg border p-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{item.titulo}</p>
                  <p className="text-sm text-muted-foreground">{item.detalhe}</p>
                </div>
                <Badge variant={item.ok ? "default" : "destructive"}>{item.ok ? "OK" : "Pendente"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

