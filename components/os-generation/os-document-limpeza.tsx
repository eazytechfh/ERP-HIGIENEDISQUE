"use client"

import { forwardRef } from "react"
import type { DadosTecnicosLimpeza, Reservatorio } from "./limpeza-form"

// Empresa Info (mock - pode vir de configuracoes do sistema)
const empresaInfo = {
  nome: "Higiene Disque Higienizações Ltda",
  endereco: "Av São Gualter, 200, lote 71 B - Piratininga",
  cidadeUf: "Niterói - RJ - Cep.: 24355-010",
  telefones: "(21)2626-3000 - (21)2625-3233",
  email: "contato@higienedisque.com.br",
  site: "www.higienedisque.com.br",
  cnpj: "36.490.092/0001-82",
  codigoInea: "UN63.01.01.87",
  certificadoCRH: "CTA Nº IN 100962",
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

type OSDocumentLimpezaProps = {
  osNumber: string
  cliente: ClienteInfo
  local: LocalInfo
  dadosTecnicos: DadosTecnicosLimpeza
  dataServico: string
  veiculo?: string
}

function getDocumentoLabel(cpfCnpj: string): string {
  const digitos = (cpfCnpj || "").replace(/\D/g, "")
  return digitos.length > 11 ? "C.N.P.J" : "C.P.F"
}

// Opcoes de cada atributo categorico, na mesma ordem/rotulo do formulario original (O.S Higienizacao.docx)
const materialOptions: { value: string; label: string }[] = [
  { value: "concreto", label: "Concreto" },
  { value: "polietileno", label: "Polietileno" },
  { value: "outros", label: "Outros" },
]

const situacaoOptions: { value: string; label: string }[] = [
  { value: "elevada", label: "Elevada" },
  { value: "apoiada", label: "Apoiada" },
  { value: "enterrada", label: "Enterrada" },
  { value: "semi_enterrada", label: "Semi-Enterrada" },
]

const coberturaOptions: { value: string; label: string }[] = [
  { value: "totalmente_coberta", label: "Totalmente Coberta" },
  { value: "parcialmente_coberta", label: "Parcialmente Coberta" },
]

const simNaoOptions: { value: string; label: string }[] = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
]

export const OSDocumentLimpeza = forwardRef<HTMLDivElement, OSDocumentLimpezaProps>(
  ({ osNumber, cliente, local, dadosTecnicos, dataServico, veiculo }, ref) => {
    const cisternas = dadosTecnicos.reservatorios.filter(r => r.tipo === "cisterna")
    const caixasDagua = dadosTecnicos.reservatorios.filter(r => r.tipo === "caixa_dagua")

    // Preencher arrays ate as posicoes fixas da tabela (5 cisternas, 10 caixas d'agua)
    const cisternasPadded: (Reservatorio | null)[] = [...cisternas, ...Array(Math.max(0, 5 - cisternas.length)).fill(null)].slice(0, 5)
    const caixasPadded: (Reservatorio | null)[] = [...caixasDagua, ...Array(Math.max(0, 10 - caixasDagua.length)).fill(null)].slice(0, 10)

    // Linhas de grupo com "checkbox" (X) para cada atributo categorico, uma sub-linha por opcao
    const renderGroupRows = (
      attributeLabel: string,
      options: { value: string; label: string }[],
      getValue: (r: Reservatorio) => string
    ) =>
      options.map((opt, i) => (
        <tr key={`${attributeLabel}-${opt.value}`}>
          <td className="border-r border-b border-black p-0.5 font-bold align-top">
            {i === 0 ? attributeLabel : ""}
          </td>
          <td className="border-r border-b border-black p-0.5 text-[8px]">{opt.label}</td>
          {cisternasPadded.map((r, ci) => (
            <td key={`c${ci}`} className="border-r border-b border-black p-0.5 text-center font-bold">
              {r && getValue(r) === opt.value ? "X" : ""}
            </td>
          ))}
          <td className="border-r border-b border-black p-0.5 text-[8px]">{opt.label}</td>
          {caixasPadded.map((r, ci) => (
            <td key={`x${ci}`} className={`border-b border-black p-0.5 text-center font-bold ${ci < caixasPadded.length - 1 ? "border-r" : ""}`}>
              {r && getValue(r) === opt.value ? "X" : ""}
            </td>
          ))}
        </tr>
      ))

    return (
      <div ref={ref} className="os-a4-page bg-white text-black p-5 mx-auto text-[11px] print:text-[10px]" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Cabecalho - logo + dados da empresa */}
        <div className="flex items-start justify-between pb-2 mb-2">
          <img src="/images/higiene-disque-logo.png" alt="Higiene Disque" className="w-28 h-16 object-contain" />
          <div className="text-[9px] text-right">
            <p className="font-bold">{empresaInfo.nome}</p>
            <p>{empresaInfo.endereco}</p>
            <p>{empresaInfo.cidadeUf}</p>
            <p>Telefones.: {empresaInfo.telefones}</p>
            <p>{empresaInfo.email}</p>
            <p>{empresaInfo.site}</p>
          </div>
        </div>

        {/* Titulo do comprovante + numero da OS */}
        <div className="flex items-center justify-between border-2 border-black mb-3">
          <div className="p-1.5">
            <p className="font-bold text-[10px] leading-tight">COMPROVANTE DE EXECUÇÃO DE SERVIÇOS /</p>
            <p className="font-bold text-[10px] leading-tight">Limpeza e Higienização de Reservatórios de Água</p>
          </div>
          <div className="border-l-2 border-black p-1.5 text-center min-w-[70px]">
            <p className="font-bold text-[9px]">Nº</p>
            <p className="text-sm font-bold">{osNumber}</p>
          </div>
        </div>

        {/* Informações da Empresa Especializada */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 px-2 py-0.5 font-bold border-b border-black text-[9px]">
            INFORMAÇÕES DA EMPRESA ESPECIALIZADA
          </div>
          <div className="grid grid-cols-4 text-[9px]">
            <div className="border-r border-black p-1">
              <p className="font-bold">CNPJ</p>
              <p>{empresaInfo.cnpj}</p>
            </div>
            <div className="border-r border-black p-1">
              <p className="font-bold">Código INEA</p>
              <p>{empresaInfo.codigoInea}</p>
            </div>
            <div className="border-r border-black p-1">
              <p className="font-bold">Certificado Registro (CRH)</p>
              <p>{empresaInfo.certificadoCRH}</p>
            </div>
            <div className="p-1">
              <p className="font-bold">Validade (CRH)</p>
              <p>{empresaInfo.validadeCRH}</p>
            </div>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 px-2 py-0.5 font-bold border-b border-black text-[9px]">
            INFORMAÇÕES DO CLIENTE
          </div>
          <div className="p-1.5 space-y-0.5 text-[9px]">
            <div>
              <span className="font-bold">Razão Social: </span>
              <span>{cliente.nome}</span>
            </div>
            <div>
              <span className="font-bold">Nome Fantasia: </span>
              <span>{cliente.nomeFantasia || "-"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold">Tipo Atividade: </span>
                <span>{cliente.tipoAtividade || "CONDOMINIO"}</span>
              </div>
              <div>
                <span className="font-bold">{getDocumentoLabel(cliente.cpfCnpj)}: </span>
                <span>{cliente.cpfCnpj}</span>
              </div>
            </div>
            <div>
              <span className="font-bold">Endereço: </span>
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
                <span className="font-bold">Função: </span>
                <span>{cliente.funcaoContato || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Descrição dos Serviços - Tabela de Reservatórios */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 px-2 py-0.5 font-bold border-b border-black text-[9px]">
            DESCRIÇÃO DOS SERVIÇOS
          </div>
          <div className="bg-gray-100 px-2 py-0.5 font-bold border-b border-black text-[9px] text-center">
            CONDIÇÕES DOS RESERVATÓRIOS DE ÁGUA
          </div>

          <table className="w-full text-[8px] border-collapse">
            <thead>
              <tr>
                <th className="border-r border-b border-black p-0.5 text-left">Tipos Reservatório</th>
                <th className="border-r border-b border-black p-0.5 text-left">Cisternas</th>
                {[1, 2, 3, 4, 5].map(n => (
                  <th key={`c${n}`} className="border-r border-b border-black p-0.5 text-center w-[26px]">{n}</th>
                ))}
                <th className="border-r border-b border-black p-0.5 text-left">Caixas D' Água</th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n, i) => (
                  <th key={`x${n}`} className={`border-b border-black p-0.5 text-center w-[22px] ${i < 9 ? "border-r" : ""}`}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Volume (M3) - valor numerico, sem checkbox */}
              <tr>
                <td className="border-r border-b border-black p-0.5 font-bold">Volume (M3)</td>
                <td className="border-r border-b border-black p-0.5"></td>
                {cisternasPadded.map((r, i) => (
                  <td key={`cv${i}`} className="border-r border-b border-black p-0.5 text-center">
                    {r?.volumeM3 || ""}
                  </td>
                ))}
                <td className="border-r border-b border-black p-0.5"></td>
                {caixasPadded.map((r, i) => (
                  <td key={`xv${i}`} className={`border-b border-black p-0.5 text-center ${i < caixasPadded.length - 1 ? "border-r" : ""}`}>
                    {r?.volumeM3 || ""}
                  </td>
                ))}
              </tr>

              {renderGroupRows("Tipo de Material", materialOptions, (r) => r.tipoMaterial)}
              {renderGroupRows("Situação em relação ao solo", situacaoOptions, (r) => r.situacaoSolo)}
              {renderGroupRows("Condições da Cobertura", coberturaOptions, (r) => r.condicaoCobertura)}
              {renderGroupRows("Presença de Detritos", simNaoOptions, (r) => r.presencaDetritos)}
              {renderGroupRows("Presença de vetores e outros animais nocivos", simNaoOptions, (r) => r.presencaVetores)}
              {renderGroupRows("Proximidades de fossas ou rede de esgoto", simNaoOptions, (r) => r.proximidadeFossaEsgoto)}
              {renderGroupRows("Ocorrência de fendas ou rachaduras", simNaoOptions, (r) => r.ocorrenciaFendasRachaduras)}
            </tbody>
          </table>
        </div>

        {/* Aviso Legal */}
        <div className="border border-black mb-3 p-2 text-[8px] leading-tight">
          <p>
            Ficam os estabelecimentos obrigados à execução SEMESTRAL da limpeza e higienização dos reservatórios de água
            destinados ao consumo humano bem como à realização de análise bacteriológica da água imediatamente após a limpeza.
          </p>
          <p className="mt-1">
            Artigo 3º, Decreto RJ nº 20356, de 17 de agosto de 1994, que regulamenta a Lei RJ nº 1893, de 20 de novembro de 1991, que
            estabelece obrigatoriedade da limpeza e higienização dos reservatórios de água para fins de manutenção dos padrões de
            potabilidade.
          </p>
        </div>

        {/* Assinaturas */}
        <div className="border border-black">
          <div className="grid grid-cols-4 text-[9px]">
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-1">APLICADOR</p>
              <p className="mt-6">{dadosTecnicos.aplicador || "Eryck Guimaraes"}</p>
            </div>
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-1">TÉCNICO RESPONSÁVEL</p>
              <p className="mt-4">{dadosTecnicos.tecnicoResponsavel || "Renato Luiz Leal Gomes"}</p>
              <p className="text-[8px]">Nº CRBio - {dadosTecnicos.registroTecnico || "55953/02 RJ"}</p>
            </div>
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-1">CLIENTE</p>
              <p className="text-[8px] mt-2">Recebi a presente ordem de serviço e a relação</p>
              <p className="text-[8px]">de medidas preventivas necessárias em anexo.</p>
              <div className="grid grid-cols-2 gap-1 mt-4">
                <div>
                  <p>_______________</p>
                  <p className="text-[8px]">Nome Legível</p>
                </div>
                <div>
                  <p>_______________</p>
                  <p className="text-[8px]">Assinatura</p>
                </div>
              </div>
            </div>
            <div className="p-2 text-center">
              <p className="font-bold mb-1">DATA SERVIÇO</p>
              <p className="text-sm font-bold mt-4">{dataServico}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

OSDocumentLimpeza.displayName = "OSDocumentLimpeza"
