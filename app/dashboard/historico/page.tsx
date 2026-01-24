"use client"

import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, CheckCircle2, Clock, XCircle, Bell, Calendar, FileText } from 'lucide-react'
import { useState } from "react"

type Cliente = {
  id: string
  nome: string
  telefone: string
  email: string
  empresa: string
  cpfCnpj: string
}

type Servico = {
  id: string
  clienteId: string
  nome: string
  data: string
  status: "Realizado" | "Programado" | "Cancelado"
  valor: number
  observacao: string
}

type Notificacao = {
  id: string
  clienteId: string
  servico: string
  dataEnvio: string
  tipo: string
}

export default function HistoricoPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  
  // Dados de exemplo - Clientes
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
    {
      id: "3",
      nome: "Carlos Oliveira",
      telefone: "(11) 99999-8888",
      email: "carlos@email.com",
      empresa: "Oliveira Corp",
      cpfCnpj: "987.654.321-00"
    },
  ]

  // Dados de exemplo - Serviços
  const servicos: Servico[] = [
    {
      id: "1",
      clienteId: "1",
      nome: "Dedetização Residencial",
      data: "2025-01-10",
      status: "Realizado",
      valor: 450.00,
      observacao: "Serviço completo em toda residência"
    },
    {
      id: "2",
      clienteId: "1",
      nome: "Limpeza de Caixa D'água",
      data: "2025-02-15",
      status: "Programado",
      valor: 350.00,
      observacao: "Agendado para manhã"
    },
    {
      id: "3",
      clienteId: "1",
      nome: "Controle de Pragas",
      data: "2024-12-20",
      status: "Cancelado",
      valor: 280.00,
      observacao: "Cliente solicitou cancelamento"
    },
    {
      id: "4",
      clienteId: "2",
      nome: "Higienização de Estofados",
      data: "2025-01-05",
      status: "Realizado",
      valor: 600.00,
      observacao: "4 sofás higienizados"
    },
    {
      id: "5",
      clienteId: "2",
      nome: "Dedetização Comercial",
      data: "2025-02-20",
      status: "Programado",
      valor: 850.00,
      observacao: "Escritório completo"
    },
  ]

  // Dados de exemplo - Notificações
  const notificacoes: Notificacao[] = [
    {
      id: "1",
      clienteId: "1",
      servico: "Dedetização Residencial",
      dataEnvio: "08/01/2025",
      tipo: "Lembrete de serviço"
    },
    {
      id: "2",
      clienteId: "1",
      servico: "Limpeza de Caixa D'água",
      dataEnvio: "10/02/2025",
      tipo: "Confirmação de agendamento"
    },
    {
      id: "3",
      clienteId: "1",
      servico: "Dedetização Residencial",
      dataEnvio: "11/01/2025",
      tipo: "Confirmação de conclusão"
    },
    {
      id: "4",
      clienteId: "2",
      servico: "Higienização de Estofados",
      dataEnvio: "03/01/2025",
      tipo: "Lembrete de serviço"
    },
    {
      id: "5",
      clienteId: "2",
      servico: "Dedetização Comercial",
      dataEnvio: "15/02/2025",
      tipo: "Confirmação de agendamento"
    },
  ]

  const filteredClientes = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm) ||
    cliente.cpfCnpj.includes(searchTerm)
  )

  const clienteServicos = selectedCliente 
    ? servicos.filter(s => s.clienteId === selectedCliente.id)
    : []

  const clienteNotificacoes = selectedCliente
    ? notificacoes.filter(n => n.clienteId === selectedCliente.id)
    : []

  const servicosRealizados = clienteServicos.filter(s => s.status === "Realizado").length
  const servicosProgramados = clienteServicos.filter(s => s.status === "Programado").length
  const servicosCancelados = clienteServicos.filter(s => s.status === "Cancelado").length

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Realizado": return "bg-green-500/10 text-green-700 border-green-200"
      case "Programado": return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "Cancelado": return "bg-red-500/10 text-red-700 border-red-200"
      default: return ""
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Histórico de Serviços</h1>
          <p className="text-muted-foreground">Visualize todos os serviços e notificações por cliente</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Clientes */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Selecionar Cliente</CardTitle>
              <CardDescription>Busque e selecione um cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredClientes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum cliente encontrado
                  </p>
                ) : (
                  filteredClientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => setSelectedCliente(cliente)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedCliente?.id === cliente.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <h3 className="font-semibold text-foreground">{cliente.nome}</h3>
                      <p className="text-sm text-muted-foreground">{cliente.empresa}</p>
                      <p className="text-xs text-muted-foreground mt-1">{cliente.telefone}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do Cliente Selecionado */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedCliente ? (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Selecione um cliente para visualizar o histórico
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Resumo de Serviços */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-500/10">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{servicosRealizados}</p>
                          <p className="text-sm text-muted-foreground">Realizados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-500/10">
                          <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{servicosProgramados}</p>
                          <p className="text-sm text-muted-foreground">Programados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-red-500/10">
                          <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{servicosCancelados}</p>
                          <p className="text-sm text-muted-foreground">Cancelados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Serviços */}
                <Card>
                  <CardHeader>
                    <CardTitle>Serviços Cadastrados</CardTitle>
                    <CardDescription>
                      Histórico completo de serviços para {selectedCliente.nome}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clienteServicos.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum serviço cadastrado para este cliente
                        </p>
                      ) : (
                        clienteServicos.map((servico) => (
                          <div
                            key={servico.id}
                            className="p-4 rounded-lg border border-border hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground">{servico.nome}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {formatDate(servico.data)}
                                  </span>
                                </div>
                              </div>
                              <Badge className={getStatusColor(servico.status)}>
                                {servico.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {servico.observacao}
                            </p>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(servico.valor)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Histórico de Notificações */}
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Notificações</CardTitle>
                    <CardDescription>
                      Registro de todas as notificações enviadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clienteNotificacoes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma notificação registrada para este cliente
                        </p>
                      ) : (
                        clienteNotificacoes.map((notificacao) => (
                          <div
                            key={notificacao.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                          >
                            <div className="p-2 rounded-full bg-primary/10 mt-1">
                              <Bell className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {notificacao.tipo}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Notificação para realizar o serviço{" "}
                                <span className="font-medium">{notificacao.servico}</span>{" "}
                                enviada dia {notificacao.dataEnvio}
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
