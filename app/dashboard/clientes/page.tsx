"use client"

import { ErpHeader } from "@/components/erp-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, UserPlus, Users } from 'lucide-react'
import { useState } from "react"

type Cliente = {
  id: string
  nome: string
  telefone: string
  email: string
  empresa: string
  cpfCnpj: string
  comoConheceu: string
  status: "Ativo" | "Inativo"
}

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState<"consultar" | "cadastrar">("consultar")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  
  // Dados de exemplo
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: "1",
      nome: "João Silva",
      telefone: "(11) 98765-4321",
      email: "joao@email.com",
      empresa: "Silva & Cia",
      cpfCnpj: "123.456.789-00",
      comoConheceu: "Indicação",
      status: "Ativo"
    },
    {
      id: "2",
      nome: "Maria Santos",
      telefone: "(11) 91234-5678",
      email: "maria@empresa.com",
      empresa: "Santos Ltda",
      cpfCnpj: "12.345.678/0001-90",
      comoConheceu: "Google",
      status: "Ativo"
    },
  ])

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    empresa: "",
    cpfCnpj: "",
    comoConheceu: "",
    status: "Ativo" as "Ativo" | "Inativo"
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingClient) {
      // Editar cliente existente
      setClientes(prev => prev.map(c => 
        c.id === editingClient.id 
          ? { ...formData, id: editingClient.id }
          : c
      ))
      setEditingClient(null)
    } else {
      // Cadastrar novo cliente
      const novoCliente: Cliente = {
        id: Date.now().toString(),
        ...formData
      }
      setClientes(prev => [...prev, novoCliente])
    }
    
    // Limpar formulário
    setFormData({
      nome: "",
      telefone: "",
      email: "",
      empresa: "",
      cpfCnpj: "",
      comoConheceu: "",
      status: "Ativo"
    })
    
    // Voltar para consulta
    setActiveTab("consultar")
  }

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      empresa: cliente.empresa,
      cpfCnpj: cliente.cpfCnpj,
      comoConheceu: cliente.comoConheceu,
      status: cliente.status
    })
    setEditingClient(cliente)
    setActiveTab("cadastrar")
  }

  const filteredClientes = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm) ||
    cliente.cpfCnpj.includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os clientes da HIGIENE DISQUE</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "consultar" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("consultar")
              setEditingClient(null)
              setFormData({
                nome: "",
                telefone: "",
                email: "",
                empresa: "",
                cpfCnpj: "",
                comoConheceu: "",
                status: "Ativo"
              })
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
            Cadastrar Clientes
          </Button>
        </div>

        {/* Conteúdo das Tabs */}
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
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum cliente encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClientes.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell className="font-medium">{cliente.nome}</TableCell>
                          <TableCell>{cliente.telefone}</TableCell>
                          <TableCell>{cliente.email}</TableCell>
                          <TableCell>{cliente.empresa}</TableCell>
                          <TableCell>{cliente.cpfCnpj}</TableCell>
                          <TableCell>
                            <Badge variant={cliente.status === "Ativo" ? "default" : "secondary"}>
                              {cliente.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cliente)}
                            >
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
          <Card>
            <CardHeader>
              <CardTitle>{editingClient ? "Editar Cliente" : "Cadastrar Novo Cliente"}</CardTitle>
              <CardDescription>
                {editingClient 
                  ? "Atualize as informações do cliente" 
                  : "Preencha os dados do novo cliente"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Cliente *</Label>
                    <Input
                      id="nome"
                      required
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone Cliente *</Label>
                    <Input
                      id="telefone"
                      required
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                      placeholder="(11) 98765-4321"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="cliente@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange("empresa", e.target.value)}
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                    <Input
                      id="cpfCnpj"
                      required
                      value={formData.cpfCnpj}
                      onChange={(e) => handleInputChange("cpfCnpj", e.target.value)}
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comoConheceu">Como nos conheceu</Label>
                    <Select
                      value={formData.comoConheceu}
                      onValueChange={(value) => handleInputChange("comoConheceu", value)}
                    >
                      <SelectTrigger id="comoConheceu">
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Indicação">Indicação</SelectItem>
                        <SelectItem value="Google">Google</SelectItem>
                        <SelectItem value="Redes Sociais">Redes Sociais</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {editingClient ? "Atualizar Cliente" : "Cadastrar Cliente"}
                  </Button>
                  {editingClient && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingClient(null)
                        setFormData({
                          nome: "",
                          telefone: "",
                          email: "",
                          empresa: "",
                          cpfCnpj: "",
                          comoConheceu: "",
                          status: "Ativo"
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
