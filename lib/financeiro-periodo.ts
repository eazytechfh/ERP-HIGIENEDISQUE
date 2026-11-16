// Periodos do dashboard financeiro e geracao de CSV (funcoes puras, testaveis).

export type PeriodoSelecionado = "mes_atual" | "anual" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12"

export const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
export const MESES_NOME = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function ultimoDia(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate()
}

export type IntervaloPeriodo = {
  inicio: string
  fim: string
  agrupamento: "mes" | "dia"
  /** Chaves dos baldes do grafico, na ordem (YYYY-MM ou YYYY-MM-DD). */
  baldes: string[]
  rotulo: string
}

/**
 * "Mes atual" ignora o ano escolhido e usa a data de hoje; "Anual" cobre o ano
 * inteiro agrupado por mes; um mes especifico agrupa por dia.
 */
export function intervaloPeriodo(ano: number, periodo: PeriodoSelecionado, hoje: Date = new Date()): IntervaloPeriodo {
  if (periodo === "anual") {
    return {
      inicio: `${ano}-01-01`,
      fim: `${ano}-12-31`,
      agrupamento: "mes",
      baldes: Array.from({ length: 12 }, (_, i) => `${ano}-${pad(i + 1)}`),
      rotulo: `Ano de ${ano}`,
    }
  }
  const anoEfetivo = periodo === "mes_atual" ? hoje.getFullYear() : ano
  const mes = periodo === "mes_atual" ? hoje.getMonth() + 1 : Number(periodo)
  const dias = ultimoDia(anoEfetivo, mes)
  return {
    inicio: `${anoEfetivo}-${pad(mes)}-01`,
    fim: `${anoEfetivo}-${pad(mes)}-${pad(dias)}`,
    agrupamento: "dia",
    baldes: Array.from({ length: dias }, (_, i) => `${anoEfetivo}-${pad(mes)}-${pad(i + 1)}`),
    rotulo: `${MESES_NOME[mes - 1]} de ${anoEfetivo}`,
  }
}

export function rotuloBalde(chave: string): string {
  const [, mes, dia] = chave.split("-")
  return dia ? dia : MESES_ABREV[Number(mes) - 1]
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export type LinhaExportacao = {
  dataReferencia: string
  dataVencimento: string
  dataLiquidacao: string
  tipo: string
  status: string
  descricao: string
  categoria: string
  vinculo: string
  formaPagamento: string
  parcela: string
  valor: number
  taxa: number | null
  valorCaixa: number
}

export type TotaisExportacao = {
  entradasRealizadas: number
  saidasRealizadas: number
  entradasProgramadas: number
  saidasProgramadas: number
  quantidade: number
}

function dataBr(iso: string) {
  if (!iso) return ""
  const [a, m, d] = iso.slice(0, 10).split("-")
  return d ? `${d}/${m}/${a}` : iso
}

function numeroBr(valor: number | null) {
  if (valor === null || valor === undefined) return ""
  return valor.toFixed(2).replace(".", ",")
}

function celula(valor: string) {
  // Excel pt-BR usa ";" — escapa aspas, separadores e quebras de linha.
  const texto = String(valor ?? "")
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto // evita injecao de formula
  return /[";\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

/** CSV para Excel pt-BR: separador ";", decimal ",", BOM UTF-8, totais no fim. */
export function gerarCsvLancamentos(linhas: LinhaExportacao[], totais: TotaisExportacao, filtroDescricao: string): string {
  const cabecalho = [
    "Data referencia", "Vencimento", "Liquidacao", "Tipo", "Status", "Descricao", "Categoria",
    "Cliente/Fornecedor", "Forma de pagamento", "Parcela", "Valor bruto", "Taxa", "Valor no caixa",
  ]
  const corpo = linhas.map((l) =>
    [
      dataBr(l.dataReferencia), dataBr(l.dataVencimento), dataBr(l.dataLiquidacao), l.tipo, l.status,
      l.descricao, l.categoria, l.vinculo, l.formaPagamento, l.parcela,
      numeroBr(l.valor), numeroBr(l.taxa), numeroBr(l.valorCaixa),
    ].map(celula).join(";"),
  )
  const saldoRealizado = totais.entradasRealizadas - totais.saidasRealizadas
  const rodape = [
    "",
    `${celula("Filtros")};${celula(filtroDescricao)}`,
    `Lancamentos;${totais.quantidade}`,
    `Entradas realizadas;${numeroBr(totais.entradasRealizadas)}`,
    `Saidas realizadas;${numeroBr(totais.saidasRealizadas)}`,
    `Saldo realizado;${numeroBr(saldoRealizado)}`,
    `Entradas programadas;${numeroBr(totais.entradasProgramadas)}`,
    `Saidas programadas;${numeroBr(totais.saidasProgramadas)}`,
  ]
  return "﻿" + [cabecalho.map(celula).join(";"), ...corpo, ...rodape].join("\r\n")
}

/** Soma os totais a partir das linhas (o export confere com o banco). Cancelados nao entram. */
export function totaisDasLinhas(linhas: Array<{ tipo: string; status: string; valorCaixa: number }>): TotaisExportacao {
  const cents = { er: 0, sr: 0, ep: 0, sp: 0 }
  for (const l of linhas) {
    const v = Math.round(l.valorCaixa * 100)
    const entrada = l.tipo === "receita"
    if (l.status === "realizado") entrada ? (cents.er += v) : (cents.sr += v)
    else if (l.status === "programado") entrada ? (cents.ep += v) : (cents.sp += v)
  }
  return {
    entradasRealizadas: cents.er / 100,
    saidasRealizadas: cents.sr / 100,
    entradasProgramadas: cents.ep / 100,
    saidasProgramadas: cents.sp / 100,
    quantidade: linhas.length,
  }
}
