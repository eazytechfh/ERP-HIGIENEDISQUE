"use client"

import React from "react"

import { ErpHeader } from "@/components/erp-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  ArrowRight, 
  FileText, 
  Upload, 
  X, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  DollarSign,
  Shield,
  Paperclip,
  Plus,
  Trash2,
  AlertTriangle,
  ClipboardList,
  User,
  Clock,
  Truck,
  Printer,
  Eye
} from 'lucide-react'
import { OSHeaderCard, type OSStatus } from "@/components/os-generation/os-header-card"
import { VetoresForm, type DadosTecnicosVetores } from "@/components/os-generation/vetores-form"
import { LimpezaForm, type DadosTecnicosLimpeza } from "@/components/os-generation/limpeza-form"
import { PdfPreviewMock, type TipoOS } from "@/components/os-generation/pdf-preview-mock"
import { ConsumoEstoqueCard, type ConsumoItem, type ItemEstoque } from "@/components/os-generation/consumo-estoque-card"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { listClientesSupabase, type ClienteInput } from "@/lib/supabase/clientes-repo"
import { buildLocaisPorCliente, mapClienteToServicoView } from "@/lib/supabase/clientes-view"
import { ensureFlowStoreInitialized, loadFlowContratos, loadFlowStore, setFlowServicos, toIsoDate, type FlowContrato, type FlowServico } from "@/lib/flow-store"

// Tipos
type Cliente = {
  id: string
  nome: string
  telefone: string
  email: string
  empresa: string
  cpfCnpj: string
}

type LocalAtendimento = {
  id: string
  nome: string
  cep: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  estado: string
}

type Equipe = {
  id: string
  nome: string
  tipo: "tecnico_individual" | "equipe_limpeza" | "equipe_caminhao"
}

type Veiculo = {
  id: string
  placa: string
  modelo: string
}

type Contrato = {
  id: string
  clienteId: string
  numero: string
  descricao: string
  itens: { id: string; nome: string }[]
}

type BillingMode = "contrato" | "adicional"

type ServiceRequest = {
  clientId: string
  locationId: string
  serviceType: string
  serviceName: string
  notes: string
  schedule: {
    date: string
    startTime: string
    endTime: string
    teamIds: string[]
    vehicleId: string
  }
  billing: {
    mode: BillingMode
    contractId?: string
    contractItemId?: string
    price?: string
    paymentMethod?: string
    billingDocument?: "recibo" | "nota_fiscal"
    additionalReason?: string
    approved?: boolean
  }
  warrantyDays: string
  attachments: File[]
}

// Mock Data
const clientesMock: Cliente[] = [
  { id: "1", nome: "João Silva", telefone: "(11) 98765-4321", email: "joao@email.com", empresa: "Silva & Cia", cpfCnpj: "123.456.789-00" },
  { id: "2", nome: "Maria Santos", telefone: "(11) 91234-5678", email: "maria@empresa.com", empresa: "Santos Ltda", cpfCnpj: "12.345.678/0001-90" },
  { id: "3", nome: "Empresa ABC Ltda", telefone: "(11) 99999-9999", email: "contato@abc.com", empresa: "ABC Ltda", cpfCnpj: "98.765.432/0001-10" },
  { id: "4", nome: "Carlos Oliveira", telefone: "(11) 97777-7777", email: "carlos@email.com", empresa: "Oliveira ME", cpfCnpj: "987.654.321-00" },
]

const locaisPorCliente: Record<string, LocalAtendimento[]> = {
  "1": [
    { id: "l1", nome: "Residência Principal", cep: "01310-100", endereco: "Av. Paulista", numero: "1000", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP" },
    { id: "l2", nome: "Escritório", cep: "01311-000", endereco: "Rua Augusta", numero: "500", bairro: "Consolação", cidade: "São Paulo", estado: "SP" },
  ],
  "2": [
    { id: "l3", nome: "Matriz", cep: "04543-000", endereco: "Av. Engenheiro Luís Carlos Berrini", numero: "1500", bairro: "Brooklin", cidade: "São Paulo", estado: "SP" },
  ],
  "3": [
    { id: "l4", nome: "Fábrica", cep: "09220-580", endereco: "Rua das Indústrias", numero: "200", bairro: "Centro", cidade: "Santo André", estado: "SP" },
    { id: "l5", nome: "Depósito", cep: "09210-000", endereco: "Av. Industrial", numero: "800", bairro: "Utinga", cidade: "Santo André", estado: "SP" },
  ],
  "4": [
    { id: "l6", nome: "Loja Centro", cep: "01010-000", endereco: "Rua 25 de Março", numero: "100", bairro: "Centro", cidade: "São Paulo", estado: "SP" },
  ],
}

const equipesMock: Equipe[] = [
  { id: "e1", nome: "Carlos - Técnico", tipo: "tecnico_individual" },
  { id: "e2", nome: "Ana - Técnica", tipo: "tecnico_individual" },
  { id: "e3", nome: "Equipe Limpeza A", tipo: "equipe_limpeza" },
  { id: "e4", nome: "Equipe Limpeza B", tipo: "equipe_limpeza" },
  { id: "e5", nome: "Equipe Caminhão 01", tipo: "equipe_caminhao" },
  { id: "e6", nome: "Equipe Caminhão 02", tipo: "equipe_caminhao" },
]

const veiculosMock: Veiculo[] = [
  { id: "v1", placa: "ABC-1234", modelo: "Caminhão Limpa Fossa" },
  { id: "v2", placa: "DEF-5678", modelo: "Caminhão Hidrojato" },
  { id: "v3", placa: "GHI-9012", modelo: "Van Equipamentos" },
]

// Mock data de serviços agendados

type StatusAgendado = "agendado" | "em_execucao" | "concluido"

type ServicoAgendado = {
  id: string
  osNumber: string
  cliente: string
  clienteId?: string
  servico: string
  tipo: string
  local: string
  data: string
  horario: string
  tecnico: string
  status: StatusAgendado
  osStatus: Exclude<OSStatus, "a_gerar">
  osFingerprint?: string
  osDocumentoHtml?: string
  osFoiAssinada?: boolean
  responsavelBaixa?: string
}

type OSViewerData = {
  osNumber: string
  servico: string
  cliente: string
  local: string
  data: string
  horario: string
  tecnico: string
  status: StatusAgendado
  osStatus: Exclude<OSStatus, "a_gerar">
  osFingerprint?: string
  osDocumentoHtml?: string
}

const servicosAgendadosMock: ServicoAgendado[] = [
  {
    id: "1",
    osNumber: "OS-2026-000123",
    cliente: "Joao Silva",
    servico: "Dedetizacao Residencial",
    tipo: "Controle de Pragas",
    local: "Residencia Principal - Av. Paulista, 1000",
    data: "05/02/2026",
    horario: "09:00 - 11:00",
    tecnico: "Carlos - Tecnico",
    status: "agendado",
    osStatus: "gerada",
  },
  {
    id: "2",
    osNumber: "OS-2026-000122",
    cliente: "Empresa ABC Ltda",
    servico: "Dedetizacao Comercial",
    tipo: "Controle de Pragas",
    local: "Fabrica - Rua das Industrias, 200",
    data: "04/02/2026",
    horario: "14:00 - 17:00",
    tecnico: "Ana - Tecnica",
    status: "em_execucao",
    osStatus: "entregue_tecnico",
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
    tecnico: "Carlos - Tecnico",
    status: "concluido",
    osStatus: "assinada_digitalizada",
  },
]

const agendadosStatusConfig = {
  agendado: { label: "Agendado", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  em_execucao: { label: "Em Execucao", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  concluido: { label: "Concluido", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
}

const osStatusConfigMap = {
  gerada: { label: "OS Gerada", variant: "secondary" as const },
  impressa: { label: "OS Impressa", variant: "default" as const },
  entregue_tecnico: { label: "Entregue ao Tecnico", variant: "default" as const },
  assinada_digitalizada: { label: "OS Assinada", variant: "default" as const },
}


function toDisplayDate(value: string) {
  const iso = toIsoDate(value)
  if (!iso) return value
  const parts = iso.split("-")
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function mapFlowStatusToAgendado(status: FlowServico["status"]): StatusAgendado {
  if (status === "executado") return "concluido"
  if (status === "em_execucao") return "em_execucao"
  return "agendado"
}

function mapAgendadoStatusToFlow(status: StatusAgendado): FlowServico["status"] {
  if (status === "concluido") return "executado"
  if (status === "em_execucao") return "em_execucao"
  return "agendado"
}

function mapFlowServicoToAgendado(servico: FlowServico): ServicoAgendado {
  const osStatus = (servico.osStatus as Exclude<OSStatus, "a_gerar"> | undefined) || "gerada"
  return {
    id: servico.id,
    osNumber: servico.osNumber,
    cliente: servico.cliente,
    clienteId: servico.clienteId,
    servico: servico.servico,
    tipo: servico.tipo || "outro",
    local: servico.local,
    data: toDisplayDate(servico.data),
    horario: servico.horario,
    tecnico: servico.tecnico,
    status: mapFlowStatusToAgendado(servico.status),
    osStatus,
    osFingerprint: servico.osFingerprint,
    osDocumentoHtml: servico.osDocumentoHtml,
    osFoiAssinada: servico.osAssinada,
    responsavelBaixa: servico.baixaObservacao,
  }
}

function mapAgendadoToFlowServico(servico: ServicoAgendado): FlowServico {
  return {
    id: servico.id,
    osNumber: servico.osNumber,
    cliente: servico.cliente,
    clienteId: servico.clienteId,
    servico: servico.servico,
    tipo: servico.tipo,
    local: servico.local,
    data: toIsoDate(servico.data) || servico.data,
    horario: servico.horario,
    tecnico: servico.tecnico,
    status: mapAgendadoStatusToFlow(servico.status),
    osStatus: servico.osStatus,
    osAssinada: typeof servico.osFoiAssinada === "boolean" ? servico.osFoiAssinada : servico.osStatus === "assinada_digitalizada",
    baixaObservacao: servico.responsavelBaixa,
    osFingerprint: servico.osFingerprint,
    osDocumentoHtml: servico.osDocumentoHtml,
  }
}
function ServicosAgendadosContent({
  servicos,
  onVerOS,
  onImprimirOS,
  onAtualizarStatus,
  onSolicitarBaixa,
  onExcluirOS,
}: {
  servicos: ServicoAgendado[]
  onVerOS: (servico: ServicoAgendado) => void
  onImprimirOS: (servico: ServicoAgendado) => void
  onAtualizarStatus: (id: string, status: StatusAgendado) => void
  onSolicitarBaixa: (id: string) => void
  onExcluirOS: (id: string) => void
}) {
  const [filtroAssinatura, setFiltroAssinatura] = useState<"todos" | "assinadas" | "sem_assinatura">("todos")

  const osAssinada = (servico: ServicoAgendado) =>
    typeof servico.osFoiAssinada === "boolean" ? servico.osFoiAssinada : servico.osStatus === "assinada_digitalizada"

  const servicosFiltrados = servicos.filter((servico) => {
    if (filtroAssinatura === "assinadas") return osAssinada(servico)
    if (filtroAssinatura === "sem_assinatura") return !osAssinada(servico)
    return true
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendados</p>
                <p className="text-2xl font-bold text-blue-600">{servicos.filter((s) => s.status === "agendado").length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Execucao</p>
                <p className="text-2xl font-bold text-amber-600">{servicos.filter((s) => s.status === "em_execucao").length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluidos</p>
                <p className="text-2xl font-bold text-green-600">{servicos.filter((s) => s.status === "concluido").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Lista de Servicos</CardTitle>
            <CardDescription>Todos os servicos agendados com suas ordens de servico</CardDescription>
          </div>
          <div className="w-full md:w-[240px]">
            <Label className="text-xs text-muted-foreground">Assinatura da OS</Label>
            <Select value={filtroAssinatura} onValueChange={(value) => setFiltroAssinatura(value as "todos" | "assinadas" | "sem_assinatura")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="assinadas">Somente assinadas</SelectItem>
                <SelectItem value="sem_assinatura">Sem assinatura</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {servicosFiltrados.map((servico) => (
              <div key={servico.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary">{servico.osNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${agendadosStatusConfig[servico.status].color}`}>
                        {agendadosStatusConfig[servico.status].label}
                      </span>
                      <Badge variant={osStatusConfigMap[servico.osStatus]?.variant || "secondary"}>
                        {osStatusConfigMap[servico.osStatus]?.label || servico.osStatus}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{servico.servico}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><User className="h-4 w-4" /><span>{servico.cliente}</span></div>
                      <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>{servico.local}</span></div>
                      <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{servico.data}</span></div>
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{servico.horario}</span></div>
                    </div>
                    <p className="text-sm"><span className="text-muted-foreground">Tecnico:</span> {servico.tecnico}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => onVerOS(servico)}>
                      <Eye className="h-4 w-4" />
                      Ver OS
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => onImprimirOS(servico)}>
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                    <Select
                      value={servico.status === "agendado" ? undefined : servico.status}
                      onValueChange={(value) => {
                        if (value === "concluido") {
                          onSolicitarBaixa(servico.id)
                          return
                        }
                        onAtualizarStatus(servico.id, value as StatusAgendado)
                      }}
                    >
                      <SelectTrigger className="w-[170px] h-9">
                        <SelectValue placeholder="STATUS OS" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em_execucao">Em execucao</SelectItem>
                        <SelectItem value="concluido">Dar baixa (Concluido)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-red-600 border-red-200 hover:text-red-700 hover:border-red-300 bg-transparent"
                      onClick={() => onExcluirOS(servico.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir OS
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {servicosFiltrados.length === 0 && (
              <div className="border rounded-lg p-6 text-sm text-muted-foreground text-center">
                Nenhuma OS encontrada para o filtro selecionado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ServicosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get("clienteId")

  // Estados principais
  const [activeTab, setActiveTab] = useState("nova-solicitacao")
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [tick, setTick] = useState(0)
  const [clientesSupabase, setClientesSupabase] = useState<ClienteInput[]>([])

  useEffect(() => {
    ensureFlowStoreInitialized("operacional")
    const onFocus = () => setTick((v) => v + 1)
    const onStorage = () => setTick((v) => v + 1)
    window.addEventListener("focus", onFocus)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadClientes = async () => {
      try {
        const rows = await listClientesSupabase()
        if (mounted) setClientesSupabase(rows)
      } catch (error) {
        console.error("Falha ao carregar clientes para servicos", error)
        if (mounted) setClientesSupabase([])
      }
    }

    void loadClientes()
    return () => {
      mounted = false
    }
  }, [])

  const flowStore = useMemo(() => loadFlowStore(), [tick])
  const clientesData = useMemo<Cliente[]>(() => {
    return clientesSupabase.map(mapClienteToServicoView)
  }, [clientesSupabase])

  const locaisPorClienteData = useMemo<Record<string, LocalAtendimento[]>>(() => {
    return buildLocaisPorCliente(clientesSupabase)
  }, [clientesSupabase])

    const estoqueBase = useMemo<ItemEstoque[]>(() => {
    const produtos = Array.isArray(flowStore.produtos) ? flowStore.produtos : []

    const mapCategoria = (categoria: string): ItemEstoque["categoria"] => {
      const normalizada = String(categoria || "").toLowerCase()
      if (normalizada.includes("diluente")) return "Diluente"
      if (normalizada.includes("epi")) return "EPI"
      return "Produto Quimico"
    }

    const mapUnidade = (unidade: string): ItemEstoque["unidadePadrao"] => {
      const value = String(unidade || "").toLowerCase()
      if (value === "l" || value === "ml" || value === "g" || value === "kg" || value === "unid") {
        return value as ItemEstoque["unidadePadrao"]
      }
      return "unid"
    }

    return produtos
      .filter((p: any) => p && (p.ativo ?? true))
      .map((p: any, idx: number) => ({
        id: String(p.id ?? `est-${idx}`),
        nome: String(p.nome || `Item ${idx + 1}`),
        categoria: mapCategoria(p.categoria),
        unidadePadrao: mapUnidade(p.unidade),
        estoqueAtual: Number(p.estoqueAtual) || 0,
        estoqueMinimo: Number(p.estoqueMinimo) || 0,
      }))
  }, [flowStore.produtos])

  const opcoesProdutoEstoque = useMemo(() => estoqueBase.map((item) => item.nome), [estoqueBase])
const contratosData = useMemo<Contrato[]>(() => {
    const saved = loadFlowContratos()
    if (!Array.isArray(saved) || saved.length === 0) return []

    return saved.map((c: FlowContrato) => ({
      id: c.id,
      clienteId: c.clienteId,
      numero: c.numero,
      descricao: c.descricao,
      itens: Array.isArray(c.itens) ? c.itens.map((i) => ({ id: i.id, nome: i.nome })) : [],
    }))
  }, [tick])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [locaisCliente, setLocaisCliente] = useState<LocalAtendimento[]>([])
  
  // Modal para novo local
  const [showNovoLocalModal, setShowNovoLocalModal] = useState(false)
  const [novoLocal, setNovoLocal] = useState<Omit<LocalAtendimento, 'id'>>({
    nome: "", cep: "", endereco: "", numero: "", bairro: "", cidade: "", estado: ""
  })

  // Estado do formulário de serviço
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest>({
    clientId: clienteIdParam || "",
    locationId: "",
    serviceType: "",
    serviceName: "",
    notes: "",
    schedule: {
      date: "",
      startTime: "",
      endTime: "",
      teamIds: [],
      vehicleId: ""
    },
    billing: {
      mode: "contrato",
      price: "",
      paymentMethod: ""
    },
    warrantyDays: "",
    attachments: []
  })

  useEffect(() => {
    if (!clienteIdParam) return
    const found = clientesData.find((c) => c.id === clienteIdParam) || null
    setClienteSelecionado(found)
    setLocaisCliente(found ? (locaisPorClienteData[found.id] || []) : [])
    setServiceRequest((prev) => ({
      ...prev,
      clientId: found?.id || "",
      locationId: "",
      billing: { ...prev.billing, contractId: "", contractItemId: "" },
    }))
  }, [clienteIdParam, clientesData, locaisPorClienteData])

  // Estados de validação
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  // Observações de acesso
  const [observacoesAcesso, setObservacoesAcesso] = useState("")

  // Estados para etapa 3 - Geração da OS
  const [osStatus, setOsStatus] = useState<OSStatus>("a_gerar")
  const [osNumber] = useState("OS-2026-000123")
  const [dataGeracao, setDataGeracao] = useState<string | null>(null)
  const [dadosTecnicosVetores, setDadosTecnicosVetores] = useState<DadosTecnicosVetores>({
    pragasAlvo: ["baratas"],
    tipoAtividade: "quimico",
    descricaoServico: "",
    produtos: [],
    medidasPreventivas: "",
    aplicador: "FERNANDO",
    tecnicoResponsavel: "Renato Luiz Leal Gomes",
    registroTecnico: "55953/02 RJ"
  })
  const [dadosTecnicosLimpeza, setDadosTecnicosLimpeza] = useState<DadosTecnicosLimpeza>({
    reservatorios: [],
    aplicador: "Eryck Guimaraes",
    tecnicoResponsavel: "Renato Luiz Leal Gomes",
    registroTecnico: "55953/02 RJ"
  })
  const [arquivoAssinado, setArquivoAssinado] = useState<File | null>(null)

  // Estados para consumo de estoque (OS Vetores)
  const [estoqueSimulado, setEstoqueSimulado] = useState<ItemEstoque[]>([])

  const [consumos, setConsumos] = useState<ConsumoItem[]>([])
  const [showBaixaServicoModal, setShowBaixaServicoModal] = useState(false)
  const [baixaStep, setBaixaStep] = useState<1 | 2>(1)
  const [baixaError, setBaixaError] = useState("")
  const [baixaDraft, setBaixaDraft] = useState<Record<string, { quantidade: string; observacao: string }>>({})
  const [servicosAgendados, setServicosAgendados] = useState<ServicoAgendado[]>([])
  const [servicosHydrated, setServicosHydrated] = useState(false)
  const [showOSViewerModal, setShowOSViewerModal] = useState(false)
  const [selectedAgendadaOS, setSelectedAgendadaOS] = useState<OSViewerData | null>(null)
  const [isFinalizandoAgendamento, setIsFinalizandoAgendamento] = useState(false)
  const [osDocumentoHtmlSnapshot, setOsDocumentoHtmlSnapshot] = useState("")
  const [showBaixaAgendadaModal, setShowBaixaAgendadaModal] = useState(false)
  const [servicoBaixaPendenteId, setServicoBaixaPendenteId] = useState<string | null>(null)
  const [baixaAgendadaAssinada, setBaixaAgendadaAssinada] = useState<"sim" | "nao">("sim")
  const [baixaAgendadaResponsavel, setBaixaAgendadaResponsavel] = useState("")
  const [baixaAgendadaError, setBaixaAgendadaError] = useState("")

  useEffect(() => {
    setEstoqueSimulado(estoqueBase.map((item) => ({ ...item })))
  }, [estoqueBase])
  

  // Sincroniza automaticamente o consumo de estoque com os produtos utilizados na OS Vetores
  const normalizarTextoProduto = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()

  const extrairQuantidadeProduto = (raw: string) => {
    const normalized = String(raw || "").replace(",", ".")
    const match = normalized.match(/\d+(?:\.\d+)?/)
    const parsed = match ? Number.parseFloat(match[0]) : Number.NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  }

  useEffect(() => {
    if (serviceRequest.serviceType !== "pragas") {
      if (consumos.length > 0) setConsumos([])
      const resetEstoque = estoqueBase.map((item) => ({ ...item }))
      if (JSON.stringify(estoqueSimulado) !== JSON.stringify(resetEstoque)) {
        setEstoqueSimulado(resetEstoque)
      }
      return
    }

    const agregado = new Map<string, { item: ItemEstoque; quantidade: number; observacao: string }>()

    dadosTecnicosVetores.produtos.forEach((produto) => {
      if (!produto.produto) return
      const produtoNormalizado = normalizarTextoProduto(produto.produto)

      const itemEstoque =
        estoqueBase.find((e) => normalizarTextoProduto(e.nome) === produtoNormalizado) ||
        estoqueBase.find((e) => normalizarTextoProduto(e.nome).includes(produtoNormalizado) || produtoNormalizado.includes(normalizarTextoProduto(e.nome)))

      if (!itemEstoque) return

      const quantidade = extrairQuantidadeProduto(produto.quantidade)
      const observacao = [produto.pragaAlvo, produto.equipamento].filter(Boolean).join(" | ")
      const atual = agregado.get(itemEstoque.id)

      if (atual) {
        atual.quantidade += quantidade
        if (!atual.observacao && observacao) atual.observacao = observacao
        agregado.set(itemEstoque.id, atual)
      } else {
        agregado.set(itemEstoque.id, { item: itemEstoque, quantidade, observacao })
      }
    })

    const novosConsumos: ConsumoItem[] = Array.from(agregado.values()).map(({ item, quantidade, observacao }, index) => ({
      id: `auto-consumo-${item.id}-${index}`,
      produtoId: item.id,
      produtoNome: item.nome,
      categoria: item.categoria,
      quantidade,
      unidade: item.unidadePadrao,
      estoqueAntes: item.estoqueAtual,
      saldoEstimado: Math.max(0, item.estoqueAtual - quantidade),
      observacao,
    }))

    const novoEstoque = estoqueBase.map((item) => {
      const itemAgregado = agregado.get(item.id)
      if (!itemAgregado) return { ...item }
      return { ...item, estoqueAtual: Math.max(0, item.estoqueAtual - itemAgregado.quantidade) }
    })

    if (JSON.stringify(consumos) !== JSON.stringify(novosConsumos)) {
      setConsumos(novosConsumos)
    }

    if (JSON.stringify(estoqueSimulado) !== JSON.stringify(novoEstoque)) {
      setEstoqueSimulado(novoEstoque)
    }
  }, [dadosTecnicosVetores.produtos, serviceRequest.serviceType, estoqueBase, consumos, estoqueSimulado])

  useEffect(() => {
    const servicosFlow = Array.isArray(flowStore.servicos) ? flowStore.servicos : []
    setServicosAgendados(servicosFlow.map((s) => mapFlowServicoToAgendado(s as FlowServico)))
    setServicosHydrated(true)
  }, [flowStore.servicos])

  useEffect(() => {
    if (!servicosHydrated) return
    setFlowServicos(servicosAgendados.map(mapAgendadoToFlowServico))
  }, [servicosAgendados, servicosHydrated])

  // Determinar tipo de OS baseado no tipo de servico
  const getTipoOS = (): TipoOS => {
    if (serviceRequest.serviceType === "reservatorio_potavel") {
      return "limpeza"
    }
    return "vetores"
  }

  // Filtrar clientes
  const filteredClientes = clientesData.filter((cliente) => {
    const term = searchTerm.toLowerCase()
    const enderecoMatch = (locaisPorClienteData[cliente.id] || []).some((local) =>
      `${local.nome} ${local.endereco} ${local.numero} ${local.bairro} ${local.cidade} ${local.estado} ${local.cep}`
        .toLowerCase()
        .includes(term)
    )

    return (
      cliente.nome.toLowerCase().includes(term) ||
      cliente.telefone.includes(searchTerm) ||
      cliente.cpfCnpj.includes(searchTerm) ||
      enderecoMatch
    )
  })

  // Handlers
  const handleClienteSelect = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setLocaisCliente(locaisPorClienteData[cliente.id] || [])
    setServiceRequest((prev) => ({
      ...prev,
      clientId: cliente.id,
      locationId: "",
      billing: { ...prev.billing, contractId: "", contractItemId: "" },
    }))
  }

  const handleInputChange = (field: string, value: any) => {
    setServiceRequest(prev => ({
      ...prev,
      [field]: value
    }))
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleScheduleChange = (field: string, value: string) => {
    setServiceRequest(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [field]: value }
    }))
    if (errors[`schedule.${field}`]) {
      setErrors(prev => ({ ...prev, [`schedule.${field}`]: "" }))
    }
  }

  const handleToggleResponsavel = (teamId: string) => {
    setServiceRequest((prev) => {
      const alreadySelected = prev.schedule.teamIds.includes(teamId)
      const nextTeamIds = alreadySelected
        ? prev.schedule.teamIds.filter((id) => id !== teamId)
        : [...prev.schedule.teamIds, teamId]

      return {
        ...prev,
        schedule: { ...prev.schedule, teamIds: nextTeamIds },
      }
    })

    if (errors["schedule.teamIds"]) {
      setErrors((prev) => ({ ...prev, ["schedule.teamIds"]: "" }))
    }
  }

  const handleBillingChange = (field: string, value: any) => {
    setServiceRequest(prev => ({
      ...prev,
      billing: { ...prev.billing, [field]: value }
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const validFiles = Array.from(files).filter(file =>
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
      setServiceRequest(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles]
      }))
    }
  }

  const removeAttachment = (index: number) => {
    setServiceRequest(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleAdicionarLocal = () => {
    const newLocal: LocalAtendimento = {
      id: `l${Date.now()}`,
      ...novoLocal
    }
    setLocaisCliente(prev => [...prev, newLocal])
    setShowNovoLocalModal(false)
    setNovoLocal({ nome: "", cep: "", endereco: "", numero: "", bairro: "", cidade: "", estado: "" })
  }

  // Validação
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!clienteSelecionado) newErrors.cliente = "Selecione um cliente"
    if (!serviceRequest.serviceType) newErrors.serviceType = "Selecione o tipo de serviço"
    if (!serviceRequest.serviceName.trim()) newErrors.serviceName = "Informe o nome do serviço"
    if (!serviceRequest.locationId) newErrors.locationId = "Selecione o local de atendimento"
    if (!serviceRequest.schedule.date) newErrors["schedule.date"] = "Informe a data"
    if (!serviceRequest.schedule.startTime) newErrors["schedule.startTime"] = "Informe o horário de início"
    if (!serviceRequest.schedule.endTime) newErrors["schedule.endTime"] = "Informe o horário de término"
    if (serviceRequest.schedule.teamIds.length === 0) newErrors["schedule.teamIds"] = "Selecione ao menos um responsável"

    // Validação de veículo para esgotamento ou equipe_caminhao
    const temEquipeCaminhao = serviceRequest.schedule.teamIds.some((teamId) => equipesMock.find((e) => e.id === teamId)?.tipo === "equipe_caminhao")
    if (
      (serviceRequest.serviceType === "esgotamento" || temEquipeCaminhao) &&
      !serviceRequest.schedule.vehicleId
    ) {
      newErrors["schedule.vehicleId"] = "Selecione o veículo"
    }

    // Validação de billing
    if (serviceRequest.billing.mode === "adicional") {
      if (!serviceRequest.billing.price) newErrors["billing.price"] = "Informe o valor"
      if (!serviceRequest.billing.paymentMethod) newErrors["billing.paymentMethod"] = "Selecione a forma de pagamento"
      if (!serviceRequest.billing.billingDocument) newErrors["billing.billingDocument"] = "Selecione o documento de cobrança"
    }
    if (serviceRequest.billing.mode === "adicional" && !serviceRequest.billing.additionalReason) {
      newErrors["billing.additionalReason"] = "Informe o motivo do adicional"
    }
    if (serviceRequest.billing.mode === "contrato") {
      if (!serviceRequest.billing.contractId) newErrors["billing.contractId"] = "Selecione o contrato"
      if (!serviceRequest.billing.contractItemId) newErrors["billing.contractItemId"] = "Selecione o item do contrato"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAvancar = () => {
    if (validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleSalvarRascunho = () => {
    setToastMessage("Rascunho salvo com sucesso!")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  useEffect(() => {
    if (currentStep !== 3 || activeTab !== "nova-solicitacao") {
      setIsFinalizandoAgendamento(false)
    }
  }, [currentStep, activeTab])

  const handleVoltar = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as 1 | 2 | 3)
    } else {
      router.push("/dashboard")
    }
  }

  // Handlers da etapa 3 - OS
  const handleGerarOS = () => {
    setOsStatus("gerada")
    setDataGeracao(new Date().toLocaleDateString('pt-BR'))
    setToastMessage("OS gerada com sucesso!")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleVisualizarPDF = () => {
    // Já está sendo exibido na prévia
    setToastMessage("Visualizando prévia da OS")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const buildOSDocumentHtml = (contentHtml: string, osNumberValue: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>OS ${osNumberValue}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    * { box-sizing: border-box; }
    .bg-green-600 { background-color: #16a34a; }
    .bg-gray-200 { background-color: #e5e7eb; }
    .bg-gray-100 { background-color: #f3f4f6; }
    .bg-black { background-color: #000; }
    .text-white { color: #fff; }
    .text-green-700 { color: #15803d; }
    .text-red-600 { color: #dc2626; }
    .text-gray-500 { color: #6b7280; }
    .font-bold { font-weight: bold; }
    .text-lg { font-size: 1.125rem; }
    .text-sm { font-size: 0.875rem; }
    .border { border: 1px solid #000; }
    .border-black { border-color: #000; }
    .border-t { border-top: 1px solid #000; }
    .border-r { border-right: 1px solid #000; }
    .border-b { border-bottom: 1px solid #000; }
    .border-2 { border-width: 2px; }
    .rounded { border-radius: 0.25rem; }
    .p-1 { padding: 0.25rem; }
    .p-2 { padding: 0.5rem; }
    .p-8 { padding: 2rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .gap-8 { gap: 2rem; }
    .flex { display: flex; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .w-full { width: 100%; }
    .w-4 { width: 1rem; }
    .w-24 { width: 6rem; }
    .h-4 { height: 1rem; }
    .h-16 { height: 4rem; }
    .min-h-\[40px\] { min-height: 40px; }
    .min-h-\[60px\] { min-height: 60px; }
    .inline-flex { display: inline-flex; }
    .leading-tight { line-height: 1.25; }
    .align-top { vertical-align: top; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    table { border-collapse: collapse; width: 100%; }
    @media print {
      body { margin: 0; padding: 10px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`

  const openAndPrintSavedOS = (contentHtml: string, osNumberValue: string) => {
    if (!contentHtml) return false
    const printWindow = window.open("", "_blank")
    if (!printWindow) return false
    printWindow.document.write(buildOSDocumentHtml(contentHtml, osNumberValue))
    printWindow.document.close()
    printWindow.print()
    return true
  }

  const handleImprimirOS = () => {
    window.print()
    if (osStatus === "gerada") {
      setOsStatus("impressa")
    }
    setToastMessage("Enviando OS para impressão...")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }
  const handleMarcarEntregue = () => {
    setOsStatus("entregue_tecnico")
    setToastMessage("OS marcada como entregue ao tecnico!")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleOpenBaixaServicoModal = () => {
    const consumoPorProduto = consumos.reduce<Record<string, { quantidade: number; observacao: string }>>((acc, consumo) => {
      const current = acc[consumo.produtoId]
      if (current) {
        acc[consumo.produtoId] = {
          quantidade: current.quantidade + consumo.quantidade,
          observacao: current.observacao || consumo.observacao || "",
        }
      } else {
        acc[consumo.produtoId] = {
          quantidade: consumo.quantidade,
          observacao: consumo.observacao || "",
        }
      }
      return acc
    }, {})

    const draftInicial: Record<string, { quantidade: string; observacao: string }> = {}
    estoqueBase.forEach((item) => {
      const consumoAtual = consumoPorProduto[item.id]
      draftInicial[item.id] = {
        quantidade: consumoAtual ? String(consumoAtual.quantidade) : "",
        observacao: consumoAtual?.observacao || "",
      }
    })

    setBaixaDraft(draftInicial)
    setBaixaError("")
    setBaixaStep(1)
    setShowBaixaServicoModal(true)
  }

  const handleBaixaDraftChange = (itemId: string, field: "quantidade" | "observacao", value: string) => {
    setBaixaDraft((prev) => ({
      ...prev,
      [itemId]: {
        quantidade: prev[itemId]?.quantidade || "",
        observacao: prev[itemId]?.observacao || "",
        [field]: value,
      },
    }))
    if (baixaError) {
      setBaixaError("")
    }
  }

  const itensSelecionadosBaixa = estoqueBase
    .map((item) => {
      const quantidade = Number.parseFloat(baixaDraft[item.id]?.quantidade || "0")
      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        return null
      }
      return {
        item,
        quantidade,
        observacao: baixaDraft[item.id]?.observacao || "",
      }
    })
    .filter((entry): entry is { item: ItemEstoque; quantidade: number; observacao: string } => entry !== null)

  const handleAvancarBaixaStep = () => {
    if (itensSelecionadosBaixa.length === 0) {
      setBaixaError("Informe ao menos um item consumido para dar baixa no servico.")
      return
    }

    const itemComSaldoInsuficiente = itensSelecionadosBaixa.find(({ item, quantidade }) => quantidade > item.estoqueAtual)
    if (itemComSaldoInsuficiente) {
      setBaixaError(
        `Quantidade informada para ${itemComSaldoInsuficiente.item.nome} excede o estoque mock (${itemComSaldoInsuficiente.item.estoqueAtual} ${itemComSaldoInsuficiente.item.unidadePadrao}).`
      )
      return
    }

    setBaixaError("")
    setBaixaStep(2)
  }

  const handleConfirmarBaixaServico = () => {
    const novosConsumos: ConsumoItem[] = itensSelecionadosBaixa.map(({ item, quantidade, observacao }, index) => ({
      id: `baixa-${Date.now()}-${index}`,
      produtoId: item.id,
      produtoNome: item.nome,
      categoria: item.categoria,
      quantidade,
      unidade: item.unidadePadrao,
      estoqueAntes: item.estoqueAtual,
      saldoEstimado: item.estoqueAtual - quantidade,
      observacao,
    }))

    const novoEstoque = estoqueBase.map((item) => {
      const selecionado = itensSelecionadosBaixa.find(({ item: baseItem }) => baseItem.id === item.id)
      if (!selecionado) {
        return { ...item }
      }
      return {
        ...item,
        estoqueAtual: item.estoqueAtual - selecionado.quantidade,
      }
    })

    setConsumos(novosConsumos)
    setEstoqueSimulado(novoEstoque)
    setShowBaixaServicoModal(false)
    setBaixaStep(1)
    setToastMessage("Baixa do servico registrada em estado local.")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  const handleUploadAssinado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArquivoAssinado(file)
      setOsStatus("assinada_digitalizada")
      setToastMessage("OS assinada anexada com sucesso!")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  const handleVerOSAgendada = (servico: ServicoAgendado) => {
    setSelectedAgendadaOS({
      osNumber: servico.osNumber,
      servico: servico.servico,
      cliente: servico.cliente,
      local: servico.local,
      data: servico.data,
      horario: servico.horario,
      tecnico: servico.tecnico,
      status: servico.status,
      osStatus: servico.osStatus,
      osFingerprint: servico.osFingerprint,
      osDocumentoHtml: servico.osDocumentoHtml,
    })
    setShowOSViewerModal(true)
  }

  const handleImprimirOSAgendada = (servico: ServicoAgendado) => {
    const impresso = openAndPrintSavedOS(servico.osDocumentoHtml || "", servico.osNumber)

    if (!impresso) {
      handleVerOSAgendada(servico)
      setToastMessage(`A OS ${servico.osNumber} nao possui anexo salvo. Gere novamente para anexar o documento.`)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      return
    }

    setServicosAgendados((prev) =>
      prev.map((item) => (item.id === servico.id && item.osStatus === "gerada" ? { ...item, osStatus: "impressa" } : item))
    )
    setToastMessage(`Impressao da ${servico.osNumber} enviada.`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleAtualizarStatusAgendada = (id: string, status: StatusAgendado) => {
    setServicosAgendados((prev) =>
      prev.map((servico) => {
        if (servico.id !== id) {
          return servico
        }

        let osStatusAtualizado = servico.osStatus
        if (status === "em_execucao") {
          osStatusAtualizado = "entregue_tecnico"
        }
        if (status === "concluido") {
          osStatusAtualizado = "assinada_digitalizada"
        }

        return {
          ...servico,
          status,
          osStatus: osStatusAtualizado,
        }
      })
    )
  }

  const handleSolicitarBaixaAgendada = (id: string) => {
    setServicoBaixaPendenteId(id)
    setBaixaAgendadaAssinada("sim")
    setBaixaAgendadaResponsavel("")
    setBaixaAgendadaError("")
    setShowBaixaAgendadaModal(true)
  }

  const handleConfirmarBaixaAgendada = () => {
    const responsavel = baixaAgendadaResponsavel.trim()
    if (!servicoBaixaPendenteId) {
      setBaixaAgendadaError("Servico nao encontrado para baixa.")
      return
    }
    if (!responsavel) {
      setBaixaAgendadaError("Informe o responsavel.")
      return
    }

    const assinada = baixaAgendadaAssinada === "sim"

    setServicosAgendados((prev) =>
      prev.map((servico) => {
        if (servico.id !== servicoBaixaPendenteId) return servico
        return {
          ...servico,
          status: "concluido",
          osStatus: assinada ? "assinada_digitalizada" : "entregue_tecnico",
          osFoiAssinada: assinada,
          responsavelBaixa: responsavel,
        }
      })
    )

    setShowBaixaAgendadaModal(false)
    setServicoBaixaPendenteId(null)
    setBaixaAgendadaError("")
    setToastMessage("Baixa da OS registrada com sucesso.")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleExcluirOSAgendada = (id: string) => {
    const alvo = servicosAgendados.find((item) => item.id === id)
    if (!alvo) return

    const ok = window.confirm(`Deseja excluir a ${alvo.osNumber}? Esta acao nao pode ser desfeita.`)
    if (!ok) return

    setServicosAgendados((prev) => prev.filter((item) => item.id !== id))
    if (selectedAgendadaOS?.osNumber === alvo.osNumber) {
      setShowOSViewerModal(false)
      setSelectedAgendadaOS(null)
    }
    setToastMessage(`${alvo.osNumber} excluida com sucesso.`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const gerarProximoNumeroOS = () => {
    const maiorNumero = servicosAgendados.reduce((acc, item) => {
      const match = item.osNumber.match(/(\d+)$/)
      const numeroAtual = match ? Number.parseInt(match[1], 10) : 0
      return Math.max(acc, numeroAtual)
    }, 0)
    return `OS-2026-${String(maiorNumero + 1).padStart(6, "0")}`
  }

  const gerarFingerprintAgendamento = () => {
    const clienteId = clienteSelecionado?.id || ""
    const servico = (serviceRequest.serviceName || "").trim().toLowerCase()
    const tipo = serviceRequest.serviceType || "outro"
    const data = serviceRequest.schedule.date || ""
    const inicio = serviceRequest.schedule.startTime || ""
    const fim = serviceRequest.schedule.endTime || ""
    const localId = serviceRequest.locationId || ""
    return [clienteId, servico, tipo, data, inicio, fim, localId].join("|")
  }

const handleConfirmarAgendamentoFinal = () => {
    if (isFinalizandoAgendamento) return
    setIsFinalizandoAgendamento(true)

    if (!osDocumentoHtmlSnapshot) {
      setToastMessage("A OS ainda esta carregando. Aguarde 1 segundo e clique novamente.")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2500)
      setIsFinalizandoAgendamento(false)
      return
    }

    const osFingerprint = gerarFingerprintAgendamento()
    const localTexto = localSelecionado
      ? `${localSelecionado.nome} - ${localSelecionado.endereco}, ${localSelecionado.numero}`
      : "Local nao informado"
    const dataFormatada = serviceRequest.schedule.date
      ? new Date(`${serviceRequest.schedule.date}T00:00:00`).toLocaleDateString("pt-BR")
      : "-"
    const horarioFormatado = `${serviceRequest.schedule.startTime || "--:--"} - ${serviceRequest.schedule.endTime || "--:--"}`

    const osExistente = servicosAgendados.find((item) => {
      if (item.osFingerprint && item.osFingerprint === osFingerprint) return true

      if (!item.osFingerprint) {
        return (
          (item.clienteId || "") === (clienteSelecionado?.id || "") &&
          item.servico.trim().toLowerCase() === (serviceRequest.serviceName || "").trim().toLowerCase() &&
          item.tipo === (serviceRequest.serviceType || "outro") &&
          item.data === dataFormatada &&
          item.horario === horarioFormatado &&
          item.local === localTexto
        )
      }

      return false
    })

    if (osExistente) {
      setToastMessage(`A OS ${osExistente.osNumber} ja foi gerada para este agendamento.`)
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
        setActiveTab("agendados")
      }, 2000)
      setIsFinalizandoAgendamento(false)
      return
    }
    const novoServico: ServicoAgendado = {
      id: `ag-${Date.now()}`,
      osNumber: gerarProximoNumeroOS(),
      cliente: clienteSelecionado?.nome || "Cliente nao informado",
      clienteId: clienteSelecionado?.id,
      servico: serviceRequest.serviceName || "Servico sem nome",
      tipo: serviceRequest.serviceType || "outro",
      local: localTexto,
      data: dataFormatada,
      horario: horarioFormatado,
      tecnico: nomesResponsaveisSelecionados.join(", ") || "Responsavel nao informado",
      status: "agendado",
      osStatus: "gerada",
      osFingerprint,
      osDocumentoHtml: osDocumentoHtmlSnapshot,
    }
    setServicosAgendados((prev) => [novoServico, ...prev])

    // Aviso nao bloqueante se for Vetores e nao houver consumo registrado
    if (serviceRequest.serviceType === "pragas" && consumos.length === 0) {
      setToastMessage("Aviso: Voce ainda nao registrou consumo de produtos. Isso pode ser preenchido apos a execucao.")
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
        setToastMessage("Agendamento confirmado. OS pronta para execucao em campo.")
        setShowToast(true)
        setTimeout(() => {
          setShowToast(false)
          setActiveTab("agendados")
        }, 2000)
      }, 3000)
    } else {
      setToastMessage("Agendamento confirmado. OS pronta para execucao em campo.")
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
        setActiveTab("agendados")
      }, 2000)
    }
  }

  const temEquipeCaminhao = serviceRequest.schedule.teamIds.some((teamId) => equipesMock.find((e) => e.id === teamId)?.tipo === "equipe_caminhao")
  const mostrarVeiculo = serviceRequest.serviceType === "esgotamento" || temEquipeCaminhao
  const equipesSelecionadas = equipesMock.filter((e) => serviceRequest.schedule.teamIds.includes(e.id))
  const nomesResponsaveisSelecionados = equipesSelecionadas.map((e) => e.nome)
  const veiculoSelecionado = veiculosMock.find((v) => v.id === serviceRequest.schedule.vehicleId)
  const isServicoCupim = serviceRequest.serviceType === "pragas" && (
    serviceRequest.serviceName.toLowerCase().includes("cupim") ||
    dadosTecnicosVetores.pragasAlvo.includes("cupins")
  )

  // Obter local selecionado
  const localSelecionado = locaisCliente.find(l => l.id === serviceRequest.locationId)

  const contratosDoCliente = contratosData.filter((c) => c.clienteId === serviceRequest.clientId)

  // Obter contrato selecionado
  const contratoSelecionado = contratosDoCliente.find((c) => c.id === serviceRequest.billing.contractId)

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8 pb-32">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Servicos</h1>
          <p className="text-muted-foreground">Gerencie solicitacoes, agendamentos e ordens de servico.</p>
        </div>

        {/* Abas superiores */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="nova-solicitacao">Nova Solicitacao</TabsTrigger>
            <TabsTrigger value="agendados">Servicos Agendados</TabsTrigger>
          </TabsList>

          <TabsContent value="nova-solicitacao" className="mt-0">
            {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { step: 1, label: "Dados do Serviço" },
            { step: 2, label: "Agendamento" },
            { step: 3, label: "Geração da OS (oficial)" }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === item.step
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > item.step
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > item.step ? <CheckCircle className="h-4 w-4" /> : item.step}
                </div>
                <span className={`text-sm ${currentStep === item.step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </div>
              {index < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-4" />}
            </div>
          ))}
        </div>

        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA ESQUERDA - Selecionar Cliente */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Selecionar Cliente
                </CardTitle>
                <CardDescription>Busque o cliente para o serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome, telefone, endereço, CPF ou CNPJ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {errors.cliente && (
                    <p className="text-sm text-destructive">{errors.cliente}</p>
                  )}

                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {filteredClientes.map((cliente) => (
                      <div
                        key={cliente.id}
                        onClick={() => handleClienteSelect(cliente)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          clienteSelecionado?.id === cliente.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium">{cliente.nome}</p>
                        <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                        <p className="text-xs text-muted-foreground">{cliente.cpfCnpj}</p>
                      </div>
                    ))}
                  </div>

                  {clienteSelecionado && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        Cliente Selecionado
                      </p>
                      <p className="text-sm">{clienteSelecionado.nome}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* COLUNA DIREITA - Formulario */}
            <div className="lg:col-span-2 space-y-6">
              {/* SECAO 1 - Informacoes do Servico */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Informações do Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceName">Nome do Serviço *</Label>
                      <Input
                        id="serviceName"
                        value={serviceRequest.serviceName}
                        onChange={(e) => handleInputChange("serviceName", e.target.value)}
                        placeholder="Ex: Dedetização Residencial"
                        className={errors.serviceName ? "border-destructive" : ""}
                      />
                      {errors.serviceName && <p className="text-sm text-destructive">{errors.serviceName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceType">Tipo de Serviço *</Label>
                      <Select
                        value={serviceRequest.serviceType}
                        onValueChange={(value) => handleInputChange("serviceType", value)}
                      >
                        <SelectTrigger className={errors.serviceType ? "border-destructive" : ""}>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pragas">Controle de Pragas</SelectItem>
                          <SelectItem value="reservatorio_potavel">Limpeza de Reservatório (Potável)</SelectItem>
                          <SelectItem value="esgotamento">Esgotamento / Reservatório de Água Usada</SelectItem>
                          <SelectItem value="desentupimento">Desentupimento</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.serviceType && <p className="text-sm text-destructive">{errors.serviceType}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Descrição/Observações do Serviço</Label>
                    <Textarea
                      id="notes"
                      value={serviceRequest.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Detalhes adicionais sobre o atendimento..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SECAO 2 - Local de Atendimento */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Local de Atendimento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Local de Atendimento *</Label>
                      <Select
                        value={serviceRequest.locationId}
                        onValueChange={(value) => handleInputChange("locationId", value)}
                        disabled={!clienteSelecionado}
                      >
                        <SelectTrigger className={errors.locationId ? "border-destructive" : ""}>
                          <SelectValue placeholder={clienteSelecionado ? "Selecione o local" : "Selecione um cliente primeiro"} />
                        </SelectTrigger>
                        <SelectContent>
                          {locaisCliente.map(local => (
                            <SelectItem key={local.id} value={local.id}>
                              {local.nome} - {local.endereco}, {local.numero}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.locationId && <p className="text-sm text-destructive">{errors.locationId}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoesAcesso">Observações de Acesso</Label>
                      <Input
                        id="observacoesAcesso"
                        value={observacoesAcesso}
                        onChange={(e) => setObservacoesAcesso(e.target.value)}
                        placeholder="Portaria, autorização, pets, EPI, etc."
                      />
                    </div>
                  </div>

                  {localSelecionado && (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      <p className="font-medium">{localSelecionado.nome}</p>
                      <p className="text-muted-foreground">
                        {localSelecionado.endereco}, {localSelecionado.numero} - {localSelecionado.bairro}
                      </p>
                      <p className="text-muted-foreground">
                        {localSelecionado.cidade}/{localSelecionado.estado} - CEP: {localSelecionado.cep}
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNovoLocalModal(true)}
                    disabled={!clienteSelecionado}
                    className="gap-2 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Cadastrar novo local
                  </Button>
                </CardContent>
              </Card>

              {/* SECAO 3 - Agendamento */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Agendamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Data Programada *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={serviceRequest.schedule.date}
                        onChange={(e) => handleScheduleChange("date", e.target.value)}
                        className={errors["schedule.date"] ? "border-destructive" : ""}
                      />
                      {errors["schedule.date"] && <p className="text-sm text-destructive">{errors["schedule.date"]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startTime">Hora Início *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={serviceRequest.schedule.startTime}
                        onChange={(e) => handleScheduleChange("startTime", e.target.value)}
                        className={errors["schedule.startTime"] ? "border-destructive" : ""}
                      />
                      {errors["schedule.startTime"] && <p className="text-sm text-destructive">{errors["schedule.startTime"]}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">Hora Fim *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={serviceRequest.schedule.endTime}
                        onChange={(e) => handleScheduleChange("endTime", e.target.value)}
                        className={errors["schedule.endTime"] ? "border-destructive" : ""}
                      />
                      {errors["schedule.endTime"] && <p className="text-sm text-destructive">{errors["schedule.endTime"]}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                                            <Label htmlFor="team">Responsáveis (Equipe/Técnico) *</Label>
                      <div className={`space-y-3 rounded-md border p-3 ${errors["schedule.teamIds"] ? "border-destructive" : "border-input"}`}>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Técnico Individual</p>
                          <div className="flex flex-wrap gap-2">
                            {equipesMock.filter(e => e.tipo === "tecnico_individual").map(eq => {
                              const selected = serviceRequest.schedule.teamIds.includes(eq.id)
                              return (
                                <Button
                                  key={eq.id}
                                  type="button"
                                  variant={selected ? "default" : "outline"}
                                  className="h-8"
                                  onClick={() => handleToggleResponsavel(eq.id)}
                                >
                                  {eq.nome}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Equipe de Limpeza</p>
                          <div className="flex flex-wrap gap-2">
                            {equipesMock.filter(e => e.tipo === "equipe_limpeza").map(eq => {
                              const selected = serviceRequest.schedule.teamIds.includes(eq.id)
                              return (
                                <Button
                                  key={eq.id}
                                  type="button"
                                  variant={selected ? "default" : "outline"}
                                  className="h-8"
                                  onClick={() => handleToggleResponsavel(eq.id)}
                                >
                                  {eq.nome}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Equipe + Caminhão</p>
                          <div className="flex flex-wrap gap-2">
                            {equipesMock.filter(e => e.tipo === "equipe_caminhao").map(eq => {
                              const selected = serviceRequest.schedule.teamIds.includes(eq.id)
                              return (
                                <Button
                                  key={eq.id}
                                  type="button"
                                  variant={selected ? "default" : "outline"}
                                  className="h-8"
                                  onClick={() => handleToggleResponsavel(eq.id)}
                                >
                                  {eq.nome}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                        {serviceRequest.schedule.teamIds.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Selecionados: {nomesResponsaveisSelecionados.join(", ")}
                          </p>
                        )}
                      </div>
                      {errors["schedule.teamIds"] && <p className="text-sm text-destructive">{errors["schedule.teamIds"]}</p>}
                    </div>

                    {mostrarVeiculo && (
                      <div className="space-y-2">
                        <Label htmlFor="vehicle">Veículo *</Label>
                        <Select
                          value={serviceRequest.schedule.vehicleId}
                          onValueChange={(value) => handleScheduleChange("vehicleId", value)}
                        >
                          <SelectTrigger className={errors["schedule.vehicleId"] ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione o veículo" />
                          </SelectTrigger>
                          <SelectContent>
                            {veiculosMock.map(v => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.placa} - {v.modelo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors["schedule.vehicleId"] && <p className="text-sm text-destructive">{errors["schedule.vehicleId"]}</p>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SECAO 4 - Financeiro do Servico */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Financeiro do Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Como este serviço será cobrado?</Label>
                    <RadioGroup
                      value={serviceRequest.billing.mode}
                      onValueChange={(value) => handleBillingChange("mode", value as BillingMode)}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="contrato" id="contrato" />
                        <Label htmlFor="contrato" className="font-normal cursor-pointer">Incluso em contrato</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="adicional" id="adicional" />
                        <Label htmlFor="adicional" className="font-normal cursor-pointer">Adicional (fora do contrato)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Campos condicionais baseados no modo de cobrança */}
                  {serviceRequest.billing.mode === "contrato" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Vincular a Contrato *</Label>
                          <Select
                            value={serviceRequest.billing.contractId || ""}
                            onValueChange={(value) => {
                              handleBillingChange("contractId", value)
                              handleBillingChange("contractItemId", "")
                            }}
                            disabled={!serviceRequest.clientId || contratosDoCliente.length === 0}
                          >
                            <SelectTrigger className={errors["billing.contractId"] ? "border-destructive" : ""}>
                              <SelectValue placeholder={!serviceRequest.clientId ? "Selecione o cliente primeiro" : contratosDoCliente.length === 0 ? "Cliente sem contratos cadastrados" : "Selecione o contrato"} />
                            </SelectTrigger>
                            <SelectContent>
                              {contratosDoCliente.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.numero} - {c.descricao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors["billing.contractId"] && <p className="text-sm text-destructive">{errors["billing.contractId"]}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Item do Contrato (serviço incluso) *</Label>
                          <Select
                            value={serviceRequest.billing.contractItemId || ""}
                            onValueChange={(value) => handleBillingChange("contractItemId", value)}
                            disabled={!contratoSelecionado}
                          >
                            <SelectTrigger className={errors["billing.contractItemId"] ? "border-destructive" : ""}>
                              <SelectValue placeholder="Selecione o item" />
                            </SelectTrigger>
                            <SelectContent>
                              {contratoSelecionado?.itens.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors["billing.contractItemId"] && <p className="text-sm text-destructive">{errors["billing.contractItemId"]}</p>}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                        Cobrança gerada pelo contrato
                      </div>
                    </div>
                  )}

                  {(serviceRequest.billing.mode === "adicional") && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Valor do Serviço *</Label>
                          <Input
                            id="price"
                            value={serviceRequest.billing.price || ""}
                            onChange={(e) => handleBillingChange("price", e.target.value)}
                            placeholder="R$ 0,00"
                            className={errors["billing.price"] ? "border-destructive" : ""}
                          />
                          {errors["billing.price"] && <p className="text-sm text-destructive">{errors["billing.price"]}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
                          <Select
                            value={serviceRequest.billing.paymentMethod || ""}
                            onValueChange={(value) => handleBillingChange("paymentMethod", value)}
                          >
                            <SelectTrigger className={errors["billing.paymentMethod"] ? "border-destructive" : ""}>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pix">Pix</SelectItem>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="cartao">Cartão</SelectItem>
                              <SelectItem value="boleto">Boleto</SelectItem>
                              <SelectItem value="transferencia">Transferência</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors["billing.paymentMethod"] && <p className="text-sm text-destructive">{errors["billing.paymentMethod"]}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingDocument">Documento de cobrança *</Label>
                          <Select
                            value={serviceRequest.billing.billingDocument || ""}
                            onValueChange={(value) => handleBillingChange("billingDocument", value)}
                          >
                            <SelectTrigger className={errors["billing.billingDocument"] ? "border-destructive" : ""}>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recibo">Recibo</SelectItem>
                              <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors["billing.billingDocument"] && <p className="text-sm text-destructive">{errors["billing.billingDocument"]}</p>}
                        </div>
                      </div>

                      {serviceRequest.billing.mode === "adicional" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="additionalReason">Motivo do adicional *</Label>
                            <Textarea
                              id="additionalReason"
                              value={serviceRequest.billing.additionalReason || ""}
                              onChange={(e) => handleBillingChange("additionalReason", e.target.value)}
                              placeholder="Descreva o motivo do serviço adicional..."
                              rows={2}
                              className={errors["billing.additionalReason"] ? "border-destructive" : ""}
                            />
                            {errors["billing.additionalReason"] && <p className="text-sm text-destructive">{errors["billing.additionalReason"]}</p>}
                          </div>

                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <Label htmlFor="approved" className="font-normal cursor-pointer">
                              Aprovado pelo cliente?
                            </Label>
                            <Switch
                              id="approved"
                              checked={serviceRequest.billing.approved || false}
                              onCheckedChange={(checked) => handleBillingChange("approved", checked)}
                            />
                          </div>

                          {!serviceRequest.billing.approved && (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm">Serviço adicional pendente de aprovação</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SECAO 5 - Garantia */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Garantia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="warranty">Garantia (dias)</Label>
                      <Input
                        id="warranty"
                        value={serviceRequest.warrantyDays}
                        onChange={(e) => handleInputChange("warrantyDays", e.target.value)}
                        placeholder="Ex: 90"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Padrões de garantia poderão ser definidos por tipo de serviço nas configurações.
                  </p>
                </CardContent>
              </Card>

              {/* SECAO 6 - Anexos */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-primary" />
                    Anexos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachments"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('attachments')?.click()}
                      className="gap-2 bg-transparent"
                    >
                      <Upload className="h-4 w-4" />
                      Selecionar Arquivos
                    </Button>
                    <span className="text-sm text-muted-foreground">PDF, DOC ou DOCX</span>
                  </div>

                  {serviceRequest.attachments.length > 0 && (
                    <div className="space-y-2">
                      {serviceRequest.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Resumo da Solicitação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cliente</p>
                      <p className="font-medium">{clienteSelecionado?.nome || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Local</p>
                      <p className="font-medium">{localSelecionado?.nome || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tipo de Serviço</p>
                      <p className="font-medium">
                        {serviceRequest.serviceType === "pragas" && "Controle de Pragas"}
                        {serviceRequest.serviceType === "reservatorio_potavel" && "Limpeza de Reservatório"}
                        {serviceRequest.serviceType === "esgotamento" && "Esgotamento"}
                        {serviceRequest.serviceType === "desentupimento" && "Desentupimento"}
                        {serviceRequest.serviceType === "outro" && "Outro"}
                        {!serviceRequest.serviceType && "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data/Horário</p>
                      <p className="font-medium">
                        {serviceRequest.schedule.date
                          ? `${new Date(serviceRequest.schedule.date).toLocaleDateString('pt-BR')} ${serviceRequest.schedule.startTime} - ${serviceRequest.schedule.endTime}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Responsável</p>
                      <p className="font-medium">
                        {nomesResponsaveisSelecionados.join(", ") || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cobrança</p>
                      <p className="font-medium">
                        {serviceRequest.billing.mode === "contrato" && "Incluso em contrato"}
                        
                        {serviceRequest.billing.mode === "adicional" && `Adicional - ${serviceRequest.billing.price || "-"}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Confirmação do Agendamento</CardTitle>
              <CardDescription>Revise as informações antes de avançar para a geração da OS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Cliente
                  </h3>
                  <div className="space-y-2 text-sm p-4 bg-muted/50 rounded-lg">
                    <p><span className="text-muted-foreground">Nome:</span> {clienteSelecionado?.nome}</p>
                    <p><span className="text-muted-foreground">CPF/CNPJ:</span> {clienteSelecionado?.cpfCnpj}</p>
                    <p><span className="text-muted-foreground">Telefone:</span> {clienteSelecionado?.telefone}</p>
                    <p><span className="text-muted-foreground">E-mail:</span> {clienteSelecionado?.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Dados do Serviço
                  </h3>
                  <div className="space-y-2 text-sm p-4 bg-muted/50 rounded-lg">
                    <p><span className="text-muted-foreground">Serviço:</span> {serviceRequest.serviceName}</p>
                    <p><span className="text-muted-foreground">Tipo:</span> {
                      serviceRequest.serviceType === "pragas" ? "Controle de Pragas" :
                      serviceRequest.serviceType === "reservatorio_potavel" ? "Limpeza de Reservatório (Potável)" :
                      serviceRequest.serviceType === "esgotamento" ? "Esgotamento" :
                      serviceRequest.serviceType === "desentupimento" ? "Desentupimento" : "Outro"
                    }</p>
                    <p><span className="text-muted-foreground">Local:</span> {localSelecionado?.nome}</p>
                    {serviceRequest.warrantyDays && (
                      <p><span className="text-muted-foreground">Garantia:</span> {serviceRequest.warrantyDays} dias</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Agendamento
                  </h3>
                  <div className="space-y-2 text-sm p-4 bg-muted/50 rounded-lg">
                    <p><span className="text-muted-foreground">Data:</span> {new Date(serviceRequest.schedule.date).toLocaleDateString('pt-BR')}</p>
                    <p><span className="text-muted-foreground">Horário:</span> {serviceRequest.schedule.startTime} às {serviceRequest.schedule.endTime}</p>
                    <p><span className="text-muted-foreground">Responsável:</span> {nomesResponsaveisSelecionados.join(", ") || "-"}</p>
                    {serviceRequest.schedule.vehicleId && (
                      <p><span className="text-muted-foreground">Veículo:</span> {veiculosMock.find(v => v.id === serviceRequest.schedule.vehicleId)?.placa}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financeiro
                  </h3>
                  <div className="space-y-2 text-sm p-4 bg-muted/50 rounded-lg">
                    <p><span className="text-muted-foreground">Cobrança:</span> {
                      serviceRequest.billing.mode === "contrato" ? "Incluso em contrato" :
                      "Adicional"
                    }</p>
                    {serviceRequest.billing.mode !== "contrato" && (
                      <>
                        <p><span className="text-muted-foreground">Valor:</span> {serviceRequest.billing.price}</p>
                        <p><span className="text-muted-foreground">Pagamento:</span> {serviceRequest.billing.paymentMethod}</p>
                        <p><span className="text-muted-foreground">Documento:</span> {serviceRequest.billing.billingDocument === "nota_fiscal" ? "Nota Fiscal" : "Recibo"}</p>
                      </>
                    )}
                    {serviceRequest.billing.mode === "contrato" && (
                      <p><span className="text-muted-foreground">Contrato:</span> {contratoSelecionado?.numero}</p>
                    )}
                  </div>
                </div>

                {localSelecionado && (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço Completo
                    </h3>
                    <div className="text-sm p-4 bg-muted/50 rounded-lg">
                      <p>{localSelecionado.endereco}, {localSelecionado.numero} - {localSelecionado.bairro}</p>
                      <p>{localSelecionado.cidade}/{localSelecionado.estado} - CEP: {localSelecionado.cep}</p>
                      {observacoesAcesso && (
                        <p className="mt-2 text-muted-foreground"><span className="font-medium">Obs. de acesso:</span> {observacoesAcesso}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center pt-4">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Clique em "Confirmar Agendamento" para gerar a OS
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ETAPA 3 - Geração da OS (oficial) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* CARD 1 - Identificação e Status da OS */}
<OSHeaderCard
  osNumber={osNumber}
  osType={getTipoOS() === "limpeza" ? "Limpeza de Reservatorios" : "Vetores (Dedetizacao)"}
  status={osStatus}
              dataGeracao={dataGeracao}
              onGerarOS={handleGerarOS}
              onVisualizarPDF={handleVisualizarPDF}
              onImprimir={handleImprimirOS}
              onMarcarEntregue={handleMarcarEntregue}
              clienteSelecionado={!!clienteSelecionado}
              agendamentoCompleto={!!serviceRequest.schedule.date && serviceRequest.schedule.teamIds.length > 0}
            />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Execucao e Baixa do Servico
                </CardTitle>
                <CardDescription>
                  Registre os itens consumidos no atendimento (mock local) antes de finalizar o ciclo da OS.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {consumos.length > 0
                    ? `${consumos.length} item(ns) de consumo registrado(s).`
                    : "Nenhum consumo registrado ainda."}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenBaixaServicoModal}
                  className="gap-2 bg-transparent"
                >
                  <CheckCircle className="h-4 w-4" />
                  Dar baixa no servico
                </Button>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CARD 2 - Dados do Cliente (somente leitura) */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Nome/Razão Social</span>
                      <span className="font-medium">{clienteSelecionado?.nome}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">CPF/CNPJ</span>
                      <span className="font-medium">{clienteSelecionado?.cpfCnpj}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Telefone</span>
                      <span className="font-medium">{clienteSelecionado?.telefone}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">E-mail</span>
                      <span className="font-medium">{clienteSelecionado?.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3 - Local e Serviço (somente leitura) */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Local e Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Local de Atendimento</span>
                      <span className="font-medium">{localSelecionado?.nome}</span>
                    </div>
                    <div className="py-2 border-b">
                      <span className="text-muted-foreground block mb-1">Endereço Completo</span>
                      <span className="font-medium text-xs">
                        {localSelecionado?.endereco}, {localSelecionado?.numero} - {localSelecionado?.bairro}, {localSelecionado?.cidade}/{localSelecionado?.estado} - CEP: {localSelecionado?.cep}
                      </span>
                    </div>
                    {observacoesAcesso && (
                      <div className="py-2 border-b">
                        <span className="text-muted-foreground block mb-1">Observações de Acesso</span>
                        <span className="font-medium">{observacoesAcesso}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Tipo de Serviço</span>
                      <span className="font-medium">
                        {serviceRequest.serviceType === "pragas" ? "Controle de Pragas" :
                         serviceRequest.serviceType === "reservatorio_potavel" ? "Limpeza de Reservatório" :
                         serviceRequest.serviceType === "esgotamento" ? "Esgotamento" :
                         serviceRequest.serviceType === "desentupimento" ? "Desentupimento" : "Outro"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Nome do Serviço</span>
                      <span className="font-medium">{serviceRequest.serviceName}</span>
                    </div>
                    <div className="py-2 border-b space-y-2">
                      <span className="text-muted-foreground block">Veiculo associado ao atendimento</span>
                      <Select
                        value={serviceRequest.schedule.vehicleId || "__none"}
                        onValueChange={(value) => handleScheduleChange("vehicleId", value === "__none" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veiculo (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Sem veiculo</SelectItem>
                          {veiculosMock.map((veiculo) => (
                            <SelectItem key={veiculo.id} value={veiculo.id}>
                              {veiculo.placa} - {veiculo.modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {serviceRequest.warrantyDays && (
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Garantia</span>
                        <span className="font-medium">{serviceRequest.warrantyDays} dias</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CARD 4 - Dados Técnicos da OS (editável) */}
            {serviceRequest.serviceType === "pragas" ? (
              <VetoresForm
                dados={dadosTecnicosVetores}
                onChange={setDadosTecnicosVetores}
                produtosDisponiveis={opcoesProdutoEstoque}
              />
            ) : serviceRequest.serviceType === "reservatorio_potavel" ? (
              <LimpezaForm
                dados={dadosTecnicosLimpeza}
                onChange={setDadosTecnicosLimpeza}
              />
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Template de OS ainda nao configurado para este tipo de servico. O modelo Vetores sera utilizado como padrao.</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CARD 4.5 - Consumo de Produtos (Estoque) - Somente para Vetores */}
            {serviceRequest.serviceType === "pragas" && (
              <ConsumoEstoqueCard
                consumos={consumos}
                onConsumosChange={setConsumos}
                estoqueSimulado={estoqueSimulado}
                onEstoqueSimuladoChange={setEstoqueSimulado}
              />
            )}

            {/* CARD 5 - Financeiro (somente leitura) */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Cobrança</p>
                    <p className="font-semibold">
                      {serviceRequest.billing.mode === "contrato" ? "Incluso em contrato" :
                       "Adicional"}
                    </p>
                  </div>
                  {serviceRequest.billing.mode === "contrato" && contratoSelecionado && (
                    <>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Contrato</p>
                        <p className="font-semibold">{contratoSelecionado.numero}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Item</p>
                        <p className="font-semibold">
                          {contratoSelecionado.itens.find(i => i.id === serviceRequest.billing.contractItemId)?.nome || "-"}
                        </p>
                      </div>
                    </>
                  )}
                  {(serviceRequest.billing.mode === "adicional") && (
                    <>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Valor</p>
                        <p className="font-semibold">{serviceRequest.billing.price || "-"}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Forma de Pagamento</p>
                        <p className="font-semibold capitalize">{serviceRequest.billing.paymentMethod || "-"}</p>
                      </div>
                    </>
                  )}
                  {serviceRequest.billing.mode === "adicional" && (
                    <div className="p-4 bg-muted/50 rounded-lg md:col-span-3">
                      <p className="text-sm text-muted-foreground mb-1">Aprovado?</p>
                      <Badge variant={serviceRequest.billing.approved ? "default" : "secondary"}>
                        {serviceRequest.billing.approved ? "Sim, aprovado" : "Pendente de aprovação"}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CARD 6 - Prévia do Documento (PDF Preview) */}
            <PdfPreviewMock
              status={osStatus}
              osNumber={osNumber}
              tipoOS={getTipoOS()}
              cliente={clienteSelecionado ? {
                nome: clienteSelecionado.nome,
                cpfCnpj: clienteSelecionado.cpfCnpj,
                telefone: clienteSelecionado.telefone,
                email: clienteSelecionado.email
              } : undefined}
              local={localSelecionado ? {
                endereco: `${localSelecionado.endereco}, ${localSelecionado.numero}`,
                bairro: localSelecionado.bairro,
                cidade: localSelecionado.cidade,
                estado: localSelecionado.estado,
                cep: localSelecionado.cep
              } : undefined}
              dadosTecnicos={getTipoOS() === "vetores" ? dadosTecnicosVetores : undefined}
              dadosTecnicosLimpeza={getTipoOS() === "limpeza" ? dadosTecnicosLimpeza : undefined}
              dataServico={serviceRequest.schedule.date ? new Date(serviceRequest.schedule.date).toLocaleDateString('pt-BR') : undefined}
              consumos={getTipoOS() === "vetores" ? consumos : []}
              veiculo={veiculoSelecionado ? `${veiculoSelecionado.placa} - ${veiculoSelecionado.modelo}` : undefined}
              mostrarDeclaracaoCupim={isServicoCupim}
              onCaptureHtml={setOsDocumentoHtmlSnapshot}
            />

            {/* CARD 7 - Upload da OS Assinada (pós-execução) */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload da OS Assinada (Pós-execução)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Após a execução, faça upload da OS assinada e digitalizada
                  </p>
                  <Input
                    id="osAssinada"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUploadAssinado}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('osAssinada')?.click()}
                    className="gap-2 bg-transparent"
                  >
                    <Upload className="h-4 w-4" />
                    Selecionar arquivo (PDF/JPG/PNG)
                  </Button>
                  {arquivoAssinado && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">{arquivoAssinado.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={showBaixaServicoModal} onOpenChange={setShowBaixaServicoModal}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Dar baixa no servico</DialogTitle>
              <DialogDescription>
                Passo {baixaStep} de 2: informe os itens consumidos (estoque mock) e confirme o lancamento local da OS.
              </DialogDescription>
            </DialogHeader>

            {baixaStep === 1 ? (
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm font-medium text-muted-foreground px-1">
                  <span>Item de estoque</span>
                  <span>Quantidade consumida</span>
                  <span>Observacao</span>
                </div>
                {estoqueBase.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start border rounded-lg p-3">
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Saldo mock: {item.estoqueAtual} {item.unidadePadrao} | Categoria: {item.categoria}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={baixaDraft[item.id]?.quantidade || ""}
                      onChange={(e) => handleBaixaDraftChange(item.id, "quantidade", e.target.value)}
                      placeholder={`Max ${item.estoqueAtual}`}
                    />
                    <Input
                      value={baixaDraft[item.id]?.observacao || ""}
                      onChange={(e) => handleBaixaDraftChange(item.id, "observacao", e.target.value)}
                      placeholder="Ex: area tecnica/fundos"
                    />
                  </div>
                ))}

                {baixaError && (
                  <p className="text-sm text-destructive">{baixaError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-2">
                <p className="text-sm text-muted-foreground">
                  Revise os itens consumidos que serao gravados no estado local do servico:
                </p>
                <div className="space-y-2">
                  {itensSelecionadosBaixa.map(({ item, quantidade, observacao }) => (
                    <div key={item.id} className="border rounded-lg p-3 text-sm">
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-muted-foreground">
                        Quantidade: {quantidade} {item.unidadePadrao}
                      </p>
                      {observacao && (
                        <p className="text-muted-foreground">Observacao: {observacao}</p>
                      )}
                    </div>
                  ))}
                </div>
                {itensSelecionadosBaixa.length === 0 && (
                  <p className="text-sm text-destructive">Nenhum item selecionado. Volte para o passo anterior.</p>
                )}
              </div>
            )}

            <DialogFooter>
              {baixaStep === 2 && (
                <Button type="button" variant="outline" onClick={() => setBaixaStep(1)}>
                  Voltar
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setShowBaixaServicoModal(false)}>
                Cancelar
              </Button>
              {baixaStep === 1 ? (
                <Button type="button" onClick={handleAvancarBaixaStep}>
                  Avancar
                </Button>
              ) : (
                <Button type="button" onClick={handleConfirmarBaixaServico} disabled={itensSelecionadosBaixa.length === 0}>
                  Confirmar baixa
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal Novo Local */}
        <Dialog open={showNovoLocalModal} onOpenChange={setShowNovoLocalModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Local</DialogTitle>
              <DialogDescription>
                Adicione um novo local de atendimento para o cliente selecionado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nomeLocal">Nome do Local *</Label>
                <Input
                  id="nomeLocal"
                  value={novoLocal.nome}
                  onChange={(e) => setNovoLocal(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Filial Centro"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={novoLocal.cep}
                    onChange={(e) => setNovoLocal(prev => ({ ...prev, cep: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Input
                    id="estado"
                    value={novoLocal.estado}
                    onChange={(e) => setNovoLocal(prev => ({ ...prev, estado: e.target.value }))}
                    placeholder="SP"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={novoLocal.endereco}
                    onChange={(e) => setNovoLocal(prev => ({ ...prev, endereco: e.target.value }))}
                    placeholder="Rua/Av."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    value={novoLocal.numero}
                    onChange={(e) => setNovoLocal(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="123"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    value={novoLocal.bairro}
                    onChange={(e) => setNovoLocal(prev => ({ ...prev, bairro: e.target.value }))}
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={novoLocal.cidade}
                    onChange={(e) => setNovoLocal(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNovoLocalModal(false)} className="bg-transparent">
                Cancelar
              </Button>
              <Button onClick={handleAdicionarLocal}>
                Salvar Local
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

          </TabsContent>

          {/* Aba Servicos Agendados */}
          <TabsContent value="agendados" className="mt-0">
            <ServicosAgendadosContent
              servicos={servicosAgendados}
              onVerOS={handleVerOSAgendada}
              onImprimirOS={handleImprimirOSAgendada}
              onAtualizarStatus={handleAtualizarStatusAgendada}
              onSolicitarBaixa={handleSolicitarBaixaAgendada}
              onExcluirOS={handleExcluirOSAgendada}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-24 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle className="h-5 w-5" />
          {toastMessage}
        </div>
      )}

      <Dialog open={showOSViewerModal} onOpenChange={setShowOSViewerModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Preview da OS</DialogTitle>
            <DialogDescription>
              Visualizacao do documento salvo da ordem de servico.
            </DialogDescription>
          </DialogHeader>
          {selectedAgendadaOS && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="default">{selectedAgendadaOS.osNumber}</Badge>
                <Badge className={agendadosStatusConfig[selectedAgendadaOS.status].color}>
                  {agendadosStatusConfig[selectedAgendadaOS.status].label}
                </Badge>
                <Badge variant={osStatusConfigMap[selectedAgendadaOS.osStatus]?.variant || "secondary"}>
                  {osStatusConfigMap[selectedAgendadaOS.osStatus]?.label || selectedAgendadaOS.osStatus}
                </Badge>
              </div>
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <p><span className="text-muted-foreground">Servico:</span> {selectedAgendadaOS.servico}</p>
                  <p><span className="text-muted-foreground">Cliente:</span> {selectedAgendadaOS.cliente}</p>
                  <p><span className="text-muted-foreground">Local:</span> {selectedAgendadaOS.local}</p>
                  <p><span className="text-muted-foreground">Data:</span> {selectedAgendadaOS.data}</p>
                  <p><span className="text-muted-foreground">Horario:</span> {selectedAgendadaOS.horario}</p>
                  <p><span className="text-muted-foreground">Tecnico:</span> {selectedAgendadaOS.tecnico}</p>
                </CardContent>
              </Card>
              {selectedAgendadaOS.osDocumentoHtml ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    title={`preview-${selectedAgendadaOS.osNumber}`}
                    srcDoc={buildOSDocumentHtml(selectedAgendadaOS.osDocumentoHtml, selectedAgendadaOS.osNumber)}
                    className="w-full h-[65vh]"
                  />
                </div>
              ) : (
                <p className="text-xs text-amber-600">Esta OS ainda nao possui anexo salvo.</p>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedAgendadaOS?.osDocumentoHtml && (
              <Button
                variant="outline"
                onClick={() => openAndPrintSavedOS(selectedAgendadaOS.osDocumentoHtml || "", selectedAgendadaOS.osNumber)}
                className="bg-transparent"
              >
                Imprimir OS
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowOSViewerModal(false)} className="bg-transparent">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBaixaAgendadaModal} onOpenChange={setShowBaixaAgendadaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dar baixa na OS</DialogTitle>
            <DialogDescription>
              Preencha os dados finais para concluir a ordem de servico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>OS foi assinada?</Label>
              <RadioGroup value={baixaAgendadaAssinada} onValueChange={(v) => setBaixaAgendadaAssinada(v as "sim" | "nao")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="baixa-assinada-sim" value="sim" />
                  <Label htmlFor="baixa-assinada-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="baixa-assinada-nao" value="nao" />
                  <Label htmlFor="baixa-assinada-nao">Nao</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baixa-responsavel">Responsavel</Label>
              <Input
                id="baixa-responsavel"
                value={baixaAgendadaResponsavel}
                onChange={(e) => setBaixaAgendadaResponsavel(e.target.value)}
                placeholder="Nome do responsavel"
              />
            </div>

            {baixaAgendadaError && <p className="text-sm text-destructive">{baixaAgendadaError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBaixaAgendadaModal(false)
                setBaixaAgendadaError("")
              }}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmarBaixaAgendada}>Confirmar baixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Rodapé Fixo com Ações */}
      {activeTab === "nova-solicitacao" && (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={handleVoltar} className="gap-2 bg-transparent">
            <X className="h-4 w-4" />
            {currentStep === 1 ? "Cancelar" : "Voltar"}
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSalvarRascunho} className="gap-2 bg-transparent">
              <FileText className="h-4 w-4" />
              Salvar rascunho
            </Button>
            
            {currentStep === 1 ? (
              <Button onClick={handleAvancar} className="gap-2">
                Avançar para Agendamento
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : currentStep === 2 ? (
              <Button onClick={() => {
                setCurrentStep(3)
                // Auto-gerar OS ao avançar para etapa 3
                handleGerarOS()
              }} className="gap-2">
                Confirmar Agendamento
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleConfirmarAgendamentoFinal} 
                className="gap-2"
                disabled={osStatus === "a_gerar" || isFinalizandoAgendamento}
              >
                Finalizar e Confirmar
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
























































