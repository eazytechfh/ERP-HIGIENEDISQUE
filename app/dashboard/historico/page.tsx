"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, CheckCircle2, Clock, XCircle, Bell, Calendar, FileText, Eye } from "lucide-react"
import { toIsoDate } from "@/lib/flow-store"
import { listClientesSupabase } from "@/lib/supabase/clientes-repo"
import { mapClienteToServicoView } from "@/lib/supabase/clientes-view"
import { listServicosSupabase } from "@/lib/supabase/servicos-repo"

type ClienteResumo = {
  id: string
  nome: string
  telefone: string
  email: string
  empresa: string
  cpfCnpj: string
}

type ServicoHistorico = {
  id: string
  osNumber: string
  clienteId: string
  nome: string
  data: string
  status: "Realizado" | "Programado" | "Cancelado" | "Em execucao"
  valor: number
  observacao: string
}

const statusMap: Record<string, ServicoHistorico["status"]> = {
  executado: "Realizado",
  agendado: "Programado",
  cancelado: "Cancelado",
  em_execucao: "Em execucao",
}

export default function HistoricoPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<ClienteResumo | null>(null)
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [servicos, setServicos] = useState<ServicoHistorico[]>([])

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        const [clientesRows, servicosRows] = await Promise.all([listClientesSupabase(), listServicosSupabase()])
        if (!mounted) return

        setClientes(
          clientesRows.map((c) => {
            const view = mapClienteToServicoView(c)
            return {
              id: view.id,
              nome: view.nome,
              telefone: view.telefone,
              email: view.email,
              empresa: view.empresa,
              cpfCnpj: view.cpfCnpj,
            }
          })
        )

        setServicos(
          servicosRows.map((s) => ({
            id: s.id,
            osNumber: s.osNumber,
            clienteId: s.clienteId,
            nome: s.servico,
            data: toIsoDate(s.data) || s.data,
            status: statusMap[s.status] ?? "Programado",
            valor: 0,
            observacao: s.baixaObservacao || `OS ${s.osNumber} registrada no sistema`,
          }))
        )
      } catch (error) {
        console.error("Falha ao carregar historico no Supabase", error)
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

  const notificacoes = useMemo(() => {
    return servicos.map((s) => ({
      id: `n-${s.id}`,
      clienteId: String(s.clienteId ?? ""),
      servico: s.nome,
      dataEnvio: toIsoDate(s.data) || s.data,
      tipo: `Atualizacao de OS: ${s.status}`,
    }))
  }, [servicos])

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      cliente.cpfCnpj.includes(searchTerm)
  )

  const clienteServicos = selectedCliente ? servicos.filter((s) => s.clienteId === selectedCliente.id) : []
  const clienteNotificacoes = selectedCliente ? notificacoes.filter((n) => n.clienteId === selectedCliente.id) : []

  const servicosRealizados = clienteServicos.filter((s) => s.status === "Realizado").length
  const servicosProgramados = clienteServicos.filter((s) => s.status === "Programado" || s.status === "Em execucao").length
  const servicosCancelados = clienteServicos.filter((s) => s.status === "Cancelado").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Realizado":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "Programado":
      case "Em execucao":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "Cancelado":
        return "bg-red-500/10 text-red-700 border-red-200"
      default:
        return ""
    }
  }

  const formatDate = (dateString: string) => {
    const iso = toIsoDate(dateString)
    const date = new Date(`${iso || dateString}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateString
    return date.toLocaleDateString("pt-BR")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Historico de Servicos</h1>
          <p className="text-muted-foreground">Visualize os servicos interligados ao cadastro e as OS geradas.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Selecionar Cliente</CardTitle>
              <CardDescription>Busque e selecione um cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
              </div>

              <div className="max-h-[600px] space-y-2 overflow-y-auto">
                {filteredClientes.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                ) : (
                  filteredClientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => setSelectedCliente(cliente)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                        selectedCliente?.id === cliente.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <h3 className="font-semibold text-foreground">{cliente.nome}</h3>
                      <p className="text-sm text-muted-foreground">{cliente.empresa}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{cliente.telefone}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            {!selectedCliente ? (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground">Selecione um cliente para visualizar o historico</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-green-500/10 p-3"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                        <div><p className="text-2xl font-bold text-foreground">{servicosRealizados}</p><p className="text-sm text-muted-foreground">Realizados</p></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-blue-500/10 p-3"><Clock className="h-6 w-6 text-blue-600" /></div>
                        <div><p className="text-2xl font-bold text-foreground">{servicosProgramados}</p><p className="text-sm text-muted-foreground">Programados</p></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-red-500/10 p-3"><XCircle className="h-6 w-6 text-red-600" /></div>
                        <div><p className="text-2xl font-bold text-foreground">{servicosCancelados}</p><p className="text-sm text-muted-foreground">Cancelados</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Servicos Cadastrados</CardTitle>
                    <CardDescription>Historico completo de servicos para {selectedCliente.nome}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clienteServicos.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">Nenhum servico cadastrado para este cliente</p>
                      ) : (
                        clienteServicos.map((servico) => (
                          <div key={servico.id} className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-foreground">{servico.nome}</h4>
                                <div className="mt-1 flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{formatDate(servico.data)}</span>
                                  <span className="text-xs text-muted-foreground">{servico.osNumber}</span>
                                </div>
                              </div>
                              <Badge className={getStatusColor(servico.status)}>{servico.status}</Badge>
                            </div>
                            <p className="mb-3 text-sm text-muted-foreground">{servico.observacao}</p>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/servicos?os=${servico.osNumber}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver OS
                              </Link>
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Historico de Notificacoes</CardTitle>
                    <CardDescription>Registro das atualizacoes de OS por cliente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clienteNotificacoes.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">Nenhuma notificacao registrada para este cliente</p>
                      ) : (
                        clienteNotificacoes.map((notificacao) => (
                          <div key={notificacao.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                            <div className="mt-1 rounded-full bg-primary/10 p-2"><Bell className="h-4 w-4 text-primary" /></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{notificacao.tipo}</p>
                              <p className="text-sm text-muted-foreground">
                                Atualizacao no servico <span className="font-medium">{notificacao.servico}</span> em {formatDate(notificacao.dataEnvio)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
