// Calculo da NFS-e (puro, testavel). Usado na tela (previa) e no servidor (envio).
//
// - Deducoes reduzem a BASE do ISS; nao mudam o valor da nota.
// - Retencoes (ISS quando retido pelo tomador, INSS, IR) sao descontadas do valor
//   bruto da nota e resultam no liquido a receber.
// - Aliquotas em percentual (o Asaas envia "aliquota" em %).

export type EntradaNfse = {
  valor: number
  deducoes: number
  issAliquota: number
  issRetido: boolean
  inssAliquota: number
  irAliquota: number
}

export type CalculoNfse = {
  valor: number
  deducoes: number
  baseIss: number
  valorIss: number
  valorIssRetido: number
  valorInss: number
  valorIr: number
  totalRetencoes: number
  liquidoReceber: number
}

const cents = (v: number) => Math.round((v || 0) * 100)
const pct = (baseCents: number, aliquota: number) => Math.round((baseCents * Math.round((aliquota || 0) * 100)) / 10000)

export function validarEntradaNfse(e: EntradaNfse): string | null {
  if (!(e.valor > 0)) return "Informe o valor da nota."
  if (e.deducoes < 0) return "Deducoes nao podem ser negativas."
  if (cents(e.deducoes) > cents(e.valor)) return "Deducoes nao podem passar do valor da nota."
  for (const [nome, v] of [["ISS", e.issAliquota], ["INSS", e.inssAliquota], ["IR", e.irAliquota]] as const) {
    if (v < 0 || v >= 100) return `Aliquota de ${nome} invalida.`
  }
  return null
}

export function calcularNfse(e: EntradaNfse): CalculoNfse {
  const valor = cents(e.valor)
  const deducoes = cents(e.deducoes)
  const base = Math.max(0, valor - deducoes)
  const iss = pct(base, e.issAliquota)
  const issRetido = e.issRetido ? iss : 0
  const inss = pct(valor, e.inssAliquota)
  const ir = pct(valor, e.irAliquota)
  const retencoes = issRetido + inss + ir
  return {
    valor: valor / 100,
    deducoes: deducoes / 100,
    baseIss: base / 100,
    valorIss: iss / 100,
    valorIssRetido: issRetido / 100,
    valorInss: inss / 100,
    valorIr: ir / 100,
    totalRetencoes: retencoes / 100,
    liquidoReceber: (valor - retencoes) / 100,
  }
}

/** Data de hoje no fuso de Sao Paulo (YYYY-MM-DD). */
export function hojeSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora)
}

/** "Agora" usa a data corrente; "Agendar" exige data futura. */
export function resolverDataEfetiva(modo: "agora" | "agendar", dataAgendada: string | undefined, hoje: string): { data: string; erro: string | null } {
  if (modo === "agora") return { data: hoje, erro: null }
  if (!dataAgendada || !/^\d{4}-\d{2}-\d{2}$/.test(dataAgendada)) return { data: "", erro: "Informe a data do agendamento." }
  if (dataAgendada <= hoje) return { data: "", erro: "A data do agendamento precisa ser futura." }
  return { data: dataAgendada, erro: null }
}

export type StatusAsaasInvoice = "SCHEDULED" | "AUTHORIZED" | "PROCESSING_CANCELLATION" | "CANCELED" | "CANCELLATION_DENIED" | "ERROR"

/** Status do documento no ERP a partir do status do Asaas. So AUTHORIZED conta como emitida. */
export function statusDocumentoPorAsaas(status: string): "pendente" | "emitido" | "cancelado" {
  if (status === "AUTHORIZED" || status === "CANCELLATION_DENIED" || status === "PROCESSING_CANCELLATION") return "emitido"
  if (status === "CANCELED") return "cancelado"
  return "pendente"
}

export function rotuloStatusAsaas(status: string): string {
  const mapa: Record<string, string> = {
    ENVIANDO: "Enviando",
    SCHEDULED: "Agendada / processando",
    AUTHORIZED: "Autorizada",
    PROCESSING_CANCELLATION: "Cancelamento em processamento",
    CANCELED: "Cancelada",
    CANCELLATION_DENIED: "Cancelamento negado",
    ERROR: "Erro na emissao",
    FALHA_ENVIO: "Falha no envio",
  }
  return mapa[status] || status || "-"
}

export type LocalCliente = {
  cep?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
}

export type EnderecoAsaas = {
  postalCode: string
  address: string
  addressNumber: string
  complement?: string
  province: string
}

/**
 * Endereco do tomador para a NFS-e (o Asaas recusa a nota sem ele).
 * Usa o primeiro local do cliente com CEP, rua, numero e bairro; o Asaas
 * deduz cidade/UF pelo CEP. Sem local completo, devolve o que falta.
 */
export function enderecoAsaasDoCliente(locais: LocalCliente[]): { endereco: EnderecoAsaas | null; faltando: string[] } {
  const limpo = (v: string | null | undefined) => String(v || "").trim()
  let melhorFaltando: string[] | null = null
  for (const local of locais) {
    const cep = limpo(local.cep).replace(/\D/g, "")
    const faltando: string[] = []
    if (cep.length !== 8) faltando.push("CEP")
    if (!limpo(local.endereco)) faltando.push("rua")
    if (!limpo(local.numero)) faltando.push("numero")
    if (!limpo(local.bairro)) faltando.push("bairro")
    if (faltando.length === 0) {
      return {
        endereco: {
          postalCode: cep,
          address: limpo(local.endereco),
          addressNumber: limpo(local.numero),
          complement: limpo(local.complemento) || undefined,
          province: limpo(local.bairro),
        },
        faltando: [],
      }
    }
    if (!melhorFaltando || faltando.length < melhorFaltando.length) melhorFaltando = faltando
  }
  return { endereco: null, faltando: melhorFaltando || ["CEP", "rua", "numero", "bairro"] }
}
