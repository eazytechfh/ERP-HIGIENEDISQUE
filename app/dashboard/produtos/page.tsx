"use client"

import { ErpHeader } from "@/components/erp-header"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock database
const mockProdutos = [
  {
    id: 1,
    nome: "Detergente Industrial",
    marca: "Clean Pro",
    fornecedor: "Distribuidora Química SA",
    quantidade: 150,
    valorCusto: 12.50,
  },
  {
    id: 2,
    nome: "Desinfetante Bactericida",
    marca: "Hygimax",
    fornecedor: "Produtos Químicos Ltda",
    quantidade: 85,
    valorCusto: 18.90,
  },
  {
    id: 3,
    nome: "Luva de Proteção (Caixa 100un)",
    marca: "SafeHands",
    fornecedor: "EPI Center",
    quantidade: 42,
    valorCusto: 45.00,
  },
  {
    id: 4,
    nome: "Álcool 70% (5L)",
    marca: "SterileMax",
    fornecedor: "Distribuidora Química SA",
    quantidade: 200,
    valorCusto: 32.00,
  },
]

export default function EstoquePage() {
  const [produtos, setProdutos] = useState(mockProdutos)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  // Formulário Cadastro
  const [formData, setFormData] = useState({
    nome: "",
    marca: "",
    fornecedor: "",
    quantidade: "",
    valorCusto: "",
  })

  // Adicionar Quantidade
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState("")
  const [searchAddQty, setSearchAddQty] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault()
    const novoProduto = {
      id: produtos.length + 1,
      nome: formData.nome,
      marca: formData.marca,
      fornecedor: formData.fornecedor,
      quantidade: parseInt(formData.quantidade),
      valorCusto: parseFloat(formData.valorCusto),
    }
    setProdutos([...produtos, novoProduto])
    setFormData({
      nome: "",
      marca: "",
      fornecedor: "",
      quantidade: "",
      valorCusto: "",
    })
  }

  const handleEditar = (produto: any) => {
    setEditingProduct(produto)
    setFormData({
      nome: produto.nome,
      marca: produto.marca,
      fornecedor: produto.fornecedor,
      quantidade: produto.quantidade.toString(),
      valorCusto: produto.valorCusto.toString(),
    })
  }

  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault()
    setProdutos(
      produtos.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              nome: formData.nome,
              marca: formData.marca,
              fornecedor: formData.fornecedor,
              quantidade: parseInt(formData.quantidade),
              valorCusto: parseFloat(formData.valorCusto),
            }
          : p
      )
    )
    setEditingProduct(null)
    setFormData({
      nome: "",
      marca: "",
      fornecedor: "",
      quantidade: "",
      valorCusto: "",
    })
  }

  const handleExcluir = (id: number) => {
    setProdutos(produtos.filter((p) => p.id !== id))
  }

  const handleAdicionarQuantidade = () => {
    if (selectedProduct && quantidadeAdicionar) {
      setProdutos(
        produtos.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, quantidade: p.quantidade + parseInt(quantidadeAdicionar) }
            : p
        )
      )
      setSelectedProduct(null)
      setQuantidadeAdicionar("")
      setSearchAddQty("")
    }
  }

  const filteredProdutos = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredForAdd = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchAddQty.toLowerCase()) ||
      p.marca.toLowerCase().includes(searchAddQty.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
            <p className="text-muted-foreground">Gestão completa de produtos e inventário</p>
          </div>
        </div>

        <Tabs defaultValue="visualizar" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="visualizar">Visualizar Estoque</TabsTrigger>
            <TabsTrigger value="cadastrar">Cadastrar Produto</TabsTrigger>
            <TabsTrigger value="adicionar">Adicionar Quantidade</TabsTrigger>
          </TabsList>

          {/* Visualizar Estoque */}
          <TabsContent value="visualizar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produtos em Estoque</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os produtos cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome, marca ou fornecedor..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead className="text-right">Valor Custo</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProdutos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum produto encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProdutos.map((produto) => (
                          <TableRow key={produto.id}>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell>{produto.marca}</TableCell>
                            <TableCell>{produto.fornecedor}</TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium ${
                                  produto.quantidade < 50
                                    ? "bg-red-100 text-red-700"
                                    : produto.quantidade < 100
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {produto.quantidade}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {produto.valorCusto.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditar(produto)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleExcluir(produto.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cadastrar Produto */}
          <TabsContent value="cadastrar">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
                </CardTitle>
                <CardDescription>
                  {editingProduct
                    ? "Atualize as informações do produto"
                    : "Preencha os dados do produto para adicionar ao estoque"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingProduct ? handleSalvarEdicao : handleCadastrar} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do Produto *</Label>
                      <Input
                        id="nome"
                        name="nome"
                        placeholder="Ex: Detergente Industrial"
                        value={formData.nome}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marca">Marca *</Label>
                      <Input
                        id="marca"
                        name="marca"
                        placeholder="Ex: Clean Pro"
                        value={formData.marca}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fornecedor">Fornecedor *</Label>
                      <Input
                        id="fornecedor"
                        name="fornecedor"
                        placeholder="Ex: Distribuidora Química SA"
                        value={formData.fornecedor}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade Inicial *</Label>
                      <Input
                        id="quantidade"
                        name="quantidade"
                        type="number"
                        placeholder="Ex: 100"
                        value={formData.quantidade}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valorCusto">Valor Custo (R$) *</Label>
                      <Input
                        id="valorCusto"
                        name="valorCusto"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 12.50"
                        value={formData.valorCusto}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
                    </Button>
                    {editingProduct && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(null)
                          setFormData({
                            nome: "",
                            marca: "",
                            fornecedor: "",
                            quantidade: "",
                            valorCusto: "",
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

          {/* Adicionar Quantidade */}
          <TabsContent value="adicionar">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Quantidade ao Estoque</CardTitle>
                <CardDescription>
                  Pesquise o produto e adicione a quantidade comprada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="searchProduct">Pesquisar Produto</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="searchProduct"
                      placeholder="Digite o nome ou marca do produto..."
                      className="pl-10"
                      value={searchAddQty}
                      onChange={(e) => {
                        setSearchAddQty(e.target.value)
                        setSelectedProduct(null)
                      }}
                    />
                  </div>
                </div>

                {searchAddQty && filteredForAdd.length > 0 && !selectedProduct && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead className="text-center">Qtd Atual</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredForAdd.map((produto) => (
                          <TableRow key={produto.id}>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell>{produto.marca}</TableCell>
                            <TableCell className="text-center">{produto.quantidade}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => setSelectedProduct(produto)}
                              >
                                Selecionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {selectedProduct && (
                  <div className="space-y-4 rounded-lg border bg-muted/50 p-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Produto Selecionado</h3>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nome:</span>
                          <span className="font-medium">{selectedProduct.nome}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Marca:</span>
                          <span className="font-medium">{selectedProduct.marca}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantidade Atual:</span>
                          <span className="font-medium">{selectedProduct.quantidade}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantidadeAdd">Quantidade a Adicionar *</Label>
                      <Input
                        id="quantidadeAdd"
                        type="number"
                        placeholder="Ex: 50"
                        value={quantidadeAdicionar}
                        onChange={(e) => setQuantidadeAdicionar(e.target.value)}
                        required
                      />
                    </div>

                    {quantidadeAdicionar && (
                      <div className="rounded-md bg-primary/10 p-3 text-sm">
                        <p className="font-medium">
                          Nova Quantidade:{" "}
                          <span className="text-primary">
                            {selectedProduct.quantidade + parseInt(quantidadeAdicionar)}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAdicionarQuantidade}
                        disabled={!quantidadeAdicionar}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar ao Estoque
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(null)
                          setQuantidadeAdicionar("")
                          setSearchAddQty("")
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
