import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { AcessoNegadoError, autenticarFinanceiro } from "@/lib/server/financeiro-auth"
import { AsaasError, ConfiguracaoAsaasError, asaasFetch, type AsaasInvoice } from "@/lib/server/asaas"
import { aplicarInvoiceNoDocumento, buscarInvoicePorReferencia, garantirClienteAsaas } from "@/lib/server/nfse"
import { calcularNfse, hojeSaoPaulo, resolverDataEfetiva, validarEntradaNfse } from "@/lib/nfse-calculos"

export const dynamic = "force-dynamic"

type Corpo = {
  /** UUID gerado pela tela ao abrir o formulario: repetir o clique nao cria outra nota. */
  chave: string
  servicoId?: string
  clienteId: string
  categoriaId?: string
  descricao: string
  observacoes?: string
  valor: number
  deducoes?: number
  issRetido: boolean
  issAliquota: number
  inssAliquota?: number
  irAliquota?: number
  modo: "agora" | "agendar"
  dataAgendada?: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function carregarDocumento(admin: SupabaseClient, id: string) {
  const { data } = await admin.from("financeiro_documentos").select("*").eq("id", id).single()
  return data
}

/** Receita da OS (reutiliza) ou receita programada nova (nota avulsa / OS sem receita). */
async function obterLancamento(admin: SupabaseClient, corpo: Corpo, usuarioId: string, dataEfetiva: string): Promise<string> {
  if (corpo.servicoId) {
    const { data: existentes } = await admin
      .from("financeiro_lancamentos")
      .select("id, status")
      .eq("servico_id", corpo.servicoId)
      .eq("tipo", "receita")
      .is("deleted_at", null)
      .neq("status", "cancelado")
      .order("created_at", { ascending: true })
      .limit(1)
    if (existentes?.[0]?.id) return String(existentes[0].id)
  }
  const { data, error } = await admin
    .from("financeiro_lancamentos")
    .insert({
      tipo: "receita",
      status: "programado",
      origem: "nota_fiscal",
      descricao: corpo.descricao,
      categoria_id: corpo.categoriaId || null,
      valor: corpo.valor,
      data_competencia: hojeSaoPaulo(),
      data_vencimento: dataEfetiva,
      cliente_id: corpo.clienteId,
      servico_id: corpo.servicoId || null,
      documento_tipo: "nota_fiscal",
      observacoes: corpo.observacoes || null,
      created_by: usuarioId,
    })
    .select("id")
    .single()
  if (error) throw new Error(`Nao foi possivel criar a receita da nota: ${error.message}`)
  return String(data.id)
}

export async function POST(req: Request) {
  let documentoId = ""
  try {
    const { user, admin } = await autenticarFinanceiro(req, "financeiro.create")
    const corpo = (await req.json()) as Corpo

    if (!corpo?.chave || !UUID.test(corpo.chave)) return NextResponse.json({ error: "Requisicao invalida." }, { status: 400 })
    if (!corpo.clienteId) return NextResponse.json({ error: "Selecione o cliente." }, { status: 400 })
    if (!corpo.descricao?.trim()) return NextResponse.json({ error: "Informe a descricao do servico." }, { status: 400 })

    const externalReference = `erp-nfse-${corpo.chave}`

    // Clique repetido / reenvio: o documento com esta chave ja existe.
    const { data: jaExiste } = await admin
      .from("financeiro_documentos")
      .select("id, asaas_invoice_id")
      .eq("external_reference", externalReference)
      .maybeSingle()

    if (!jaExiste) {
      const entrada = {
        valor: Number(corpo.valor) || 0,
        deducoes: Number(corpo.deducoes) || 0,
        issAliquota: Number(corpo.issAliquota) || 0,
        issRetido: Boolean(corpo.issRetido),
        inssAliquota: Number(corpo.inssAliquota) || 0,
        irAliquota: Number(corpo.irAliquota) || 0,
      }
      const erroEntrada = validarEntradaNfse(entrada)
      if (erroEntrada) return NextResponse.json({ error: erroEntrada }, { status: 400 })
      const hoje = hojeSaoPaulo()
      const { data: dataEfetiva, erro: erroData } = resolverDataEfetiva(corpo.modo, corpo.dataAgendada, hoje)
      if (erroData) return NextResponse.json({ error: erroData }, { status: 400 })

      const { data: config } = await admin.from("financeiro_nfse_config").select("*").eq("id", 1).maybeSingle()
      if (!config?.municipal_service_id && !config?.municipal_service_code) {
        return NextResponse.json({ error: "Configure o servico municipal em Config. NFS-e antes de emitir." }, { status: 400 })
      }

      const calculo = calcularNfse(entrada)
      const lancamentoId = await obterLancamento(admin, { ...corpo, valor: entrada.valor }, user.id, dataEfetiva)

      const { data: criado, error: erroDoc } = await admin
        .from("financeiro_documentos")
        .insert({
          lancamento_id: lancamentoId,
          tipo: "nota_fiscal",
          status: "pendente",
          cliente_id: corpo.clienteId,
          servico_id: corpo.servicoId || null,
          descricao: corpo.descricao.trim(),
          numero: null,
          data_emissao: hoje,
          data_vencimento: dataEfetiva,
          valor: calculo.valor,
          valor_servico: calculo.valor,
          observacoes: corpo.observacoes?.trim() || null,
          external_reference: externalReference,
          asaas_status: "ENVIANDO",
          emissao_modo: corpo.modo,
          data_efetiva: dataEfetiva,
          deducoes: calculo.deducoes,
          iss_retido: entrada.issRetido,
          iss_aliquota: entrada.issAliquota,
          inss_aliquota: entrada.inssAliquota,
          ir_aliquota: entrada.irAliquota,
          valor_iss: calculo.valorIss,
          valor_inss: calculo.valorInss,
          valor_ir: calculo.valorIr,
          valor_liquido_receber: calculo.liquidoReceber,
          municipal_service_code: config.municipal_service_code,
          municipal_service_name: config.municipal_service_name,
          api_integracao_status: "pendente",
          created_by: user.id,
        })
        .select("id")
        .single()
      if (erroDoc) {
        // Corrida entre dois cliques: o outro request criou primeiro.
        const { data: outro } = await admin.from("financeiro_documentos").select("id").eq("external_reference", externalReference).maybeSingle()
        if (!outro) throw new Error(erroDoc.message)
        documentoId = String(outro.id)
      } else {
        documentoId = String(criado.id)
      }
    } else {
      documentoId = String(jaExiste.id)
    }

    const documento = await carregarDocumento(admin, documentoId)
    if (documento.asaas_invoice_id) {
      // Ja enviada: nao reenviar. A tela usa "Atualizar status" para sincronizar.
      return NextResponse.json({ documento })
    }

    const { data: config } = await admin.from("financeiro_nfse_config").select("*").eq("id", 1).maybeSingle()
    // Portal Nacional: o Asaas so aceita o codigo do servico (nao ha lista/ID).
    const fiscal = await asaasFetch<{ useNationalPortal?: boolean }>("/fiscalInfo/")
    const usarCodigo = Boolean(fiscal?.useNationalPortal) || !config?.municipal_service_id
    if (usarCodigo && !config?.municipal_service_code) {
      throw new Error("Esta conta do Asaas usa o Portal Nacional: informe o CODIGO do servico em Config. NFS-e.")
    }
    const customerId = await garantirClienteAsaas(admin, documento.cliente_id)

    // Reconciliacao: se um envio anterior teve resposta incerta, a nota pode ja existir.
    let invoice: AsaasInvoice | null = await buscarInvoicePorReferencia(externalReference)
    if (!invoice) {
      invoice = await asaasFetch<AsaasInvoice>("/invoices", {
        method: "POST",
        body: {
          customer: customerId,
          serviceDescription: documento.descricao,
          observations: documento.observacoes || config?.observacoes_padrao || "",
          externalReference,
          value: Number(documento.valor),
          deductions: Number(documento.deducoes) || 0,
          effectiveDate: documento.data_efetiva,
          ...(usarCodigo
            ? { municipalServiceCode: config?.municipal_service_code }
            : { municipalServiceId: config?.municipal_service_id }),
          municipalServiceName: config?.municipal_service_name || config?.municipal_service_code || "",
          taxes: {
            retainIss: Boolean(documento.iss_retido),
            iss: Number(documento.iss_aliquota) || 0,
            inss: Number(documento.inss_aliquota) || 0,
            ir: Number(documento.ir_aliquota) || 0,
            pis: Number(config?.pis_aliquota) || 0,
            cofins: Number(config?.cofins_aliquota) || 0,
            csll: Number(config?.csll_aliquota) || 0,
          },
        },
      })
    }
    await aplicarInvoiceNoDocumento(admin, documentoId, invoice)
    await admin.from("financeiro_documentos").update({ api_integracao_status: "enviado", asaas_customer_id: customerId }).eq("id", documentoId)

    // "Agora": antecipa o processamento. A confirmacao vem pelo webhook INVOICE_AUTHORIZED.
    if (documento.emissao_modo === "agora" && invoice.status === "SCHEDULED") {
      try {
        const autorizada = await asaasFetch<AsaasInvoice>(`/invoices/${encodeURIComponent(invoice.id)}/authorize`, { method: "POST" })
        await aplicarInvoiceNoDocumento(admin, documentoId, autorizada)
      } catch (error) {
        // A nota segue agendada para hoje; o Asaas processa na data efetiva.
        const motivo = error instanceof Error ? error.message : "Falha ao solicitar emissao imediata."
        await admin.from("financeiro_documentos").update({ asaas_status_descricao: motivo }).eq("id", documentoId)
      }
    }

    return NextResponse.json({ documento: await carregarDocumento(admin, documentoId) })
  } catch (error) {
    if (error instanceof AcessoNegadoError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof ConfiguracaoAsaasError) return NextResponse.json({ error: error.message }, { status: 503 })

    const mensagem = error instanceof Error ? error.message : "Erro interno."
    if (documentoId) {
      try {
        const { supabaseAdmin } = await import("@/lib/server/financeiro-auth")
        const incerto = error instanceof AsaasError && error.incerto
        await supabaseAdmin()
          .from("financeiro_documentos")
          .update({
            asaas_status: "FALHA_ENVIO",
            api_integracao_status: "erro",
            erro_motivo: incerto
              ? `${mensagem} Use "Reenviar": o sistema confere no Asaas antes de criar outra nota.`
              : mensagem,
          })
          .eq("id", documentoId)
          .is("asaas_invoice_id", null)
      } catch {
        // registro do erro e melhor esforco
      }
    }
    const status = error instanceof AsaasError ? (error.status >= 400 && error.status < 500 ? 400 : 502) : 500
    return NextResponse.json({ error: mensagem, documentoId: documentoId || undefined }, { status })
  }
}
