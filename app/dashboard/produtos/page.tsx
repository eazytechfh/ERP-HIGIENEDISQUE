"use client"

import { ErpHeader } from "@/components/erp-header"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Package, Plus, Search, Pencil, Trash2, FileText, X } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Tipos
type Categoria = "Produto Químico" | "Diluente" | "Consumível" | "EPI"
type Unidade = "L" | "ml" | "g" | "kg" | "unid"
type Status = "OK" | "Alerta" | "Crítico"

interface Produto {
  id: number
  nome: string
  marca: string
  fornecedor: string
  estoqueAtual: number
  estoqueMinimo: number
  unidade: Unidade
  categoria: Categoria
  custoUnitario: number
  ativo: boolean
}

interface ItemNF {
  produtoId: number | null
  quantidade: number
  unidade: Unidade
  custoUnitario: number
}

// Mock database com produtos de dedetização
const mockProdutos: Produto[] = [
  {
    id: 1,
    nome: "Cipermetrina 25% CE",
    marca: "Rogama",
    fornecedor: "Distribuidora Química SA",
    estoqueAtual: 45,
    estoqueMinimo: 20,
    unidade: "L",
    categoria: "Produto Químico",
    custoUnitario: 189.90,
    ativo: true,
  },
  {
    id: 2,
    nome: "Deltametrina SC",
    marca: "Bayer",
    fornecedor: "Bayer CropScience",
    estoqueAtual: 12,
    estoqueMinimo: 15,
    unidade: "L",
    categoria: "Produto Químico",
    custoUnitario: 245.00,
    ativo: true,
  },
  {
    id: 3,
    nome: "Gel Baraticida MaxForce",
    marca: "Bayer",
    fornecedor: "Bayer CropScience",
    estoqueAtual: 8,
    estoqueMinimo: 25,
    unidade: "unid",
    categoria: "Produto Químico",
    custoUnitario: 78.50,
    ativo: true,
  },
  {
    id: 4,
    nome: "Raticida Granulado",
    marca: "Citromax",
    fornecedor: "Citromax Ind. Química",
    estoqueAtual: 30,
    estoqueMinimo: 10,
    unidade: "kg",
    categoria: "Produto Químico",
    custoUnitario: 65.00,
    ativo: true,
  },
  {
    id: 5,
    nome: "Diluente Querosene",
    marca: "Petrobras",
    fornecedor: "Distribuidora Química SA",
    estoqueAtual: 100,
    estoqueMinimo: 50,
    unidade: "L",
    categoria: "Diluente",
    custoUnitario: 12.50,
    ativo: true,
  },
  {
    id: 6,
    nome: "Luva Nitrílica (Caixa 100un)",
    marca: "Descarpack",
    fornecedor: "EPI Center",
    estoqueAtual: 15,
    estoqueMinimo: 10,
    unidade: "unid",
    categoria: "EPI",
    custoUnitario: 89.90,
    ativo: true,
  },
  {
    id: 7,
    nome: "Máscara PFF2",
    marca: "3M",
    fornecedor: "EPI Center",
    estoqueAtual: 5,
    estoqueMinimo: 20,
    unidade: "unid",
    categoria: "EPI",
    custoUnitario: 8.50,
    ativo: true,
  },
  {
    id: 8,
    nome: "Pulverizador Costal 20L",
    marca: "Guarany",
    fornecedor: "Agro Peças Ltda",
    estoqueAtual: 6,
    estoqueMinimo: 3,
    unidade: "unid",
    categoria: "Consumível",
    custoUnitario: 285.00,
    ativo: true,
  },
  {
    id: 9,
    nome: "Armadilha Adesiva Rateiro",
    marca: "Colly",
    fornecedor: "Citromax Ind. Química",
    estoqueAtual: 200,
    estoqueMinimo: 100,
    unidade: "unid",
    categoria: "Consumível",
    custoUnitario: 4.50,
    ativo: true,
  },
  {
    id: 10,
    nome: "Inseticida K-Othrine SC",
    marca: "Bayer",
    fornecedor: "Bayer CropScience",
    estoqueAtual: 18,
    estoqueMinimo: 20,
    unidade: "L",
    categoria: "Produto Químico",
    custoUnitario: 320.00,
    ativo: true,
  },
]

const categorias: Categoria[] = ["Produto Químico", "Diluente", "Consumível", "EPI"]
const unidades: Unidade[] = ["L", "ml", "g", "kg", "unid"]

const fornecedoresMock = [
  "Distribuidora Química SA",
  "Bayer CropScience",
  "Citromax Ind. Química",
  "EPI Center",
  "Agro Peças Ltda",
]

function calcularStatus(estoqueAtual: number, estoqueMinimo: number): Status {
  if (estoqueAtual < estoqueMinimo) return "Crítico"
  if (estoqueAtual <= estoqueMinimo * 1.2) return "Alerta"
  return "OK"
}

function StatusBadge({ status }: { status: Status }) {
  const styles = {
    OK: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Alerta: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Crítico: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }
  return (
    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}

function EstoqueBadge({ quantidade, status }: { quantidade: number; status: Status }) {
  const styles = {
    OK: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Alerta: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Crítico: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }
  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium ${styles[status]}`}>
      {quantidade}
    </span>
  )
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>(mockProdutos)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [isNFModalOpen, setIsNFModalOpen] = useState(false)
  
  // Formulário Cadastro
  const [formData, setFormData] = useState({
    nome: "",
    marca: "",
    fornecedor: "",
    categoria: "" as Categoria | "",
    unidade: "" as Unidade | "",
    estoqueMinimo: "",
    ativo: true,
  })

  // Formulário Nota Fiscal
  const [nfData, setNfData] = useState({
    fornecedor: "",
    numeroNF: "",
    dataNF: "",
    itens: [{ produtoId: null, quantidade: 0, unidade: "unid" as Unidade, custoUnitario: 0 }] as ItemNF[],
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoria || !formData.unidade) return
    
    const novoProduto: Produto = {
      id: Math.max(...produtos.map(p => p.id)) + 1,
      nome: formData.nome,
      marca: formData.marca,
      fornecedor: formData.fornecedor,
      estoqueAtual: 0, // Estoque começa zerado
      estoqueMinimo: parseInt(formData.estoqueMinimo) || 0,
      unidade: formData.unidade,
      categoria: formData.categoria,
      custoUnitario: 0, // Será definido na entrada de NF
      ativo: formData.ativo,
    }
    setProdutos([...produtos, novoProduto])
    setFormData({
      nome: "",
      marca: "",
      fornecedor: "",
      categoria: "",
      unidade: "",
      estoqueMinimo: "",
      ativo: true,
    })
  }

  const handleEditar = (produto: Produto) => {
    setEditingProduct(produto)
    setFormData({
      nome: produto.nome,
      marca: produto.marca,
      fornecedor: produto.fornecedor,
      categoria: produto.categoria,
      unidade: produto.unidade,
      estoqueMinimo: produto.estoqueMinimo.toString(),
      ativo: produto.ativo,
    })
  }

  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct || !formData.categoria || !formData.unidade) return
    
    setProdutos(
      produtos.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              nome: formData.nome,
              marca: formData.marca,
              fornecedor: formData.fornecedor,
              categoria: formData.categoria,
              unidade: formData.unidade,
              estoqueMinimo: parseInt(formData.estoqueMinimo) || 0,
              ativo: formData.ativo,
            }
          : p
      )
    )
    setEditingProduct(null)
    setFormData({
      nome: "",
      marca: "",
      fornecedor: "",
      categoria: "",
      unidade: "",
      estoqueMinimo: "",
      ativo: true,
    })
  }

  const handleExcluir = (id: number) => {
    setProdutos(produtos.filter((p) => p.id !== id))
  }

  // Nota Fiscal
  const handleAddItemNF = () => {
    setNfData({
      ...nfData,
      itens: [...nfData.itens, { produtoId: null, quantidade: 0, unidade: "unid", custoUnitario: 0 }],
    })
  }

  const handleRemoveItemNF = (index: number) => {
    setNfData({
      ...nfData,
      itens: nfData.itens.filter((_, i) => i !== index),
    })
  }

  const handleItemNFChange = (index: number, field: keyof ItemNF, value: any) => {
    const newItens = [...nfData.itens]
    newItens[index] = { ...newItens[index], [field]: value }
    setNfData({ ...nfData, itens: newItens })
  }

  const handleEntradaNF = () => {
    // Atualiza o estoque com os itens da NF
    const updatedProdutos = produtos.map(produto => {
      const item = nfData.itens.find(i => i.produtoId === produto.id)
      if (item) {
        return {
          ...produto,
          estoqueAtual: produto.estoqueAtual + item.quantidade,
          custoUnitario: item.custoUnitario > 0 ? item.custoUnitario : produto.custoUnitario,
        }
      }
      return produto
    })
    
    setProdutos(updatedProdutos)
    setNfData({
      fornecedor: "",
      numeroNF: "",
      dataNF: "",
      itens: [{ produtoId: null, quantidade: 0, unidade: "unid", custoUnitario: 0 }],
    })
    setIsNFModalOpen(false)
  }

  const filteredProdutos = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
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
            <p className="text-muted-foreground">Gestao completa de produtos e insumos para dedetizacao</p>
          </div>
        </div>

        <Tabs defaultValue="visualizar" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="visualizar">Visualizar Estoque</TabsTrigger>
            <TabsTrigger value="cadastrar">Cadastrar Produto</TabsTrigger>
            <TabsTrigger value="nf">Entrada de Nota Fiscal</TabsTrigger>
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
                      placeholder="Pesquisar por nome, marca, fornecedor ou categoria..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Estoque Atual</TableHead>
                        <TableHead className="text-center">Unidade</TableHead>
                        <TableHead className="text-center">Estoque Min.</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Custo Unitario</TableHead>
                        <TableHead className="text-center">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProdutos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                            Nenhum produto encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProdutos.map((produto) => {
                          const status = calcularStatus(produto.estoqueAtual, produto.estoqueMinimo)
                          return (
                            <TableRow key={produto.id} className={!produto.ativo ? "opacity-50" : ""}>
                              <TableCell className="font-medium">{produto.nome}</TableCell>
                              <TableCell>{produto.marca}</TableCell>
                              <TableCell>{produto.fornecedor}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {produto.categoria}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <EstoqueBadge quantidade={produto.estoqueAtual} status={status} />
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">
                                {produto.unidade}
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">
                                {produto.estoqueMinimo}
                              </TableCell>
                              <TableCell className="text-center">
                                <StatusBadge status={status} />
                              </TableCell>
                              <TableCell className="text-right">
                                R$ {produto.custoUnitario.toFixed(2)}
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
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Legenda de Status */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-muted-foreground">OK - Estoque acima do minimo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="text-muted-foreground">Alerta - Estoque proximo do minimo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-muted-foreground">Critico - Estoque abaixo do minimo</span>
                  </div>
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
                    ? "Atualize as informacoes do produto"
                    : "Preencha os dados do produto. A quantidade sera definida via entrada de nota fiscal."}
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
                        placeholder="Ex: Cipermetrina 25% CE"
                        value={formData.nome}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) => setFormData({ ...formData, categoria: value as Categoria })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unidade">Unidade Padrao *</Label>
                      <Select
                        value={formData.unidade}
                        onValueChange={(value) => setFormData({ ...formData, unidade: value as Unidade })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidades.map((un) => (
                            <SelectItem key={un} value={un}>
                              {un}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estoqueMinimo">Estoque Minimo *</Label>
                      <Input
                        id="estoqueMinimo"
                        name="estoqueMinimo"
                        type="number"
                        placeholder="Ex: 10"
                        value={formData.estoqueMinimo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marca">Marca *</Label>
                      <Input
                        id="marca"
                        name="marca"
                        placeholder="Ex: Bayer"
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
                        placeholder="Ex: Distribuidora Quimica SA"
                        value={formData.fornecedor}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <Label htmlFor="ativo" className="cursor-pointer">
                      Produto Ativo
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      {editingProduct ? "Salvar Alteracoes" : "Cadastrar Produto"}
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
                            categoria: "",
                            unidade: "",
                            estoqueMinimo: "",
                            ativo: true,
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

          {/* Entrada de Nota Fiscal */}
          <TabsContent value="nf">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Entrada de Nota Fiscal
                </CardTitle>
                <CardDescription>
                  Registre a entrada de produtos via nota fiscal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nf-fornecedor">Fornecedor *</Label>
                    <Select
                      value={nfData.fornecedor}
                      onValueChange={(value) => setNfData({ ...nfData, fornecedor: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedoresMock.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numeroNF">Numero da NF *</Label>
                    <Input
                      id="numeroNF"
                      placeholder="Ex: 123456"
                      value={nfData.numeroNF}
                      onChange={(e) => setNfData({ ...nfData, numeroNF: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataNF">Data da NF *</Label>
                    <Input
                      id="dataNF"
                      type="date"
                      value={nfData.dataNF}
                      onChange={(e) => setNfData({ ...nfData, dataNF: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Itens da Nota Fiscal</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItemNF}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {nfData.itens.map((item, index) => (
                      <div key={index} className="grid gap-3 md:grid-cols-5 items-end p-4 rounded-lg border bg-muted/30">
                        <div className="space-y-2 md:col-span-1">
                          <Label>Produto *</Label>
                          <Select
                            value={item.produtoId?.toString() || ""}
                            onValueChange={(value) => handleItemNFChange(index, "produtoId", parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {produtos.filter(p => p.ativo).map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Quantidade *</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.quantidade || ""}
                            onChange={(e) => handleItemNFChange(index, "quantidade", parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unidade *</Label>
                          <Select
                            value={item.unidade}
                            onValueChange={(value) => handleItemNFChange(index, "unidade", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {unidades.map((un) => (
                                <SelectItem key={un} value={un}>
                                  {un}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Custo Unitario (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={item.custoUnitario || ""}
                            onChange={(e) => handleItemNFChange(index, "custoUnitario", parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="flex justify-end">
                          {nfData.itens.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItemNF(index)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleEntradaNF}
                    disabled={!nfData.fornecedor || !nfData.numeroNF || !nfData.dataNF || nfData.itens.every(i => !i.produtoId)}
                    className="flex-1"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Dar Entrada no Estoque
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de confirmação (mantido para possível uso futuro) */}
      <Dialog open={isNFModalOpen} onOpenChange={setIsNFModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Entrada de Nota Fiscal</DialogTitle>
            <DialogDescription>
              Deseja confirmar a entrada dos itens no estoque?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNFModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEntradaNF}>
              Confirmar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
