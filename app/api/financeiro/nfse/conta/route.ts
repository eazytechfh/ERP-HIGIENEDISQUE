import { NextResponse } from "next/server"
import { AcessoNegadoError, autenticarFinanceiro } from "@/lib/server/financeiro-auth"
import { AsaasError, ConfiguracaoAsaasError, asaasFetch, resolverAmbienteAsaas } from "@/lib/server/asaas"

export const dynamic = "force-dynamic"

/**
 * Dados fiscais da conta Asaas (somente leitura) para a tela Config. NFS-e.
 * Devolve so campos nao sensiveis: nada de usuario/senha/token da prefeitura.
 */
export async function POST(req: Request) {
  try {
    await autenticarFinanceiro(req, "financeiro.view")
    const { ambiente } = resolverAmbienteAsaas()
    const info = await asaasFetch<any>("/fiscalInfo/")
    return NextResponse.json({
      ambiente,
      simplesNacional: Boolean(info?.simplesNacional),
      portalNacional: Boolean(info?.useNationalPortal),
      certificadoEnviado: Boolean(info?.certificateSent),
      cnae: info?.cnae || "",
      itemListaServico: info?.serviceListItem || "",
      nbsCodigo: info?.nbsCode || "",
      nbsDescricao: info?.nbsDescription || "",
    })
  } catch (error) {
    if (error instanceof AcessoNegadoError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof ConfiguracaoAsaasError) return NextResponse.json({ error: error.message }, { status: 503 })
    const status = error instanceof AsaasError ? 502 : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status })
  }
}
