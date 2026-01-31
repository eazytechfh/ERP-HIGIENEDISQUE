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
import { PdfPreviewMock } from "@/components/os-generation/pdf-preview-mock"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

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
  numero: string
  descricao: string
  itens: { id: string; nome: string }[]
}

type BillingMode = "contrato" | "avulso" | "adicional"

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
    teamId: string
    vehicleId: string
  }
  billing: {
    mode: BillingMode
    contractId?: string
    contractItemId?: string
    price?: string
    paymentMethod?: string
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

const contratosMock: Contrato[] = [
  { 
    id: "c1", 
    numero: "CONT-2026-001", 
    descricao: "Contrato Anual - Manutenção Preventiva",
    itens: [
      { id: "ci1", nome: "Dedetização Mensal" },
      { id: "ci2", nome: "Limpeza de Caixa d'Água Semestral" },
    ]
  },
  { 
    id: "c2", 
    numero: "CONT-2026-002", 
    descricao: "Contrato Semestral - Controle de Pragas",
    itens: [
      { id: "ci3", nome: "Controle de Pragas Bimestral" },
    ]
  },
]

export default function ServicosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get("clienteId")

  // Estados principais
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    clienteIdParam ? clientesMock.find(c => c.id === clienteIdParam) || null : null
  )
  const [locaisCliente, setLocaisCliente] = useState<LocalAtendimento[]>(
    clienteIdParam ? locaisPorCliente[clienteIdParam] || [] : []
  )
  
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
      teamId: "",
      vehicleId: ""
    },
    billing: {
      mode: "avulso",
      price: "",
      paymentMethod: ""
    },
    warrantyDays: "",
    attachments: []
  })

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
  const [arquivoAssinado, setArquivoAssinado] = useState<File | null>(null)

  // Filtrar clientes
  const filteredClientes = clientesMock.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm) ||
    cliente.cpfCnpj.includes(searchTerm)
  )

  // Handlers
  const handleClienteSelect = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setLocaisCliente(locaisPorCliente[cliente.id] || [])
    setServiceRequest(prev => ({
      ...prev,
      clientId: cliente.id,
      locationId: ""
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
    if (!serviceRequest.schedule.teamId) newErrors["schedule.teamId"] = "Selecione o responsável"

    // Validação de veículo para esgotamento ou equipe_caminhao
    const equipeSelecionada = equipesMock.find(e => e.id === serviceRequest.schedule.teamId)
    if (
      (serviceRequest.serviceType === "esgotamento" || equipeSelecionada?.tipo === "equipe_caminhao") &&
      !serviceRequest.schedule.vehicleId
    ) {
      newErrors["schedule.vehicleId"] = "Selecione o veículo"
    }

    // Validação de billing
    if (serviceRequest.billing.mode === "avulso" || serviceRequest.billing.mode === "adicional") {
      if (!serviceRequest.billing.price) newErrors["billing.price"] = "Informe o valor"
      if (!serviceRequest.billing.paymentMethod) newErrors["billing.paymentMethod"] = "Selecione a forma de pagamento"
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
    setToastMessage("OS marcada como entregue ao técnico!")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
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

  const handleConfirmarAgendamentoFinal = () => {
    setToastMessage("Agendamento confirmado. OS pronta para execução em campo.")
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      router.push("/dashboard/servicos/agendados")
    }, 2000)
  }

  // Verificar se precisa mostrar campo de veículo
  const equipeSelecionada = equipesMock.find(e => e.id === serviceRequest.schedule.teamId)
  const mostrarVeiculo = serviceRequest.serviceType === "esgotamento" || equipeSelecionada?.tipo === "equipe_caminhao"

  // Obter local selecionado
  const localSelecionado = locaisCliente.find(l => l.id === serviceRequest.locationId)

  // Obter contrato selecionado
  const contratoSelecionado = contratosMock.find(c => c.id === serviceRequest.billing.contractId)

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8 pb-32">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Solicitação / Agendamento de Serviço</h1>
          <p className="text-muted-foreground">Cadastre o serviço e programe o atendimento. A OS será gerada após execução.</p>
        </div>

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
            {/* COLUNA ESQUERDA — Selecionar Cliente */}
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
                      placeholder="Nome, telefone, CPF ou CNPJ..."
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

            {/* COLUNA DIREITA — Formulário */}
            <div className="lg:col-span-2 space-y-6">
              {/* SEÇÃO 1 — Informações do Serviço */}
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

              {/* SEÇÃO 2 — Local de Atendimento */}
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

              {/* SEÇÃO 3 — Agendamento */}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="team">Responsável (Equipe/Técnico) *</Label>
                      <Select
                        value={serviceRequest.schedule.teamId}
                        onValueChange={(value) => handleScheduleChange("teamId", value)}
                      >
                        <SelectTrigger className={errors["schedule.teamId"] ? "border-destructive" : ""}>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tecnico_individual" disabled className="font-semibold text-muted-foreground">
                            Técnico Individual
                          </SelectItem>
                          {equipesMock.filter(e => e.tipo === "tecnico_individual").map(eq => (
                            <SelectItem key={eq.id} value={eq.id}>{eq.nome}</SelectItem>
                          ))}
                          <SelectItem value="equipe_limpeza" disabled className="font-semibold text-muted-foreground">
                            Equipe de Limpeza
                          </SelectItem>
                          {equipesMock.filter(e => e.tipo === "equipe_limpeza").map(eq => (
                            <SelectItem key={eq.id} value={eq.id}>{eq.nome}</SelectItem>
                          ))}
                          <SelectItem value="equipe_caminhao" disabled className="font-semibold text-muted-foreground">
                            Equipe + Caminhão
                          </SelectItem>
                          {equipesMock.filter(e => e.tipo === "equipe_caminhao").map(eq => (
                            <SelectItem key={eq.id} value={eq.id}>{eq.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors["schedule.teamId"] && <p className="text-sm text-destructive">{errors["schedule.teamId"]}</p>}
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

              {/* SEÇÃO 4 — Financeiro do Serviço */}
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
                        <RadioGroupItem value="avulso" id="avulso" />
                        <Label htmlFor="avulso" className="font-normal cursor-pointer">Avulso</Label>
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
                            onValueChange={(value) => handleBillingChange("contractId", value)}
                          >
                            <SelectTrigger className={errors["billing.contractId"] ? "border-destructive" : ""}>
                              <SelectValue placeholder="Selecione o contrato" />
                            </SelectTrigger>
                            <SelectContent>
                              {contratosMock.map(c => (
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

                  {(serviceRequest.billing.mode === "avulso" || serviceRequest.billing.mode === "adicional") && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* SEÇÃO 5 — Garantia */}
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

              {/* SEÇÃO 6 — Anexos */}
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
                        {equipesMock.find(e => e.id === serviceRequest.schedule.teamId)?.nome || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cobrança</p>
                      <p className="font-medium">
                        {serviceRequest.billing.mode === "contrato" && "Incluso em contrato"}
                        {serviceRequest.billing.mode === "avulso" && `Avulso - ${serviceRequest.billing.price || "-"}`}
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
                    <p><span className="text-muted-foreground">Responsável:</span> {equipesMock.find(e => e.id === serviceRequest.schedule.teamId)?.nome}</p>
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
                      serviceRequest.billing.mode === "avulso" ? "Avulso" : "Adicional"
                    }</p>
                    {serviceRequest.billing.mode !== "contrato" && (
                      <>
                        <p><span className="text-muted-foreground">Valor:</span> {serviceRequest.billing.price}</p>
                        <p><span className="text-muted-foreground">Pagamento:</span> {serviceRequest.billing.paymentMethod}</p>
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
              osType="Vetores (Dedetização)"
              status={osStatus}
              dataGeracao={dataGeracao}
              onGerarOS={handleGerarOS}
              onVisualizarPDF={handleVisualizarPDF}
              onImprimir={handleImprimirOS}
              onMarcarEntregue={handleMarcarEntregue}
              clienteSelecionado={!!clienteSelecionado}
              agendamentoCompleto={!!serviceRequest.schedule.date && !!serviceRequest.schedule.teamId}
            />

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

            {/* CARD 4 - Dados Técnicos da OS Vetores (editável) */}
            {serviceRequest.serviceType === "pragas" ? (
              <VetoresForm
                dados={dadosTecnicosVetores}
                onChange={setDadosTecnicosVetores}
              />
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Template de OS ainda não configurado para este tipo de serviço. O modelo Vetores será utilizado como padrão.</span>
                  </div>
                </CardContent>
              </Card>
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
                       serviceRequest.billing.mode === "avulso" ? "Avulso" : "Adicional"}
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
                  {(serviceRequest.billing.mode === "avulso" || serviceRequest.billing.mode === "adicional") && (
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
              dadosTecnicos={dadosTecnicosVetores}
              dataServico={serviceRequest.schedule.date ? new Date(serviceRequest.schedule.date).toLocaleDateString('pt-BR') : undefined}
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

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-24 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5">
            <CheckCircle className="h-5 w-5" />
            {toastMessage}
          </div>
        )}
      </main>

      {/* Rodapé Fixo com Ações */}
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
                disabled={osStatus === "a_gerar"}
              >
                Finalizar e Confirmar
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
