'use client'

import { ErpHeader } from "@/components/erp-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Search, UserPlus, Edit, Trash2, Users } from 'lucide-react'

type Membro = {
  id: number
  nome: string
  telefone: string
  cargo: string
  endereco: string
  situacao: 'Ativo' | 'Inativo'
}

export default function EquipePage() {
  const [membros, setMembros] = useState<Membro[]>([
    {
      id: 1,
      nome: "João Silva",
      telefone: "(11) 98765-4321",
      cargo: "Técnico em Dedetização",
      endereco: "Rua das Flores, 123 - São Paulo/SP",
      situacao: "Ativo"
    },
    {
      id: 2,
      nome: "Maria Santos",
      telefone: "(11) 97654-3210",
      cargo: "Auxiliar de Limpeza",
      endereco: "Av. Paulista, 456 - São Paulo/SP",
      situacao: "Ativo"
    },
    {
      id: 3,
      nome: "Pedro Costa",
      telefone: "(11) 96543-2109",
      cargo: "Supervisor de Equipe",
      endereco: "Rua dos Jardins, 789 - São Paulo/SP",
      situacao: "Ativo"
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Omit<Membro, 'id'>>({
    nome: "",
    telefone: "",
    cargo: "",
    endereco: "",
    situacao: "Ativo"
  })

  const handleInputChange = (field: keyof Omit<Membro, 'id'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingId) {
      setMembros(prev => prev.map(m => 
        m.id === editingId ? { ...formData, id: editingId } : m
      ))
      setEditingId(null)
    } else {
      const novoMembro: Membro = {
        id: Math.max(0, ...membros.map(m => m.id)) + 1,
        ...formData
      }
      setMembros(prev => [...prev, novoMembro])
    }

    setFormData({
      nome: "",
      telefone: "",
      cargo: "",
      endereco: "",
      situacao: "Ativo"
    })
  }

  const handleEdit = (membro: Membro) => {
    setFormData({
      nome: membro.nome,
      telefone: membro.telefone,
      cargo: membro.cargo,
      endereco: membro.endereco,
      situacao: membro.situacao
    })
    setEditingId(membro.id)
  }

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este membro?")) {
      setMembros(prev => prev.filter(m => m.id !== id))
    }
  }

  const filteredMembros = membros.filter(membro =>
    membro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membro.telefone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membro.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Cadastro de Equipe</h1>
        </div>

        <Tabs defaultValue="visualizar" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="visualizar">Equipe Cadastrada</TabsTrigger>
            <TabsTrigger value="cadastrar">Cadastrar Novo Membro</TabsTrigger>
          </TabsList>

          <TabsContent value="visualizar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Membros da Equipe</CardTitle>
                <CardDescription>Visualize e gerencie todos os membros cadastrados</CardDescription>
                
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome, telefone ou cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Telefone</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Cargo</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Endereço</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Situação</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredMembros.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                              Nenhum membro encontrado
                            </td>
                          </tr>
                        ) : (
                          filteredMembros.map((membro) => (
                            <tr key={membro.id} className="hover:bg-muted/50">
                              <td className="px-4 py-3 font-medium">{membro.nome}</td>
                              <td className="px-4 py-3">{membro.telefone}</td>
                              <td className="px-4 py-3">{membro.cargo}</td>
                              <td className="px-4 py-3 text-sm">{membro.endereco}</td>
                              <td className="px-4 py-3">
                                <Badge variant={membro.situacao === 'Ativo' ? 'default' : 'secondary'}>
                                  {membro.situacao}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(membro)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(membro.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  Total de membros: {filteredMembros.length}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cadastrar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  {editingId ? 'Editar Membro' : 'Cadastrar Novo Membro'}
                </CardTitle>
                <CardDescription>
                  {editingId ? 'Atualize as informações do membro' : 'Preencha os dados do novo membro da equipe'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input
                        id="nome"
                        placeholder="Digite o nome completo"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        placeholder="(00) 00000-0000"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo *</Label>
                      <Input
                        id="cargo"
                        placeholder="Digite o cargo"
                        value={formData.cargo}
                        onChange={(e) => handleInputChange('cargo', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="situacao">Situação *</Label>
                      <Select
                        value={formData.situacao}
                        onValueChange={(value) => handleInputChange('situacao', value as 'Ativo' | 'Inativo')}
                      >
                        <SelectTrigger id="situacao">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="endereco">Endereço Completo *</Label>
                      <Input
                        id="endereco"
                        placeholder="Rua, número, bairro, cidade/estado"
                        value={formData.endereco}
                        onChange={(e) => handleInputChange('endereco', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingId ? 'Atualizar Membro' : 'Cadastrar Membro'}
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null)
                          setFormData({
                            nome: "",
                            telefone: "",
                            cargo: "",
                            endereco: "",
                            situacao: "Ativo"
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
