export type FlowStatusServico = "agendado" | "em_execucao" | "executado" | "cancelado"

export type FlowServico = {
  id: string
  osNumber: string
  cliente: string
  clienteId?: string
  servico: string
  tipo?: string
  local: string
  data: string // pt-BR or ISO
  horario: string
  tecnico: string
  status: FlowStatusServico
  osStatus?: string
  osAssinada?: boolean
  baixaObservacao?: string
}

export type FlowStore = {
  clientes: any[]
  servicos: FlowServico[]
  veiculos: any[]
  manutencoes: any[]
  produtos: any[]
}

const STORAGE_KEY = "erp_higiene_flow_v1"

const defaultState: FlowStore = {
  clientes: [],
  servicos: [],
  veiculos: [],
  manutencoes: [],
  produtos: [],
}

export function loadFlowStore(): FlowStore {
  if (typeof window === "undefined") return defaultState
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<FlowStore>
    return {
      clientes: Array.isArray(parsed.clientes) ? parsed.clientes : [],
      servicos: Array.isArray(parsed.servicos) ? parsed.servicos : [],
      veiculos: Array.isArray(parsed.veiculos) ? parsed.veiculos : [],
      manutencoes: Array.isArray(parsed.manutencoes) ? parsed.manutencoes : [],
      produtos: Array.isArray(parsed.produtos) ? parsed.produtos : [],
    }
  } catch {
    return defaultState
  }
}

export function saveFlowStore(next: Partial<FlowStore>) {
  if (typeof window === "undefined") return
  const current = loadFlowStore()
  const merged: FlowStore = {
    ...current,
    ...next,
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
}

export const setFlowClientes = (clientes: any[]) => saveFlowStore({ clientes })
export const setFlowServicos = (servicos: FlowServico[]) => saveFlowStore({ servicos })
export const setFlowVeiculos = (veiculos: any[]) => saveFlowStore({ veiculos })
export const setFlowManutencoes = (manutencoes: any[]) => saveFlowStore({ manutencoes })
export const setFlowProdutos = (produtos: any[]) => saveFlowStore({ produtos })

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

  const clientesAtivos = store.clientes.filter((c: any) => c.status === "Ativo").length
  const clientesAVencer = store.clientes.filter((c: any) => {
    if (!c.dataFimContrato) return false
    const d = toIsoDate(c.dataFimContrato)
    if (!d) return false
    return new Date(`${d}T00:00:00`) < today
  }).length

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
    totalClientesResumo: clientesAtivos + clientesAVencer,
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
