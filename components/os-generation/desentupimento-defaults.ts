import type { DadosTecnicosDesentupimento } from "./desentupimento-form.tsx"

type OrigemDadosDesentupimento = {
  usuario: string
  inicio: string
  fim: string
  servico: string
  modoCobranca: "contrato" | "adicional" | "avulso"
  valor: string
  formaPagamento: string
}

const formasPagamento: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  boleto: "Boleto",
  transferencia: "Transferência",
}

const responsavelPadraoDesentupimento = "Bruna Freitas"

function formatarHorario(inicio: string, fim: string): string {
  if (inicio && fim) return `${inicio} - ${fim}`
  return inicio || fim
}

function parseValor(value: string): number | null {
  const limpo = value.replace(/R\$\s?/gi, "").replace(/\s/g, "")
  if (!limpo) return null

  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo
  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : null
}

function formatarValor(value: string, modo: OrigemDadosDesentupimento["modoCobranca"]): string {
  if (modo === "contrato") return "Incluso no contrato"
  const numero = parseValor(value)
  if (numero === null) return ""
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\u00a0/g, " ")
}

export function preencherDadosDesentupimento(
  dados: DadosTecnicosDesentupimento,
  origem: OrigemDadosDesentupimento,
): DadosTecnicosDesentupimento {
  const servico = origem.servico.trim()
  const valorServico = formatarValor(origem.valor, origem.modoCobranca)

  return {
    ...dados,
    horaServico: dados.horaServico || formatarHorario(origem.inicio, origem.fim),
    atendente: dados.atendente || responsavelPadraoDesentupimento,
    tecnico: dados.tecnico || responsavelPadraoDesentupimento,
    vendedor: dados.vendedor || responsavelPadraoDesentupimento,
    condicaoPagamento: dados.condicaoPagamento || formasPagamento[origem.formaPagamento] || origem.formaPagamento,
    servicos: dados.servicos.length > 0 || (!servico && !valorServico)
      ? dados.servicos
      : [{
          id: "servico-solicitacao",
          descricao: servico,
          garantia: "",
          valorServico,
        }],
  }
}
