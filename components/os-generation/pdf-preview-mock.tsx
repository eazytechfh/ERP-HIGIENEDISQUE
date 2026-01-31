"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, AlertCircle, Printer } from "lucide-react"
import { useRef } from "react"
import type { OSStatus } from "./os-header-card"
import { OSDocumentVetores } from "./os-document-vetores"
import { OSDocumentLimpeza } from "./os-document-limpeza"
import type { DadosTecnicosVetores } from "./vetores-form"
import type { DadosTecnicosLimpeza } from "./limpeza-form"
import type { ConsumoItem } from "./consumo-estoque-card"

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

export type TipoOS = "vetores" | "limpeza"

type PdfPreviewMockProps = {
  status: OSStatus
  osNumber: string
  tipoOS?: TipoOS
  cliente?: ClienteInfo
  local?: LocalInfo
  dadosTecnicos?: DadosTecnicosVetores
  dadosTecnicosLimpeza?: DadosTecnicosLimpeza
  dataServico?: string
  consumos?: ConsumoItem[]
}

export function PdfPreviewMock({ 
  status, 
  osNumber, 
  tipoOS = "vetores",
  cliente, 
  local, 
  dadosTecnicos,
  dadosTecnicosLimpeza,
  dataServico,
  consumos = []
}: PdfPreviewMockProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const isGenerated = status !== "a_gerar"

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>OS ${osNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              * { box-sizing: border-box; }
              .bg-green-600 { background-color: #16a34a; }
              .bg-gray-200 { background-color: #e5e7eb; }
              .bg-gray-100 { background-color: #f3f4f6; }
              .bg-black { background-color: #000; }
              .text-white { color: #fff; }
              .text-green-700 { color: #15803d; }
              .text-red-600 { color: #dc2626; }
              .text-gray-500 { color: #6b7280; }
              .font-bold { font-weight: bold; }
              .text-lg { font-size: 1.125rem; }
              .text-sm { font-size: 0.875rem; }
              .border { border: 1px solid #000; }
              .border-black { border-color: #000; }
              .border-t { border-top: 1px solid #000; }
              .border-r { border-right: 1px solid #000; }
              .border-b { border-bottom: 1px solid #000; }
              .border-2 { border-width: 2px; }
              .rounded { border-radius: 0.25rem; }
              .p-1 { padding: 0.25rem; }
              .p-2 { padding: 0.5rem; }
              .p-8 { padding: 2rem; }
              .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
              .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-4 { margin-top: 1rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-8 { margin-bottom: 2rem; }
              .gap-2 { gap: 0.5rem; }
              .gap-4 { gap: 1rem; }
              .gap-8 { gap: 2rem; }
              .flex { display: flex; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
              .items-center { align-items: center; }
              .items-start { align-items: flex-start; }
              .justify-center { justify-content: center; }
              .justify-between { justify-content: space-between; }
              .text-center { text-align: center; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
              .w-full { width: 100%; }
              .w-4 { width: 1rem; }
              .w-24 { width: 6rem; }
              .h-4 { height: 1rem; }
              .h-16 { height: 4rem; }
              .min-h-\\[40px\\] { min-height: 40px; }
              .min-h-\\[60px\\] { min-height: 60px; }
              .inline-flex { display: inline-flex; }
              .leading-tight { line-height: 1.25; }
              .align-top { vertical-align: top; }
              .space-y-1 > * + * { margin-top: 0.25rem; }
              table { border-collapse: collapse; width: 100%; }
              @media print {
                body { margin: 0; padding: 10px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const defaultDadosTecnicos: DadosTecnicosVetores = dadosTecnicos || {
    pragasAlvo: ["baratas"],
    tipoAtividade: "quimico",
    descricaoServico: "",
    produtos: [],
    medidasPreventivas: "",
    aplicador: "",
    tecnicoResponsavel: "Renato Luiz Leal Gomes",
    registroTecnico: "55953/02 RJ"
  }

  const defaultDadosTecnicosLimpeza: DadosTecnicosLimpeza = dadosTecnicosLimpeza || {
    reservatorios: [],
    aplicador: "Eryck Guimaraes",
    tecnicoResponsavel: "Renato Luiz Leal Gomes",
    registroTecnico: "55953/02 RJ"
  }

  const defaultCliente: ClienteInfo = cliente || {
    nome: "Cliente",
    cpfCnpj: "",
    telefone: "",
    email: ""
  }

  const defaultLocal: LocalInfo = local || {
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: ""
  }

  const tipoOSLabel = tipoOS === "limpeza" ? "Limpeza de Reservatorios" : "Vetores (Dedetizacao)"

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
              {tipoOS === "limpeza" ? (
                <OSDocumentLimpeza
                  osNumber={osNumber}
                  cliente={defaultCliente}
                  local={defaultLocal}
                  dadosTecnicos={defaultDadosTecnicosLimpeza}
                  dataServico={dataServico || new Date().toLocaleDateString('pt-BR')}
                />
              ) : (
<OSDocumentVetores
                osNumber={osNumber}
                cliente={defaultCliente}
                local={defaultLocal}
                dadosTecnicos={defaultDadosTecnicos}
                dataServico={dataServico || new Date().toLocaleDateString('pt-BR')}
                consumos={consumos}
              />
              )}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg min-h-[400px] flex flex-col items-center justify-center p-8 border-muted-foreground/30 bg-muted/30">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-center mb-2">
              Previa - OS {tipoOSLabel} (Modelo Oficial)
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="h-4 w-4" />
              A OS sera gerada em PDF no modelo oficial {tipoOSLabel}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center max-w-md">
              {tipoOS === "limpeza" 
                ? "Apos clicar em \"Gerar OS\", o documento sera criado no formato padrao para Limpeza e Higienizacao de Reservatorios de Agua, pronto para impressao e assinatura presencial do cliente."
                : "Apos clicar em \"Gerar OS\", o documento sera criado no formato padrao para Controle de Vetores / Dedetizacao, pronto para impressao e assinatura presencial do cliente."
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
