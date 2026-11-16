import { NextResponse } from "next/server"
import { AcessoNegadoError, autenticarFinanceiro } from "@/lib/server/financeiro-auth"
import { AsaasError, ConfiguracaoAsaasError } from "@/lib/server/asaas"
import { asaasFetch, type AsaasInvoice } from "@/lib/server/asaas"
import { aplicarInvoiceNoDocumento, buscarInvoice, buscarInvoicePorReferencia, garantirClienteAsaas } from "@/lib/server/nfse"

export const dynamic = "force-dynamic"

/** Busca no Asaas o estado atual da nota e grava no documento. */
export async function POST(req: Request) {
  try {
    const { admin } = await autenticarFinanceiro(req, "financeiro.view")
    const { documentoId } = (await req.json()) as { documentoId?: string }
    if (!documentoId) return NextResponse.json({ error: "Documento nao informado." }, { status: 400 })

    const { data: documento } = await admin
      .from("financeiro_documentos")
      .select("id, tipo, asaas_invoice_id, external_reference, cliente_id, emissao_modo")
      .eq("id", documentoId)
      .maybeSingle()
    if (!documento || documento.tipo !== "nota_fiscal") return NextResponse.json({ error: "Nota nao encontrada." }, { status: 404 })

    const invoice = documento.asaas_invoice_id
      ? await buscarInvoice(documento.asaas_invoice_id)
      : documento.external_reference
        ? await buscarInvoicePorReferencia(documento.external_reference)
        : null
    if (invoice) await aplicarInvoiceNoDocumento(admin, documento.id, invoice)

    // "Emitir agora" que ficou agendada (ex.: pendencia de cadastro do cliente):
    // reenvia os dados atuais do cliente e pede a emissao de novo.
    let aviso = ""
    if (invoice && invoice.status === "SCHEDULED" && documento.emissao_modo === "agora" && documento.cliente_id) {
      try {
        await garantirClienteAsaas(admin, documento.cliente_id)
        const autorizada = await asaasFetch<AsaasInvoice>(`/invoices/${encodeURIComponent(invoice.id)}/authorize`, { method: "POST" })
        await aplicarInvoiceNoDocumento(admin, documento.id, autorizada)
      } catch (error) {
        aviso = error instanceof Error ? error.message : "Nao foi possivel pedir a emissao."
        await admin.from("financeiro_documentos").update({ asaas_status_descricao: aviso }).eq("id", documento.id)
      }
    }

    const { data: atualizado } = await admin.from("financeiro_documentos").select("*").eq("id", documento.id).single()
    return NextResponse.json({ documento: atualizado, encontradaNoAsaas: Boolean(invoice), aviso })
  } catch (error) {
    if (error instanceof AcessoNegadoError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof ConfiguracaoAsaasError) return NextResponse.json({ error: error.message }, { status: 503 })
    const status = error instanceof AsaasError ? 502 : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status })
  }
}
