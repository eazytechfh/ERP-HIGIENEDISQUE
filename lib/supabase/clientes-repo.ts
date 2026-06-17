"use client"

import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase } from "@/lib/supabase/profiles-repo"

export type ClienteLocalInput = {
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
}

export type ClienteContatoInput = {
  id?: string
  nome: string
  cargo: string
  telefone: string
  email: string
  principal: boolean
}

export type ClienteArquivoInput = {
  id?: string
  nome: string
  mimeType: string
  conteudoBase64: string
  criadoEm: string
  tamanho?: number
  origem?: string
  contratoId?: string
  storageBucket?: string
  storagePath?: string
}

export type ClienteInput = {
  id?: string
  tipoCliente: "pf" | "pj"
  nome: string
  nomeFantasia: string
  telefone: string
  email: string
  status: "Ativo" | "Inativo" | "Suspenso"
  cpf: string
  cnpj: string
  inscricaoEstadual: string
  inscricaoMunicipal: string
  locais: ClienteLocalInput[]
  contatos: ClienteContatoInput[]
  canalPreferencial: string
  horariosContato: string
  notifAgendamentos: boolean
  notifLembretes: boolean
  notifCertificados: boolean
  notifCobrancas: boolean
  horariosAtendimento: string
  autorizacaoPrevia: boolean
  epiEspecifico: boolean
  possuiPets: boolean
  observacoesOperacionais: string
  possuiContrato: boolean
  tipoContrato: string
  dataInicioContrato: string
  dataFimContrato: string
  situacaoContrato: string
  observacoesInternas: string
  arquivos: ClienteArquivoInput[]
}

function emptyArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

function mapDbToCliente(row: any): ClienteInput {
  return {
    id: String(row.id),
    tipoCliente: row.tipo_cliente === "pj" ? "pj" : "pf",
    nome: row.nome || "",
    nomeFantasia: row.nome_fantasia || "",
    telefone: row.telefone || "",
    email: row.email || "",
    status: (row.status || "Ativo") as ClienteInput["status"],
    cpf: row.cpf || "",
    cnpj: row.cnpj || "",
    inscricaoEstadual: row.inscricao_estadual || "",
    inscricaoMunicipal: row.inscricao_municipal || "",
    locais: emptyArray(row.cliente_locais).map((l: any) => ({
      id: String(l.id),
      nome: l.nome || "",
      cep: l.cep || "",
      endereco: l.endereco || "",
      numero: l.numero || "",
      complemento: l.complemento || "",
      bairro: l.bairro || "",
      cidade: l.cidade || "",
      estado: l.estado || "",
      tipoAmbiente: l.tipo_ambiente || "",
    })),
    contatos: emptyArray(row.cliente_contatos).map((c: any) => ({
      id: String(c.id),
      nome: c.nome || "",
      cargo: c.cargo || "",
      telefone: c.telefone || "",
      email: c.email || "",
      principal: Boolean(c.principal),
    })),
    canalPreferencial: row.canal_preferencial || "whatsapp",
    horariosContato: row.horarios_contato || "",
    notifAgendamentos: Boolean(row.notif_agendamentos ?? true),
    notifLembretes: Boolean(row.notif_lembretes ?? true),
    notifCertificados: Boolean(row.notif_certificados ?? false),
    notifCobrancas: Boolean(row.notif_cobrancas ?? true),
    horariosAtendimento: row.horarios_atendimento || "",
    autorizacaoPrevia: Boolean(row.autorizacao_previa ?? false),
    epiEspecifico: Boolean(row.epi_especifico ?? false),
    possuiPets: Boolean(row.possui_pets ?? false),
    observacoesOperacionais: row.observacoes_operacionais || "",
    possuiContrato: Boolean(row.possui_contrato ?? false),
    tipoContrato: row.tipo_contrato || "",
    dataInicioContrato: row.data_inicio_contrato || "",
    dataFimContrato: row.data_fim_contrato || "",
    situacaoContrato: row.situacao_contrato || "",
    observacoesInternas: row.observacoes_internas || "",
    arquivos: emptyArray(row.cliente_arquivos).map((a: any) => ({
      id: String(a.id),
      nome: a.nome || "",
      mimeType: a.mime_type || "application/octet-stream",
      conteudoBase64: "",
      criadoEm: a.criado_em || a.created_at || new Date().toISOString(),
      tamanho: typeof a.tamanho === "number" ? a.tamanho : undefined,
      origem: a.origem || "arquivo",
      contratoId: a.contrato_id || undefined,
      storageBucket: a.storage_bucket || undefined,
      storagePath: a.storage_path || undefined,
    })),
  }
}

function mapClienteToDb(cliente: ClienteInput) {
  return {
    id: cliente.id,
    tipo_cliente: cliente.tipoCliente,
    nome: cliente.nome,
    nome_fantasia: cliente.nomeFantasia || null,
    telefone: cliente.telefone || null,
    email: cliente.email || null,
    status: cliente.status,
    cpf: cliente.cpf || null,
    cnpj: cliente.cnpj || null,
    inscricao_estadual: cliente.inscricaoEstadual || null,
    inscricao_municipal: cliente.inscricaoMunicipal || null,
    canal_preferencial: cliente.canalPreferencial || null,
    horarios_contato: cliente.horariosContato || null,
    notif_agendamentos: Boolean(cliente.notifAgendamentos),
    notif_lembretes: Boolean(cliente.notifLembretes),
    notif_certificados: Boolean(cliente.notifCertificados),
    notif_cobrancas: Boolean(cliente.notifCobrancas),
    horarios_atendimento: cliente.horariosAtendimento || null,
    autorizacao_previa: Boolean(cliente.autorizacaoPrevia),
    epi_especifico: Boolean(cliente.epiEspecifico),
    possui_pets: Boolean(cliente.possuiPets),
    observacoes_operacionais: cliente.observacoesOperacionais || null,
    possui_contrato: Boolean(cliente.possuiContrato),
    tipo_contrato: cliente.tipoContrato || null,
    data_inicio_contrato: cliente.dataInicioContrato || null,
    data_fim_contrato: cliente.dataFimContrato || null,
    situacao_contrato: cliente.situacaoContrato || null,
    observacoes_internas: cliente.observacoesInternas || null,
    deleted_at: null,
  }
}

// Colunas mínimas para seletores (Serviços, Histórico) — não inclui campos longos desnecessários
export const CLIENTE_COLUMNS_SELETOR = "id,nome,nome_fantasia,telefone,email,cpf,cnpj,tipo_cliente"

// Colunas mínimas para verificação de duplicatas — só o que é comparado
export const CLIENTE_COLUMNS_DUPLICATAS = "id,nome,telefone,email,cpf,cnpj"

export type ListClientesParams = {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  nomeOnly?: boolean
  columns?: string
}

export type ListClientesResult = {
  data: ClienteInput[]
  count: number
}

export async function listClientesSupabase(params?: ListClientesParams): Promise<ListClientesResult> {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = getSupabaseBrowserClient()
  const selectColumns = params?.columns ?? "*"
  let query = supabase
    .from("clientes")
    .select(selectColumns, { count: "estimated" })
    .is("deleted_at", null)
    .order("nome", { ascending: true })
    .range(from, to)

  if (params?.search) {
    const term = params.search.replace(/[%_]/g, "\\$&")
    // Detecta se o termo é numérico (telefone/cpf/cnpj) ou textual (nome).
    // OR em 4 colunas simultaneamente impede o uso eficiente dos índices trigram.
    const isNumeric = /^[\d\s\-\.\(\)\/]+$/.test(params.search)
    if (isNumeric) {
      query = query.or(`telefone.ilike.%${term}%,cpf.ilike.%${term}%,cnpj.ilike.%${term}%`)
    } else {
      query = query.ilike("nome", `%${term}%`)
    }
  }

  if (params?.status && params.status !== "todos") {
    query = query.eq("status", params.status)
  }

  const { data, error, count } = await query
  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return {
    data: (data || []).map((row) => mapDbToCliente({ ...row, cliente_locais: [], cliente_contatos: [], cliente_arquivos: [] })),
    count: count ?? 0,
  }
}

export type ClientesMetricas = {
  totalAtivos: number
  totalAVencer: number
  totalVencidos: number
  total: number
}

export async function getClientesMetricasSupabase(): Promise<ClientesMetricas> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("get_clientes_metricas")
  if (error) throw new Error(error.message)
  return data as ClientesMetricas
}

export type ClienteContratoAVencer = {
  id: string
  nome: string
  dataFimContrato: string
}

export async function listClientesContratoAVencerSupabase(): Promise<ClienteContratoAVencer[]> {
  const supabase = getSupabaseBrowserClient()
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const em30Dias = new Date(hoje)
  em30Dias.setDate(hoje.getDate() + 30)

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, data_fim_contrato")
    .is("deleted_at", null)
    .eq("status", "Ativo")
    .eq("possui_contrato", true)
    .gte("data_fim_contrato", hoje.toISOString().split("T")[0])
    .lte("data_fim_contrato", em30Dias.toISOString().split("T")[0])
    .order("data_fim_contrato", { ascending: true })
    .limit(50)

  if (error) throw new Error((error as any).message || JSON.stringify(error))
  return (data || []).map((row: any) => ({
    id: String(row.id),
    nome: row.nome || "",
    dataFimContrato: row.data_fim_contrato || "",
  }))
}

export async function getClienteSupabase(clienteId: string): Promise<ClienteInput> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("clientes")
    .select(`*, cliente_locais(*), cliente_contatos(*), cliente_arquivos(*)`)
    .eq("id", clienteId)
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return mapDbToCliente(data)
}

export async function upsertClienteSupabase(input: ClienteInput): Promise<ClienteInput> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "clientes.edit" : "clientes.create",
    "Voce nao possui permissao para salvar clientes.",
  )

  const supabase = getSupabaseBrowserClient()

  const payload = mapClienteToDb(input)
  const { data: saved, error: saveError } = await supabase
    .from("clientes")
    .upsert(payload)
    .select("id")
    .single()

  if (saveError) throw saveError

  const clienteId = String(saved.id)

  const { error: delLocaisError } = await supabase.from("cliente_locais").delete().eq("cliente_id", clienteId)
  if (delLocaisError) throw delLocaisError

  const { error: delContatosError } = await supabase.from("cliente_contatos").delete().eq("cliente_id", clienteId)
  if (delContatosError) throw delContatosError

  const { error: delArquivosError } = await supabase.from("cliente_arquivos").delete().eq("cliente_id", clienteId)
  if (delArquivosError) throw delArquivosError

  const locaisRows = emptyArray(input.locais).map((l) => ({
    cliente_id: clienteId,
    nome: l.nome || null,
    cep: l.cep || null,
    endereco: l.endereco || null,
    numero: l.numero || null,
    complemento: l.complemento || null,
    bairro: l.bairro || null,
    cidade: l.cidade || null,
    estado: l.estado || null,
    tipo_ambiente: l.tipoAmbiente || null,
  }))

  if (locaisRows.length > 0) {
    const { error } = await supabase.from("cliente_locais").insert(locaisRows)
    if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  }

  const contatosRows = emptyArray(input.contatos).map((c) => ({
    cliente_id: clienteId,
    nome: c.nome || null,
    cargo: c.cargo || null,
    telefone: c.telefone || null,
    email: c.email || null,
    principal: Boolean(c.principal),
  }))

  if (contatosRows.length > 0) {
    const { error } = await supabase.from("cliente_contatos").insert(contatosRows)
    if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  }

  const arquivosRows = emptyArray(input.arquivos).map((a) => ({
    cliente_id: clienteId,
    nome: a.nome,
    mime_type: a.mimeType || null,
    storage_bucket: null,
    storage_path: null,
    tamanho: a.tamanho ?? null,
    origem: a.origem || null,
    contrato_id: a.contratoId || null,
    criado_em: a.criadoEm || new Date().toISOString(),
  }))

  if (arquivosRows.length > 0) {
    const { error } = await supabase.from("cliente_arquivos").insert(arquivosRows)
    if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  }

  const { data: full, error: fullError } = await supabase
    .from("clientes")
    .select(`
      *,
      cliente_locais(*),
      cliente_contatos(*),
      cliente_arquivos(*)
    `)
    .eq("id", clienteId)
    .single()

  if (fullError) throw fullError
  const cliente = mapDbToCliente(full)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "cliente",
    entityId: clienteId,
    entityLabel: cliente.nome,
    description: isEditing ? "Cliente atualizado no sistema." : "Novo cliente cadastrado no sistema.",
    metadata: {
      status: cliente.status,
      tipoCliente: cliente.tipoCliente,
    },
  })

  return cliente
}

export async function deleteClienteSupabase(clienteId: string): Promise<void> {
  await assertPermissionSupabase("clientes.delete", "Voce nao possui permissao para excluir clientes.")

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("clientes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clienteId)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "cliente",
    entityId: clienteId,
    entityLabel: clienteId,
    description: "Cliente removido do sistema.",
  })
}
