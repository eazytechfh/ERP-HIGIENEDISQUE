"use client"

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
import { Search, ArrowRight, FileText, Upload, X, CheckCircle } from 'lucide-react'
import { useState } from "react"

type Cliente = {
  id: string
  nome: string
  telefone: string
  email: string
  empresa: string
  cpfCnpj: string
}

type ServicoData = {
  clienteId: string
  clienteNome: string
  nomeServico: string
  endereco: string
  tipo: string
  dataProgramada: string
  valor: string
  formaPagamento: string
  recorrencia: boolean
  tempoRecorrencia: string
  garantia: string
  operador: string
  arquivo: File | null
}

export default function ServicosPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [showOSDialog, setShowOSDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [notificarCliente, setNotificarCliente] = useState<"sim" | "nao">("sim")
  
  // Dados de exemplo de clientes
  const clientes: Cliente[] = [
    {
      id: "1",
      nome: "João Silva",
      telefone: "(11) 98765-4321",
      email: "joao@email.com",
      empresa: "Silva & Cia",
      cpfCnpj: "123.456.789-00"
    },
    {
      id: "2",
      nome: "Maria Santos",
      telefone: "(11) 91234-5678",
      email: "maria@empresa.com",
      empresa: "Santos Ltda",
      cpfCnpj: "12.345.678/0001-90"
    },
  ]

  const [servicoData, setServicoData] = useState<ServicoData>({
    clienteId: "",
    clienteNome: "",
    nomeServico: "",
    endereco: "",
    tipo: "",
    dataProgramada: "",
    valor: "",
    formaPagamento: "",
    recorrencia: false,
    tempoRecorrencia: "",
    garantia: "",
    operador: "",
    arquivo: null
  })

  const filteredClientes = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm) ||
    cliente.cpfCnpj.includes(searchTerm)
  )

  const handleClienteSelect = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setServicoData(prev => ({
      ...prev,
      clienteId: cliente.id,
      clienteNome: cliente.nome
    }))
  }

  const handleInputChange = (field: keyof ServicoData, value: any) => {
    setServicoData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type === 'application/pdf' || 
                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setServicoData(prev => ({ ...prev, arquivo: file }))
    } else {
      alert('Por favor, selecione apenas arquivos PDF ou DOCX')
    }
  }

  const handleAvancar = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleGerarOS = () => {
    setShowOSDialog(true)
  }

  const handleConfirmarOS = () => {
    setShowOSDialog(false)
    // Aqui seria enviado a notificação se selecionado
    setShowSuccessDialog(true)
  }

  const handleFinalizarCadastro = () => {
    console.log("[v0] Serviço cadastrado:", servicoData)
    console.log("[v0] Notificar cliente:", notificarCliente)
    
    // Resetar formulário
    setShowSuccessDialog(false)
    setStep(1)
    setClienteSelecionado(null)
    setServicoData({
      clienteId: "",
      clienteNome: "",
      nomeServico: "",
      endereco: "",
      tipo: "",
      dataProgramada: "",
      valor: "",
      formaPagamento: "",
      recorrencia: false,
      tempoRecorrencia: "",
      garantia: "",
      operador: "",
      arquivo: null
    })
    setSearchTerm("")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cadastro de Serviços</h1>
          <p className="text-muted-foreground">Cadastre novos serviços para seus clientes</p>
        </div>

        {/* Indicador de Etapas */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <span className={step === 1 ? 'font-medium' : 'text-muted-foreground'}>
              Dados do Serviço
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className={step === 2 ? 'font-medium' : 'text-muted-foreground'}>
              Gerar OS
            </span>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleAvancar}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Seleção de Cliente */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Selecionar Cliente</CardTitle>
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

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
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

              {/* Formulário de Serviço */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Informações do Serviço</CardTitle>
                  <CardDescription>Preencha os dados do serviço a ser realizado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nomeServico">Nome do Serviço *</Label>
                        <Input
                          id="nomeServico"
                          required
                          value={servicoData.nomeServico}
                          onChange={(e) => handleInputChange("nomeServico", e.target.value)}
                          placeholder="Ex: Dedetização Residencial"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo *</Label>
                        <Select
                          required
                          value={servicoData.tipo}
                          onValueChange={(value) => handleInputChange("tipo", value)}
                        >
                          <SelectTrigger id="tipo">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Apartamento">Apartamento</SelectItem>
                            <SelectItem value="Casa">Casa</SelectItem>
                            <SelectItem value="Negócio">Negócio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço *</Label>
                      <Textarea
                        id="endereco"
                        required
                        value={servicoData.endereco}
                        onChange={(e) => handleInputChange("endereco", e.target.value)}
                        placeholder="Endereço completo onde o serviço será realizado"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dataProgramada">Data Programada *</Label>
                        <Input
                          id="dataProgramada"
                          type="date"
                          required
                          value={servicoData.dataProgramada}
                          onChange={(e) => handleInputChange("dataProgramada", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor do Serviço *</Label>
                        <Input
                          id="valor"
                          required
                          value={servicoData.valor}
                          onChange={(e) => handleInputChange("valor", e.target.value)}
                          placeholder="R$ 0,00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
                        <Select
                          required
                          value={servicoData.formaPagamento}
                          onValueChange={(value) => handleInputChange("formaPagamento", value)}
                        >
                          <SelectTrigger id="formaPagamento">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                            <SelectItem value="Boleto">Boleto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="operador">Operador *</Label>
                        <Input
                          id="operador"
                          required
                          value={servicoData.operador}
                          onChange={(e) => handleInputChange("operador", e.target.value)}
                          placeholder="Nome do operador responsável"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Recorrência</Label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={servicoData.recorrencia}
                            onChange={(e) => handleInputChange("recorrencia", e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Serviço recorrente</span>
                        </label>
                      </div>
                      {servicoData.recorrencia && (
                        <Select
                          value={servicoData.tempoRecorrencia}
                          onValueChange={(value) => handleInputChange("tempoRecorrencia", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Periodicidade da recorrência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Semanal">Semanal</SelectItem>
                            <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="Mensal">Mensal</SelectItem>
                            <SelectItem value="Bimestral">Bimestral</SelectItem>
                            <SelectItem value="Trimestral">Trimestral</SelectItem>
                            <SelectItem value="Semestral">Semestral</SelectItem>
                            <SelectItem value="Anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="garantia">Garantia</Label>
                      <Input
                        id="garantia"
                        value={servicoData.garantia}
                        onChange={(e) => handleInputChange("garantia", e.target.value)}
                        placeholder="Ex: 90 dias"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="arquivo">Anexar Documento (PDF ou DOCX)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="arquivo"
                          type="file"
                          accept=".pdf,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('arquivo')?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Selecionar Arquivo
                        </Button>
                        {servicoData.arquivo && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4" />
                            <span>{servicoData.arquivo.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInputChange("arquivo", null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                type="submit" 
                size="lg" 
                className="gap-2"
                disabled={!clienteSelecionado}
              >
                Avançar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Gerar Ordem de Serviço</CardTitle>
              <CardDescription>Revise as informações e gere a OS para o cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Dados do Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Nome:</span> {servicoData.clienteNome}</p>
                    <p><span className="text-muted-foreground">CPF/CNPJ:</span> {clienteSelecionado?.cpfCnpj}</p>
                    <p><span className="text-muted-foreground">Telefone:</span> {clienteSelecionado?.telefone}</p>
                    <p><span className="text-muted-foreground">E-mail:</span> {clienteSelecionado?.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Dados do Serviço</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Serviço:</span> {servicoData.nomeServico}</p>
                    <p><span className="text-muted-foreground">Tipo:</span> {servicoData.tipo}</p>
                    <p><span className="text-muted-foreground">Data:</span> {new Date(servicoData.dataProgramada).toLocaleDateString('pt-BR')}</p>
                    <p><span className="text-muted-foreground">Valor:</span> {servicoData.valor}</p>
                    <p><span className="text-muted-foreground">Pagamento:</span> {servicoData.formaPagamento}</p>
                    <p><span className="text-muted-foreground">Operador:</span> {servicoData.operador}</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-2">Endereço</h3>
                  <p className="text-sm">{servicoData.endereco}</p>
                </div>

                {servicoData.recorrencia && (
                  <div className="md:col-span-2">
                    <Badge>Recorrência: {servicoData.tempoRecorrencia}</Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleGerarOS} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Gerar OS
                </Button>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Prévia da OS */}
        <Dialog open={showOSDialog} onOpenChange={setShowOSDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prévia da Ordem de Serviço</DialogTitle>
              <DialogDescription>Revise as informações antes de confirmar</DialogDescription>
            </DialogHeader>

            <div className="border rounded-lg p-6 space-y-4 bg-background">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary">HIGIENE DISQUE</h2>
                  <p className="text-sm text-muted-foreground">Ordem de Serviço</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">OS Nº</p>
                  <p className="font-bold">#{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Cliente</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><strong>Nome:</strong> {servicoData.clienteNome}</p>
                  <p><strong>CPF/CNPJ:</strong> {clienteSelecionado?.cpfCnpj}</p>
                  <p><strong>Telefone:</strong> {clienteSelecionado?.telefone}</p>
                  <p><strong>E-mail:</strong> {clienteSelecionado?.email}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Serviço</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Serviço:</strong> {servicoData.nomeServico}</p>
                  <p><strong>Tipo:</strong> {servicoData.tipo}</p>
                  <p><strong>Endereço:</strong> {servicoData.endereco}</p>
                  <p><strong>Data Programada:</strong> {new Date(servicoData.dataProgramada).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Operador Responsável:</strong> {servicoData.operador}</p>
                  {servicoData.garantia && <p><strong>Garantia:</strong> {servicoData.garantia}</p>}
                  {servicoData.recorrencia && (
                    <p><strong>Recorrência:</strong> {servicoData.tempoRecorrencia}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Pagamento</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><strong>Valor:</strong> {servicoData.valor}</p>
                  <p><strong>Forma de Pagamento:</strong> {servicoData.formaPagamento}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Notificar Cliente via WhatsApp e E-mail?
                </Label>
                <RadioGroup value={notificarCliente} onValueChange={(value: "sim" | "nao") => setNotificarCliente(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="sim" />
                    <Label htmlFor="sim" className="cursor-pointer">Sim, enviar notificação</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="nao" />
                    <Label htmlFor="nao" className="cursor-pointer">Não enviar agora</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOSDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmarOS} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Confirmar e Cadastrar Serviço
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Sucesso */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Serviço Cadastrado com Sucesso!
              </DialogTitle>
              <DialogDescription>
                O serviço foi cadastrado e a OS foi gerada.
                {notificarCliente === "sim" && " O cliente será notificado via WhatsApp e E-mail."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleFinalizarCadastro}>
                Finalizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
