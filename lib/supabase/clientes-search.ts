function escapeSearchTerm(value: string): string {
  return value.replace(/[%_]/g, "\\$&")
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

export function appendLocalClientIds(filter: string, localClientIds: string[]): string {
  const ids = [...new Set(localClientIds.filter((id) => /^[a-zA-Z0-9-]+$/.test(id)))]
  return ids.length > 0 ? `${filter},id.in.(${ids.join(",")})` : filter
}
