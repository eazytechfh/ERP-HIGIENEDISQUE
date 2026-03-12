"use client"

import { ErpHeader } from "@/components/erp-header"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Package, Plus, Search, Pencil, Trash2, FileText, X, Truck } from 'lucide-react'
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
import { Textarea } from "@/components/ui/textarea"
import { ensureFlowStoreInitialized, setFlowFornecedores, setFlowProdutos } from "@/lib/flow-store"

// Tipos
type Categoria = "Item Quimico" | "Diluente" | "Consumivel" | "Equipamentos" | "EPIs"
type Unidade = "L" | "ml" | "g" | "kg" | "unid"
type Status = "OK" | "Alerta" | "Critico"

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

interface Fornecedor {
  id: number
  razaoSocial: string
  cnpj: string
  telefone: string
  email: string
  endereco: {
    rua: string
    numero: string
    bairro: string
    cidade: string
    uf: string
  }
  nomeContato: string
  observacoes: string
  ativo: boolean
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
    categoria: "Item Quimico",
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
    categoria: "Item Quimico",
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
    categoria: "Item Quimico",
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
    categoria: "Item Quimico",
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
    categoria: "EPIs",
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
    categoria: "EPIs",
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
    categoria: "Consumivel",
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
    categoria: "Consumivel",
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
    categoria: "Item Quimico",
    custoUnitario: 320.00,
    ativo: true,
  },
]

const categorias: Categoria[] = ["Item Quimico", "Diluente", "Consumivel", "Equipamentos", "EPIs"]
const unidades: Unidade[] = ["L", "ml", "g", "kg", "unid"]
const ufs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]

const mockFornecedores: Fornecedor[] = [
  {
    id: 1,
    razaoSocial: "Distribuidora Quimica SA",
    cnpj: "12.345.678/0001-90",
    telefone: "(11) 3456-7890",
    email: "contato@distquimica.com.br",
    endereco: {
      rua: "Av. Industrial",
      numero: "1500",
      bairro: "Distrito Industrial",
      cidade: "Sao Paulo",
      uf: "SP",
    },
    nomeContato: "Carlos Silva",
    observacoes: "Fornecedor principal de inseticidas",
    ativo: true,
  },
  {
    id: 2,
    razaoSocial: "EPI Center Equipamentos Ltda",
    cnpj: "98.765.432/0001-10",
    telefone: "(21) 2222-3333",
    email: "vendas@epicenter.com.br",
    endereco: {
      rua: "Rua da Seguranca",
      numero: "250",
      bairro: "Centro",
      cidade: "Rio de Janeiro",
      uf: "RJ",
    },
    nomeContato: "Ana Costa",
    observacoes: "Especializado em EPIs e equipamentos de seguranca",
    ativo: true,
  },
  {
    id: 3,
    razaoSocial: "Agro Pecas e Equipamentos Ltda",
    cnpj: "45.678.901/0001-23",
    telefone: "(19) 3344-5566",
    email: "comercial@agropecas.com.br",
    endereco: {
      rua: "Rod. Campinas",
      numero: "KM 45",
      bairro: "Zona Rural",
      cidade: "Campinas",
      uf: "SP",
    },
    nomeContato: "Roberto Almeida",
    observacoes: "Pulverizadores e equipamentos agricolas",
    ativo: true,
  },
]

function calcularStatus(estoqueAtual: number, estoqueMinimo: number): Status {
  if (estoqueAtual < estoqueMinimo) return "Critico"
  if (estoqueAtual <= estoqueMinimo * 1.2) return "Alerta"
  return "OK"
}

function StatusBadge({ status }: { status: Status }) {
  const styles = {
    OK: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Alerta: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Critico: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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
    Critico: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }
  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium ${styles[status]}`}>
      {quantidade}
    </span>
  )
}

// Mascaras de formatacao
function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const store = ensureFlowStoreInitialized("operacional")
    setProdutos(Array.isArray(store.produtos) ? (store.produtos as Produto[]) : [])
    setFornecedores(Array.isArray(store.fornecedores) ? (store.fornecedores as Fornecedor[]) : [])
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    setFlowProdutos(produtos as any[])
  }, [produtos, loaded])

  useEffect(() => {
    if (!loaded) return
    setFlowFornecedores(fornecedores as any[])
  }, [fornecedores, loaded])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("visualizar")
  const [searchFornecedor, setSearchFornecedor] = useState("")
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
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

  // Formulário Fornecedor
  const [fornecedorForm, setFornecedorForm] = useState({
    razaoSocial: "",
    cnpj: "",
    telefone: "",
    email: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    nomeContato: "",
    observacoes: "",
    ativo: true,
  })

  // Formulário Nota Fiscal
  const [nfData, setNfData] = useState({
    fornecedorId: null as number | null,
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
    const categoria = formData.categoria
    const unidade = formData.unidade
    
    const novoProduto: Produto = {
      id: Math.max(...produtos.map(p => p.id)) + 1,
      nome: formData.nome,
      marca: formData.marca,
      fornecedor: formData.fornecedor,
      estoqueAtual: 0, // Estoque começa zerado
      estoqueMinimo: parseInt(formData.estoqueMinimo) || 0,
      unidade,
      categoria,
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
    setActiveTab("cadastrar")
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
    const categoria = formData.categoria
    const unidade = formData.unidade
    
    setProdutos(
      produtos.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              nome: formData.nome,
              marca: formData.marca,
              fornecedor: formData.fornecedor,
              categoria,
              unidade,
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

  // Fornecedor handlers
  const resetFornecedorForm = () => {
    setFornecedorForm({
      razaoSocial: "",
      cnpj: "",
      telefone: "",
      email: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
      nomeContato: "",
      observacoes: "",
      ativo: true,
    })
    setEditingFornecedor(null)
  }

  const handleCadastrarFornecedor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fornecedorForm.razaoSocial || !fornecedorForm.cnpj || !fornecedorForm.telefone || !fornecedorForm.email) return

    const novoFornecedor: Fornecedor = {
      id: Math.max(0, ...fornecedores.map(f => f.id)) + 1,
      razaoSocial: fornecedorForm.razaoSocial,
      cnpj: fornecedorForm.cnpj,
      telefone: fornecedorForm.telefone,
      email: fornecedorForm.email,
      endereco: {
        rua: fornecedorForm.rua,
        numero: fornecedorForm.numero,
        bairro: fornecedorForm.bairro,
        cidade: fornecedorForm.cidade,
        uf: fornecedorForm.uf,
      },
      nomeContato: fornecedorForm.nomeContato,
      observacoes: fornecedorForm.observacoes,
      ativo: fornecedorForm.ativo,
    }
    setFornecedores([...fornecedores, novoFornecedor])
    resetFornecedorForm()
  }

  const handleEditarFornecedor = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor)
    setFornecedorForm({
      razaoSocial: fornecedor.razaoSocial,
      cnpj: fornecedor.cnpj,
      telefone: fornecedor.telefone,
      email: fornecedor.email,
      rua: fornecedor.endereco.rua,
      numero: fornecedor.endereco.numero,
      bairro: fornecedor.endereco.bairro,
      cidade: fornecedor.endereco.cidade,
      uf: fornecedor.endereco.uf,
      nomeContato: fornecedor.nomeContato,
      observacoes: fornecedor.observacoes,
      ativo: fornecedor.ativo,
    })
  }

  const handleSalvarFornecedor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFornecedor) return

    setFornecedores(
      fornecedores.map((f) =>
        f.id === editingFornecedor.id
          ? {
              ...f,
              razaoSocial: fornecedorForm.razaoSocial,
              cnpj: fornecedorForm.cnpj,
              telefone: fornecedorForm.telefone,
              email: fornecedorForm.email,
              endereco: {
                rua: fornecedorForm.rua,
                numero: fornecedorForm.numero,
                bairro: fornecedorForm.bairro,
                cidade: fornecedorForm.cidade,
                uf: fornecedorForm.uf,
              },
              nomeContato: fornecedorForm.nomeContato,
              observacoes: fornecedorForm.observacoes,
              ativo: fornecedorForm.ativo,
            }
          : f
      )
    )
    resetFornecedorForm()
  }

  const handleExcluirFornecedor = (id: number) => {
    setFornecedores(fornecedores.filter((f) => f.id !== id))
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
      fornecedorId: null,
      numeroNF: "",
      dataNF: "",
      itens: [{ produtoId: null, quantidade: 0, unidade: "unid", custoUnitario: 0 }],
    })
    setIsNFModalOpen(false)
  }

  const filteredFornecedores = fornecedores.filter(
    (f) =>
      f.razaoSocial.toLowerCase().includes(searchFornecedor.toLowerCase()) ||
      f.cnpj.includes(searchFornecedor) ||
      f.telefone.includes(searchFornecedor) ||
      f.email.toLowerCase().includes(searchFornecedor.toLowerCase()) ||
      f.nomeContato.toLowerCase().includes(searchFornecedor.toLowerCase())
  )

  const fornecedoresAtivos = fornecedores.filter(f => f.ativo)

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
            <p className="text-muted-foreground">Gestao completa de itens e insumos para dedetizacao</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="visualizar">Visualizar Estoque</TabsTrigger>
            <TabsTrigger value="cadastrar">Cadastrar Item</TabsTrigger>
            <TabsTrigger value="nf">Entrada de Nota Fiscal</TabsTrigger>
            <TabsTrigger value="fornecedor">Cadastro de Fornecedor</TabsTrigger>
          </TabsList>

          {/* Visualizar Estoque */}
          <TabsContent value="visualizar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Itens em Estoque</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os itens cadastrados
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
                            Nenhum item encontrado
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

          {/* Cadastrar Item */}
          <TabsContent value="cadastrar">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingProduct ? "Editar Item" : "Cadastrar Novo Item"}
                </CardTitle>
                <CardDescription>
                  {editingProduct
                    ? "Atualize as informacoes do item"
                    : "Preencha os dados do item. A quantidade sera definida via entrada de nota fiscal."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingProduct ? handleSalvarEdicao : handleCadastrar} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do Item *</Label>
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
                      <Select
                        value={formData.fornecedor}
                        onValueChange={(value) => setFormData({ ...formData, fornecedor: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {fornecedores.filter(f => f.ativo).map((fornecedor) => (
                            <SelectItem key={fornecedor.id} value={fornecedor.razaoSocial}>
                              {fornecedor.razaoSocial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <Label htmlFor="ativo" className="cursor-pointer">
                      Item Ativo
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      {editingProduct ? "Salvar Alteracoes" : "Cadastrar Item"}
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
                  Registre a entrada de itens via nota fiscal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nf-fornecedor">Fornecedor *</Label>
                    <Select
                      value={nfData.fornecedorId?.toString() || ""}
                      onValueChange={(value) => setNfData({ ...nfData, fornecedorId: parseInt(value) })}
                      disabled={fornecedoresAtivos.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={fornecedoresAtivos.length === 0 ? "Cadastre um fornecedor primeiro" : "Selecione o fornecedor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedoresAtivos.map((f) => (
                          <SelectItem key={f.id} value={f.id.toString()}>
                            {f.razaoSocial}
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
                          <Label>Item *</Label>
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
                    disabled={!nfData.fornecedorId || !nfData.numeroNF || !nfData.dataNF || nfData.itens.every(i => !i.produtoId)}
                    className="flex-1"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Dar Entrada no Estoque
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cadastro de Fornecedor */}
          <TabsContent value="fornecedor" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulário de Cadastro */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {editingFornecedor ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}
                  </CardTitle>
                  <CardDescription>
                    {editingFornecedor
                      ? "Atualize as informacoes do fornecedor"
                      : "Preencha os dados do fornecedor"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={editingFornecedor ? handleSalvarFornecedor : handleCadastrarFornecedor} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="razaoSocial">Razao Social *</Label>
                        <Input
                          id="razaoSocial"
                          placeholder="Ex: Distribuidora Quimica SA"
                          value={fornecedorForm.razaoSocial}
                          onChange={(e) => setFornecedorForm({ ...fornecedorForm, razaoSocial: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ *</Label>
                        <Input
                          id="cnpj"
                          placeholder="00.000.000/0000-00"
                          value={fornecedorForm.cnpj}
                          onChange={(e) => setFornecedorForm({ ...fornecedorForm, cnpj: formatCNPJ(e.target.value) })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone *</Label>
                        <Input
                          id="telefone"
                          placeholder="(00) 00000-0000"
                          value={fornecedorForm.telefone}
                          onChange={(e) => setFornecedorForm({ ...fornecedorForm, telefone: formatTelefone(e.target.value) })}
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contato@empresa.com.br"
                          value={fornecedorForm.email}
                          onChange={(e) => setFornecedorForm({ ...fornecedorForm, email: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nomeContato">Nome do Contato</Label>
                        <Input
                          id="nomeContato"
                          placeholder="Ex: Joao Silva"
                          value={fornecedorForm.nomeContato}
                          onChange={(e) => setFornecedorForm({ ...fornecedorForm, nomeContato: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="pt-4 border-t">
                      <Label className="text-base font-semibold mb-3 block">Endereco</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="rua">Rua/Avenida</Label>
                          <Input
                            id="rua"
                            placeholder="Ex: Av. Industrial"
                            value={fornecedorForm.rua}
                            onChange={(e) => setFornecedorForm({ ...fornecedorForm, rua: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="numero">Numero</Label>
                          <Input
                            id="numero"
                            placeholder="Ex: 1500"
                            value={fornecedorForm.numero}
                            onChange={(e) => setFornecedorForm({ ...fornecedorForm, numero: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bairro">Bairro</Label>
                          <Input
                            id="bairro"
                            placeholder="Ex: Centro"
                            value={fornecedorForm.bairro}
                            onChange={(e) => setFornecedorForm({ ...fornecedorForm, bairro: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input
                            id="cidade"
                            placeholder="Ex: Sao Paulo"
                            value={fornecedorForm.cidade}
                            onChange={(e) => setFornecedorForm({ ...fornecedorForm, cidade: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="uf">UF</Label>
                          <Select
                            value={fornecedorForm.uf}
                            onValueChange={(value) => setFornecedorForm({ ...fornecedorForm, uf: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {ufs.map((uf) => (
                                <SelectItem key={uf} value={uf}>
                                  {uf}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observacoes</Label>
                      <Textarea
                        id="observacoes"
                        placeholder="Informacoes adicionais sobre o fornecedor..."
                        value={fornecedorForm.observacoes}
                        onChange={(e) => setFornecedorForm({ ...fornecedorForm, observacoes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Switch
                        id="fornecedor-ativo"
                        checked={fornecedorForm.ativo}
                        onCheckedChange={(checked) => setFornecedorForm({ ...fornecedorForm, ativo: checked })}
                      />
                      <Label htmlFor="fornecedor-ativo" className="cursor-pointer">
                        Fornecedor Ativo
                      </Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        {editingFornecedor ? "Salvar Alteracoes" : "Cadastrar Fornecedor"}
                      </Button>
                      {editingFornecedor && (
                        <Button type="button" variant="outline" onClick={resetFornecedorForm}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Fornecedores */}
              <Card>
                <CardHeader>
                  <CardTitle>Fornecedores Cadastrados</CardTitle>
                  <CardDescription>
                    {fornecedores.length} fornecedor(es) cadastrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar por razao social, CNPJ, telefone ou e-mail..."
                        className="pl-10"
                        value={searchFornecedor}
                        onChange={(e) => setSearchFornecedor(e.target.value)}
                      />
                    </div>
                  </div>

                                    <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Acoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFornecedores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Nenhum fornecedor encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredFornecedores.map((fornecedor) => (
                            <TableRow key={fornecedor.id} className={!fornecedor.ativo ? "opacity-60" : ""}>
                              <TableCell className="font-medium">{fornecedor.razaoSocial}</TableCell>
                              <TableCell>{fornecedor.cnpj}</TableCell>
                              <TableCell>{fornecedor.nomeContato || "-"}</TableCell>
                              <TableCell>{fornecedor.telefone}</TableCell>
                              <TableCell>{fornecedor.email}</TableCell>
                              <TableCell>
                                <Badge variant={fornecedor.ativo ? "default" : "secondary"}>
                                  {fornecedor.ativo ? "Ativo" : "Inativo"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditarFornecedor(fornecedor)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleExcluirFornecedor(fornecedor.id)}>
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
            </div>
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











