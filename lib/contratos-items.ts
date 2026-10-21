export type ContratoItemEditavel = {
  id?: string
  nome: string
  frequencia?: string
  limites?: string
}

export type ContratoItemPayload = {
  id: string | null
  nome: string
  frequencia: string | null
  limites: string | null
}

export function buildContratoItensPayload(
  items: readonly ContratoItemEditavel[],
): ContratoItemPayload[] {
  return items.map((item) => ({
    id: item.id || null,
    nome: item.nome,
    frequencia: item.frequencia || null,
    limites: item.limites || null,
  }))
}
