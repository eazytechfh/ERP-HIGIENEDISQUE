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
import { Package, Plus, Search, Pencil, Trash2, FileText, X, Truck, Eye, Paperclip, Download } from 'lucide-react'
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
import { Checkbox } from "@/components/ui/checkbox"
import { ensureFlowStoreInitialized, setFlowFornecedores, setFlowProdutos } from "@/lib/flow-store"
import {
  deleteFornecedorSupabase,
  deleteNotaFiscalSupabase,
  deleteProdutoSupabase,
  getNotaFiscalArquivoUrl,
  listFornecedoresSupabase,
  listNotasFiscaisSupabase,
  listProdutosSupabase,
  type NotaFiscalHistorico,
  registrarEntradaNotaFiscalSupabase,
  upsertFornecedorSupabase,
  upsertProdutoSupabase,
} from "@/lib/supabase/estoque-repo"
import { listFinanceiroCategoriasSupabase, type FinanceiroCategoriaItem, upsertDespesaNotaFiscalSupabase } from "@/lib/supabase/financeiro-repo"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"

// Tipos
type Categoria = "Item Quimico" | "Diluente" | "Consumivel" | "Equipamentos" | "EPIs"
type Unidade = "L" | "ml" | "g" | "kg" | "unid"
type Status = "OK" | "Alerta" | "Critico"

interface Produto {
  id: string
  nome: string
  marca: string
  fornecedorId: string
  fornecedor: string
  estoqueAtual: number
  estoqueMinimo: number
  unidade: Unidade
  categoria: Categoria
  custoUnitario: number
  ativo: boolean
}

interface ItemNF {
  produtoId: string | null
  quantidade: number
  unidade: Unidade
  custoUnitario: number
}

interface Fornecedor {
  id: string
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

function isValidStringId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeProdutos(items: unknown[]): Produto[] {
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const maybeProduto = item as Partial<Produto>
    if (!isValidStringId(maybeProduto.id)) return []

    return [{
      id: maybeProduto.id,
      nome: maybeProduto.nome || "",
      marca: maybeProduto.marca || "",
      fornecedorId: maybeProduto.fornecedorId || "",
      fornecedor: maybeProduto.fornecedor || "",
      estoqueAtual: Number(maybeProduto.estoqueAtual) || 0,
      estoqueMinimo: Number(maybeProduto.estoqueMinimo) || 0,
      unidade: (maybeProduto.unidade as Unidade) || "unid",
      categoria: (maybeProduto.categoria as Categoria) || "Consumivel",
      custoUnitario: Number(maybeProduto.custoUnitario) || 0,
      ativo: Boolean(maybeProduto.ativo ?? true),
    }]
  })
}

function normalizeFornecedores(items: unknown[]): Fornecedor[] {
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const maybeFornecedor = item as Partial<Fornecedor>
    if (!isValidStringId(maybeFornecedor.id)) return []

    return [{
      id: maybeFornecedor.id,
      razaoSocial: maybeFornecedor.razaoSocial || "",
      cnpj: maybeFornecedor.cnpj || "",
      telefone: maybeFornecedor.telefone || "",
      email: maybeFornecedor.email || "",
      endereco: {
        rua: maybeFornecedor.endereco?.rua || "",
        numero: maybeFornecedor.endereco?.numero || "",
        bairro: maybeFornecedor.endereco?.bairro || "",
        cidade: maybeFornecedor.endereco?.cidade || "",
        uf: maybeFornecedor.endereco?.uf || "",
      },
      nomeContato: maybeFornecedor.nomeContato || "",
      observacoes: maybeFornecedor.observacoes || "",
      ativo: Boolean(maybeFornecedor.ativo ?? true),
    }]
  })
}

// Mock database com produtos de dedetização
const mockProdutos = [
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

const mockFornecedores = [
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown; error_description?: unknown; details?: unknown })
    if (typeof maybeMessage.message === "string") return maybeMessage.message
    if (typeof maybeMessage.error_description === "string") return maybeMessage.error_description
    if (typeof maybeMessage.details === "string") return maybeMessage.details
    try {
      return JSON.stringify(error)
    } catch {
      return "Ocorreu um erro inesperado."
    }
  }
  return "Ocorreu um erro inesperado."
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscalHistorico[]>([])
  const [notasFiscaisCount, setNotasFiscaisCount] = useState(0)
  const [notasFiscaisPage, setNotasFiscaisPage] = useState(1)
  const [loadingMaisNotas, setLoadingMaisNotas] = useState(false)
  const [categoriasDespesa, setCategoriasDespesa] = useState<FinanceiroCategoriaItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notaFiscalSelecionada, setNotaFiscalSelecionada] = useState<NotaFiscalHistorico | null>(null)
  const [nfArquivo, setNfArquivo] = useState<File | null>(null)
  const [abrindoArquivoId, setAbrindoArquivoId] = useState<string | null>(null)
  const [searchNotaFiscal, setSearchNotaFiscal] = useState("")
  const [nfError, setNfError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadEstoque() {
      try {
        const [produtosDb, fornecedoresDb, notasResult, categoriasDb] = await Promise.all([
          listProdutosSupabase(),
          listFornecedoresSupabase(),
          listNotasFiscaisSupabase(1, 50),
          listFinanceiroCategoriasSupabase("despesa"),
        ])

        if (!active) return
        setProdutos(produtosDb)
        setFornecedores(fornecedoresDb)
        setNotasFiscais(notasResult.data)
        setNotasFiscaisCount(notasResult.count)
        setNotasFiscaisPage(1)
        setCategoriasDespesa(categoriasDb.filter((item) => item.ativo))
        setLoadError(null)
      } catch (error) {
        console.error("Falha ao carregar estoque do Supabase", error)
        const store = ensureFlowStoreInitialized("operacional")
        if (!active) return
        setProdutos(Array.isArray(store.produtos) ? normalizeProdutos(store.produtos) : [])
        setFornecedores(Array.isArray(store.fornecedores) ? normalizeFornecedores(store.fornecedores) : [])
        setNotasFiscais([])
        setCategoriasDespesa([])
        setLoadError("Nao foi possivel carregar o estoque do Supabase. Exibindo dados locais, se houver.")
      } finally {
        if (active) setLoaded(true)
      }
    }

    void loadEstoque()

    return () => {
      active = false
    }
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
  const [confirmProduto, setConfirmProduto] = useState<{
    open: boolean
    tipo: "cadastrar" | "editar" | null
    warningMessage?: string
  }>({ open: false, tipo: null })
  const [isSavingProduto, setIsSavingProduto] = useState(false)
  
  // Formulário Cadastro
  const [formData, setFormData] = useState({
    nome: "",
    marca: "",
    fornecedorId: "",
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
    fornecedorId: null as string | null,
    numeroNF: "",
    dataNF: "",
    itens: [{ produtoId: null, quantidade: 0, unidade: "unid" as Unidade, custoUnitario: 0 }] as ItemNF[],
    registrarDespesa: false,
    categoriaDespesaId: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleOpenConfirmProduto = (e: React.FormEvent, tipo: "cadastrar" | "editar") => {
    e.preventDefault()
    if (!formData.categoria || !formData.unidade || !formData.fornecedorId) return

    // Verificar duplicidade de nome para novos cadastros
    let warningMessage: string | undefined
    if (tipo === "cadastrar") {
      const nomeNovo = formData.nome.trim().toLowerCase()
      const jaExiste = produtos.some((p) => p.nome.trim().toLowerCase() === nomeNovo)
      if (jaExiste) {
        warningMessage = `Já existe um item com o nome "${formData.nome}" no estoque. Verifique se não é um cadastro duplicado.`
      }
    }

    setConfirmProduto({ open: true, tipo, warningMessage })
  }

  const executeCadastrarProduto = async () => {
    if (!formData.categoria || !formData.unidade || !formData.fornecedorId) return
    setIsSavingProduto(true)
    try {
      const categoria = formData.categoria
      const unidade = formData.unidade
      const fornecedorSelecionado = fornecedores.find((f) => f.id === formData.fornecedorId)
      const novoProduto = await upsertProdutoSupabase({
        nome: formData.nome,
        marca: formData.marca,
        fornecedorId: formData.fornecedorId,
        estoqueAtual: 0,
        estoqueMinimo: parseInt(formData.estoqueMinimo) || 0,
        unidade,
        categoria,
        custoUnitario: 0,
        ativo: formData.ativo,
      })
      setProdutos([...produtos, { ...novoProduto, fornecedor: fornecedorSelecionado?.razaoSocial || novoProduto.fornecedor }])
      setFormData({ nome: "", marca: "", fornecedorId: "", categoria: "", unidade: "", estoqueMinimo: "", ativo: true })
      setConfirmProduto({ open: false, tipo: null })
    } finally {
      setIsSavingProduto(false)
    }
  }

  // kept for form onSubmit compatibility — actual save goes through confirm dialog
  const handleCadastrar = (e: React.FormEvent) => handleOpenConfirmProduto(e, "cadastrar")

  const handleEditar = (produto: Produto) => {
    setActiveTab("cadastrar")
    setEditingProduct(produto)
    setFormData({
      nome: produto.nome,
      marca: produto.marca,
      fornecedorId: produto.fornecedorId,
      categoria: produto.categoria,
      unidade: produto.unidade,
      estoqueMinimo: produto.estoqueMinimo.toString(),
      ativo: produto.ativo,
    })
  }

  const executeEditarProduto = async () => {
    if (!editingProduct || !formData.categoria || !formData.unidade || !formData.fornecedorId) return
    setIsSavingProduto(true)
    try {
      const categoria = formData.categoria
      const unidade = formData.unidade
      const produtoSalvo = await upsertProdutoSupabase({
        id: editingProduct.id,
        nome: formData.nome,
        marca: formData.marca,
        fornecedorId: formData.fornecedorId,
        estoqueAtual: editingProduct.estoqueAtual,
        estoqueMinimo: parseInt(formData.estoqueMinimo) || 0,
        unidade,
        categoria,
        custoUnitario: editingProduct.custoUnitario,
        ativo: formData.ativo,
      })
      setProdutos(produtos.map((p) => (p.id === editingProduct.id ? produtoSalvo : p)))
      setEditingProduct(null)
      setFormData({ nome: "", marca: "", fornecedorId: "", categoria: "", unidade: "", estoqueMinimo: "", ativo: true })
      setConfirmProduto({ open: false, tipo: null })
    } finally {
      setIsSavingProduto(false)
    }
  }

  // kept for form onSubmit compatibility — actual save goes through confirm dialog
  const handleSalvarEdicao = (e: React.FormEvent) => handleOpenConfirmProduto(e, "editar")

  const handleExcluir = async (id: string) => {
    await deleteProdutoSupabase(id)
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

  const handleCadastrarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fornecedorForm.razaoSocial || !fornecedorForm.cnpj || !fornecedorForm.telefone || !fornecedorForm.email) return

    const novoFornecedor = await upsertFornecedorSupabase({
      razaoSocial: fornecedorForm.razaoSocial,
      cnpj: fornecedorForm.cnpj,
      telefone: fornecedorForm.telefone,
      email: fornecedorForm.email,
      rua: fornecedorForm.rua,
      numero: fornecedorForm.numero,
      bairro: fornecedorForm.bairro,
      cidade: fornecedorForm.cidade,
      uf: fornecedorForm.uf,
      nomeContato: fornecedorForm.nomeContato,
      observacoes: fornecedorForm.observacoes,
      ativo: fornecedorForm.ativo,
    })
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

  const handleSalvarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFornecedor) return

    const fornecedorSalvo = await upsertFornecedorSupabase({
      id: editingFornecedor.id,
      razaoSocial: fornecedorForm.razaoSocial,
      cnpj: fornecedorForm.cnpj,
      telefone: fornecedorForm.telefone,
      email: fornecedorForm.email,
      rua: fornecedorForm.rua,
      numero: fornecedorForm.numero,
      bairro: fornecedorForm.bairro,
      cidade: fornecedorForm.cidade,
      uf: fornecedorForm.uf,
      nomeContato: fornecedorForm.nomeContato,
      observacoes: fornecedorForm.observacoes,
      ativo: fornecedorForm.ativo,
    })
    setFornecedores(fornecedores.map((f) => (f.id === editingFornecedor.id ? fornecedorSalvo : f)))
    resetFornecedorForm()
  }

  const handleExcluirFornecedor = async (id: string) => {
    await deleteFornecedorSupabase(id)
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

  const handleEntradaNF = async () => {
    try {
      setNfError(null)
      const itensSelecionados = nfData.itens.filter((item) => item.produtoId)
      if (itensSelecionados.length === 0) return

      await registrarEntradaNotaFiscalSupabase({
        fornecedorId: nfData.fornecedorId || "",
        numeroNF: nfData.numeroNF,
        dataNF: nfData.dataNF,
        itens: itensSelecionados.map((item) => ({
          produtoId: item.produtoId || "",
          quantidade: item.quantidade,
          unidade: item.unidade,
          custoUnitario: item.custoUnitario,
        })),
        arquivo: nfArquivo,
      })

      await Promise.all(
        itensSelecionados.map(async (item) => {
          const produtoAtual = produtos.find((produto) => produto.id === item.produtoId)
          if (!produtoAtual) return

          await upsertProdutoSupabase({
            id: produtoAtual.id,
            nome: produtoAtual.nome,
            marca: produtoAtual.marca,
            fornecedorId: produtoAtual.fornecedorId,
            estoqueAtual: produtoAtual.estoqueAtual + item.quantidade,
            estoqueMinimo: produtoAtual.estoqueMinimo,
            unidade: produtoAtual.unidade,
            categoria: produtoAtual.categoria,
            custoUnitario: item.custoUnitario > 0 ? item.custoUnitario : produtoAtual.custoUnitario,
            ativo: produtoAtual.ativo,
          })
        })
      )

      if (nfData.registrarDespesa) {
        const totalDespesa = itensSelecionados.reduce((sum, item) => sum + item.quantidade * item.custoUnitario, 0)
        if (totalDespesa > 0) {
          await upsertDespesaNotaFiscalSupabase({
            numeroDocumento: nfData.numeroNF,
            fornecedorId: nfData.fornecedorId || undefined,
            descricao: `Entrada NF ${nfData.numeroNF}`,
            categoriaId: nfData.categoriaDespesaId || undefined,
            categoria: categoriasDespesa.find((item) => item.id === nfData.categoriaDespesaId)?.nome,
            valor: totalDespesa,
            dataCompetencia: nfData.dataNF,
            dataVencimento: nfData.dataNF,
            observacoes: `Despesa gerada pela entrada da nota fiscal ${nfData.numeroNF}`,
          })
        }
      }

      const [produtosAtualizadosSalvar, notasSalvarResult] = await Promise.all([
        listProdutosSupabase(),
        listNotasFiscaisSupabase(1, 50),
      ])
      setProdutos(produtosAtualizadosSalvar)
      setNotasFiscais(notasSalvarResult.data)
      setNotasFiscaisCount(notasSalvarResult.count)
      setNotasFiscaisPage(1)
      setNfData({
        fornecedorId: null,
        numeroNF: "",
        dataNF: "",
        itens: [{ produtoId: null, quantidade: 0, unidade: "unid", custoUnitario: 0 }],
        registrarDespesa: false,
        categoriaDespesaId: "",
      })
      setNfArquivo(null)
      setIsNFModalOpen(false)
    } catch (error) {
      console.error("Falha ao registrar nota fiscal", error)
      setNfError(getErrorMessage(error))
    }
  }

  const formatFileSize = (size: number) => {
    if (!size) return "-"
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleAbrirArquivoNota = async (nota: NotaFiscalHistorico) => {
    if (!nota.arquivoStorageBucket || !nota.arquivoStoragePath) return
    try {
      setNfError(null)
      setAbrindoArquivoId(nota.id)
      const signedUrl = await getNotaFiscalArquivoUrl(nota.arquivoStorageBucket, nota.arquivoStoragePath)
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      console.error("Falha ao abrir anexo da nota", error)
      setNfError(getErrorMessage(error))
    } finally {
      setAbrindoArquivoId(null)
    }
  }

  const handleExcluirNotaFiscal = async (nota: NotaFiscalHistorico) => {
    const confirmed = window.confirm(`Excluir a nota fiscal ${nota.numeroNF} e estornar os itens no estoque?`)
    if (!confirmed) return

    try {
      setNfError(null)
      await Promise.all(
        nota.itens.map(async (item) => {
          const produtoAtual = produtos.find((produto) => produto.id === item.produtoId)
          if (!produtoAtual) return

          await upsertProdutoSupabase({
            id: produtoAtual.id,
            nome: produtoAtual.nome,
            marca: produtoAtual.marca,
            fornecedorId: produtoAtual.fornecedorId,
            estoqueAtual: Math.max(0, produtoAtual.estoqueAtual - item.quantidade),
            estoqueMinimo: produtoAtual.estoqueMinimo,
            unidade: produtoAtual.unidade,
            categoria: produtoAtual.categoria,
            custoUnitario: produtoAtual.custoUnitario,
            ativo: produtoAtual.ativo,
          })
        })
      )

      await deleteNotaFiscalSupabase(
        nota.id,
        nota.arquivoStorageBucket && nota.arquivoStoragePath
          ? { bucket: nota.arquivoStorageBucket, path: nota.arquivoStoragePath }
          : null,
      )

      const [produtosAtualizados, notasExcluirResult] = await Promise.all([
        listProdutosSupabase(),
        listNotasFiscaisSupabase(1, 50),
      ])

      setProdutos(produtosAtualizados)
      setNotasFiscais(notasExcluirResult.data)
      setNotasFiscaisCount(notasExcluirResult.count)
      setNotasFiscaisPage(1)

      if (notaFiscalSelecionada?.id === nota.id) {
        setNotaFiscalSelecionada(null)
      }
    } catch (error) {
      console.error("Falha ao excluir nota fiscal", error)
      setNfError(getErrorMessage(error))
    }
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

  async function handleCarregarMaisNotas() {
    setLoadingMaisNotas(true)
    try {
      const proximaPagina = notasFiscaisPage + 1
      const result = await listNotasFiscaisSupabase(proximaPagina, 50)
      setNotasFiscais((prev) => [...prev, ...result.data])
      setNotasFiscaisCount(result.count)
      setNotasFiscaisPage(proximaPagina)
    } finally {
      setLoadingMaisNotas(false)
    }
  }

  const filteredNotasFiscais = notasFiscais.filter((nota) => {
    const term = searchNotaFiscal.trim().toLowerCase()
    if (!term) return true
    return (
      nota.numeroNF.toLowerCase().includes(term) ||
      nota.fornecedor.toLowerCase().includes(term) ||
      nota.dataNF.toLowerCase().includes(term) ||
      nota.arquivoNome.toLowerCase().includes(term)
    )
  })

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

        {loadError ? (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError}
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex h-auto flex-wrap gap-1 bg-muted p-1">
            <TabsTrigger value="visualizar">Visualizar Estoque</TabsTrigger>
            <TabsTrigger value="quimicos">Produtos Químicos</TabsTrigger>
            <TabsTrigger value="cadastrar">Cadastrar Item</TabsTrigger>
            <TabsTrigger value="nf">Entrada de Nota Fiscal</TabsTrigger>
            <TabsTrigger value="fornecedor">Cadastro de Fornecedor</TabsTrigger>
          </TabsList>

          {/* Visualizar Estoque */}
          <TabsContent value="visualizar" className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Itens em Estoque</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todos os itens cadastrados
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent whitespace-nowrap shrink-0"
                  onClick={() => {
                    const cabecalho = ["Nome", "Marca", "Fornecedor", "Categoria", "Estoque Atual", "Unidade", "Estoque Min.", "Status", "Custo Unitario (R$)", "Ativo"]
                    const linhas = filteredProdutos.map((p) => {
                      const status = calcularStatus(p.estoqueAtual, p.estoqueMinimo)
                      return [p.nome, p.marca, p.fornecedor, p.categoria, p.estoqueAtual, p.unidade, p.estoqueMinimo, status, p.custoUnitario.toFixed(2), p.ativo ? "Sim" : "Nao"]
                        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
                    })
                    const csv = [cabecalho.join(","), ...linhas].join("\n")
                    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `estoque-${new Date().toISOString().slice(0, 10)}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  <Download className="h-4 w-4" />
                  Exportar Estoque
                </Button>
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

          {/* Produtos Químicos */}
          <TabsContent value="quimicos" className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Produtos Químicos</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todos os produtos químicos (inseticidas, raticidas, diluentes e similares)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent whitespace-nowrap shrink-0"
                  onClick={() => {
                    setFormData((f) => ({ ...f, categoria: "Item Quimico" }))
                    setActiveTab("cadastrar")
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Químico
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome ou marca..."
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
                        <TableHead className="text-center">Estoque Atual</TableHead>
                        <TableHead className="text-center">Unidade</TableHead>
                        <TableHead className="text-center">Estoque Min.</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Custo Unitario</TableHead>
                        <TableHead className="text-center">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtos.filter(
                        (p) => p.categoria === "Item Quimico" &&
                          (p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            Nenhum produto químico cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        produtos.filter(
                          (p) => p.categoria === "Item Quimico" &&
                            (p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()))
                        ).map((produto) => {
                          const status = calcularStatus(produto.estoqueAtual, produto.estoqueMinimo)
                          return (
                            <TableRow key={produto.id} className={!produto.ativo ? "opacity-50" : ""}>
                              <TableCell className="font-medium">{produto.nome}</TableCell>
                              <TableCell>{produto.marca}</TableCell>
                              <TableCell>{produto.fornecedor}</TableCell>
                              <TableCell className="text-center">
                                <EstoqueBadge quantidade={produto.estoqueAtual} status={status} />
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">{produto.unidade}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{produto.estoqueMinimo}</TableCell>
                              <TableCell className="text-center">
                                <StatusBadge status={status} />
                              </TableCell>
                              <TableCell className="text-right">R$ {produto.custoUnitario.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditar(produto)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleExcluir(produto.id)}>
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
                        value={formData.fornecedorId}
                        onValueChange={(value) => setFormData({ ...formData, fornecedorId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {fornecedores.filter(f => f.ativo).map((fornecedor) => (
                            <SelectItem key={fornecedor.id} value={fornecedor.id}>
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
                    <Button type="submit" className="flex-1" disabled={isSavingProduto}>
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
                            fornecedorId: "",
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
          <TabsContent value="nf" className="space-y-6">
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
                {nfError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {nfError}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nf-fornecedor">Fornecedor *</Label>
                    <Select
                      value={nfData.fornecedorId || ""}
                      onValueChange={(value) => setNfData({ ...nfData, fornecedorId: value })}
                      disabled={fornecedoresAtivos.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={fornecedoresAtivos.length === 0 ? "Cadastre um fornecedor primeiro" : "Selecione o fornecedor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedoresAtivos.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="arquivoNF">Anexo da Nota</Label>
                    <Input
                      id="arquivoNF"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.xml"
                      onChange={(e) => setNfArquivo(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Aceita PDF, imagem ou XML da nota fiscal.
                    </p>
                  </div>
                  <div className="rounded-md border border-dashed p-4 text-sm">
                    {nfArquivo ? (
                      <div className="space-y-1">
                        <p className="font-medium">{nfArquivo.name}</p>
                        <p className="text-muted-foreground">{formatFileSize(nfArquivo.size)}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum arquivo anexado para esta entrada.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Cadastrar despesa no fluxo de caixa?</p>
                      <p className="text-sm text-muted-foreground">Ao marcar, a entrada da NF tambem cria uma despesa financeira vinculada.</p>
                    </div>
                    <Checkbox
                      checked={nfData.registrarDespesa}
                      onCheckedChange={(checked) => setNfData({ ...nfData, registrarDespesa: checked === true })}
                    />
                  </div>

                  {nfData.registrarDespesa ? (
                    <div className="space-y-2">
                      <Label>Categoria de despesa</Label>
                      <Select
                        value={nfData.categoriaDespesaId || "__none__"}
                        onValueChange={(value) => setNfData({ ...nfData, categoriaDespesaId: value === "__none__" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sem categoria</SelectItem>
                          {categoriasDespesa.map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
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
                            value={item.produtoId || ""}
                            onValueChange={(value) => handleItemNFChange(index, "produtoId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {produtos.filter((p) => p.ativo).map((p) => (
                                <SelectItem key={p.id} value={p.id}>
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

            <Card>
              <CardHeader>
                <CardTitle>Notas Fiscais Anteriores</CardTitle>
                <CardDescription>
                  Consulte entradas anteriores e abra o anexo salvo quando precisar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por numero, fornecedor, data ou nome do anexo..."
                      className="pl-10"
                      value={searchNotaFiscal}
                      onChange={(e) => setSearchNotaFiscal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numero</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Anexo</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotasFiscais.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            Nenhuma nota fiscal encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredNotasFiscais.map((nota) => (
                          <TableRow key={nota.id}>
                            <TableCell className="font-medium">{nota.numeroNF}</TableCell>
                            <TableCell>{nota.dataNF}</TableCell>
                            <TableCell>{nota.fornecedor}</TableCell>
                            <TableCell>{nota.itens.length}</TableCell>
                            <TableCell>
                              {nota.arquivoNome ? (
                                <span className="inline-flex items-center gap-2 text-sm">
                                  <Paperclip className="h-4 w-4" />
                                  {nota.arquivoNome}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Sem anexo</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setNotaFiscalSelecionada(nota)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver nota
                                </Button>
                                {nota.arquivoStoragePath ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => void handleAbrirArquivoNota(nota)}
                                    disabled={abrindoArquivoId === nota.id}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    {abrindoArquivoId === nota.id ? "Abrindo..." : "Abrir anexo"}
                                  </Button>
                                ) : null}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void handleExcluirNotaFiscal(nota)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {notasFiscais.length < notasFiscaisCount && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleCarregarMaisNotas()}
                        disabled={loadingMaisNotas}
                      >
                        {loadingMaisNotas ? "Carregando..." : `Carregar mais (${notasFiscais.length} de ${notasFiscaisCount})`}
                      </Button>
                    </div>
                  )}
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
      <Dialog open={Boolean(notaFiscalSelecionada)} onOpenChange={(open) => !open && setNotaFiscalSelecionada(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nota Fiscal {notaFiscalSelecionada?.numeroNF || ""}</DialogTitle>
            <DialogDescription>
              {notaFiscalSelecionada ? `${notaFiscalSelecionada.fornecedor} • ${notaFiscalSelecionada.dataNF}` : ""}
            </DialogDescription>
          </DialogHeader>
          {notaFiscalSelecionada ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">Fornecedor</p>
                  <p className="text-muted-foreground">{notaFiscalSelecionada.fornecedor}</p>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">Anexo</p>
                  {notaFiscalSelecionada.arquivoNome ? (
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        {notaFiscalSelecionada.arquivoNome} • {formatFileSize(notaFiscalSelecionada.arquivoTamanho)}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleAbrirArquivoNota(notaFiscalSelecionada)}
                        disabled={abrindoArquivoId === notaFiscalSelecionada.id}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {abrindoArquivoId === notaFiscalSelecionada.id ? "Abrindo..." : "Visualizar anexo"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum anexo salvo para esta nota.</p>
                  )}
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Custo Unitario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notaFiscalSelecionada.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.produtoNome}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell>{item.unidade}</TableCell>
                        <TableCell className="text-right">R$ {item.custoUnitario.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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

      {/* Diálogo de confirmação de produto/fornecedor */}
      <ConfirmActionDialog
        open={confirmProduto.open}
        title={
          confirmProduto.tipo === "editar"
            ? "Confirmar edição do item"
            : "Confirmar cadastro do item"
        }
        description="Revise os dados antes de salvar."
        details={[
          { label: "Nome", value: formData.nome || "" },
          { label: "Categoria", value: formData.categoria || "" },
          { label: "Unidade", value: formData.unidade || "" },
          { label: "Estoque mínimo", value: formData.estoqueMinimo ? `${formData.estoqueMinimo} unid.` : "0 unid." },
          { label: "Fornecedor", value: fornecedores.find((f) => f.id === formData.fornecedorId)?.razaoSocial || "" },
        ]}
        warningMessage={confirmProduto.warningMessage}
        confirmLabel={isSavingProduto ? "Salvando..." : "Confirmar"}
        isLoading={isSavingProduto}
        onConfirm={() => {
          if (confirmProduto.tipo === "editar") {
            void executeEditarProduto()
          } else {
            void executeCadastrarProduto()
          }
        }}
        onCancel={() => setConfirmProduto({ open: false, tipo: null })}
      />
    </div>
  )
}











