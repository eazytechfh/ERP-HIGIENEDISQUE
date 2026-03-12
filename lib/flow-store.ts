export type DataMode = "local" | "api"

export type FlowStatusServico = "agendado" | "em_execucao" | "executado" | "cancelado"

export type FlowServico = {
  id: string
  osNumber: string
  cliente: string
  clienteId?: string
  servico: string
  tipo?: string
  local: string
  data: string
  horario: string
  tecnico: string
  status: FlowStatusServico
  osStatus?: string
  osAssinada?: boolean
  baixaObservacao?: string
  osFingerprint?: string
  osDocumentoHtml?: string
}

export type FlowStore = {
  clientes: any[]
  servicos: FlowServico[]
  veiculos: any[]
  manutencoes: any[]
  produtos: any[]
  fornecedores: any[]
}

export type FlowScenario = "operacional" | "critico" | "vazio"

export type FlowContratoItem = {
  id: string
  nome: string
}

export type FlowContrato = {
  id: string
  clienteId: string
  numero: string
  descricao: string
  status: "ativo" | "suspenso" | "encerrado"
  tipoContrato: "recorrente" | "avulso"
  dataInicio: string
  dataTermino: string
  itens: FlowContratoItem[]
}

const STORAGE_KEY = "erp_higiene_flow_v3"
const LEGACY_STORAGE_KEY = "erp_higiene_flow_v1"
const DATA_MODE_KEY = "erp_higiene_data_mode"
const CONTRACTS_STORAGE_KEY = "erp_higiene_contratos_v2"

const defaultState: FlowStore = {
  clientes: [],
  servicos: [],
  veiculos: [],
  manutencoes: [],
  produtos: [],
  fornecedores: [],
}

function hasAnyData(store: FlowStore) {
  return (
    store.clientes.length > 0 ||
    store.servicos.length > 0 ||
    store.veiculos.length > 0 ||
    store.manutencoes.length > 0 ||
    store.produtos.length > 0 ||
    store.fornecedores.length > 0
  )
}

function makeIsoOffset(base: Date, diffDays: number) {
  const d = new Date(base)
  d.setDate(base.getDate() + diffDays)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function buildScenarioStore(_scenario: FlowScenario, _now = new Date()): FlowStore {
  return { ...defaultState }
}

function normalizeStore(parsed: Partial<FlowStore> | null | undefined): FlowStore {
  return {
    clientes: Array.isArray(parsed?.clientes) ? parsed!.clientes : [],
    servicos: Array.isArray(parsed?.servicos) ? (parsed!.servicos as FlowServico[]) : [],
    veiculos: Array.isArray(parsed?.veiculos) ? parsed!.veiculos : [],
    manutencoes: Array.isArray(parsed?.manutencoes) ? parsed!.manutencoes : [],
    produtos: Array.isArray(parsed?.produtos) ? parsed!.produtos : [],
    fornecedores: Array.isArray(parsed?.fornecedores) ? parsed!.fornecedores : [],
  }
}

export function loadFlowStore(): FlowStore {
  if (typeof window === "undefined") return { ...defaultState }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeStore(JSON.parse(raw) as Partial<FlowStore>)

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
      const normalized = normalizeStore(JSON.parse(legacy) as Partial<FlowStore>)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    }

    return { ...defaultState }
  } catch {
    return { ...defaultState }
  }
}

export function saveFlowStore(next: Partial<FlowStore>) {
  if (typeof window === "undefined") return
  const current = loadFlowStore()
  const merged: FlowStore = normalizeStore({ ...current, ...next })
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
}

export function ensureFlowStoreInitialized(_scenario: FlowScenario = "operacional") {
  const current = loadFlowStore()
  if (hasAnyData(current)) return current
  return { ...defaultState }
}

export function resetFlowStore(_scenario: FlowScenario = "operacional") {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  window.localStorage.removeItem(CONTRACTS_STORAGE_KEY)
}


export const setFlowClientes = (clientes: any[]) => saveFlowStore({ clientes })
export const setFlowServicos = (servicos: FlowServico[]) => saveFlowStore({ servicos })
export const setFlowVeiculos = (veiculos: any[]) => saveFlowStore({ veiculos })
export const setFlowManutencoes = (manutencoes: any[]) => saveFlowStore({ manutencoes })
export const setFlowProdutos = (produtos: any[]) => saveFlowStore({ produtos })
export const setFlowFornecedores = (fornecedores: any[]) => saveFlowStore({ fornecedores })

export function getCurrentDataMode(): DataMode {
  if (typeof window === "undefined") return "local"
  const value = window.localStorage.getItem(DATA_MODE_KEY)
  return value === "api" ? "api" : "local"
}

export function setCurrentDataMode(mode: DataMode) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DATA_MODE_KEY, mode)
}

export function loadFlowContratos(): FlowContrato[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(CONTRACTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as FlowContrato[]) : []
  } catch {
    return []
  }
}

export function saveFlowContratos(contratos: FlowContrato[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(Array.isArray(contratos) ? contratos : []))
}

export function upsertFlowContrato(contrato: FlowContrato) {
  const current = loadFlowContratos()
  const next = current.some((c) => c.id === contrato.id)
    ? current.map((c) => (c.id === contrato.id ? contrato : c))
    : [...current, contrato]
  saveFlowContratos(next)
}

export function toIsoDate(value: string): string {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ""
  return `${m[3]}-${m[2]}-${m[1]}`
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfWeekMonday(base: Date): Date {
  const date = new Date(base)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfWeekSunday(base: Date): Date {
  const start = startOfWeekMonday(base)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function inMonth(target: Date, ref: Date) {
  return target.getFullYear() === ref.getFullYear() && target.getMonth() === ref.getMonth()
}

export function buildDashboardMetrics(store: FlowStore, now = new Date()) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const weekStart = startOfWeekMonday(today)
  const weekEnd = endOfWeekSunday(today)

  const servicos = store.servicos.map((s) => {
    const iso = toIsoDate(s.data)
    const dataObj = iso ? new Date(`${iso}T00:00:00`) : null
    return { ...s, dataObj }
  })

  const programadosHoje = servicos.filter((s) => s.status === "agendado" && s.dataObj && isSameDay(s.dataObj, today)).length
  const realizadosHoje = servicos.filter((s) => s.status === "executado" && s.dataObj && isSameDay(s.dataObj, today)).length

  const programadosSemana = servicos.filter((s) => s.status === "agendado" && s.dataObj && s.dataObj >= weekStart && s.dataObj <= weekEnd).length
  const realizadosSemana = servicos.filter((s) => s.status === "executado" && s.dataObj && s.dataObj >= weekStart && s.dataObj <= weekEnd).length

  const programadosMes = servicos.filter((s) => s.status === "agendado" && s.dataObj && inMonth(s.dataObj, today)).length
  const realizadosMes = servicos.filter((s) => s.status === "executado" && s.dataObj && inMonth(s.dataObj, today)).length

  const clientesAtivosList = store.clientes.filter((c: any) => c.status === "Ativo")
  const clientesAtivos = clientesAtivosList.length

  const getSituacaoContratoCliente = (c: any): "Em dia" | "A vencer" | "Vencido" | "" => {
    if (!c?.possuiContrato) return ""

    const d = toIsoDate(c.dataFimContrato || "")
    if (!d) {
      if (c.situacaoContrato === "Em dia" || c.situacaoContrato === "A vencer" || c.situacaoContrato === "Vencido") {
        return c.situacaoContrato
      }
      return ""
    }

    const dataFim = new Date(`${d}T00:00:00`)
    if (Number.isNaN(dataFim.getTime())) {
      if (c.situacaoContrato === "Em dia" || c.situacaoContrato === "A vencer" || c.situacaoContrato === "Vencido") {
        return c.situacaoContrato
      }
      return ""
    }

    const diffDays = Math.floor((dataFim.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return "Vencido"
    if (diffDays <= 30) return "A vencer"
    return "Em dia"
  }

  const clientesComContratoAtivo = clientesAtivosList.filter((c: any) => c.possuiContrato)
  const clientesAVencer = clientesComContratoAtivo.filter((c: any) => getSituacaoContratoCliente(c) === "A vencer").length
  const clientesVencidos = clientesComContratoAtivo.filter((c: any) => getSituacaoContratoCliente(c) === "Vencido").length
  const totalClientesResumo = clientesAtivos
  const osSemana = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + idx)
    const label = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"][idx]
    const total = servicos.filter((s) => {
      if (!s.dataObj) return false
      if (!isSameDay(s.dataObj, d)) return false
      return s.status === "agendado" || s.status === "em_execucao" || s.status === "executado"
    }).length
    return { dia: label, os: total }
  })

  const servicosVencidos = servicos.filter((s) => s.status === "agendado" && s.dataObj && s.dataObj < today).length

  const manutencaoVeiculo = store.manutencoes.filter((m: any) => {
    if (!m.dataPrevista || m.status === "Concluida") return false
    const d = new Date(`${toIsoDate(m.dataPrevista)}T00:00:00`)
    if (Number.isNaN(d.getTime())) return false
    const diffDays = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }).length

  const equipamentoDefeito = store.produtos.filter((p: any) => p.categoria === "Equipamentos" && p.condicao === "Defeito").length

  const osSemAssinatura = servicos.filter((s) => s.status === "executado" && s.baixaObservacao && !s.osAssinada).length

  const pendenciasCriticas = store.clientes.flatMap((c: any) =>
    Array.isArray(c.pendenciasCriticas)
      ? c.pendenciasCriticas.map((texto: string) => ({ cliente: c.nome, texto }))
      : []
  )

  return {
    programadosHoje,
    realizadosHoje,
    pendentesHoje: Math.max(0, programadosHoje - realizadosHoje),
    clientesAtivos,
    clientesAVencer,
    clientesVencidos,
    totalClientesResumo,
    programadosSemana,
    realizadosSemana,
    programadosMes,
    realizadosMes,
    osSemana,
    alertas: {
      osSemAssinatura,
      servicosVencidos,
      manutencaoVeiculo,
      equipamentoDefeito,
    },
    pendenciasCriticas,
  }
}

export function buildFlowValidationChecklist(store: FlowStore) {
  const metrics = buildDashboardMetrics(store)

  return [
    {
      id: "clientes_ativos",
      titulo: "Clientes ativos carregados",
      ok: metrics.clientesAtivos > 0,
      detalhe: `${metrics.clientesAtivos} cliente(s) ativo(s)`,
    },
    {
      id: "servicos_hoje",
      titulo: "Servicos de hoje no painel",
      ok: metrics.programadosHoje >= metrics.realizadosHoje,
      detalhe: `${metrics.programadosHoje} programado(s), ${metrics.realizadosHoje} realizado(s)`,
    },
    {
      id: "historico_os",
      titulo: "Historico de OS com status coerente",
      ok: store.servicos.some((s) => s.status === "executado"),
      detalhe: `${store.servicos.filter((s) => s.status === "executado").length} OS executada(s)`,
    },
    {
      id: "estoque_fornecedor",
      titulo: "Cadastro de fornecedor em estoque",
      ok: Array.isArray(store.fornecedores) && store.fornecedores.length > 0,
      detalhe: `${store.fornecedores.length} fornecedor(es)`,
    },
    {
      id: "alertas",
      titulo: "Alertas operacionais calculados",
      ok: typeof metrics.alertas.servicosVencidos === "number",
      detalhe: `${metrics.alertas.servicosVencidos} servico(s) vencido(s)`,
    },
  ]
}








