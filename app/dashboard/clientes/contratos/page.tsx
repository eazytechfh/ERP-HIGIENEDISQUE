"use client"

import React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { 
  ChevronRight, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  ClipboardList,
  Plus,
  Trash2,
  Upload,
  Save,
  X,
  Building2,
  Search
} from "lucide-react"
import Link from "next/link"

interface ServicoContrato {
  id: string
  tipoServico: string
  frequencia: string
  limites: string
}

interface Cliente {
  id: string
  nome: string
  cpfCnpj: string
  tipo: "PF" | "PJ"
  status: string
  telefone: string
  email: string
}

// Mock de clientes cadastrados
const clientesCadastrados: Cliente[] = [
  { id: "1", nome: "Empresa ABC Ltda", cpfCnpj: "12.345.678/0001-90", tipo: "PJ", status: "Ativo", telefone: "(11) 99999-9999", email: "contato@empresaabc.com.br" },
  { id: "2", nome: "João Silva", cpfCnpj: "123.456.789-00", tipo: "PF", status: "Ativo", telefone: "(11) 98888-8888", email: "joao@email.com" },
  { id: "3", nome: "Comércio XYZ ME", cpfCnpj: "98.765.432/0001-10", tipo: "PJ", status: "Ativo", telefone: "(11) 97777-7777", email: "xyz@comercio.com.br" },
  { id: "4", nome: "Maria Santos", cpfCnpj: "987.654.321-00", tipo: "PF", status: "Ativo", telefone: "(11) 96666-6666", email: "maria@email.com" },
  { id: "5", nome: "Indústria Beta S.A.", cpfCnpj: "11.222.333/0001-44", tipo: "PJ", status: "Ativo", telefone: "(11) 95555-5555", email: "beta@industria.com.br" },
]

export default function NovoContratoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get("clienteId")

  // Estado para seleção de cliente
  const [searchTerm, setSearchTerm] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    clienteIdParam ? clientesCadastrados.find(c => c.id === clienteIdParam) || null : null
  )
  const [showClienteList, setShowClienteList] = useState(false)

  // Filtrar clientes pela pesquisa
  const clientesFiltrados = clientesCadastrados.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpfCnpj.includes(searchTerm) ||
    cliente.telefone.includes(searchTerm)
  )

  // Estado do formulário
  const [tipoContrato, setTipoContrato] = useState("recorrente")
  const [statusContrato, setStatusContrato] = useState("ativo")
  const [dataInicio, setDataInicio] = useState("")
  const [dataTermino, setDataTermino] = useState("")
  const [diaVencimento, setDiaVencimento] = useState("")
  const [valorMensal, setValorMensal] = useState("")
  const [reajusteAnual, setReajusteAnual] = useState("")
  const [multaContratual, setMultaContratual] = useState("")
  const [exigeAprovacao, setExigeAprovacao] = useState(false)
  const [adicionalDescricao, setAdicionalDescricao] = useState("")
  const [observacoesContratuais, setObservacoesContratuais] = useState("")
  const [observacoesInternas, setObservacoesInternas] = useState("")
  const [arquivoContrato, setArquivoContrato] = useState<File | null>(null)

  // Serviços inclusos
  const [servicosContrato, setServicosContrato] = useState<ServicoContrato[]>([
    { id: "1", tipoServico: "", frequencia: "", limites: "" }
  ])

  const tiposServico = [
    "Controle de Pragas",
    "Limpeza de Caixa d'Água",
    "Desentupimento",
    "Sanitização",
    "Desratização",
    "Descupinização",
    "Limpeza de Fossa",
    "Higienização de Ar-Condicionado"
  ]

  const frequencias = [
    { value: "mensal", label: "Mensal" },
    { value: "bimestral", label: "Bimestral" },
    { value: "trimestral", label: "Trimestral" },
    { value: "semestral", label: "Semestral" },
    { value: "anual", label: "Anual" }
  ]

  const adicionarServico = () => {
    setServicosContrato([
      ...servicosContrato,
      { id: Date.now().toString(), tipoServico: "", frequencia: "", limites: "" }
    ])
  }

  const removerServico = (id: string) => {
    if (servicosContrato.length > 1) {
      setServicosContrato(servicosContrato.filter(s => s.id !== id))
    }
  }

  const atualizarServico = (id: string, campo: keyof ServicoContrato, valor: string) => {
    setServicosContrato(servicosContrato.map(s => 
      s.id === id ? { ...s, [campo]: valor } : s
    ))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivoContrato(e.target.files[0])
    }
  }

  const handleSalvar = () => {
    // Em produção, salvaria no banco de dados
    alert("Contrato salvo com sucesso!")
    router.push(`/dashboard/clientes`)
  }

  const handleSalvarECadastrarServico = () => {
    // Em produção, salvaria e redirecionaria para cadastro de serviço
    alert("Contrato salvo! Redirecionando para cadastro de serviço...")
    router.push(`/dashboard/servicos`)
  }

  const clienteData = clienteSelecionado || { nome: "", cpfCnpj: "", tipo: "", status: "" }

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/clientes" className="hover:text-foreground transition-colors">Clientes</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Detalhes do Cliente</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Novo Contrato</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cadastro de Contrato</h1>
          <p className="text-muted-foreground">Definição de contrato recorrente ou avulso</p>
        </div>

        <div className="space-y-6">
          {/* BLOCO 1 — Seleção/Identificação do Cliente */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Selecionar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!clienteSelecionado ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome, CPF/CNPJ ou telefone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowClienteList(true)
                      }}
                      onFocus={() => setShowClienteList(true)}
                      className="pl-10"
                    />
                  </div>
                  
                  {showClienteList && (
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map(cliente => (
                          <button
                            key={cliente.id}
                            type="button"
                            className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                            onClick={() => {
                              setClienteSelecionado(cliente)
                              setShowClienteList(false)
                              setSearchTerm("")
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">{cliente.nome}</p>
                                <p className="text-sm text-muted-foreground">{cliente.cpfCnpj} | {cliente.telefone}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                cliente.tipo === "PJ" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                              }`}>
                                {cliente.tipo}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="p-3 text-center text-muted-foreground">Nenhum cliente encontrado</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nome / Razão Social</Label>
                      <p className="font-medium text-foreground">{clienteSelecionado.nome}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">CPF/CNPJ</Label>
                      <p className="font-medium text-foreground">{clienteSelecionado.cpfCnpj}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <p className="font-medium text-foreground">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          clienteSelecionado.tipo === "PJ" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        }`}>
                          <Building2 className="h-3 w-3" />
                          {clienteSelecionado.tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status do Cliente</Label>
                      <p className="font-medium">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                          {clienteSelecionado.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClienteSelecionado(null)}
                    className="bg-transparent"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Alterar cliente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BLOCO 2 — Tipo de Contrato */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Tipo de Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Tipo</Label>
                  <RadioGroup value={tipoContrato} onValueChange={setTipoContrato} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recorrente" id="recorrente" />
                      <Label htmlFor="recorrente" className="font-normal cursor-pointer">Recorrente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="avulso" id="avulso" />
                      <Label htmlFor="avulso" className="font-normal cursor-pointer">Avulso</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusContrato} onValueChange={setStatusContrato}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                      <SelectItem value="encerrado">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 3 — Vigência e Financeiro */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Vigência e Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input 
                    id="dataInicio"
                    type="date" 
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataTermino">Data de Término / Renovação</Label>
                  <Input 
                    id="dataTermino"
                    type="date" 
                    value={dataTermino}
                    onChange={(e) => setDataTermino(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diaVencimento">Dia de Vencimento *</Label>
                  <Select value={diaVencimento} onValueChange={setDiaVencimento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                        <SelectItem key={dia} value={dia.toString()}>Dia {dia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorMensal">Valor Mensal *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="valorMensal"
                      type="text" 
                      placeholder="0,00"
                      className="pl-9"
                      value={valorMensal}
                      onChange={(e) => setValorMensal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reajusteAnual">Reajuste Anual (%)</Label>
                  <Input 
                    id="reajusteAnual"
                    type="text" 
                    placeholder="Ex: IGPM + 5%"
                    value={reajusteAnual}
                    onChange={(e) => setReajusteAnual(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="multaContratual">Multa Contratual (%)</Label>
                  <Input 
                    id="multaContratual"
                    type="text" 
                    placeholder="Ex: 10%"
                    value={multaContratual}
                    onChange={(e) => setMultaContratual(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 4 — Serviços Inclusos no Contrato */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Serviços Inclusos no Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {servicosContrato.map((servico, index) => (
                  <div key={servico.id} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-muted-foreground">Serviço {index + 1}</span>
                      {servicosContrato.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerServico(servico.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Tipo de Serviço *</Label>
                        <Select 
                          value={servico.tipoServico} 
                          onValueChange={(v) => atualizarServico(servico.id, "tipoServico", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposServico.map(tipo => (
                              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Frequência *</Label>
                        <Select 
                          value={servico.frequencia} 
                          onValueChange={(v) => atualizarServico(servico.id, "frequencia", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencias.map(freq => (
                              <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Limites</Label>
                        <Input 
                          placeholder="Ex: até 10 caixas, até 50 pontos"
                          value={servico.limites}
                          onChange={(e) => atualizarServico(servico.id, "limites", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={adicionarServico}
                  className="w-full border-dashed bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar serviço ao contrato
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 5 — Regras de Adicionais */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Regras de Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adicionalDescricao">O que é considerado adicional?</Label>
                  <Textarea 
                    id="adicionalDescricao"
                    placeholder="Descreva o que será considerado serviço adicional fora do contrato..."
                    rows={3}
                    value={adicionalDescricao}
                    onChange={(e) => setAdicionalDescricao(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="exigeAprovacao" className="font-medium">Exige aprovação prévia do cliente?</Label>
                    <p className="text-sm text-muted-foreground">O cliente deve aprovar serviços adicionais antes da execução</p>
                  </div>
                  <Switch
                    id="exigeAprovacao"
                    checked={exigeAprovacao}
                    onCheckedChange={setExigeAprovacao}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoesContratuais">Observações Contratuais</Label>
                  <Textarea 
                    id="observacoesContratuais"
                    placeholder="Observações específicas sobre regras de adicionais..."
                    rows={2}
                    value={observacoesContratuais}
                    onChange={(e) => setObservacoesContratuais(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 6 — Observações Internas */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Observações Internas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="observacoesInternas">Observações Administrativas</Label>
                  <Textarea 
                    id="observacoesInternas"
                    placeholder="Observações internas sobre o contrato (não visível para o cliente)..."
                    rows={3}
                    value={observacoesInternas}
                    onChange={(e) => setObservacoesInternas(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload de Contrato Assinado (opcional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="arquivoContrato"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="arquivoContrato" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      {arquivoContrato ? (
                        <p className="text-sm text-foreground font-medium">{arquivoContrato.name}</p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">Clique para fazer upload</p>
                          <p className="text-xs text-muted-foreground">PDF, DOC ou DOCX</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 7 — Ações */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end p-4 bg-background border rounded-lg sticky bottom-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/clientes')}
              className="sm:order-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              variant="outline"
              onClick={handleSalvarECadastrarServico}
              className="sm:order-2 bg-transparent"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Salvar e Cadastrar Serviço
            </Button>
            <Button 
              onClick={handleSalvar}
              className="sm:order-3"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Contrato
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
