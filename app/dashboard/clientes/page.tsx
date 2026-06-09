"use client"

import { ErpHeader } from "@/components/erp-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Building2, FileText, Upload, ChevronRight, Home, Save, X, Download, Eye
} from 'lucide-react'
import { ConfirmActionDialog, type ConfirmDetailItem } from "@/components/ui/confirm-action-dialog"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ensureFlowStoreInitialized, loadFlowContratos, saveFlowContratos, setFlowClientes } from "@/lib/flow-store"
import { isApiMode } from "@/lib/runtime-config"
import { deleteClienteSupabase, getClienteSupabase, listClientesSupabase, upsertClienteSupabase, type ClienteInput } from "@/lib/supabase/clientes-repo"
import { listContratosSupabase, type ContratoSupabaseItem } from "@/lib/supabase/contratos-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

// Types
type TipoCliente = "pf" | "pj"
type StatusCliente = "Ativo" | "Inativo" | "Suspenso"
type TipoContrato = "Recorrente" | "Avulso" | ""
type SituacaoContrato = "Em dia" | "A vencer" | "Vencido" | ""
type FiltroContrato = "todos" | "com_contrato" | "sem_contrato" | "em_dia" | "a_vencer" | "vencido"

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

type ClienteArquivo = {
  id: string
  nome: string
  mimeType: string
  conteudoBase64: string
  criadoEm: string
  tamanho?: number
  origem?: string
  contratoId?: string
  storageBucket?: string
  storagePath?: string
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
  arquivos: ClienteArquivo[]
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
  const [contractFilter, setContractFilter] = useState<FiltroContrato>("todos")
  const [statusFilter, setStatusFilter] = useState<StatusCliente | "todos">("todos")
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contratosSupabase, setContratosSupabase] = useState<ContratoSupabaseItem[]>([])
  const [clientesLoaded, setClientesLoaded] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [isSavingCliente, setIsSavingCliente] = useState(false)
  const [confirmCliente, setConfirmCliente] = useState<{
    open: boolean
    action: "salvar" | "contrato" | "servico" | null
    details: ConfirmDetailItem[]
    warningMessage?: string
  }>({ open: false, action: null, details: [] })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingPage, setIsLoadingPage] = useState(false)
  const PAGE_SIZE = 20
  const apiMode = isApiMode()

  const loadClientes = useCallback(async (page: number, search: string, status: string) => {
    if (!apiMode) return
    setIsLoadingPage(true)
    setLoadError("")
    try {
      const [clientesResult, contratosResult] = await Promise.allSettled([
        listClientesSupabase({ page, pageSize: PAGE_SIZE, search: search || undefined, status }),
        listContratosSupabase(),
      ])

      let clientesList: Cliente[] = []
      let clientesCount = 0

      if (clientesResult.status === "fulfilled") {
        clientesList = clientesResult.value.data as Cliente[]
        clientesCount = clientesResult.value.count
      } else {
        console.error("Falha ao carregar clientes no Supabase", clientesResult.reason)
        setLoadError("Nao foi possivel carregar os clientes do Supabase para este usuario.")
      }

      let contratos: ContratoSupabaseItem[] = []
      if (contratosResult.status === "fulfilled") {
        contratos = contratosResult.value
        setContratosSupabase(contratos)
      } else {
        setContratosSupabase([])
      }

      // Se há busca e nenhum cliente foi encontrado pelo servidor, tenta por número de contrato
      if (search && clientesList.length === 0 && contratos.length > 0) {
        const term = search.toLowerCase()
        const clienteIdsComContrato = contratos
          .filter((c) => c.numero.toLowerCase().includes(term))
          .map((c) => c.clienteId)
          .filter(Boolean)

        if (clienteIdsComContrato.length > 0) {
          const porContratoResult = await listClientesSupabase({ pageSize: 9999, status })
          const clientesPorContrato = (porContratoResult.data as Cliente[]).filter((c) =>
            clienteIdsComContrato.includes(String(c.id))
          )
          clientesList = clientesPorContrato
          clientesCount = clientesPorContrato.length
        }
      }

      setClientes(clientesList)
      setTotalCount(clientesCount)
    } finally {
      setIsLoadingPage(false)
      setClientesLoaded(true)
    }
  }, [apiMode])

  // Carga inicial (modo local)
  useEffect(() => {
    if (apiMode) return
    const store = ensureFlowStoreInitialized("operacional")
    setClientes(Array.isArray(store.clientes) ? (store.clientes as Cliente[]) : [])
    setContratosSupabase([])
    setClientesLoaded(true)
  }, [apiMode])

  // Carga paginada com debounce na busca
  useEffect(() => {
    if (!apiMode) return
    const timer = setTimeout(() => {
      setCurrentPage(1)
      loadClientes(1, searchTerm, statusFilter)
    }, searchTerm ? 400 : 0)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, apiMode])

  const searchTermRef = useRef(searchTerm)
  const statusFilterRef = useRef(statusFilter)
  useEffect(() => { searchTermRef.current = searchTerm }, [searchTerm])
  useEffect(() => { statusFilterRef.current = statusFilter }, [statusFilter])

  useEffect(() => {
    if (!apiMode || !clientesLoaded) return
    loadClientes(currentPage, searchTermRef.current, statusFilterRef.current)
  }, [currentPage])

  useEffect(() => {
    if (!clientesLoaded || apiMode) return
    setFlowClientes(clientes as any[])
  }, [clientes, clientesLoaded, apiMode])

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
  if (formData.tipoCliente === "pj" && !formData.cnpj.trim()) return false
  
  return true
}

const handleOpenConfirmCliente = (action: "salvar" | "contrato" | "servico") => {
  if (!isFormValid()) {
    alert("Por favor, preencha todos os campos obrigatorios: Nome, Telefone, E-mail e CNPJ (para Pessoa Juridica)")
    return
  }

  const docValue = formData.tipoCliente === "pj"
    ? (formData.cnpj?.trim() || "")
    : (formData.cpf?.trim() || "")

  // Verificar duplicidade por CNPJ/CPF (apenas para novos registros)
  let warningMessage: string | undefined
  if (!editingClient && docValue) {
    const jaExiste = clientes.some((c) => {
      const docExistente = (c as any).cnpj?.trim() || (c as any).cpf?.trim() || ""
      return docExistente && docExistente === docValue
    })
    if (jaExiste) {
      warningMessage = `Já existe um cliente cadastrado com o documento "${docValue}". Verifique se não é um cadastro duplicado.`
    }
  }

  const actionLabels = {
    salvar: "Salvar cliente",
    contrato: "Salvar e criar contrato",
    servico: "Salvar e criar serviço",
  }

  setConfirmCliente({
    open: true,
    action,
    warningMessage,
    details: [
      { label: "Nome", value: formData.nome || "" },
      { label: "Tipo", value: formData.tipoCliente === "pj" ? "Pessoa Jurídica" : "Pessoa Física" },
      ...(docValue ? [{ label: formData.tipoCliente === "pj" ? "CNPJ" : "CPF", value: docValue }] : []),
      { label: "Telefone", value: formData.telefone || "" },
      { label: "E-mail", value: formData.email || "" },
      { label: "Ação", value: actionLabels[action] },
    ],
  })
}

const handleSubmit = async (action: "salvar" | "contrato" | "servico") => {
  if (!isFormValid()) {
    alert("Por favor, preencha todos os campos obrigatorios: Nome, Telefone, E-mail e CNPJ (para Pessoa Juridica)")
    return
  }

  setIsSavingCliente(true)

  try {
    let clienteId: string

    if (apiMode) {
      const payload: ClienteInput = {
        ...(formData as ClienteInput),
        id: editingClient?.id,
      }

      const saved = await upsertClienteSupabase(payload)
      const savedCliente = saved as Cliente

      setClientes((prev) => {
        if (editingClient?.id) {
          return prev.map((c) => (c.id === editingClient.id ? savedCliente : c))
        }
        return [savedCliente, ...prev]
      })

      clienteId = String(saved.id)
      setEditingClient(null)
    } else {
      if (editingClient) {
        setClientes((prev) => prev.map((c) => (c.id === editingClient.id ? { ...formData, id: editingClient.id } : c)))
        clienteId = editingClient.id
        setEditingClient(null)
      } else {
        clienteId = Date.now().toString()
        const novoCliente: Cliente = {
          id: clienteId,
          ...formData,
        }
        setClientes((prev) => [...prev, novoCliente])
      }
    }

    setFormData(clienteInicial)

    if (action === "salvar") {
      setActiveTab("consultar")
    } else if (action === "contrato") {
      router.push(`/dashboard/clientes/contratos?clienteId=${clienteId}`)
    } else if (action === "servico") {
      router.push(`/dashboard/servicos?clienteId=${clienteId}`)
    }
  } catch (error) {
    console.error("Falha ao salvar cliente", error)
    alert("Falha ao salvar cliente. Verifique permiss?es/perfil e tente novamente.")
  } finally {
    setIsSavingCliente(false)
  }
}

  const handleEdit = async (cliente: Cliente) => {
    if (apiMode) {
      try {
        const full = await getClienteSupabase(cliente.id) as Cliente
        const { id, ...rest } = full
        setFormData(rest)
        setEditingClient(full)
      } catch {
        const { id, ...rest } = cliente
        setFormData(rest)
        setEditingClient(cliente)
      }
    } else {
      const { id, ...rest } = cliente
      setFormData(rest)
      setEditingClient(cliente)
    }
    setActiveTab("cadastrar")
  }

  const handleDelete = async (cliente: Cliente) => {
    const confirmed = window.confirm(`Excluir o cliente "${cliente.nome}"? Esta a??o n?o pode ser desfeita.`)
    if (!confirmed) return

    try {
      if (apiMode) {
        await deleteClienteSupabase(cliente.id)
      }

      setClientes((prev) => prev.filter((c) => c.id !== cliente.id))

      if (!apiMode) {
        const contratosFiltrados = loadFlowContratos().filter((contrato) => contrato.clienteId !== String(cliente.id))
        saveFlowContratos(contratosFiltrados)
      }

      if (editingClient?.id === cliente.id) {
        setFormData(clienteInicial)
        setEditingClient(null)
        setActiveTab("consultar")
      }
    } catch (error) {
      console.error("Falha ao excluir cliente", error)
      alert("Falha ao excluir cliente. Verifique permiss?es/perfil e tente novamente.")
    }
  }

  const handleCancel = () => {
    setFormData(clienteInicial)
    setEditingClient(null)
    setActiveTab("consultar")
  }


  const baixarArquivoCliente = async (arquivo: ClienteArquivo) => {
    if (arquivo?.storageBucket && arquivo?.storagePath) {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.storage.from(arquivo.storageBucket).createSignedUrl(arquivo.storagePath, 60)
        if (error) throw error
        window.open(data.signedUrl, "_blank", "noopener,noreferrer")
        return
      } catch (error) {
        console.error("Falha ao abrir arquivo do cliente no storage", error)
      }
    }

    if (!arquivo?.conteudoBase64 || !arquivo?.mimeType) return
    const href = `data:${arquivo.mimeType};base64,${arquivo.conteudoBase64}`
    const link = document.createElement("a")
    link.href = href
    link.download = arquivo.nome || "arquivo"
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const calcularSituacaoContrato = (dataFimContrato: string, fallback: SituacaoContrato = ""): SituacaoContrato => {
    if (!dataFimContrato) return fallback

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const fim = new Date(`${dataFimContrato}T00:00:00`)
    if (Number.isNaN(fim.getTime())) return fallback

    const msPorDia = 1000 * 60 * 60 * 24
    const diffDays = Math.floor((fim.getTime() - hoje.getTime()) / msPorDia)

    if (diffDays < 0) return "Vencido"
    if (diffDays <= 30) return "A vencer"
    return "Em dia"
  }

  const formatarDataContrato = (value?: string) => {
    if (!value) return "-"
    const [y, m, d] = value.split("-")
    if (!y || !m || !d) return value
    return `${d}/${m}/${y}`
  }

  const getSituacaoCliente = (cliente: Cliente): SituacaoContrato => {
    if (!cliente.possuiContrato) return ""
    return calcularSituacaoContrato(cliente.dataFimContrato, cliente.situacaoContrato)
  }

  const contratosPorCliente = useMemo(() => {
    const source = apiMode
      ? contratosSupabase.map((contrato) => ({
          id: contrato.id,
          clienteId: contrato.clienteId,
          numero: contrato.numero,
          descricao: contrato.descricao,
          status: contrato.status,
          dataInicio: contrato.dataInicio,
          dataTermino: contrato.dataTermino,
        }))
      : loadFlowContratos()

    const map = new Map<string, typeof source[number]>()
    source.forEach((contrato) => {
      if (!contrato?.clienteId) return
      const current = map.get(String(contrato.clienteId))
      if (!current) {
        map.set(String(contrato.clienteId), contrato)
        return
      }

      const currentDate = current.dataTermino || current.dataInicio || ""
      const nextDate = contrato.dataTermino || contrato.dataInicio || ""
      if (nextDate > currentDate) {
        map.set(String(contrato.clienteId), contrato)
      }
    })
    return map
  }, [apiMode, contratosSupabase])

  const getContratoResumoCliente = (cliente: Cliente) => {
    const contrato = contratosPorCliente.get(String(cliente.id))
    if (contrato) {
      const situacao = calcularSituacaoContrato(contrato.dataTermino || "", cliente.situacaoContrato)
      return {
        possuiContrato: true,
        numero: contrato.numero || "",
        situacao,
      }
    }

    return {
      possuiContrato: Boolean(cliente.possuiContrato),
      numero: "",
      situacao: getSituacaoCliente(cliente),
    }
  }

  const getContratoArquivoCliente = (cliente: Cliente) => {
    const arquivos = Array.isArray(cliente.arquivos) ? cliente.arquivos : []
    const contratoAtual = contratosPorCliente.get(String(cliente.id))
    const porContratoAtual = contratoAtual
      ? arquivos.filter((arquivo) => arquivo.contratoId && String(arquivo.contratoId) === String(contratoAtual.id))
      : []

    const candidatos = (porContratoAtual.length > 0 ? porContratoAtual : arquivos).filter((arquivo) =>
      String(arquivo.origem || "").includes("contrato"),
    )

    return candidatos.sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")))[0] || null
  }

  const contratosPorId = new Map(loadFlowContratos().map((contrato) => [String(contrato.id), contrato]))

  const csvEscape = (value: unknown) => {
    const text = value == null ? "" : String(value)
    const escaped = text.replace(/"/g, '""')
    return '"' + escaped + '"'
  }

  const exportarClientesCsv = () => {
    if (filteredClientes.length === 0) {
      alert("Não há clientes para exportar com os filtros atuais.")
      return
    }

    const header = [
      "id",
      "tipoCliente",
      "nome",
      "nomeFantasia",
      "telefone",
      "email",
      "status",
      "cpf",
      "cnpj",
      "inscricaoEstadual",
      "inscricaoMunicipal",
      "canalPreferencial",
      "horariosContato",
      "notifAgendamentos",
      "notifLembretes",
      "notifCertificados",
      "notifCobrancas",
      "horariosAtendimento",
      "autorizacaoPrevia",
      "epiEspecifico",
      "possuiPets",
      "observacoesOperacionais",
      "possuiContrato",
      "tipoContrato",
      "dataInicioContrato",
      "dataFimContrato",
      "situacaoContrato",
      "situacaoContratoCalculada",
      "observacoesInternas",
      "locaisJson",
      "contatosJson",
      "arquivosJson",
      "qtdLocais",
      "qtdContatos",
      "qtdArquivos",
    ]

    const rows = filteredClientes.map((cliente) => {
      const situacaoCalculada = getSituacaoCliente(cliente)
      const values = [
        cliente.id,
        cliente.tipoCliente,
        cliente.nome,
        cliente.nomeFantasia,
        cliente.telefone,
        cliente.email,
        cliente.status,
        cliente.cpf,
        cliente.cnpj,
        cliente.inscricaoEstadual,
        cliente.inscricaoMunicipal,
        cliente.canalPreferencial,
        cliente.horariosContato,
        cliente.notifAgendamentos,
        cliente.notifLembretes,
        cliente.notifCertificados,
        cliente.notifCobrancas,
        cliente.horariosAtendimento,
        cliente.autorizacaoPrevia,
        cliente.epiEspecifico,
        cliente.possuiPets,
        cliente.observacoesOperacionais,
        cliente.possuiContrato,
        cliente.tipoContrato,
        cliente.dataInicioContrato,
        cliente.dataFimContrato,
        cliente.situacaoContrato,
        situacaoCalculada,
        cliente.observacoesInternas,
        JSON.stringify(Array.isArray(cliente.locais) ? cliente.locais : []),
        JSON.stringify(Array.isArray(cliente.contatos) ? cliente.contatos : []),
        JSON.stringify(Array.isArray(cliente.arquivos) ? cliente.arquivos : []),
        Array.isArray(cliente.locais) ? cliente.locais.length : 0,
        Array.isArray(cliente.contatos) ? cliente.contatos.length : 0,
        Array.isArray(cliente.arquivos) ? cliente.arquivos.length : 0,
      ]
      return values.map((v) => csvEscape(v)).join(';')
    })

    const csv = [header.map((h) => csvEscape(h)).join(';'), ...rows].join('\n')
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const date = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = "clientes_filtrados_" + date + ".csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const filteredClientes = clientes.filter((cliente) => {
    // Filtro por número de contrato (client-side, sobre contratos já carregados)
    if (searchTerm) {
      const contratoResumo = getContratoResumoCliente(cliente)
      const term = searchTerm.toLowerCase()
      const matchesContrato = contratoResumo.numero?.toLowerCase().includes(term)
      if (matchesContrato) return true
    }

    if (contractFilter === "todos") return true
    const contratoResumo = getContratoResumoCliente(cliente)
    const situacaoCliente = contratoResumo.situacao
    switch (contractFilter) {
      case "com_contrato": return contratoResumo.possuiContrato
      case "sem_contrato": return !contratoResumo.possuiContrato
      case "em_dia": return contratoResumo.possuiContrato && situacaoCliente === "Em dia"
      case "a_vencer": return contratoResumo.possuiContrato && situacaoCliente === "A vencer"
      case "vencido": return contratoResumo.possuiContrato && situacaoCliente === "Vencido"
      default: return true
    }
  })

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
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/clientes/contratos")}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Cadastrar Contrato
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
              {loadError ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{loadError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome, telefone, CPF, CNPJ ou nº contrato..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={contractFilter} onValueChange={(v) => setContractFilter(v as FiltroContrato)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Contrato: Todos</SelectItem>
                    <SelectItem value="com_contrato">Com contrato</SelectItem>
                    <SelectItem value="sem_contrato">Sem contrato</SelectItem>
                    <SelectItem value="em_dia">Em dia</SelectItem>
                    <SelectItem value="a_vencer">A vencer</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusCliente | "todos")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Status: Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {apiMode
                    ? `${totalCount.toLocaleString("pt-BR")} cliente(s) encontrado(s)`
                    : `${filteredClientes.length} cliente(s) encontrado(s)`}
                  {isLoadingPage && <span className="ml-2 text-muted-foreground/60">Carregando...</span>}
                </p>
                <Button type="button" variant="outline" className="gap-2" onClick={exportarClientesCsv}>
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>

              {apiMode && totalCount > PAGE_SIZE && (
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoadingPage}
                  >
                    ← Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {Math.ceil(totalCount / PAGE_SIZE)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalCount / PAGE_SIZE), p + 1))}
                    disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE) || isLoadingPage}
                  >
                    Próxima →
                  </Button>
                </div>
              )}

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
                          {(() => {
                            const contratoResumo = getContratoResumoCliente(cliente)
                            const contratoArquivo = getContratoArquivoCliente(cliente)
                            return (
                              <>
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
                            {contratoResumo.possuiContrato ? (
                              <div className="flex flex-col gap-1">
                                {contratoResumo.numero ? <span className="text-xs text-muted-foreground">{contratoResumo.numero}</span> : null}
                                <Badge variant={contratoResumo.situacao === "Em dia" ? "default" : contratoResumo.situacao === "A vencer" ? "secondary" : "destructive"}>
                                  {contratoResumo.situacao || "Com contrato"}
                                </Badge>
                              </div>
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
                            <div className="flex items-center justify-end gap-1">
                              {contratoArquivo ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void baixarArquivoCliente(contratoArquivo)}
                                  title="Ver contrato"
                                >
                                  <Eye className="h-4 w-4 text-primary" />
                                </Button>
                              ) : null}
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(cliente)} title="Editar cliente">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(cliente)} title="Excluir cliente">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                              </>
                            )
                          })()}
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
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
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
            {/* BLOCO 7 - Observações e Anexos */}
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
                    </p>                    <Input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                    />
                  </div>
                </div>

                {Array.isArray(formData.arquivos) && formData.arquivos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Arquivos anexados ao cliente</Label>
                    <div className="space-y-2">
                      {formData.arquivos.map((arquivo) => (                        <div key={arquivo.id} className="flex items-center justify-between border rounded-md p-2 gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium break-all">{arquivo.nome}</p>
                            <p className="text-xs text-muted-foreground">{arquivo.origem || "arquivo"}</p>
                            {(() => {
                              const contrato = arquivo.contratoId ? contratosPorId.get(String(arquivo.contratoId)) : null
                              const inicio = contrato?.dataInicio || formData.dataInicioContrato
                              const termino = contrato?.dataTermino || formData.dataFimContrato
                              const situacao = calcularSituacaoContrato(termino || "", formData.situacaoContrato)
                              const mostrarResumoContrato = (arquivo.origem || "").includes("contrato") || Boolean(arquivo.contratoId)
                              if (!mostrarResumoContrato) return null

                              return (
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Início: {formatarDataContrato(inicio)}</span>
                                  <span className="text-muted-foreground">Término: {formatarDataContrato(termino)}</span>
                                  <Badge variant={situacao === "Em dia" ? "default" : situacao === "A vencer" ? "secondary" : "destructive"} className="h-5">
                                    {situacao || "-"}
                                  </Badge>
                                </div>
                              )
                            })()}
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => baixarArquivoCliente(arquivo)} className="gap-2 shrink-0">
                            <Download className="h-4 w-4" />
                            Baixar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Diálogo de confirmação de cadastro de cliente */}
            <ConfirmActionDialog
              open={confirmCliente.open}
              title={editingClient ? "Confirmar edição do cliente" : "Confirmar cadastro do cliente"}
              description={editingClient
                ? "Revise os dados abaixo antes de salvar as alterações."
                : "Revise os dados antes de cadastrar. Verifique se o cliente já não existe no sistema."
              }
              details={confirmCliente.details}
              warningMessage={confirmCliente.warningMessage}
              confirmLabel={isSavingCliente ? "Salvando..." : "Confirmar"}
              isLoading={isSavingCliente}
              onConfirm={() => {
                if (confirmCliente.action) {
                  void handleSubmit(confirmCliente.action).then(() => {
                    setConfirmCliente({ open: false, action: null, details: [] })
                  })
                }
              }}
              onCancel={() => setConfirmCliente({ open: false, action: null, details: [] })}
            />

            {/* BLOCO 9 - Ações (Fixo no rodapé) */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50">
              <div className="container mx-auto flex flex-wrap gap-3 justify-end">
                <Button variant="outline" onClick={handleCancel} className="gap-2 bg-transparent">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
<Button
    variant="secondary"
    onClick={() => handleOpenConfirmCliente("contrato")}
    className="gap-2"
    disabled={!isFormValid() || isSavingCliente}
  >
    <FileText className="h-4 w-4" />
    Salvar e cadastrar contrato
  </Button>
  <Button
    variant="secondary"
    onClick={() => handleOpenConfirmCliente("servico")}
    className="gap-2"
    disabled={!isFormValid() || isSavingCliente}
  >
    <Plus className="h-4 w-4" />
    Salvar e cadastrar serviço
  </Button>
  <Button
    onClick={() => handleOpenConfirmCliente("salvar")}
    className="gap-2"
    disabled={!isFormValid() || isSavingCliente}
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
























