function escapeSearchTerm(value: string): string {
  return value.trim().replace(/[%_]/g, "\\$&")
}

export type ClienteSearchFields = {
  nome?: string
  nomeFantasia?: string
  email?: string
  telefone?: string
  cpf?: string
  cnpj?: string
}

export function normalizeClienteSearchValue(value: unknown): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export function buildLocalAddressSearchFilter(search: string): string {
  const term = escapeSearchTerm(search)
  return ["endereco", "numero", "bairro", "cidade", "cep", "nome"]
    .map((field) => `${field}.ilike.%${term}%`)
    .join(",")
}

export function buildClienteTextSearchFilter(search: string, localClientIds: string[]): string {
  const term = escapeSearchTerm(search)
  const filters = [`nome.ilike.%${term}%`]
  const ids = [...new Set(localClientIds.filter((id) => /^[a-zA-Z0-9-]+$/.test(id)))]
  if (ids.length > 0) filters.push(`id.in.(${ids.join(",")})`)
  return filters.join(",")
}

export function buildClienteIdentitySearchFilter(search: string): string {
  const term = escapeSearchTerm(search)
  return ["nome", "nome_fantasia", "email", "telefone", "cpf", "cnpj"]
    .map((field) => `${field}.ilike.%${term}%`)
    .join(",")
}

export function clienteMatchesSearch(cliente: ClienteSearchFields, search: string): boolean {
  const term = normalizeClienteSearchValue(search)
  if (!term) return true
  return [cliente.nome, cliente.nomeFantasia, cliente.email, cliente.telefone, cliente.cpf, cliente.cnpj]
    .some((value) => normalizeClienteSearchValue(value).includes(term))
}

export function rankClienteSearchResult(cliente: ClienteSearchFields, search: string): number {
  const term = normalizeClienteSearchValue(search)
  if (!term) return 0
  const nome = normalizeClienteSearchValue(cliente.nome)
  const fantasia = normalizeClienteSearchValue(cliente.nomeFantasia)
  const identifiers = [cliente.telefone, cliente.cpf, cliente.cnpj].map(normalizeClienteSearchValue)
  const email = normalizeClienteSearchValue(cliente.email)

  if (nome === term || fantasia === term || identifiers.includes(term)) return 0
  if (nome.startsWith(term) || fantasia.startsWith(term)) return 1
  if (new RegExp(`(^|\\s|[/.-])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s|[/.-])`).test(nome)) return 2
  if (nome.includes(term)) return 3
  if (fantasia.includes(term)) return 4
  if (identifiers.some((value) => value.includes(term))) return 5
  if (email.includes(term)) return 6
  return 10
}

export function appendLocalClientIds(filter: string, localClientIds: string[]): string {
  const ids = [...new Set(localClientIds.filter((id) => /^[a-zA-Z0-9-]+$/.test(id)))]
  return ids.length > 0 ? `${filter},id.in.(${ids.join(",")})` : filter
}
