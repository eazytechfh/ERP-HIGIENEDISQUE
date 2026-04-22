"use client"

import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase } from "@/lib/supabase/profiles-repo"

export type EstoqueCategoria = "Item Quimico" | "Diluente" | "Consumivel" | "Equipamentos" | "EPIs"
export type EstoqueUnidade = "L" | "ml" | "g" | "kg" | "unid"

export type ProdutoSupabaseItem = {
  id: string
  nome: string
  marca: string
  fornecedorId: string
  fornecedor: string
  estoqueAtual: number
  estoqueMinimo: number
  unidade: EstoqueUnidade
  categoria: EstoqueCategoria
  custoUnitario: number
  ativo: boolean
}

export type ProdutoSupabaseInput = {
  id?: string
  nome: string
  marca: string
  fornecedorId: string
  estoqueAtual?: number
  estoqueMinimo: number
  unidade: EstoqueUnidade
  categoria: EstoqueCategoria
  custoUnitario?: number
  ativo: boolean
}

export type FornecedorSupabaseItem = {
  id: string
  razaoSocial: string
  cnpj: string
  telefone: string
  email: string
  endereco: {
    rua: string
    numero: string
    bairro: string
    cidade: string
    uf: string
  }
  nomeContato: string
  observacoes: string
  ativo: boolean
}

export type FornecedorSupabaseInput = {
  id?: string
  razaoSocial: string
  cnpj: string
  telefone: string
  email: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  nomeContato: string
  observacoes: string
  ativo: boolean
}

export type NotaFiscalEntradaItemInput = {
  produtoId: string
  quantidade: number
  unidade: EstoqueUnidade
  custoUnitario: number
}

export type NotaFiscalEntradaInput = {
  fornecedorId: string
  numeroNF: string
  dataNF: string
  itens: NotaFiscalEntradaItemInput[]
  observacoes?: string
  arquivo?: File | null
}

export type NotaFiscalHistoricoItem = {
  id: string
  produtoId: string
  produtoNome: string
  quantidade: number
  unidade: string
  custoUnitario: number
}

export type NotaFiscalHistorico = {
  id: string
  fornecedorId: string
  fornecedor: string
  numeroNF: string
  dataNF: string
  observacoes: string
  createdAt: string
  arquivoNome: string
  arquivoMimeType: string
  arquivoStorageBucket: string
  arquivoStoragePath: string
  arquivoTamanho: number
  itens: NotaFiscalHistoricoItem[]
}

const categoriasValidas: EstoqueCategoria[] = ["Item Quimico", "Diluente", "Consumivel", "Equipamentos", "EPIs"]
const unidadesValidas: EstoqueUnidade[] = ["L", "ml", "g", "kg", "unid"]

function asCategoria(value: unknown): EstoqueCategoria {
  return categoriasValidas.includes(value as EstoqueCategoria) ? (value as EstoqueCategoria) : "Consumivel"
}

function asUnidade(value: unknown): EstoqueUnidade {
  return unidadesValidas.includes(value as EstoqueUnidade) ? (value as EstoqueUnidade) : "unid"
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function mapDbToProduto(row: any): ProdutoSupabaseItem {
  const fornecedor = row.fornecedores
  return {
    id: String(row.id),
    nome: row.nome || "",
    marca: row.marca || "",
    fornecedorId: row.fornecedor_id ? String(row.fornecedor_id) : "",
    fornecedor: fornecedor?.razao_social || "",
    estoqueAtual: asNumber(row.estoque_atual),
    estoqueMinimo: asNumber(row.estoque_minimo),
    unidade: asUnidade(row.unidade),
    categoria: asCategoria(row.categoria),
    custoUnitario: asNumber(row.custo_unitario),
    ativo: Boolean(row.ativo ?? true),
  }
}

function mapProdutoToDb(input: ProdutoSupabaseInput) {
  return {
    id: input.id,
    nome: input.nome,
    marca: input.marca || null,
    fornecedor_id: input.fornecedorId || null,
    estoque_atual: input.estoqueAtual ?? 0,
    estoque_minimo: input.estoqueMinimo,
    unidade: input.unidade,
    categoria: input.categoria,
    custo_unitario: input.custoUnitario ?? 0,
    ativo: Boolean(input.ativo),
    deleted_at: null,
  }
}

function mapDbToFornecedor(row: any): FornecedorSupabaseItem {
  return {
    id: String(row.id),
    razaoSocial: row.razao_social || "",
    cnpj: row.cnpj || "",
    telefone: row.telefone || "",
    email: row.email || "",
    endereco: {
      rua: row.rua || "",
      numero: row.numero || "",
      bairro: row.bairro || "",
      cidade: row.cidade || "",
      uf: row.uf || "",
    },
    nomeContato: row.nome_contato || "",
    observacoes: row.observacoes || "",
    ativo: Boolean(row.ativo ?? true),
  }
}

function mapDbToNotaFiscal(row: any): NotaFiscalHistorico {
  return {
    id: String(row.id),
    fornecedorId: row.fornecedor_id ? String(row.fornecedor_id) : "",
    fornecedor: row.fornecedores?.razao_social || "",
    numeroNF: row.numero_nf || "",
    dataNF: row.data_nf || "",
    observacoes: row.observacoes || "",
    createdAt: row.created_at || "",
    arquivoNome: row.arquivo_nome || "",
    arquivoMimeType: row.arquivo_mime_type || "",
    arquivoStorageBucket: row.arquivo_storage_bucket || "",
    arquivoStoragePath: row.arquivo_storage_path || "",
    arquivoTamanho: asNumber(row.arquivo_tamanho),
    itens: Array.isArray(row.nota_fiscal_itens)
      ? row.nota_fiscal_itens.map((item: any) => ({
          id: String(item.id),
          produtoId: item.produto_id ? String(item.produto_id) : "",
          produtoNome: item.produtos?.nome || "",
          quantidade: asNumber(item.quantidade),
          unidade: item.unidade || "",
          custoUnitario: asNumber(item.custo_unitario),
        }))
      : [],
  }
}

function mapFornecedorToDb(input: FornecedorSupabaseInput) {
  return {
    id: input.id,
    razao_social: input.razaoSocial,
    cnpj: input.cnpj || null,
    telefone: input.telefone || null,
    email: input.email || null,
    rua: input.rua || null,
    numero: input.numero || null,
    bairro: input.bairro || null,
    cidade: input.cidade || null,
    uf: input.uf || null,
    nome_contato: input.nomeContato || null,
    observacoes: input.observacoes || null,
    ativo: Boolean(input.ativo),
    deleted_at: null,
  }
}

export async function listProdutosSupabase(): Promise<ProdutoSupabaseItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("produtos")
    .select("*, fornecedores(id, razao_social)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToProduto)
}

export async function upsertProdutoSupabase(input: ProdutoSupabaseInput): Promise<ProdutoSupabaseItem> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "estoque.edit" : "estoque.create",
    "Voce nao possui permissao para salvar produtos.",
  )

  const supabase = getSupabaseBrowserClient()
  const { data: saved, error: saveError } = await supabase
    .from("produtos")
    .upsert(mapProdutoToDb(input))
    .select("id")
    .single()

  if (saveError) throw saveError

  const { data, error } = await supabase
    .from("produtos")
    .select("*, fornecedores(id, razao_social)")
    .eq("id", saved.id)
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  const produto = mapDbToProduto(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "produto",
    entityId: produto.id,
    entityLabel: produto.nome,
    description: isEditing ? "Produto atualizado no estoque." : "Novo produto cadastrado no estoque.",
  })

  return produto
}

export async function deleteProdutoSupabase(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.rpc("soft_delete_produto", { p_id: id })

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "produto",
    entityId: id,
    entityLabel: id,
    description: "Produto excluido do estoque.",
  })
}

export async function listFornecedoresSupabase(): Promise<FornecedorSupabaseItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .is("deleted_at", null)
    .order("razao_social", { ascending: true })

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToFornecedor)
}

export async function upsertFornecedorSupabase(input: FornecedorSupabaseInput): Promise<FornecedorSupabaseItem> {
  const isEditing = Boolean(input.id)
  await assertPermissionSupabase(
    isEditing ? "estoque.edit" : "estoque.create",
    "Voce nao possui permissao para salvar fornecedores.",
  )

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("fornecedores")
    .upsert(mapFornecedorToDb(input))
    .select("*")
    .single()

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  const fornecedor = mapDbToFornecedor(data)

  await safeAuditLogSupabase({
    action: isEditing ? "update" : "create",
    entity: "fornecedor",
    entityId: fornecedor.id,
    entityLabel: fornecedor.razaoSocial,
    description: isEditing ? "Fornecedor atualizado no sistema." : "Novo fornecedor cadastrado no sistema.",
  })

  return fornecedor
}

export async function deleteFornecedorSupabase(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.rpc("soft_delete_fornecedor", { p_id: id })

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "fornecedor",
    entityId: id,
    entityLabel: id,
    description: "Fornecedor excluido do sistema.",
  })
}

export async function registrarEntradaNotaFiscalSupabase(input: NotaFiscalEntradaInput): Promise<string> {
  await assertPermissionSupabase("estoque.create", "Voce nao possui permissao para registrar nota fiscal.")

  const supabase = getSupabaseBrowserClient()

  const { data: notaSalva, error: notaError } = await supabase
    .from("notas_fiscais_entrada")
    .insert({
      fornecedor_id: input.fornecedorId,
      numero_nf: input.numeroNF,
      data_nf: input.dataNF,
      observacoes: input.observacoes || null,
    })
    .select("id")
    .single()

  if (notaError) throw notaError

  const itensPayload = input.itens.map((item) => ({
    nota_fiscal_id: notaSalva.id,
    produto_id: item.produtoId,
    quantidade: item.quantidade,
    unidade: item.unidade,
    custo_unitario: item.custoUnitario,
  }))

  const { error: itensError } = await supabase
    .from("nota_fiscal_itens")
    .insert(itensPayload)

  if (itensError) throw itensError

  if (input.arquivo) {
    const fileName = sanitizeFileName(input.arquivo.name || "nota-fiscal")
    const storagePath = `${notaSalva.id}/${Date.now()}-${fileName}`
    const bucket = "notas-fiscais"

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, input.arquivo, {
        upsert: false,
        contentType: input.arquivo.type || "application/octet-stream",
      })

    if (uploadError) throw uploadError

    const { error: updateArquivoError } = await supabase
      .from("notas_fiscais_entrada")
      .update({
        arquivo_nome: input.arquivo.name,
        arquivo_mime_type: input.arquivo.type || "application/octet-stream",
        arquivo_storage_bucket: bucket,
        arquivo_storage_path: storagePath,
        arquivo_tamanho: input.arquivo.size,
      })
      .eq("id", notaSalva.id)

    if (updateArquivoError) throw updateArquivoError
  }

  await safeAuditLogSupabase({
    action: "create",
    entity: "nota_fiscal_entrada",
    entityId: String(notaSalva.id),
    entityLabel: input.numeroNF,
    description: "Entrada de nota fiscal registrada no estoque.",
    metadata: {
      fornecedorId: input.fornecedorId || "",
      itens: input.itens.length,
    },
  })

  return String(notaSalva.id)
}

export async function listNotasFiscaisSupabase(): Promise<NotaFiscalHistorico[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("notas_fiscais_entrada")
    .select(`
      *,
      fornecedores(id, razao_social),
      nota_fiscal_itens(
        *,
        produtos(id, nome)
      )
    `)
    .is("deleted_at", null)
    .order("data_nf", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return (data || []).map(mapDbToNotaFiscal)
}

export async function getNotaFiscalArquivoUrl(
  bucket: string,
  path: string,
): Promise<string> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10)
  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))
  return data.signedUrl
}

export async function deleteNotaFiscalSupabase(
  id: string,
  arquivo?: { bucket: string; path: string } | null,
): Promise<void> {
  await assertPermissionSupabase("estoque.delete", "Voce nao possui permissao para excluir notas fiscais.")

  const supabase = getSupabaseBrowserClient()

  if (arquivo?.bucket && arquivo?.path) {
    const { error: storageError } = await supabase.storage.from(arquivo.bucket).remove([arquivo.path])
    if (storageError) throw storageError
  }

  const { error } = await supabase
    .from("notas_fiscais_entrada")
    .delete()
    .eq("id", id)

  if (error) throw new Error((error as any).message || (error as any).code || JSON.stringify(error))

  await safeAuditLogSupabase({
    action: "delete",
    entity: "nota_fiscal_entrada",
    entityId: id,
    entityLabel: id,
    description: "Nota fiscal removida do estoque.",
  })
}
