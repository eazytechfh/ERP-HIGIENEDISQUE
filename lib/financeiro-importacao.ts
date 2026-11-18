// Importacao de despesas a partir de planilha (extrato bancario categorizado).
// Funcoes puras (sem React/Supabase) para poderem ser testadas.
//
// Formato esperado (a primeira linha com "Data" e "Valor" e o cabecalho):
//   Data de pagamento | Valor | Quem recebeu | Categoria do gasto | Descricao original da linha do extrato

export type CelulaPlanilha = string | number | boolean | Date | null | undefined

export type LinhaDespesaImportada = {
  /** Numero da linha na planilha (1 = primeira linha). */
  linhaPlanilha: number
  dataPagamento: string
  valor: number
  recebedor: string
  categoria: string
  descricao: string
  formaPagamento: string
}

export type ErroImportacao = { linhaPlanilha: number; mensagem: string }

export type ResultadoLeituraDespesas = {
  linhas: LinhaDespesaImportada[]
  erros: ErroImportacao[]
}

export function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

const COLUNAS = {
  data: ["data de pagamento", "data pagamento", "data"],
  valor: ["valor"],
  recebedor: ["quem recebeu", "favorecido", "recebedor", "fornecedor"],
  categoria: ["categoria do gasto", "categoria"],
  descricao: ["descricao original da linha do extrato", "descricao original", "descricao", "historico"],
} as const

type ChaveColuna = keyof typeof COLUNAS

function texto(celula: CelulaPlanilha): string {
  if (celula === null || celula === undefined) return ""
  if (celula instanceof Date) return ""
  return String(celula).replace(/\s+/g, " ").trim()
}

function mapearCabecalho(linha: CelulaPlanilha[]): Partial<Record<ChaveColuna, number>> {
  const mapa: Partial<Record<ChaveColuna, number>> = {}
  linha.forEach((celula, indice) => {
    const nome = normalizarTexto(texto(celula))
    if (!nome) return
    for (const chave of Object.keys(COLUNAS) as ChaveColuna[]) {
      if (mapa[chave] === undefined && (COLUNAS[chave] as readonly string[]).includes(nome)) {
        mapa[chave] = indice
        return
      }
    }
  })
  return mapa
}

function doisDigitos(n: number) {
  return String(n).padStart(2, "0")
}

function dataValida(ano: number, mes: number, dia: number): string | null {
  if (ano < 2000 || ano > 2100) return null
  const teste = new Date(Date.UTC(ano, mes - 1, dia))
  if (teste.getUTCFullYear() !== ano || teste.getUTCMonth() !== mes - 1 || teste.getUTCDate() !== dia) return null
  return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`
}

/** Aceita Date (celula de data do Excel, em UTC), dd/mm/aaaa e aaaa-mm-dd. */
export function lerDataPlanilha(celula: CelulaPlanilha): string | null {
  if (celula instanceof Date) {
    if (Number.isNaN(celula.getTime())) return null
    return dataValida(celula.getUTCFullYear(), celula.getUTCMonth() + 1, celula.getUTCDate())
  }
  const valor = texto(celula)
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(valor)
  if (br) return dataValida(Number(br[3]), Number(br[2]), Number(br[1]))
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(valor)
  if (iso) return dataValida(Number(iso[1]), Number(iso[2]), Number(iso[3]))
  return null
}

/** Aceita numero, "1234.56" e "R$ 1.234,56". Retorna null se nao for numero. */
export function lerValorPlanilha(celula: CelulaPlanilha): number | null {
  if (typeof celula === "number") return Number.isFinite(celula) ? celula : null
  let valor = texto(celula).replace(/R\$/gi, "").replace(/\s/g, "")
  if (!valor) return null
  if (valor.includes(",")) valor = valor.replace(/\./g, "").replace(",", ".")
  if (!/^-?\d+(\.\d+)?$/.test(valor)) return null
  return Number(valor)
}

/** Forma de pagamento so quando o extrato deixa claro (nao chuta cartao: ele tem taxa). */
export function inferirFormaPagamento(descricao: string): string {
  const d = normalizarTexto(descricao)
  if (/^pix\b/.test(d)) return "pix"
  if (/^pagamento de boleto\b/.test(d)) return "boleto"
  return ""
}

export function lerDespesasPlanilha(linhasBrutas: CelulaPlanilha[][]): ResultadoLeituraDespesas {
  let indiceCabecalho = -1
  let colunas: Partial<Record<ChaveColuna, number>> = {}
  for (let i = 0; i < Math.min(linhasBrutas.length, 10); i += 1) {
    const mapa = mapearCabecalho(linhasBrutas[i] || [])
    if (mapa.data !== undefined && mapa.valor !== undefined) {
      indiceCabecalho = i
      colunas = mapa
      break
    }
  }

  if (indiceCabecalho < 0) {
    return {
      linhas: [],
      erros: [{ linhaPlanilha: 1, mensagem: 'Cabecalho nao encontrado. A planilha precisa ter as colunas "Data de pagamento" e "Valor".' }],
    }
  }

  const linhas: LinhaDespesaImportada[] = []
  const erros: ErroImportacao[] = []
  const pegar = (linha: CelulaPlanilha[], chave: ChaveColuna) => {
    const indice = colunas[chave]
    return indice === undefined ? "" : texto(linha[indice])
  }

  for (let i = indiceCabecalho + 1; i < linhasBrutas.length; i += 1) {
    const linha = linhasBrutas[i] || []
    const linhaPlanilha = i + 1
    if (linha.every((celula) => texto(celula) === "" && !(celula instanceof Date))) continue

    const dataPagamento = lerDataPlanilha(linha[colunas.data as number])
    if (!dataPagamento) {
      erros.push({ linhaPlanilha, mensagem: "Data de pagamento ausente ou invalida." })
      continue
    }

    const valorBruto = lerValorPlanilha(linha[colunas.valor as number])
    if (valorBruto === null) {
      erros.push({ linhaPlanilha, mensagem: "Valor ausente ou invalido." })
      continue
    }
    const valor = Math.round(valorBruto * 100) / 100
    if (valor <= 0) {
      erros.push({ linhaPlanilha, mensagem: "O valor precisa ser maior que zero." })
      continue
    }

    const recebedor = pegar(linha, "recebedor")
    const descricaoOriginal = pegar(linha, "descricao")
    const descricao = (descricaoOriginal || recebedor || "Despesa importada").slice(0, 250)

    linhas.push({
      linhaPlanilha,
      dataPagamento,
      valor,
      recebedor,
      categoria: pegar(linha, "categoria") || "Outros",
      descricao,
      formaPagamento: inferirFormaPagamento(descricaoOriginal),
    })
  }

  return { linhas, erros }
}

/** Chave para comparar com lancamentos ja gravados (mesma data, valor e descricao). */
export function chaveDespesa(dataIso: string, valor: number, descricao: string): string {
  return `${dataIso}|${Math.round(valor * 100)}|${normalizarTexto(descricao)}`
}

/**
 * Separa as linhas que ja existem no sistema. Linhas repetidas dentro da propria
 * planilha sao legitimas (ex.: duas tarifas iguais no mesmo dia), entao a
 * comparacao consome uma ocorrencia existente por linha da planilha.
 */
export function separarDuplicadas<T extends { dataPagamento: string; valor: number; descricao: string }>(
  linhas: T[],
  existentes: Array<{ dataPagamento: string; valor: number; descricao: string }>,
): { novas: T[]; duplicadas: T[] } {
  const restantes = new Map<string, number>()
  for (const item of existentes) {
    const chave = chaveDespesa(item.dataPagamento, item.valor, item.descricao)
    restantes.set(chave, (restantes.get(chave) || 0) + 1)
  }

  const novas: T[] = []
  const duplicadas: T[] = []
  for (const linha of linhas) {
    const chave = chaveDespesa(linha.dataPagamento, linha.valor, linha.descricao)
    const disponivel = restantes.get(chave) || 0
    if (disponivel > 0) {
      restantes.set(chave, disponivel - 1)
      duplicadas.push(linha)
    } else {
      novas.push(linha)
    }
  }
  return { novas, duplicadas }
}
