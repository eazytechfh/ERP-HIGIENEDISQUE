"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CheckCircle2, Clock, XCircle, Bell, Calendar, FileText, Eye, Paperclip, ChevronLeft, ChevronRight } from "lucide-react"
import { toIsoDate } from "@/lib/flow-store"
import { CLIENTE_COLUMNS_SELETOR, listClientesSupabase } from "@/lib/supabase/clientes-repo"
import { mapClienteToServicoView } from "@/lib/supabase/clientes-view"
import { getOSAssinadaArquivoUrl, listServicosSupabase } from "@/lib/supabase/servicos-repo"
import { extrairGarantiasServico, type GarantiaServicoItem, type SituacaoGarantia } from "@/lib/garantias-servicos"
import { openPrintDocument } from "@/components/os-generation/print-utils"

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
  cliente: string
  local: string
  horario: string
  tecnico: string
  osDocumentoHtml: string
  osAssinada: boolean
  osAssinadaNome: string
  osAssinadaStorageBucket: string
  osAssinadaStoragePath: string
  garantias: GarantiaServicoItem[]
}

const statusMap: Record<string, ServicoHistorico["status"]> = {
  executado: "Realizado",
  agendado: "Programado",
  cancelado: "Cancelado",
  em_execucao: "Em execucao",
}

const PAGE_SIZE = 20

type ListaClientesModo = "com_servicos" | "todos"

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
}

export default function HistoricoPage() {
  const [listaClientesModo, setListaClientesModo] = useState<ListaClientesModo>("com_servicos")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<ClienteResumo | null>(null)
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingClientes, setIsLoadingClientes] = useState(false)
  const [isLoadingServicos, setIsLoadingServicos] = useState(true)
  const [servicos, setServicos] = useState<ServicoHistorico[]>([])
  const [selectedServico, setSelectedServico] = useState<ServicoHistorico | null>(null)
  const [showOSDialog, setShowOSDialog] = useState(false)

  const clientesRequestIdRef = useRef(0)

  const loadClientes = useCallback(async (page: number, search: string) => {
    const requestId = ++clientesRequestIdRef.current
    setIsLoadingClientes(true)
    try {
      const result = await listClientesSupabase({ page, pageSize: PAGE_SIZE, search: search || undefined, columns: CLIENTE_COLUMNS_SELETOR })
      if (requestId !== clientesRequestIdRef.current) return
      setClientes(
        result.data.map((c) => {
          const view = mapClienteToServicoView(c)
          return { id: view.id, nome: view.nome, telefone: view.telefone, email: view.email, empresa: view.empresa, cpfCnpj: view.cpfCnpj }
        })
      )
      setTotalCount(result.count)
    } catch (error) {
      if (requestId !== clientesRequestIdRef.current) return
      console.error("Falha ao carregar clientes no historico", error)
      setClientes([])
      setTotalCount(0)
    } finally {
      if (requestId === clientesRequestIdRef.current) setIsLoadingClientes(false)
    }
  }, [])

  // Busca paginada no cadastro completo de clientes.
  useEffect(() => {
    if (listaClientesModo !== "todos") return
    const timer = setTimeout(() => {
      loadClientes(currentPage, searchTerm)
    }, searchTerm ? 600 : 0)
    return () => clearTimeout(timer)
  }, [currentPage, listaClientesModo, loadClientes, searchTerm])

  // Carrega serviços uma vez
  useEffect(() => {
    let mounted = true
    listServicosSupabase()
      .then((rows) => {
        if (!mounted) return
        setServicos(
          rows.map((s) => ({
            id: s.id,
            osNumber: s.osNumber,
            clienteId: s.clienteId,
            nome: s.servico,
            data: toIsoDate(s.data) || s.data,
            status: statusMap[s.status] ?? "Programado",
            valor: 0,
            observacao: s.baixaObservacao || `OS ${s.osNumber} registrada no sistema`,
            cliente: s.cliente,
            local: s.local,
            horario: s.horario,
            tecnico: s.tecnico,
            osDocumentoHtml: s.osDocumentoHtml,
            osAssinada: s.osAssinada,
            osAssinadaNome: s.osAssinadaNome,
            osAssinadaStorageBucket: s.osAssinadaStorageBucket,
            osAssinadaStoragePath: s.osAssinadaStoragePath,
            garantias: extrairGarantiasServico(s),
          }))
        )
      })
      .catch((err) => console.error("Falha ao carregar servicos no historico", err))
      .finally(() => {
        if (mounted) setIsLoadingServicos(false)
      })
    return () => { mounted = false }
  }, [])

  const servicosPorCliente = useMemo(() => {
    const counts = new Map<string, number>()
    for (const servico of servicos) {
      if (!servico.clienteId) continue
      counts.set(servico.clienteId, (counts.get(servico.clienteId) || 0) + 1)
    }
    return counts
  }, [servicos])

  const clientesComServicos = useMemo(() => {
    const unicos = new Map<string, ClienteResumo>()
    for (const servico of servicos) {
      if (!servico.clienteId || unicos.has(servico.clienteId)) continue
      unicos.set(servico.clienteId, {
        id: servico.clienteId,
        nome: servico.cliente || "Cliente sem nome",
        telefone: "",
        email: "",
        empresa: "",
        cpfCnpj: "",
      })
    }
    return Array.from(unicos.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
    )
  }, [servicos])

  const clientesComServicosFiltrados = useMemo(() => {
    const termo = normalizeSearch(searchTerm)
    if (!termo) return clientesComServicos
    return clientesComServicos.filter((cliente) => normalizeSearch(cliente.nome).includes(termo))
  }, [clientesComServicos, searchTerm])

  const clientesComServicosPaginados = useMemo(() => {
    const inicio = (currentPage - 1) * PAGE_SIZE
    return clientesComServicosFiltrados.slice(inicio, inicio + PAGE_SIZE)
  }, [clientesComServicosFiltrados, currentPage])

  const clientesVisiveis = listaClientesModo === "com_servicos" ? clientesComServicosPaginados : clientes
  const totalClientesVisiveis = listaClientesModo === "com_servicos" ? clientesComServicosFiltrados.length : totalCount
  const carregandoLista = listaClientesModo === "com_servicos" ? isLoadingServicos : isLoadingClientes

  const notificacoes = useMemo(() => {
    return servicos.map((s) => ({
      id: `n-${s.id}`,
      clienteId: String(s.clienteId ?? ""),
      servico: s.nome,
      dataEnvio: toIsoDate(s.data) || s.data,
      tipo: `Atualizacao de OS: ${s.status}`,
    }))
  }, [servicos])

  const clienteServicos = selectedCliente ? servicos.filter((s) => s.clienteId === selectedCliente.id) : []
  const clienteNotificacoes = selectedCliente ? notificacoes.filter((n) => n.clienteId === selectedCliente.id) : []

  const servicosRealizados = clienteServicos.filter((s) => s.status === "Realizado").length
  const servicosProgramados = clienteServicos.filter((s) => s.status === "Programado" || s.status === "Em execucao").length
  const servicosCancelados = clienteServicos.filter((s) => s.status === "Cancelado").length
  const totalPages = Math.ceil(totalClientesVisiveis / PAGE_SIZE)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Realizado": return "bg-green-500/10 text-green-700 border-green-200"
      case "Programado":
      case "Em execucao": return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "Cancelado": return "bg-red-500/10 text-red-700 border-red-200"
      default: return ""
    }
  }

  const garantiaColor: Record<SituacaoGarantia, string> = {
    vencida: "border-red-200 bg-red-50 text-red-700",
    a_vencer: "border-amber-200 bg-amber-50 text-amber-700",
    vigente: "border-green-200 bg-green-50 text-green-700",
  }

  const garantiaLabel: Record<SituacaoGarantia, string> = {
    vencida: "Vencida",
    a_vencer: "A vencer",
    vigente: "Vigente",
  }

  const formatDate = (dateString: string) => {
    const iso = toIsoDate(dateString)
    const date = new Date(`${iso || dateString}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateString
    return date.toLocaleDateString("pt-BR")
  }

  const buildOSDocumentHtml = (contentHtml: string, osNumberValue: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${osNumberValue}</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #fff; color: #111827; }
    table { border-collapse: collapse; width: 100%; }
    @media print { body { margin: 0; padding: 10px; } .no-print { display: none; } }
  </style>
</head>
<body>${contentHtml}</body>
</html>`

  const handleVerOS = (servico: ServicoHistorico) => {
    setSelectedServico(servico)
    setShowOSDialog(true)
  }

  const handleImprimirOS = () => {
    if (!selectedServico?.osDocumentoHtml) return
    openPrintDocument(buildOSDocumentHtml(selectedServico.osDocumentoHtml, selectedServico.osNumber))
  }

  const handleAbrirAnexoAssinado = async (servico: ServicoHistorico) => {
    if (!servico.osAssinadaStorageBucket || !servico.osAssinadaStoragePath) return
    try {
      const signedUrl = await getOSAssinadaArquivoUrl(servico.osAssinadaStorageBucket, servico.osAssinadaStoragePath)
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      console.error("Falha ao abrir anexo assinado da OS", error)
    }
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
          {/* Painel esquerdo — lista paginada de clientes */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Selecionar Cliente</CardTitle>
              <CardDescription>
                {listaClientesModo === "com_servicos"
                  ? `${totalClientesVisiveis.toLocaleString("pt-BR")} cliente(s) com serviço`
                  : totalCount > 0
                    ? `${totalCount.toLocaleString("pt-BR")} clientes cadastrados`
                    : "Busque e selecione um cliente"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={listaClientesModo}
                onValueChange={(value) => {
                  setListaClientesModo(value as ListaClientesModo)
                  setSearchTerm("")
                  setCurrentPage(1)
                }}
                className="mb-3"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="com_servicos">
                    Com serviços ({clientesComServicos.length})
                  </TabsTrigger>
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={listaClientesModo === "com_servicos" ? "Buscar cliente com serviço..." : "Nome, telefone, CPF ou CNPJ..."}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="max-h-[520px] space-y-2 overflow-y-auto">
                {carregandoLista ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
                ) : clientesVisiveis.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {listaClientesModo === "com_servicos" ? "Nenhum cliente com serviço encontrado" : "Nenhum cliente encontrado"}
                  </p>
                ) : (
                  clientesVisiveis.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => setSelectedCliente(cliente)}
                      className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${
                        selectedCliente?.id === cliente.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground text-sm">{cliente.nome}</h3>
                        {listaClientesModo === "com_servicos" ? (
                          <Badge variant="secondary" className="shrink-0 text-[11px]">
                            {servicosPorCliente.get(cliente.id) || 0} serviço(s)
                          </Badge>
                        ) : null}
                      </div>
                      {cliente.empresa && cliente.empresa !== cliente.nome && (
                        <p className="text-xs text-muted-foreground">{cliente.empresa}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{cliente.telefone || cliente.cpfCnpj}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || carregandoLista}
                    className="gap-1 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Ant.
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || carregandoLista}
                    className="gap-1 px-2"
                  >
                    Próx.
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Painel direito */}
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
                            {servico.garantias.length > 0 && (
                              <div className="mb-3 rounded-md border bg-muted/20 p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Garantias</p>
                                <div className="flex flex-wrap gap-2">
                                  {servico.garantias.map((garantia) => (
                                    <div key={garantia.id} className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs">
                                      <span className="font-medium">{garantia.cobertura}</span>
                                      <Badge variant="outline" className={garantiaColor[garantia.situacao]}>{garantiaLabel[garantia.situacao]}</Badge>
                                      <span className="text-muted-foreground">até {formatDate(garantia.vencimento)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p className="mb-3 text-sm text-muted-foreground">{servico.observacao}</p>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleVerOS(servico)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver OS
                              </Button>
                              {servico.osAssinada && servico.osAssinadaStoragePath ? (
                                <Button variant="outline" size="sm" onClick={() => void handleAbrirAnexoAssinado(servico)}>
                                  <Paperclip className="mr-2 h-4 w-4" />
                                  Ver anexo assinado
                                </Button>
                              ) : null}
                            </div>
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

        <Dialog open={showOSDialog} onOpenChange={setShowOSDialog}>
          <DialogContent className="max-h-[95vh] w-[96vw] overflow-y-auto sm:max-w-[1200px]">
            <DialogHeader>
              <DialogTitle>Preview da OS</DialogTitle>
              <DialogDescription>Visualizacao do documento salvo da ordem de servico.</DialogDescription>
            </DialogHeader>
            {selectedServico && (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{selectedServico.osNumber}</Badge>
                  <Badge className={getStatusColor(selectedServico.status)}>{selectedServico.status}</Badge>
                </div>
                <Card>
                  <CardContent className="space-y-2 pt-4">
                    <p><span className="text-muted-foreground">Servico:</span> {selectedServico.nome}</p>
                    <p><span className="text-muted-foreground">Cliente:</span> {selectedServico.cliente}</p>
                    <p><span className="text-muted-foreground">Local:</span> {selectedServico.local || "-"}</p>
                    <p><span className="text-muted-foreground">Data:</span> {formatDate(selectedServico.data)}</p>
                    <p><span className="text-muted-foreground">Horario:</span> {selectedServico.horario || "-"}</p>
                    <p><span className="text-muted-foreground">Tecnico:</span> {selectedServico.tecnico || "-"}</p>
                    <p><span className="text-muted-foreground">OS assinada:</span> {selectedServico.osAssinada ? (selectedServico.osAssinadaNome || "Arquivo anexado") : "Nao"}</p>
                  </CardContent>
                </Card>
                {selectedServico.osDocumentoHtml ? (
                  <div className="overflow-hidden rounded-lg border">
                    <iframe
                      title={`preview-${selectedServico.osNumber}`}
                      srcDoc={buildOSDocumentHtml(selectedServico.osDocumentoHtml, selectedServico.osNumber)}
                      className="h-[58vh] w-full min-h-[520px]"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">Esta OS ainda nao possui documento salvo.</p>
                )}
              </div>
            )}
            <DialogFooter>
              {selectedServico?.osAssinada && selectedServico.osAssinadaStoragePath ? (
                <Button variant="outline" onClick={() => void handleAbrirAnexoAssinado(selectedServico)} className="bg-transparent">
                  Ver anexo assinado
                </Button>
              ) : null}
              {selectedServico?.osDocumentoHtml ? (
                <Button variant="outline" onClick={handleImprimirOS} className="bg-transparent">
                  Imprimir OS
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setShowOSDialog(false)} className="bg-transparent">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
