export type ClienteLocalData = {
  id?: string
  nome: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  tipoAmbiente: string
  tipoAtividade: string
}

export function mapClienteLocalFromDb(row: Record<string, unknown>): ClienteLocalData {
  return {
    id: row.id == null ? undefined : String(row.id),
    nome: String(row.nome || ""),
    cep: String(row.cep || ""),
    endereco: String(row.endereco || ""),
    numero: String(row.numero || ""),
    complemento: String(row.complemento || ""),
    bairro: String(row.bairro || ""),
    cidade: String(row.cidade || ""),
    estado: String(row.estado || ""),
    tipoAmbiente: String(row.tipo_ambiente || ""),
    tipoAtividade: String(row.tipo_atividade || ""),
  }
}

export function mapClienteLocalToDb(local: Partial<ClienteLocalData>) {
  return {
    nome: local.nome || null,
    cep: local.cep || null,
    endereco: local.endereco || null,
    numero: local.numero || null,
    complemento: local.complemento || null,
    bairro: local.bairro || null,
    cidade: local.cidade || null,
    estado: local.estado || null,
    tipo_ambiente: local.tipoAmbiente || null,
    tipo_atividade: local.tipoAtividade || null,
  }
}

export function resolveLocalActivity(local?: Partial<ClienteLocalData> | null): string {
  return local?.tipoAtividade?.trim() || local?.tipoAmbiente?.trim() || ""
}
