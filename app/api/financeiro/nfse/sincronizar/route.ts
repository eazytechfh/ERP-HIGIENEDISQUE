import { NextResponse } from "next/server"
import { AcessoNegadoError, autenticarFinanceiro } from "@/lib/server/financeiro-auth"
import { AsaasError, ConfiguracaoAsaasError } from "@/lib/server/asaas"
import { aplicarInvoiceNoDocumento, buscarInvoice, buscarInvoicePorReferencia } from "@/lib/server/nfse"

export const dynamic = "force-dynamic"

/** Busca no Asaas o estado atual da nota e grava no documento. */
export async function POST(req: Request) {
  try {
    const { admin } = await autenticarFinanceiro(req, "financeiro.view")
    const { documentoId } = (await req.json()) as { documentoId?: string }
    if (!documentoId) return NextResponse.json({ error: "Documento nao informado." }, { status: 400 })

    const { data: documento } = await admin
      .from("financeiro_documentos")
      .select("id, tipo, asaas_invoice_id, external_reference")
      .eq("id", documentoId)
      .maybeSingle()
    if (!documento || documento.tipo !== "nota_fiscal") return NextResponse.json({ error: "Nota nao encontrada." }, { status: 404 })

    const invoice = documento.asaas_invoice_id
      ? await buscarInvoice(documento.asaas_invoice_id)
      : documento.external_reference
        ? await buscarInvoicePorReferencia(documento.external_reference)
        : null
    if (invoice) await aplicarInvoiceNoDocumento(admin, documento.id, invoice)

    const { data: atualizado } = await admin.from("financeiro_documentos").select("*").eq("id", documento.id).single()
    return NextResponse.json({ documento: atualizado, encontradaNoAsaas: Boolean(invoice) })
  } catch (error) {
    if (error instanceof AcessoNegadoError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof ConfiguracaoAsaasError) return NextResponse.json({ error: error.message }, { status: 503 })
    const status = error instanceof AsaasError ? 502 : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status })
  }
}
