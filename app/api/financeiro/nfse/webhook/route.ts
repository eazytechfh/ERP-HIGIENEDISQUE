import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@/lib/server/financeiro-auth"
import { aplicarInvoiceNoDocumento, buscarInvoice } from "@/lib/server/nfse"
import type { AsaasInvoice } from "@/lib/server/asaas"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function tokenValido(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN || ""
  if (!esperado || !recebido) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Webhook de notas fiscais do Asaas.
 * - Autenticacao: header "asaas-access-token" = ASAAS_WEBHOOK_TOKEN.
 * - Idempotencia: o evento e gravado pelo id (chave unica) ANTES de processar;
 *   repeticoes do mesmo evento sao ignoradas.
 * - Reconciliacao: o estado aplicado vem de uma consulta atual ao Asaas, entao
 *   eventos fora de ordem nao fazem a nota "voltar" de status.
 */
export async function POST(req: Request) {
  if (!tokenValido(req.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 })
  }
  const eventoId = typeof payload?.id === "string" ? payload.id : ""
  const evento = typeof payload?.event === "string" ? payload.event : ""
  if (!eventoId || !evento) return NextResponse.json({ error: "Evento sem id" }, { status: 400 })

  const admin = supabaseAdmin()
  // Valida formatos antes de usar em filtros do banco.
  const invoiceIdBruto = typeof payload?.invoice?.id === "string" ? payload.invoice.id : ""
  const invoiceId: string | null = /^[A-Za-z0-9_]{1,64}$/.test(invoiceIdBruto) ? invoiceIdBruto : null
  const refBruta = typeof payload?.invoice?.externalReference === "string" ? payload.invoice.externalReference : ""
  const externalReference = /^erp-nfse-[0-9a-f-]{36}$/i.test(refBruta) ? refBruta : ""

  const { data: inserido, error: erroInsert } = await admin
    .from("financeiro_asaas_eventos")
    .upsert({ id: eventoId, evento, invoice_id: invoiceId, payload }, { onConflict: "id", ignoreDuplicates: true })
    .select("id")
  if (erroInsert) {
    // Sem gravar, o Asaas deve tentar de novo.
    return NextResponse.json({ error: "Falha ao registrar evento" }, { status: 500 })
  }
  if (!inserido || inserido.length === 0) {
    return NextResponse.json({ ok: true, duplicado: true })
  }

  if (!evento.startsWith("INVOICE_") || !invoiceId) {
    await admin.from("financeiro_asaas_eventos").update({ status: "ignorado", processado_em: new Date().toISOString() }).eq("id", eventoId)
    return NextResponse.json({ ok: true })
  }

  try {
    const { data: documento } = await admin
      .from("financeiro_documentos")
      .select("id")
      .or(`asaas_invoice_id.eq.${invoiceId}${externalReference ? `,external_reference.eq.${externalReference}` : ""}`)
      .limit(1)
      .maybeSingle()

    if (!documento) {
      await admin.from("financeiro_asaas_eventos").update({ status: "ignorado", erro: "Nota sem documento no ERP", processado_em: new Date().toISOString() }).eq("id", eventoId)
      return NextResponse.json({ ok: true })
    }

    let invoice: AsaasInvoice
    try {
      invoice = await buscarInvoice(invoiceId)
    } catch {
      invoice = payload.invoice as AsaasInvoice // sem acesso ao Asaas agora: usa o payload
    }
    await aplicarInvoiceNoDocumento(admin, documento.id, invoice)
    await admin.from("financeiro_asaas_eventos").update({ status: "processado", processado_em: new Date().toISOString() }).eq("id", eventoId)
  } catch (error) {
    // Evento ja gravado: responde 200 e fica como "erro" para reprocessar (botao Atualizar status).
    await admin
      .from("financeiro_asaas_eventos")
      .update({ status: "erro", erro: error instanceof Error ? error.message : "Erro ao processar" })
      .eq("id", eventoId)
  }
  return NextResponse.json({ ok: true })
}
