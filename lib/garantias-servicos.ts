export type UnidadeGarantia = "dias" | "meses" | "anos"
export type SituacaoGarantia = "vencida" | "a_vencer" | "vigente"

export type GarantiaServicoItem = {
  id: string
  servicoId: string
  osNumber: string
  clienteId: string
  cliente: string
  servico: string
  cobertura: string
  local: string
  dataServico: string
  vencimento: string
  prazo: string
  situacao: SituacaoGarantia
  diasRestantes: number
}

type ServicoComGarantia = {
  id: string
  osNumber: string
  clienteId?: string
  cliente: string
  servico: string
  local: string
  data: string
  status: string
  osFormData?: Record<string, unknown> | null
}

const ROTULOS_PRAGAS: Record<string, string> = {
  baratas: "Baratas",
  formigas: "Formigas",
  ratos: "Ratos",
  mosquitos: "Mosquitos",
  cupins: "Cupins",
  lacraias: "Lacraias",
  pulgas_carrapatos: "Pulgas/Carrapatos",
  tracas: "Traças",
  aranhas: "Aranhas",
  carunchos: "Carunchos",
  percevejos: "Percevejos",
  moscas: "Moscas",
  outros: "Outros",
}

function normalizar(value: unknown): string {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

function objectValue(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? value as Record<string, any> : {}
}

export function parseDataGarantia(value: unknown): Date | null {
  const raw = String(value || "").trim()
  if (!raw) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw)
  const date = iso
    ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    : br
      ? new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]))
      : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

export function adicionarPrazoGarantia(base: Date, quantidade: number, unidade: UnidadeGarantia): Date {
  const result = new Date(base)
  if (unidade === "anos") result.setFullYear(result.getFullYear() + quantidade)
  else if (unidade === "meses") result.setMonth(result.getMonth() + quantidade)
  else result.setDate(result.getDate() + quantidade)
  return result
}

function formatIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function unidadeLabel(unidade: UnidadeGarantia, quantidade: number): string {
  if (unidade === "anos") return quantidade === 1 ? "ano" : "anos"
  if (unidade === "meses") return quantidade === 1 ? "mês" : "meses"
  return quantidade === 1 ? "dia" : "dias"
}

export function classificarGarantia(vencimento: string, hoje = new Date()): Pick<GarantiaServicoItem, "situacao" | "diasRestantes"> {
  const dataVencimento = parseDataGarantia(vencimento)
  if (!dataVencimento) return { situacao: "vigente", diasRestantes: 0 }
  const dataHoje = new Date(hoje)
  dataHoje.setHours(0, 0, 0, 0)
  dataVencimento.setHours(0, 0, 0, 0)
  const diasRestantes = Math.round((dataVencimento.getTime() - dataHoje.getTime()) / 86_400_000)
  return {
    situacao: diasRestantes < 0 ? "vencida" : diasRestantes <= 30 ? "a_vencer" : "vigente",
    diasRestantes,
  }
}

export function extrairGarantiasServico(servico: ServicoComGarantia, hoje = new Date()): GarantiaServicoItem[] {
  if (!["executado", "concluido"].includes(servico.status) || !servico.osFormData) return []

  const form = objectValue(servico.osFormData)
  const request = objectValue(form.serviceRequest)
  const vetores = objectValue(form.dadosTecnicosVetores)
  const limpeza = objectValue(form.dadosTecnicosLimpeza)
  const nomeNormalizado = normalizar(request.serviceName || servico.servico)
  if (nomeNormalizado.includes("gordura") || (nomeNormalizado.includes("transporte") && nomeNormalizado.includes("residuo"))) return []

  const dataBase = parseDataGarantia(objectValue(request.schedule).date || servico.data)
  if (!dataBase) return []

  const quantidadeGeral = Number.parseInt(String(request.warrantyDays || "0"), 10)
  const unidadeGeral: UnidadeGarantia = ["dias", "meses", "anos"].includes(request.warrantyUnit)
    ? request.warrantyUnit
    : "meses"
  const reservatorios = Array.isArray(limpeza.reservatorios) ? limpeza.reservatorios : []
  const ehLimpeza = reservatorios.length > 0 || /higien|reservatorio|caixa d|cisterna/.test(nomeNormalizado)
  const ehPragas = /praga|dedet|desinset|desrat|cupim|vetor|controle/.test(nomeNormalizado)
  const pragas = Array.isArray(vetores.pragasAlvo) ? vetores.pragasAlvo.map(String) : []
  const garantiasPorPraga = objectValue(vetores.garantiasPorPraga)

  let coberturas: Array<{ nome: string; quantidade: number; unidade: UnidadeGarantia }> = []
  if (ehLimpeza) {
    const quantidade = quantidadeGeral > 0 ? quantidadeGeral : 6
    const unidade = quantidadeGeral > 0 ? unidadeGeral : "meses"
    coberturas = (reservatorios.length ? reservatorios : [{ tipo: "reservatorio", numero: "" }]).map((item: any) => ({
      nome: [item.tipo === "caixa_dagua" ? "Caixa d'Água" : item.tipo === "cisterna" ? "Cisterna" : "Higienização", item.numero].filter(Boolean).join(" "),
      quantidade,
      unidade,
    }))
  } else if (ehPragas && pragas.length > 0) {
    coberturas = pragas.map((praga) => {
      const especifica = objectValue(garantiasPorPraga[praga])
      const quantidadeEspecifica = Number.parseInt(String(especifica.quantidade || "0"), 10)
      const quantidade = quantidadeEspecifica > 0 ? quantidadeEspecifica : quantidadeGeral > 0 ? quantidadeGeral : praga === "cupins" ? 24 : 3
      const unidade: UnidadeGarantia = quantidadeEspecifica > 0 && ["dias", "meses", "anos"].includes(especifica.unidade)
        ? especifica.unidade
        : quantidadeGeral > 0
          ? unidadeGeral
          : "meses"
      return { nome: ROTULOS_PRAGAS[praga] || praga, quantidade, unidade }
    })
  } else if (quantidadeGeral > 0) {
    coberturas = [{ nome: request.serviceName || servico.servico || "Serviço", quantidade: quantidadeGeral, unidade: unidadeGeral }]
  }

  return coberturas.map((cobertura, index) => {
    const vencimento = formatIso(adicionarPrazoGarantia(dataBase, cobertura.quantidade, cobertura.unidade))
    return {
      id: `${servico.id}-${index}-${normalizar(cobertura.nome).replace(/\s+/g, "-")}`,
      servicoId: servico.id,
      osNumber: servico.osNumber,
      clienteId: servico.clienteId || "",
      cliente: servico.cliente,
      servico: request.serviceName || servico.servico,
      cobertura: cobertura.nome,
      local: servico.local,
      dataServico: formatIso(dataBase),
      vencimento,
      prazo: `${cobertura.quantidade} ${unidadeLabel(cobertura.unidade, cobertura.quantidade)}`,
      ...classificarGarantia(vencimento, hoje),
    }
  })
}

export function extrairGarantiasServicos(servicos: ServicoComGarantia[], hoje = new Date()): GarantiaServicoItem[] {
  return servicos.flatMap((servico) => extrairGarantiasServico(servico, hoje))
}
