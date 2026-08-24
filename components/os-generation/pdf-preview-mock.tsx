"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award, FileText, AlertCircle, Printer } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { OSStatus } from "./os-header-card"
import { OSDocumentVetores } from "./os-document-vetores"
import { OSDocumentLimpeza } from "./os-document-limpeza"
import { OSDocumentDesentupimento } from "./os-document-desentupimento"
import { CertificadoGarantia, type CertificadoGarantiaData } from "./certificado-garantia"
import type { DadosTecnicosVetores } from "./vetores-form"
import type { DadosTecnicosLimpeza } from "./limpeza-form"
import type { DadosTecnicosDesentupimento } from "./desentupimento-form"
import type { ConsumoItem } from "./consumo-estoque-card"
import { openPrintWindow, type CertificatePaperSize } from "./print-utils"

type ClienteInfo = {
  nome: string
  nomeFantasia?: string
  cpfCnpj: string
  telefone: string
  email: string
  tipoAtividade?: string
  contato?: string
  funcaoContato?: string
}

type LocalInfo = {
  endereco: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export type TipoOS = "vetores" | "limpeza" | "desentupimento"

type PdfPreviewMockProps = {
  status: OSStatus
  osNumber: string
  tipoOS?: TipoOS
  cliente?: ClienteInfo
  local?: LocalInfo
  dadosTecnicos?: DadosTecnicosVetores
  dadosTecnicosLimpeza?: DadosTecnicosLimpeza
  dadosTecnicosDesentupimento?: DadosTecnicosDesentupimento
  dataServico?: string
  consumos?: ConsumoItem[]
  veiculo?: string
  mostrarDeclaracaoCupim?: boolean
  certificadoData?: CertificadoGarantiaData
  incluirCertificado?: boolean
  onCaptureHtml?: (html: string) => void
}

export function PdfPreviewMock({
  status,
  osNumber,
  tipoOS = "vetores",
  cliente,
  local,
  dadosTecnicos,
  dadosTecnicosLimpeza,
  dadosTecnicosDesentupimento,
  dataServico,
  consumos = [],
  veiculo,
  mostrarDeclaracaoCupim = false,
  certificadoData,
  incluirCertificado = false,
  onCaptureHtml,
}: PdfPreviewMockProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const osOnlyRef = useRef<HTMLDivElement>(null)
  const certificadoRef = useRef<HTMLDivElement>(null)
  const [certificatePaperSize, setCertificatePaperSize] = useState<CertificatePaperSize>("a5")
  const isGenerated = status !== "a_gerar"

  useEffect(() => {
    if (!onCaptureHtml || !isGenerated || !printRef.current) return
    onCaptureHtml(printRef.current.innerHTML)
  }, [onCaptureHtml, isGenerated, osNumber, tipoOS, cliente, local, dadosTecnicos, dadosTecnicosLimpeza, dadosTecnicosDesentupimento, dataServico, consumos, veiculo, mostrarDeclaracaoCupim, certificadoData, incluirCertificado])

  const handlePrint = () => {
    // Imprime somente a OS (sem o certificado, que tem orientacao landscape
    // e usa um perfil de pagina proprio). Misturar as duas no mesmo job faz
    // o navegador aplicar uma unica orientacao a todas as paginas, deixando a
    // OS deitada. O certificado tem seu proprio botao/print job separado.
    if (!osOnlyRef.current) return
    openPrintWindow(osOnlyRef.current.innerHTML, `OS ${osNumber}`)
  }

  const handlePrintCertificado = () => {
    if (!certificadoRef.current || !certificadoData) return
    openPrintWindow(certificadoRef.current.outerHTML, `Certificado ${osNumber}`, {
      page: "certificate",
      certificatePaperSize,
    })
  }

  const defaultDadosTecnicos: DadosTecnicosVetores = dadosTecnicos || {
    pragasAlvo: ["baratas"],
    tipoAtividade: "quimico",
    descricaoServico: "",
    produtos: [],
    medidasPreventivas: "",
    aplicador: "",
    tecnicoResponsavel: "Renato Luiz Leal Gomes",
    registroTecnico: "55953/02 RJ",
  }

  const defaultDadosTecnicosLimpeza: DadosTecnicosLimpeza = dadosTecnicosLimpeza || {
    reservatorios: [],
    aplicador: "Eryck Guimaraes",
    tecnicoResponsavel: "Renato Luiz Leal Gomes",
    registroTecnico: "55953/02 RJ",
  }

  const defaultDadosTecnicosDesentupimento: DadosTecnicosDesentupimento = dadosTecnicosDesentupimento || {
    horaServico: "",
    atendente: "",
    tecnico: "",
    vendedor: "",
    inscricao: "",
    homePage: "",
    contatos: "",
    origem: "",
    referencia: "",
    observacoes: "",
    servicos: [],
    desconto: "",
    condicaoPagamento: "",
  }

  const defaultCliente: ClienteInfo = cliente || {
    nome: "Cliente",
    cpfCnpj: "",
    telefone: "",
    email: "",
  }

  const defaultLocal: LocalInfo = local || {
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  }

  const tipoOSLabel =
    tipoOS === "limpeza"
      ? "Limpeza de Reservatorios"
      : tipoOS === "desentupimento"
        ? "Desentupimento"
        : "Vetores (Dedetizacao)"

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Previa do Documento (OS Oficial)
          </CardTitle>
          {isGenerated && (
            <div className="flex gap-2">
              {certificadoData && (
                <div className="flex items-center gap-2">
                  <Select
                    value={certificatePaperSize}
                    onValueChange={(value) => setCertificatePaperSize(value as CertificatePaperSize)}
                  >
                    <SelectTrigger className="h-9 w-[150px]" aria-label="Tamanho do papel do certificado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a5">Papel A5</SelectItem>
                      <SelectItem value="a4">Papel A4</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handlePrintCertificado} className="gap-2 bg-transparent">
                    <Award className="h-4 w-4" />
                    Imprimir certificado
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 bg-transparent">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isGenerated ? (
          <div className="border rounded-lg overflow-auto max-h-[800px] bg-gray-100 p-4">
            <div ref={printRef}>
              <div ref={osOnlyRef}>
                {tipoOS === "limpeza" ? (
                  <OSDocumentLimpeza
                    osNumber={osNumber}
                    cliente={defaultCliente}
                    local={defaultLocal}
                    dadosTecnicos={defaultDadosTecnicosLimpeza}
                    dataServico={dataServico || new Date().toLocaleDateString("pt-BR")}
                    veiculo={veiculo}
                  />
                ) : tipoOS === "desentupimento" ? (
                  <OSDocumentDesentupimento
                    osNumber={osNumber}
                    cliente={defaultCliente}
                    local={defaultLocal}
                    dadosTecnicos={defaultDadosTecnicosDesentupimento}
                    dataServico={dataServico || new Date().toLocaleDateString("pt-BR")}
                    veiculo={veiculo}
                  />
                ) : (
                  <OSDocumentVetores
                    osNumber={osNumber}
                    cliente={defaultCliente}
                    local={defaultLocal}
                    dadosTecnicos={defaultDadosTecnicos}
                    dataServico={dataServico || new Date().toLocaleDateString("pt-BR")}
                    consumos={consumos}
                    veiculo={veiculo}
                    showDeclaracaoCupim={mostrarDeclaracaoCupim}
                  />
                )}
              </div>
              {incluirCertificado && certificadoData ? (
                <CertificadoGarantia
                  ref={certificadoRef}
                  data={certificadoData}
                  pageBreakBefore
                />
              ) : null}
            </div>
            {!incluirCertificado && certificadoData ? (
              <div className="hidden">
                <CertificadoGarantia ref={certificadoRef} data={certificadoData} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg min-h-[400px] flex flex-col items-center justify-center p-8 border-muted-foreground/30 bg-muted/30">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-center mb-2">Previa - OS {tipoOSLabel} (Modelo Oficial)</h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="h-4 w-4" />
              A OS sera gerada em PDF no modelo oficial {tipoOSLabel}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center max-w-md">
              {tipoOS === "limpeza"
                ? 'Apos clicar em "Gerar OS", o documento sera criado no formato padrao para Limpeza e Higienizacao de Reservatorios de Agua, pronto para impressao e assinatura presencial do cliente.'
                : tipoOS === "desentupimento"
                  ? 'Apos clicar em "Gerar OS", o documento sera criado no formato padrao para Desentupimento, pronto para impressao e assinatura presencial do cliente.'
                  : 'Apos clicar em "Gerar OS", o documento sera criado no formato padrao para Controle de Vetores / Dedetizacao, pronto para impressao e assinatura presencial do cliente.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

