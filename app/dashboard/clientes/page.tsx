"use client"

import { ErpHeader } from "@/components/erp-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Search, Plus, Edit, UserPlus, Users, Trash2, MapPin, Phone, 
  Building2, FileText, Upload, ChevronRight, Home, Save, X
} from 'lucide-react'
import { useState } from "react"
import { useRouter } from "next/navigation"

// Types
type TipoCliente = "pf" | "pj"
type StatusCliente = "Ativo" | "Inativo" | "Suspenso"
type TipoContrato = "Recorrente" | "Avulso" | ""
type SituacaoContrato = "Em dia" | "A vencer" | "Vencido" | ""

type LocalAtendimento = {
  id: string
  nome: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  tipoAmbiente: string
}

type Contato = {
  id: string
  nome: string
  cargo: string
  telefone: string
  email: string
  principal: boolean
}

type Cliente = {
  id: string
  tipoCliente: TipoCliente
  nome: string
  nomeFantasia: string
  telefone: string
  email: string
  status: StatusCliente
  cpf: string
  cnpj: string
  inscricaoEstadual: string
  inscricaoMunicipal: string
  locais: LocalAtendimento[]
  contatos: Contato[]
  canalPreferencial: string
  horariosContato: string
  notifAgendamentos: boolean
  notifLembretes: boolean
  notifCertificados: boolean
  notifCobrancas: boolean
  horariosAtendimento: string
  autorizacaoPrevia: boolean
  epiEspecifico: boolean
  possuiPets: boolean
  observacoesOperacionais: string
  possuiContrato: boolean
  tipoContrato: TipoContrato
  dataInicioContrato: string
  dataFimContrato: string
  situacaoContrato: SituacaoContrato
  observacoesInternas: string
  arquivos: File[]
}

const clienteInicial: Omit<Cliente, 'id'> = {
  tipoCliente: "pf",
  nome: "",
  nomeFantasia: "",
  telefone: "",
  email: "",
  status: "Ativo",
  cpf: "",
  cnpj: "",
  inscricaoEstadual: "",
  inscricaoMunicipal: "",
  locais: [],
  contatos: [],
  canalPreferencial: "whatsapp",
  horariosContato: "",
  notifAgendamentos: true,
  notifLembretes: true,
  notifCertificados: false,
  notifCobrancas: true,
  horariosAtendimento: "",
  autorizacaoPrevia: false,
  epiEspecifico: false,
  possuiPets: false,
  observacoesOperacionais: "",
  possuiContrato: false,
  tipoContrato: "",
  dataInicioContrato: "",
  dataFimContrato: "",
  situacaoContrato: "",
  observacoesInternas: "",
  arquivos: []
}

const localInicial: Omit<LocalAtendimento, 'id'> = {
  nome: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  tipoAmbiente: ""
}

const contatoInicial: Omit<Contato, 'id'> = {
  nome: "",
  cargo: "",
  telefone: "",
  email: "",
  principal: false
}

export default function ClientesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"consultar" | "cadastrar">("consultar")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  
  // Mock data
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: "1",
      tipoCliente: "pj",
      nome: "Condomínio Residencial Park Sul",
      nomeFantasia: "Park Sul",
      telefone: "(11) 98765-4321",
      email: "sindico@parksul.com.br",
      status: "Ativo",
      cpf: "",
      cnpj: "12.345.678/0001-90",
      inscricaoEstadual: "",
      inscricaoMunicipal: "123456",
      locais: [{ id: "1", nome: "Bloco A", cep: "01310-100", endereco: "Av. Paulista", numero: "1000", complemento: "Bloco A", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP", tipoAmbiente: "Condomínio" }],
      contatos: [{ id: "1", nome: "Carlos Silva", cargo: "Síndico", telefone: "(11) 98765-4321", email: "carlos@email.com", principal: true }],
      canalPreferencial: "whatsapp",
      horariosContato: "08:00 às 18:00",
      notifAgendamentos: true,
      notifLembretes: true,
      notifCertificados: true,
      notifCobrancas: true,
      horariosAtendimento: "08:00 às 17:00",
      autorizacaoPrevia: true,
      epiEspecifico: false,
      possuiPets: true,
      observacoesOperacionais: "Avisar portaria com antecedência",
      possuiContrato: true,
      tipoContrato: "Recorrente",
      dataInicioContrato: "2024-01-01",
      dataFimContrato: "2024-12-31",
      situacaoContrato: "Em dia",
      observacoesInternas: "Cliente desde 2020",
      arquivos: []
    },
    {
      id: "2",
      tipoCliente: "pf",
      nome: "Maria Santos",
      nomeFantasia: "",
      telefone: "(11) 91234-5678",
      email: "maria@email.com",
      status: "Ativo",
      cpf: "123.456.789-00",
      cnpj: "",
      inscricaoEstadual: "",
      inscricaoMunicipal: "",
      locais: [{ id: "1", nome: "Residência", cep: "04567-000", endereco: "Rua das Flores", numero: "123", complemento: "Casa", bairro: "Jardim Europa", cidade: "São Paulo", estado: "SP", tipoAmbiente: "Residencial" }],
      contatos: [],
      canalPreferencial: "email",
      horariosContato: "Qualquer horário",
      notifAgendamentos: true,
      notifLembretes: true,
      notifCertificados: false,
      notifCobrancas: true,
      horariosAtendimento: "Manhã ou tarde",
      autorizacaoPrevia: false,
      epiEspecifico: false,
      possuiPets: true,
      observacoesOperacionais: "Possui 2 cachorros",
      possuiContrato: false,
      tipoContrato: "",
      dataInicioContrato: "",
      dataFimContrato: "",
      situacaoContrato: "",
      observacoesInternas: "",
      arquivos: []
    },
  ])

  const [formData, setFormData] = useState<Omit<Cliente, 'id'>>(clienteInicial)

  // Handlers
  const handleInputChange = (field: keyof Omit<Cliente, 'id'>, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addLocal = () => {
    const novoLocal: LocalAtendimento = {
      id: Date.now().toString(),
      ...localInicial
    }
    setFormData(prev => ({ ...prev, locais: [...prev.locais, novoLocal] }))
  }

  const updateLocal = (id: string, field: keyof LocalAtendimento, value: string) => {
    setFormData(prev => ({
      ...prev,
      locais: prev.locais.map(l => l.id === id ? { ...l, [field]: value } : l)
    }))
  }

  const removeLocal = (id: string) => {
    setFormData(prev => ({ ...prev, locais: prev.locais.filter(l => l.id !== id) }))
  }

  const addContato = () => {
    const novoContato: Contato = {
      id: Date.now().toString(),
      ...contatoInicial
    }
    setFormData(prev => ({ ...prev, contatos: [...prev.contatos, novoContato] }))
  }

  const updateContato = (id: string, field: keyof Contato, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      contatos: prev.contatos.map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
  }

  const removeContato = (id: string) => {
    setFormData(prev => ({ ...prev, contatos: prev.contatos.filter(c => c.id !== id) }))
  }

// Validação dos campos obrigatórios
const isFormValid = () => {
  // Campos obrigatórios básicos
  if (!formData.nome.trim()) return false
  if (!formData.telefone.trim()) return false
  if (!formData.email.trim()) return false
  
  // Validação condicional PF/PJ
  if (formData.tipoCliente === "pf" && !formData.cpf.trim()) return false
  if (formData.tipoCliente === "pj" && !formData.cnpj.trim()) return false
  
  return true
}

const handleSubmit = (action: "salvar" | "contrato" | "servico") => {
  // Validação antes de submeter
  if (!isFormValid()) {
    alert("Por favor, preencha todos os campos obrigatórios: Nome, Telefone, E-mail e CPF/CNPJ")
    return
  }

  let clienteId: string

  if (editingClient) {
    setClientes(prev => prev.map(c =>
      c.id === editingClient.id ? { ...formData, id: editingClient.id } : c
    ))
    clienteId = editingClient.id
    setEditingClient(null)
  } else {
    clienteId = Date.now().toString()
    const novoCliente: Cliente = {
      id: clienteId,
      ...formData
    }
    setClientes(prev => [...prev, novoCliente])
  }
  
  setFormData(clienteInicial)
  
  if (action === "salvar") {
    setActiveTab("consultar")
  } else if (action === "contrato") {
    // Redireciona para a página de cadastro de contrato
    router.push(`/dashboard/clientes/contratos?clienteId=${clienteId}`)
  } else if (action === "servico") {
    // Redireciona para a página de cadastro de serviço
    router.push(`/dashboard/servicos?clienteId=${clienteId}`)
  }
}

  const handleEdit = (cliente: Cliente) => {
    const { id, ...rest } = cliente
    setFormData(rest)
    setEditingClient(cliente)
    setActiveTab("cadastrar")
  }

  const handleCancel = () => {
    setFormData(clienteInicial)
    setEditingClient(null)
    setActiveTab("consultar")
  }

  const filteredClientes = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm) ||
    cliente.cpf.includes(searchTerm) ||
    cliente.cnpj.includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
          <ChevronRight className="h-4 w-4" />
          <span>Clientes</span>
          {activeTab === "cadastrar" && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{editingClient ? "Editar Cliente" : "Novo Cliente"}</span>
            </>
          )}
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {activeTab === "cadastrar" 
              ? (editingClient ? "Editar Cliente" : "Cadastro de Cliente")
              : "Clientes"
            }
          </h1>
          <p className="text-muted-foreground">
            {activeTab === "cadastrar" 
              ? "Registro de novos clientes no sistema"
              : "Gerencie os clientes da HIGIENE DISQUE"
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "consultar" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("consultar")
              setEditingClient(null)
              setFormData(clienteInicial)
            }}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Consultar Clientes
          </Button>
          <Button
            variant={activeTab === "cadastrar" ? "default" : "outline"}
            onClick={() => setActiveTab("cadastrar")}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Cadastrar Cliente
          </Button>
        </div>

        {/* Consultar */}
        {activeTab === "consultar" ? (
          <Card>
            <CardHeader>
              <CardTitle>Clientes Cadastrados</CardTitle>
              <CardDescription>Busque e gerencie seus clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome, telefone, CPF ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome / Razão Social</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nenhum cliente encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClientes.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {cliente.tipoCliente === "pf" ? "PF" : "PJ"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{cliente.nome}</TableCell>
                          <TableCell>{cliente.telefone}</TableCell>
                          <TableCell>{cliente.email}</TableCell>
                          <TableCell>{cliente.tipoCliente === "pf" ? cliente.cpf : cliente.cnpj}</TableCell>
                          <TableCell>
                            {cliente.possuiContrato ? (
                              <Badge variant={cliente.situacaoContrato === "Em dia" ? "default" : cliente.situacaoContrato === "A vencer" ? "secondary" : "destructive"}>
                                {cliente.situacaoContrato}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Sem contrato</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cliente.status === "Ativo" ? "default" : cliente.status === "Suspenso" ? "secondary" : "outline"}>
                              {cliente.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(cliente)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Cadastrar */
          <div className="space-y-6 pb-32">
            {/* BLOCO 1 - Tipo de Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Tipo de Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={formData.tipoCliente} 
                  onValueChange={(v) => handleInputChange("tipoCliente", v as TipoCliente)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pf" id="pf" />
                    <Label htmlFor="pf" className="cursor-pointer">Pessoa Física</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pj" id="pj" />
                    <Label htmlFor="pj" className="cursor-pointer">Pessoa Jurídica</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* BLOCO 2 - Identificação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Identificação do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">{formData.tipoCliente === "pf" ? "Nome Completo" : "Razão Social"} *</Label>
                    <Input
                      id="nome"
                      required
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder={formData.tipoCliente === "pf" ? "Nome completo" : "Razão social da empresa"}
                    />
                  </div>

                  {formData.tipoCliente === "pj" && (
                    <div className="space-y-2">
                      <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                      <Input
                        id="nomeFantasia"
                        value={formData.nomeFantasia}
                        onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                        placeholder="Nome fantasia"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone Principal *</Label>
                    <Input
                      id="telefone"
                      required
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                      placeholder="(11) 98765-4321"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail Principal *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  {formData.tipoCliente === "pf" ? (
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        required
                        value={formData.cpf}
                        onChange={(e) => handleInputChange("cpf", e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ *</Label>
                        <Input
                          id="cnpj"
                          required
                          value={formData.cnpj}
                          onChange={(e) => handleInputChange("cnpj", e.target.value)}
                          placeholder="00.000.000/0001-00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ie">Inscrição Estadual</Label>
                        <Input
                          id="ie"
                          value={formData.inscricaoEstadual}
                          onChange={(e) => handleInputChange("inscricaoEstadual", e.target.value)}
                          placeholder="Inscrição estadual"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="im">Inscrição Municipal</Label>
                        <Input
                          id="im"
                          value={formData.inscricaoMunicipal}
                          onChange={(e) => handleInputChange("inscricaoMunicipal", e.target.value)}
                          placeholder="Inscrição municipal"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="status">Status do Cliente *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => handleInputChange("status", v as StatusCliente)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Suspenso">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BLOCO 3 - Locais de Atendimento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Local(is) de Atendimento
                </CardTitle>
                <CardDescription>Cadastre os locais onde os serviços serão realizados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.locais.map((local, index) => (
                  <div key={local.id} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-muted-foreground">Local {index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeLocal(local.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Local</Label>
                        <Input
                          value={local.nome}
                          onChange={(e) => updateLocal(local.id, "nome", e.target.value)}
                          placeholder="Ex: Matriz, Bloco A"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CEP</Label>
                        <Input
                          value={local.cep}
                          onChange={(e) => updateLocal(local.id, "cep", e.target.value)}
                          placeholder="00000-000"
                        />
                      </div>
                      <div className="space-y-2 lg:col-span-2">
                        <Label>Endereço</Label>
                        <Input
                          value={local.endereco}
                          onChange={(e) => updateLocal(local.id, "endereco", e.target.value)}
                          placeholder="Rua, Avenida..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Número</Label>
                        <Input
                          value={local.numero}
                          onChange={(e) => updateLocal(local.id, "numero", e.target.value)}
                          placeholder="Nº"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Complemento</Label>
                        <Input
                          value={local.complemento}
                          onChange={(e) => updateLocal(local.id, "complemento", e.target.value)}
                          placeholder="Apto, Sala..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input
                          value={local.bairro}
                          onChange={(e) => updateLocal(local.id, "bairro", e.target.value)}
                          placeholder="Bairro"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input
                          value={local.cidade}
                          onChange={(e) => updateLocal(local.id, "cidade", e.target.value)}
                          placeholder="Cidade"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select
                          value={local.estado}
                          onValueChange={(v) => updateLocal(local.id, "estado", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Ambiente</Label>
                        <Select
                          value={local.tipoAmbiente}
                          onValueChange={(v) => updateLocal(local.id, "tipoAmbiente", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Residencial">Residencial</SelectItem>
                            <SelectItem value="Condomínio">Condomínio</SelectItem>
                            <SelectItem value="Empresa">Empresa</SelectItem>
                            <SelectItem value="Indústria">Indústria</SelectItem>
                            <SelectItem value="Restaurante">Restaurante</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addLocal} className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Adicionar novo local
                </Button>
              </CardContent>
            </Card>

            {/* BLOCO 4 - Contatos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Contatos do Cliente
                </CardTitle>
                <CardDescription>Cadastre os contatos adicionais do cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.contatos.map((contato, index) => (
                  <div key={contato.id} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-muted-foreground">Contato {index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeContato(contato.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={contato.nome}
                          onChange={(e) => updateContato(contato.id, "nome", e.target.value)}
                          placeholder="Nome do contato"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cargo/Função</Label>
                        <Select
                          value={contato.cargo}
                          onValueChange={(v) => updateContato(contato.id, "cargo", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Síndico">Síndico</SelectItem>
                            <SelectItem value="Zelador">Zelador</SelectItem>
                            <SelectItem value="Financeiro">Financeiro</SelectItem>
                            <SelectItem value="Compras">Compras</SelectItem>
                            <SelectItem value="Responsável Técnico">Responsável Técnico</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input
                          value={contato.telefone}
                          onChange={(e) => updateContato(contato.id, "telefone", e.target.value)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input
                          value={contato.email}
                          onChange={(e) => updateContato(contato.id, "email", e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`principal-${contato.id}`}
                            checked={contato.principal}
                            onCheckedChange={(v) => updateContato(contato.id, "principal", v as boolean)}
                          />
                          <Label htmlFor={`principal-${contato.id}`} className="cursor-pointer text-sm">
                            Contato principal
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addContato} className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Adicionar contato
                </Button>
              </CardContent>
            </Card>

            {/* BLOCO 5 - Preferências de Comunicação */}
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Comunicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Canal Preferencial</Label>
                    <RadioGroup 
                      value={formData.canalPreferencial} 
                      onValueChange={(v) => handleInputChange("canalPreferencial", v)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="whatsapp" id="whatsapp" />
                        <Label htmlFor="whatsapp" className="cursor-pointer">WhatsApp</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email-pref" />
                        <Label htmlFor="email-pref" className="cursor-pointer">E-mail</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="telefone" id="telefone-pref" />
                        <Label htmlFor="telefone-pref" className="cursor-pointer">Telefone</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horariosContato">Horários permitidos para contato</Label>
                    <Input
                      id="horariosContato"
                      value={formData.horariosContato}
                      onChange={(e) => handleInputChange("horariosContato", e.target.value)}
                      placeholder="Ex: 08:00 às 18:00, dias úteis"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Receber notificações automáticas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifAgendamentos"
                        checked={formData.notifAgendamentos}
                        onCheckedChange={(v) => handleInputChange("notifAgendamentos", v as boolean)}
                      />
                      <Label htmlFor="notifAgendamentos" className="cursor-pointer">Agendamentos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifLembretes"
                        checked={formData.notifLembretes}
                        onCheckedChange={(v) => handleInputChange("notifLembretes", v as boolean)}
                      />
                      <Label htmlFor="notifLembretes" className="cursor-pointer">Lembretes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifCertificados"
                        checked={formData.notifCertificados}
                        onCheckedChange={(v) => handleInputChange("notifCertificados", v as boolean)}
                      />
                      <Label htmlFor="notifCertificados" className="cursor-pointer">Certificados</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifCobrancas"
                        checked={formData.notifCobrancas}
                        onCheckedChange={(v) => handleInputChange("notifCobrancas", v as boolean)}
                      />
                      <Label htmlFor="notifCobrancas" className="cursor-pointer">Cobranças</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BLOCO 6 - Regras Operacionais */}
            <Card>
              <CardHeader>
                <CardTitle>Regras Operacionais do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="horariosAtendimento">Horários permitidos para atendimento</Label>
                    <Input
                      id="horariosAtendimento"
                      value={formData.horariosAtendimento}
                      onChange={(e) => handleInputChange("horariosAtendimento", e.target.value)}
                      placeholder="Ex: Segunda a Sexta, 08:00 às 17:00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="autorizacaoPrevia" className="cursor-pointer">Necessita autorização prévia?</Label>
                    <Switch
                      id="autorizacaoPrevia"
                      checked={formData.autorizacaoPrevia}
                      onCheckedChange={(v) => handleInputChange("autorizacaoPrevia", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="epiEspecifico" className="cursor-pointer">Exige uso específico de EPI?</Label>
                    <Switch
                      id="epiEspecifico"
                      checked={formData.epiEspecifico}
                      onCheckedChange={(v) => handleInputChange("epiEspecifico", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="possuiPets" className="cursor-pointer">Possui pets no local?</Label>
                    <Switch
                      id="possuiPets"
                      checked={formData.possuiPets}
                      onCheckedChange={(v) => handleInputChange("possuiPets", v)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoesOperacionais">Observações operacionais</Label>
                  <Textarea
                    id="observacoesOperacionais"
                    value={formData.observacoesOperacionais}
                    onChange={(e) => handleInputChange("observacoesOperacionais", e.target.value)}
                    placeholder="Informações importantes para a equipe de campo..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* BLOCO 7 - Informações Contratuais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Informações Contratuais (Resumo)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label htmlFor="possuiContrato" className="cursor-pointer">Possui contrato ativo?</Label>
                  <Switch
                    id="possuiContrato"
                    checked={formData.possuiContrato}
                    onCheckedChange={(v) => handleInputChange("possuiContrato", v)}
                  />
                </div>
                {formData.possuiContrato && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Contrato</Label>
                      <Select
                        value={formData.tipoContrato}
                        onValueChange={(v) => handleInputChange("tipoContrato", v as TipoContrato)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Recorrente">Recorrente</SelectItem>
                          <SelectItem value="Avulso">Avulso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input
                        type="date"
                        value={formData.dataInicioContrato}
                        onChange={(e) => handleInputChange("dataInicioContrato", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Término/Renovação</Label>
                      <Input
                        type="date"
                        value={formData.dataFimContrato}
                        onChange={(e) => handleInputChange("dataFimContrato", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Situação</Label>
                      <Select
                        value={formData.situacaoContrato}
                        onValueChange={(v) => handleInputChange("situacaoContrato", v as SituacaoContrato)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Em dia">Em dia</SelectItem>
                          <SelectItem value="A vencer">A vencer</SelectItem>
                          <SelectItem value="Vencido">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BLOCO 8 - Observações e Anexos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Observações Internas e Anexos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="observacoesInternas">Observações internas</Label>
                  <Textarea
                    id="observacoesInternas"
                    value={formData.observacoesInternas}
                    onChange={(e) => handleInputChange("observacoesInternas", e.target.value)}
                    placeholder="Anotações internas sobre o cliente..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload de arquivos</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contratos, documentos, plantas, fotos (PDF, DOCX, JPG, PNG)
                    </p>
                    <Input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BLOCO 9 - Ações (Fixo no rodapé) */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50">
              <div className="container mx-auto flex flex-wrap gap-3 justify-end">
                <Button variant="outline" onClick={handleCancel} className="gap-2 bg-transparent">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
<Button 
    variant="secondary" 
    onClick={() => handleSubmit("contrato")} 
    className="gap-2"
    disabled={!isFormValid()}
  >
    <FileText className="h-4 w-4" />
    Salvar e cadastrar contrato
  </Button>
  <Button 
    variant="secondary" 
    onClick={() => handleSubmit("servico")} 
    className="gap-2"
    disabled={!isFormValid()}
  >
    <Plus className="h-4 w-4" />
    Salvar e cadastrar serviço
  </Button>
  <Button 
    onClick={() => handleSubmit("salvar")} 
    className="gap-2"
    disabled={!isFormValid()}
  >
    <Save className="h-4 w-4" />
    Salvar cliente
  </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
