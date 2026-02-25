"use client"

import { forwardRef } from "react"
import type { DadosTecnicosLimpeza, Reservatorio } from "./limpeza-form"

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

type OSDocumentLimpezaProps = {
  osNumber: string
  cliente: ClienteInfo
  local: LocalInfo
  dadosTecnicos: DadosTecnicosLimpeza
  dataServico: string
}

const materialLabels: Record<string, string> = {
  concreto: "Concreto",
  polietileno: "Polietileno",
  outros: "Outros",
}

const situacaoLabels: Record<string, string> = {
  elevada: "Elevada",
  apoiada: "Apoiada",
  enterrada: "Enterrada",
  semi_enterrada: "Semi-Enterrada",
}

const coberturaLabels: Record<string, string> = {
  totalmente_coberta: "Totalmente Coberta",
  parcialmente_coberta: "Parcialmente Coberta",
}

export const OSDocumentLimpeza = forwardRef<HTMLDivElement, OSDocumentLimpezaProps>(
  ({ osNumber, cliente, local, dadosTecnicos, dataServico }, ref) => {
    const cisternas = dadosTecnicos.reservatorios.filter(r => r.tipo === "cisterna")
    const caixasDagua = dadosTecnicos.reservatorios.filter(r => r.tipo === "caixa_dagua")

    // Preencher arrays ate 5 posicoes para exibicao na tabela
    const cisternasPadded = [...cisternas, ...Array(Math.max(0, 5 - cisternas.length)).fill(null)]
    const caixasPadded = [...caixasDagua, ...Array(Math.max(0, 10 - caixasDagua.length)).fill(null)]

    return (
      <div ref={ref} className="bg-white text-black p-6 max-w-4xl mx-auto text-[10px] print:text-[9px]" style={{ fontFamily: 'Arial, sans-serif' }}>
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
            <p className="font-bold text-green-700 text-[9px]">Limpeza e Higienizacao de Reservatorios de Agua</p>
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
          </div>
        </div>

        {/* Descricao dos Servicos - Tabela de Reservatorios */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 px-2 py-0.5 font-bold border-b border-black text-[9px]">
            DESCRICAO DOS SERVICOS
          </div>
          <div className="bg-gray-100 px-2 py-0.5 font-bold border-b border-black text-[9px] text-center">
            CONDICOES DOS RESERVATORIOS DE AGUA
          </div>

          {/* Cabecalho da tabela */}
          <table className="w-full text-[8px] border-collapse">
            <thead>
              <tr>
                <th className="border-r border-b border-black p-0.5 text-left" rowSpan={2}></th>
                <th className="border-r border-b border-black p-0.5 text-center" colSpan={5}>Cisternas</th>
                <th className="border-b border-black p-0.5 text-center" colSpan={10}>Caixas D' Agua</th>
              </tr>
              <tr>
                {/* Cisternas 1-5 */}
                {[1, 2, 3, 4, 5].map(n => (
                  <th key={`c${n}`} className="border-r border-b border-black p-0.5 text-center w-[30px]">{n}</th>
                ))}
                {/* Caixas 1-10 */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <th key={`cx${n}`} className={`border-b border-black p-0.5 text-center w-[26px] ${n < 10 ? 'border-r' : ''}`}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Volume (M3) */}
              <tr>
                <td className="border-r border-b border-black p-0.5 font-bold">Volume (M3)</td>
                {cisternasPadded.slice(0, 5).map((r, i) => (
                  <td key={`cv${i}`} className="border-r border-b border-black p-0.5 text-center">
                    {r?.volumeM3 || ""}
                  </td>
                ))}
                {caixasPadded.slice(0, 10).map((r, i) => (
                  <td key={`cxv${i}`} className={`border-b border-black p-0.5 text-center ${i < 9 ? 'border-r' : ''}`}>
                    {r?.volumeM3 || ""}
                  </td>
                ))}
              </tr>

              {/* Tipo de Material */}
              <tr>
                <td className="border-r border-b border-black p-0.5 font-bold">Tipo de Material</td>
                {cisternasPadded.slice(0, 5).map((r, i) => (
                  <td key={`cm${i}`} className="border-r border-b border-black p-0.5 text-center text-[7px]">
                    {r ? materialLabels[r.tipoMaterial] || "" : ""}
                  </td>
                ))}
                {caixasPadded.slice(0, 10).map((r, i) => (
                  <td key={`cxm${i}`} className={`border-b border-black p-0.5 text-center text-[7px] ${i < 9 ? 'border-r' : ''}`}>
                    {r ? materialLabels[r.tipoMaterial] || "" : ""}
                  </td>
                ))}
              </tr>

              {/* Situacao em relacao ao solo */}
              <tr>
                <td className="border-r border-b border-black p-0.5 font-bold">Situacao em relacao ao solo</td>
                {cisternasPadded.slice(0, 5).map((r, i) => (
                  <td key={`cs${i}`} className="border-r border-b border-black p-0.5 text-center text-[7px]">
                    {r ? situacaoLabels[r.situacaoSolo] || "" : ""}
                  </td>
                ))}
                {caixasPadded.slice(0, 10).map((r, i) => (
                  <td key={`cxs${i}`} className={`border-b border-black p-0.5 text-center text-[7px] ${i < 9 ? 'border-r' : ''}`}>
                    {r ? situacaoLabels[r.situacaoSolo] || "" : ""}
                  </td>
                ))}
              </tr>

              {/* Condicoes da Cobertura */}
              <tr>
                <td className="border-r border-b border-black p-0.5 font-bold">Condicoes da Cobertura</td>
                {cisternasPadded.slice(0, 5).map((r, i) => (
                  <td key={`cc${i}`} className="border-r border-b border-black p-0.5 text-center text-[7px]">
                    {r ? coberturaLabels[r.condicaoCobertura] || "" : ""}
                  </td>
                ))}
                {caixasPadded.slice(0, 10).map((r, i) => (
                  <td key={`cxc${i}`} className={`border-b border-black p-0.5 text-center text-[7px] ${i < 9 ? 'border-r' : ''}`}>
                    {r ? coberturaLabels[r.condicaoCobertura] || "" : ""}
                  </td>
                ))}
              </tr>

              {/* Presenca de Detritos */}
              <tr>
                <td className="border-r border-b border-black p-0.5 font-bold">Presenca de Detritos</td>
                {cisternasPadded.slice(0, 5).map((r, i) => (
                  <td key={`cd${i}`} className="border-r border-b border-black p-0.5 text-center">
                    {r ? (r.presencaDetritos === "sim" ? "Sim" : "Nao") : ""}
                  </td>
                ))}
                {caixasPadded.slice(0, 10).map((r, i) => (
                  <td key={`cxd${i}`} className={`border-b border-black p-0.5 text-center ${i < 9 ? 'border-r' : ''}`}>
                    {r ? (r.presencaDetritos === "sim" ? "Sim" : "Nao") : ""}
                  </td>
                ))}
              </tr>

              {/* Presenca de vetores */}
              <tr>
                <td className="border-r border-b border-black p-0.5 font-bold">Presenca de vetores e outros animais nocivos</td>
                {cisternasPadded.slice(0, 5).map((r, i) => (
                  <td key={`cpv${i}`} className="border-r border-b border-black p-0.5 text-center">
                    {r ? (r.presencaVetores === "sim" ? "Sim" : "Nao") : ""}
                  </td>
                ))}
                {caixasPadded.slice(0, 10).map((r, i) => (
                  <td key={`cxpv${i}`} className={`border-b border-black p-0.5 text-center ${i < 9 ? 'border-r' : ''}`}>
                    {r ? (r.presencaVetores === "sim" ? "Sim" : "Nao") : ""}
                  </td>
                ))}
              </tr>

              {/* Proximidade de fossas */}
              <tr>
                <td className="border-r border-b border-black p-0.5 font-bold">Proximidades de fossas ou rede de esgoto</td>
                {cisternasPadded.slice(0, 5).map((r, i) => (
                  <td key={`cpf${i}`} className="border-r border-b border-black p-0.5 text-center">
                    {r ? (r.proximidadeFossaEsgoto === "sim" ? "Sim" : "Nao") : ""}
                  </td>
                ))}
                {caixasPadded.slice(0, 10).map((r, i) => (
                  <td key={`cxpf${i}`} className={`border-b border-black p-0.5 text-center ${i < 9 ? 'border-r' : ''}`}>
                    {r ? (r.proximidadeFossaEsgoto === "sim" ? "Sim" : "Nao") : ""}
                  </td>
                ))}
              </tr>

              {/* Ocorrencia de fendas */}
              <tr>
                <td className="border-r border-black p-0.5 font-bold">Ocorrencia de fendas ou rachaduras</td>
                {cisternasPadded.slice(0, 5).map((r, i) => (
                  <td key={`cof${i}`} className="border-r border-black p-0.5 text-center">
                    {r ? (r.ocorrenciaFendasRachaduras === "sim" ? "Sim" : "Nao") : ""}
                  </td>
                ))}
                {caixasPadded.slice(0, 10).map((r, i) => (
                  <td key={`cxof${i}`} className={`border-black p-0.5 text-center ${i < 9 ? 'border-r' : ''}`}>
                    {r ? (r.ocorrenciaFendasRachaduras === "sim" ? "Sim" : "Nao") : ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Aviso Legal */}
        <div className="border border-black mb-3 p-2 text-[8px] leading-tight">
          <p>
            Ficam os estabelecimentos obrigados a execucao SEMESTRAL da limpeza e higienizacao dos reservatorios de agua 
            destinados ao consumo humano bem como a realizacao de analise bacteriologica da agua imediatamente apos a limpeza.
          </p>
          <p className="mt-1">
            Artigo 3, Decreto RJ n 20356, de 17 de agosto de 1994, que regulamenta a Lei RJ n 1893, de 20 de novembro de 1991, que 
            estabelece obrigatoriedade da limpeza e higienizacao dos reservatorios de agua para fins de manutencao dos padroes de 
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
              <p className="font-bold mb-1">TECNICO RESPONSAVEL</p>
              <p className="mt-4">{dadosTecnicos.tecnicoResponsavel || "Renato Luiz Leal Gomes"}</p>
              <p className="text-[8px]">N CRBio - {dadosTecnicos.registroTecnico || "55953/02 RJ"}</p>
              <p className="mt-2">_______________________________________</p>
            </div>
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-1">CLIENTE</p>
              <p className="text-[8px] mt-2">Recebi a presente ordem de servico e a relacao</p>
              <p className="text-[8px]">de medidas preventivas necessarias em anexo.</p>
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

OSDocumentLimpeza.displayName = "OSDocumentLimpeza"
