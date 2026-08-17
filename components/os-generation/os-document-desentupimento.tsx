"use client"

import { forwardRef } from "react"
import type { DadosTecnicosDesentupimento } from "./desentupimento-form"

// Empresa Info (mock - pode vir de configuracoes do sistema)
const empresaInfo = {
  nome: "Higiene Disque Higienizacoes Ltda",
  endereco: "Av Sao Gualter, 200, lote 71 B - Piratininga",
  cidadeUf: "Niteroi - RJ - Cep.: 24355-010",
  telefones: "(21)2626-3000 - (21)2625-3233",
  email: "contato@higienedisque.com.br",
  site: "www.higienedisque.com.br",
  cnpj: "36.490.092/0001-82",
  codigoInea: "UN63.01.01.87",
  certificadoCRH: "CTA N IN 100962",
  validadeCRH: "01/11/2029",
}

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

type OSDocumentDesentupimentoProps = {
  osNumber: string
  cliente: ClienteInfo
  local: LocalInfo
  dadosTecnicos: DadosTecnicosDesentupimento
  dataServico: string
  veiculo?: string
}

const tipoDesentupimentoLabels: Record<string, string> = {
  mecanico: "Mecanico",
  hidrojateamento: "Hidrojateamento",
  quimico: "Quimico",
  outro: "Outro",
}

const situacaoFinalLabels: Record<string, string> = {
  desobstruido_totalmente: "Desobstruido Totalmente",
  desobstruido_parcialmente: "Desobstruido Parcialmente",
  necessita_retorno: "Necessita Retorno",
}

export const OSDocumentDesentupimento = forwardRef<HTMLDivElement, OSDocumentDesentupimentoProps>(
  ({ osNumber, cliente, local, dadosTecnicos, dataServico, veiculo }, ref) => {
    return (
      <div ref={ref} className="os-a4-page bg-white text-black p-5 mx-auto text-[11px] print:text-[10px]" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-20 h-14 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-base">HD</span>
            </div>
            <div className="text-[9px]">
              <h1 className="font-bold text-xs">{empresaInfo.nome}</h1>
              <p>{empresaInfo.endereco}</p>
              <p>{empresaInfo.cidadeUf}</p>
              <p>Telefones.: {empresaInfo.telefones}</p>
              <p>{empresaInfo.email}</p>
              <p>{empresaInfo.site}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-green-700 text-[9px]">COMPROVANTE DE EXECUCAO DE SERVICOS /</p>
            <p className="font-bold text-green-700 text-[9px]">Desentupimento</p>
            <div className="mt-2 border-2 border-black p-1">
              <p className="font-bold text-center text-[9px]">N</p>
              <p className="text-center text-sm font-bold text-red-600">{osNumber}</p>
            </div>
          </div>
        </div>

        {/* Informacoes da Empresa Especializada */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 px-2 py-0.5 font-bold border-b border-black text-[9px]">
            INFORMACOES DA EMPRESA ESPECIALIZADA
          </div>
          <div className="grid grid-cols-4 text-[9px]">
            <div className="border-r border-black p-1">
              <p className="font-bold">Codigo INEA</p>
              <p>{empresaInfo.codigoInea}</p>
            </div>
            <div className="border-r border-black p-1">
              <p className="font-bold">Certificado Registro (CRH)</p>
              <p>{empresaInfo.certificadoCRH}</p>
            </div>
            <div className="border-r border-black p-1">
              <p className="font-bold">Validade (CRH)</p>
              <p>{empresaInfo.validadeCRH}</p>
            </div>
            <div className="p-1">
              <p className="font-bold">CNPJ</p>
              <p>{empresaInfo.cnpj}</p>
            </div>
          </div>
        </div>

        {/* Informacoes do Cliente */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 px-2 py-0.5 font-bold border-b border-black text-[9px]">
            INFORMACOES DO CLIENTE
          </div>
          <div className="p-1.5 space-y-0.5 text-[9px]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold">Razao Social: </span>
                <span>{cliente.nome}</span>
              </div>
              <div>
                <span className="font-bold">Nome Fantasia: </span>
                <span>{cliente.nomeFantasia || "-"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold">Tipo Atividade: </span>
                <span>{cliente.tipoAtividade || "CONDOMINIO"}</span>
              </div>
              <div>
                <span className="font-bold">C.N.P.J: </span>
                <span>{cliente.cpfCnpj}</span>
              </div>
            </div>
            <div>
              <span className="font-bold">Endereco: </span>
              <span>{local.endereco}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="font-bold">Bairro: </span>
                <span>{local.bairro}</span>
              </div>
              <div>
                <span className="font-bold">Cidade / UF: </span>
                <span>{local.cidade}</span>
              </div>
              <div>
                <span className="font-bold">C.E.P: </span>
                <span>{local.cep}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold">Telefones: </span>
                <span>{cliente.telefone}</span>
              </div>
              <div>
                <span className="font-bold">E-Mail: </span>
                <span>{cliente.email}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold">Contatos: </span>
                <span>{cliente.contato || "-"}</span>
              </div>
              <div>
                <span className="font-bold">Funcao: </span>
                <span>{cliente.funcaoContato || "-"}</span>
              </div>
            </div>
            <div>
              <span className="font-bold">Veiculo associado: </span>
              <span>{veiculo || "-"}</span>
            </div>
          </div>
        </div>

        {/* Descricao do Servico */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 px-2 py-0.5 font-bold border-b border-black text-[9px]">
            DESCRICAO DO SERVICO
          </div>
          <div className="p-1.5 space-y-1.5 text-[9px]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold">Local do Entupimento: </span>
                <span>{dadosTecnicos.localEntupimento || "-"}</span>
              </div>
              <div>
                <span className="font-bold">Tipo de Desentupimento: </span>
                <span>{tipoDesentupimentoLabels[dadosTecnicos.tipoDesentupimento] || "-"}</span>
              </div>
            </div>
            <div>
              <span className="font-bold">Equipamento Utilizado: </span>
              <span>{dadosTecnicos.equipamentoUtilizado || "-"}</span>
            </div>
            <div>
              <span className="font-bold">Diagnostico / Causa do Entupimento: </span>
              <p className="mt-0.5">{dadosTecnicos.diagnostico || "-"}</p>
            </div>
            <div>
              <span className="font-bold">Material Removido: </span>
              <p className="mt-0.5">{dadosTecnicos.materialRemovido || "-"}</p>
            </div>
            <div>
              <span className="font-bold">Situacao Final: </span>
              <span>{situacaoFinalLabels[dadosTecnicos.situacaoFinal] || "-"}</span>
            </div>
            {dadosTecnicos.observacoes && (
              <div>
                <span className="font-bold">Observacoes: </span>
                <p className="mt-0.5">{dadosTecnicos.observacoes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Assinaturas */}
        <div className="border border-black">
          <div className="grid grid-cols-4 text-[9px]">
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-1">APLICADOR</p>
              <p className="mt-6">{dadosTecnicos.aplicador || "-"}</p>
            </div>
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-1">TECNICO RESPONSAVEL</p>
              <p className="mt-4">{dadosTecnicos.tecnicoResponsavel || "-"}</p>
              <p className="text-[8px]">{dadosTecnicos.registroTecnico || ""}</p>
              <p className="mt-2">_______________________________________</p>
            </div>
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-1">CLIENTE</p>
              <p className="text-[8px] mt-2">Recebi a presente ordem de servico e confirmo</p>
              <p className="text-[8px]">a execucao do servico descrito acima.</p>
              <p className="mt-2">_______________________________</p>
              <p className="text-[8px]">Assinatura</p>
              <p className="mt-1">_______________________________</p>
              <p className="text-[8px]">Nome Legivel</p>
            </div>
            <div className="p-2 text-center">
              <p className="font-bold mb-1">DATA</p>
              <p className="font-bold mb-1">SERVICO</p>
              <p className="text-sm font-bold mt-2">{dataServico}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

OSDocumentDesentupimento.displayName = "OSDocumentDesentupimento"
