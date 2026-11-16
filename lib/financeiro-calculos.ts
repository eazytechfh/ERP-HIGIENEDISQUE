// Calculos financeiros puros (sem React/Supabase) para poderem ser testados.
// A mesma regra de taxa existe no banco (financeiro_solicitar_baixa); mantenha as duas iguais.

export type ModalidadeCartao = "cartao_credito" | "cartao_debito"

export const MAX_PARCELAS = 36
export const MAX_PARCELAS_CARTAO = 21

/** Chave da taxa de cartao: debito e sempre 1x; credito varia com as parcelas da venda. */
export function chaveTaxaCartao(modalidade: ModalidadeCartao, parcelas: number): string {
  return `${modalidade}:${modalidade === "cartao_debito" ? 1 : parcelas}`
}

export function rotuloTaxaCartao(modalidade: ModalidadeCartao, parcelas: number): string {
  if (modalidade === "cartao_debito") return "Debito"
  return parcelas <= 1 ? "Credito a vista" : `Credito ${parcelas}x`
}

export function isModalidadeCartao(formaPagamento: string | null | undefined): formaPagamento is ModalidadeCartao {
  return formaPagamento === "cartao_credito" || formaPagamento === "cartao_debito"
}

function toCents(value: number): number {
  return Math.round(value * 100)
}

/**
 * Divide o total em parcelas iguais; os centavos que sobram vao para as
 * primeiras parcelas, entao a soma sempre fecha com o total.
 */
export function dividirEmParcelas(total: number, quantidade: number): number[] {
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > MAX_PARCELAS) {
    throw new Error(`Quantidade de parcelas deve ser entre 1 e ${MAX_PARCELAS}.`)
  }
  const totalCents = toCents(total)
  if (totalCents <= 0) throw new Error("O total precisa ser maior que zero.")
  if (totalCents < quantidade) throw new Error("O total e menor que um centavo por parcela.")

  const base = Math.floor(totalCents / quantidade)
  const resto = totalCents - base * quantidade
  return Array.from({ length: quantidade }, (_, index) => (base + (index < resto ? 1 : 0)) / 100)
}

function diasNoMes(ano: number, mes: number): number {
  // mes: 1-12
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate()
}

/**
 * Soma meses a uma data YYYY-MM-DD mantendo o dia; se o mes nao tiver o dia
 * (ex.: 31 em fevereiro), usa o ultimo dia do mes.
 */
export function adicionarMeses(dataIso: string, meses: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataIso)
  if (!match) throw new Error(`Data invalida: ${dataIso}`)
  const dia = Number(match[3])
  const indice = Number(match[1]) * 12 + (Number(match[2]) - 1) + meses
  const ano = Math.floor(indice / 12)
  const mes = (indice % 12) + 1
  const diaFinal = Math.min(dia, diasNoMes(ano, mes))
  return `${ano}-${String(mes).padStart(2, "0")}-${String(diaFinal).padStart(2, "0")}`
}

export type ParcelaPlanejada = {
  numero: number
  total: number
  valor: number
  dataVencimento: string
}

/** Parcelas mensais a partir do primeiro vencimento. */
export function planejarParcelas(input: { total: number; quantidade: number; primeiroVencimento: string }): ParcelaPlanejada[] {
  const valores = dividirEmParcelas(input.total, input.quantidade)
  return valores.map((valor, index) => ({
    numero: index + 1,
    total: input.quantidade,
    valor,
    dataVencimento: adicionarMeses(input.primeiroVencimento, index),
  }))
}

export function descricaoParcela(descricao: string, numero: number, total: number): string {
  return total > 1 ? `${descricao} (${numero}/${total})` : descricao
}

export type CalculoTaxa = {
  valorBruto: number
  taxaPercentual: number
  taxaValor: number
  valorLiquido: number
}

/** Taxa arredondada ao centavo (meio para cima), como o round(numeric, 2) do Postgres. */
export function calcularTaxa(valorBruto: number, taxaPercentual: number): CalculoTaxa {
  const brutoCents = toCents(valorBruto)
  const taxaCentesimos = Math.round(taxaPercentual * 100) // percentual com 2 casas -> inteiro
  const taxaCents = Math.round((brutoCents * taxaCentesimos) / 10000)
  return {
    valorBruto: brutoCents / 100,
    taxaPercentual: taxaCentesimos / 100,
    taxaValor: taxaCents / 100,
    valorLiquido: (brutoCents - taxaCents) / 100,
  }
}

/** Cartao (credito, debito ou o generico "cartao" usado na OS). */
export function isFormaCartao(formaPagamento: string | null | undefined): boolean {
  return Boolean(formaPagamento && formaPagamento.startsWith("cartao"))
}

export type PlanoCobranca = {
  /** Lancamentos a criar: 1 para cartao; 1 por parcela nas demais formas. */
  lancamentos: ParcelaPlanejada[]
  /** Parcelas da venda no cartao (definem a taxa); null fora do cartao. */
  cartaoParcelas: number | null
}

/**
 * Regra das parcelas, independente da forma de pagamento:
 * - cartao: a operadora repassa o total, entao e UM lancamento com baixa unica;
 *   as parcelas so escolhem a taxa (debito e sempre 1x);
 * - demais formas (boleto, pix...): o dinheiro entra picado, entao cada parcela
 *   vira um lancamento mensal com baixa propria.
 */
export function planejarCobranca(input: {
  total: number
  quantidade: number
  primeiroVencimento: string
  formaPagamento: string
}): PlanoCobranca {
  if (isFormaCartao(input.formaPagamento)) {
    const maximo = MAX_PARCELAS_CARTAO
    if (!Number.isInteger(input.quantidade) || input.quantidade < 1 || input.quantidade > maximo) {
      throw new Error(`No cartao as parcelas devem ser entre 1 e ${maximo}.`)
    }
    return {
      lancamentos: planejarParcelas({ total: input.total, quantidade: 1, primeiroVencimento: input.primeiroVencimento }),
      cartaoParcelas: input.formaPagamento === "cartao_debito" ? 1 : input.quantidade,
    }
  }
  return {
    lancamentos: planejarParcelas({ total: input.total, quantidade: input.quantidade, primeiroVencimento: input.primeiroVencimento }),
    cartaoParcelas: null,
  }
}
