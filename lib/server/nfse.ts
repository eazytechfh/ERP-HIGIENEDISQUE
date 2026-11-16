// Regras da NFS-e no servidor: cliente no Asaas, reconciliacao e aplicacao do status.
import type { SupabaseClient } from "@supabase/supabase-js"
import { asaasFetch, resolverAmbienteAsaas, type AsaasInvoice } from "@/lib/server/asaas"
import { enderecoAsaasDoCliente, statusDocumentoPorAsaas } from "@/lib/nfse-calculos"

const somenteDigitos = (v: string | null | undefined) => String(v || "").replace(/\D/g, "")

/**
 * Cliente do ERP no Asaas: vinculo salvo -> busca por referencia externa/CPF-CNPJ -> cria.
 * Sempre envia os dados atuais do ERP (nome, contato e endereco), inclusive para
 * clientes que ja existiam no Asaas: a NFS-e exige o endereco do tomador.
 */
export async function garantirClienteAsaas(admin: SupabaseClient, clienteId: string): Promise<string> {
  const { ambiente } = resolverAmbienteAsaas()

  const { data: cliente, error } = await admin
    .from("clientes")
    .select("id, nome, cpf, cnpj, email, telefone")
    .eq("id", clienteId)
    .is("deleted_at", null)
    .maybeSingle()
  if (error || !cliente) throw new Error("Cliente nao encontrado.")

  const cpfCnpj = somenteDigitos(cliente.cnpj) || somenteDigitos(cliente.cpf)
  if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
    throw new Error(`O cliente "${cliente.nome}" precisa ter CPF ou CNPJ valido para receber NFS-e.`)
  }

  const { data: locais } = await admin
    .from("cliente_locais")
    .select("cep, endereco, numero, complemento, bairro, created_at")
    .eq("cliente_id", cliente.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
  const { endereco, faltando } = enderecoAsaasDoCliente(locais || [])
  if (!endereco) {
    throw new Error(
      `O cliente "${cliente.nome}" precisa de endereco completo para receber NFS-e. Falta: ${faltando.join(", ")}. Cadastre em Clientes > Locais.`,
    )
  }

  const telefone = somenteDigitos(cliente.telefone)
  const dados = {
    name: cliente.nome,
    cpfCnpj,
    email: cliente.email || undefined,
    mobilePhone: telefone.length >= 10 ? telefone : undefined,
    ...endereco,
  }

  const referencia = `erp-cliente-${cliente.id}`
  const { data: vinculo } = await admin
    .from("financeiro_asaas_clientes")
    .select("asaas_customer_id, ambiente")
    .eq("cliente_id", clienteId)
    .maybeSingle()

  let asaasId = vinculo?.asaas_customer_id && vinculo.ambiente === ambiente ? String(vinculo.asaas_customer_id) : ""
  if (!asaasId) {
    // A API do Asaas aceita clientes duplicados: sempre procurar antes de criar.
    const porReferencia = await asaasFetch<{ data: Array<{ id: string; deleted?: boolean }> }>(
      `/customers?externalReference=${encodeURIComponent(referencia)}&limit=1`,
    )
    asaasId = porReferencia.data?.find((c) => !c.deleted)?.id || ""
  }
  if (!asaasId) {
    const porDocumento = await asaasFetch<{ data: Array<{ id: string; deleted?: boolean }> }>(`/customers?cpfCnpj=${cpfCnpj}&limit=1`)
    asaasId = porDocumento.data?.find((c) => !c.deleted)?.id || ""
  }

  if (asaasId) {
    // Atualiza com os dados atuais do ERP (ex.: endereco cadastrado depois).
    // PUT /customers/{id}: campos undefined nao vao no JSON, entao nao apagam dados no Asaas.
    await asaasFetch(`/customers/${encodeURIComponent(asaasId)}`, { method: "PUT", body: { ...dados, externalReference: referencia } })
  } else {
    const criado = await asaasFetch<{ id: string }>("/customers", {
      method: "POST",
      body: { ...dados, externalReference: referencia, notificationDisabled: true },
    })
    asaasId = criado.id
  }

  await admin
    .from("financeiro_asaas_clientes")
    .upsert({ cliente_id: cliente.id, asaas_customer_id: asaasId, ambiente }, { onConflict: "cliente_id" })
  return asaasId
}

/** Procura no Asaas uma nota ja criada com esta referencia (antes de repetir um envio incerto). */
export async function buscarInvoicePorReferencia(externalReference: string): Promise<AsaasInvoice | null> {
  const lista = await asaasFetch<{ data: AsaasInvoice[] }>(`/invoices?externalReference=${encodeURIComponent(externalReference)}&limit=1`)
  return lista.data?.[0] || null
}

export async function buscarInvoice(invoiceId: string): Promise<AsaasInvoice> {
  return asaasFetch<AsaasInvoice>(`/invoices/${encodeURIComponent(invoiceId)}`)
}

/** Grava no documento o estado atual da nota no Asaas. Idempotente. */
export async function aplicarInvoiceNoDocumento(admin: SupabaseClient, documentoId: string, invoice: AsaasInvoice) {
  const atualizacao: Record<string, unknown> = {
    asaas_invoice_id: invoice.id,
    asaas_status: invoice.status,
    asaas_status_descricao: invoice.statusDescription || null,
    status: statusDocumentoPorAsaas(invoice.status),
    sincronizado_em: new Date().toISOString(),
    erro_motivo: invoice.status === "ERROR" ? invoice.statusDescription || "Erro informado pela prefeitura/Asaas." : null,
  }
  if (invoice.customer) atualizacao.asaas_customer_id = invoice.customer
  if (invoice.number) atualizacao.numero = String(invoice.number)
  if (invoice.validationCode) atualizacao.codigo_verificacao = invoice.validationCode
  if (invoice.pdfUrl) atualizacao.pdf_url = invoice.pdfUrl
  if (invoice.xmlUrl) atualizacao.xml_url = invoice.xmlUrl

  const { error } = await admin.from("financeiro_documentos").update(atualizacao).eq("id", documentoId)
  if (error) throw new Error(error.message)
}
