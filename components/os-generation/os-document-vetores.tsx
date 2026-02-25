"use client"

import { forwardRef } from "react"
import type { DadosTecnicosVetores, PragaAlvo } from "./vetores-form"
import type { ConsumoItem } from "./consumo-estoque-card"

// Empresa Info (mock - pode vir de configurações do sistema)
const empresaInfo = {
  nome: "Higiene Disque Higienizacoes Ltda",
  endereco: "Av Sao Gualter, 200, lote 71 B - Piratininga",
  cidadeUf: "Niteroi - RJ - Cep.: 24355-010",
  telefones: "(21)2626-3000 - (21)2625-3233",
  email: "contato@higienedisque.com.br",
  site: "www.higienedisque.com.br",
  cnpj: "36.490.092/0001-82",
  licencaAmbiental: "IN00457009",
  validadeLicenca: "08/2027",
  codigoInea: "UN63.01.01.87",
  ctaNumero: "IN00457009",
}

const pragaLabels: Record<PragaAlvo, string> = {
  baratas: "BARATA",
  formigas: "FORMIGA",
  ratos: "RATO",
  mosquitos: "MOSQUITO",
  cupins: "Cupim",
  pulgas_carrapatos: "Pulgas/Carrapatos",
  outros: "Outros",
}

type ClienteInfo = {
  nome: string
  nomeFantasia?: string
  cpfCnpj: string
  telefone: string
  email: string
  tipoAtividade?: string
}

type LocalInfo = {
  endereco: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

type OSDocumentVetoresProps = {
  osNumber: string
  cliente: ClienteInfo
  local: LocalInfo
  dadosTecnicos: DadosTecnicosVetores
  dataServico: string
  tecnicoResponsavel?: string
  registroTecnico?: string
  consumos?: ConsumoItem[]
}

export const OSDocumentVetores = forwardRef<HTMLDivElement, OSDocumentVetoresProps>(
  ({ osNumber, cliente, local, dadosTecnicos, dataServico, tecnicoResponsavel, registroTecnico, consumos = [] }, ref) => {
    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-4xl mx-auto text-xs print:text-[10px]" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-16 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">HD</span>
            </div>
            <div>
              <h1 className="font-bold text-sm">{empresaInfo.nome}</h1>
              <p className="text-[10px]">{empresaInfo.endereco}</p>
              <p className="text-[10px]">{empresaInfo.cidadeUf}</p>
              <p className="text-[10px]">Telefones.: {empresaInfo.telefones}</p>
              <p className="text-[10px]">{empresaInfo.email}</p>
              <p className="text-[10px]">{empresaInfo.site}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-green-700">Controle de Vetores e Pragas Urbanas</p>
            <div className="mt-2 border-2 border-black p-2">
              <p className="font-bold text-center">COMPROVANTE DE EXECUCAO DE SERVICOS</p>
              <p className="text-center text-lg font-bold text-red-600">N {osNumber}</p>
            </div>
          </div>
        </div>

        {/* Informacoes da Empresa Especializada */}
        <div className="border border-black mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black">
            INFORMACOES DA EMPRESA ESPECIALIZADA
          </div>
          <div className="grid grid-cols-4 text-[10px]">
            <div className="border-r border-black p-1">
              <p className="font-bold">Licenca Ambiental (LAS/LO)</p>
              <p>{empresaInfo.licencaAmbiental}</p>
            </div>
            <div className="border-r border-black p-1">
              <p className="font-bold">Validade (LAS/LO)</p>
              <p>{empresaInfo.validadeLicenca}</p>
            </div>
            <div className="border-r border-black p-1">
              <p className="font-bold">CTA N</p>
              <p>{empresaInfo.ctaNumero}</p>
            </div>
            <div className="p-1">
              <p className="font-bold">Codigo INEA</p>
              <p>{empresaInfo.codigoInea}</p>
            </div>
          </div>
          <div className="border-t border-black p-1 text-[10px]">
            <span className="font-bold">CNPJ: </span>
            <span>{empresaInfo.cnpj}</span>
          </div>
        </div>

        {/* Informacoes do Cliente */}
        <div className="border border-black mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black">
            INFORMACOES DO CLIENTE
          </div>
          <div className="p-2 space-y-1 text-[10px]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold">Nome: </span>
                <span>{cliente.nome}</span>
              </div>
              <div>
                <span className="font-bold">Nome Fantasia: </span>
                <span>{cliente.nomeFantasia || "-"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold">Tipo Atividade: </span>
                <span>{cliente.tipoAtividade || "APARTAMENTO"}</span>
              </div>
              <div>
                <span className="font-bold">C.P.F/CNPJ: </span>
                <span>{cliente.cpfCnpj}</span>
              </div>
            </div>
            <div>
              <span className="font-bold">Endereco: </span>
              <span>{local.endereco}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <span className="font-bold">Bairro: </span>
                <span>{local.bairro}</span>
              </div>
              <div>
                <span className="font-bold">Cidade/UF: </span>
                <span>{local.cidade} / {local.estado}</span>
              </div>
              <div>
                <span className="font-bold">C.E.P: </span>
                <span>{local.cep}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold">Telefones: </span>
                <span>{cliente.telefone}</span>
              </div>
              <div>
                <span className="font-bold">E-Mail: </span>
                <span>{cliente.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vetor(es) ou Praga(s) Urbana(s) Controlada(s) */}
        <div className="border border-black mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black">
            VETOR(ES) OU PRAGA(S) URBANA(S) CONTROLADA(S)
          </div>
          <div className="p-2 flex flex-wrap gap-4 text-[10px]">
            {dadosTecnicos.pragasAlvo.map((praga) => (
              <span key={praga} className="font-bold">
                {pragaLabels[praga]}
              </span>
            ))}
          </div>
        </div>

        {/* Atividade Desenvolvida */}
        <div className="border border-black mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black">
            ATIVIDADE DESENVOLVIDA
          </div>
          <div className="p-2 text-[10px]">
            <div className="flex gap-8">
              <label className="flex items-center gap-2">
                <span className={`w-4 h-4 border border-black inline-flex items-center justify-center ${dadosTecnicos.tipoAtividade === "nao_quimico" ? "bg-black" : ""}`}>
                  {dadosTecnicos.tipoAtividade === "nao_quimico" && <span className="text-white text-[8px]">X</span>}
                </span>
                CONTROLE NAO QUIMICO
              </label>
              <label className="flex items-center gap-2">
                <span className={`w-4 h-4 border border-black inline-flex items-center justify-center ${dadosTecnicos.tipoAtividade === "quimico" ? "bg-black" : ""}`}>
                  {dadosTecnicos.tipoAtividade === "quimico" && <span className="text-white text-[8px]">X</span>}
                </span>
                CONTROLE QUIMICO
              </label>
            </div>
          </div>
        </div>

        {/* Descricao dos Servicos */}
        <div className="border border-black mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black">
            DESCRICAO DOS SERVICOS
          </div>
          <div className="p-2 min-h-[40px] text-[10px]">
            {dadosTecnicos.descricaoServico || "-"}
          </div>
        </div>

        {/* Produtos Quimicos e Equipamentos */}
        <div className="border border-black mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black text-[9px]">
            PRODUTOS QUIMICOS E EQUIPAMENTOS EMPREGADOS (INSTRUCOES NO VERSO)
          </div>
          <table className="w-full text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-r border-b border-black p-1 text-left">Codigo INEA</th>
                <th className="border-r border-b border-black p-1 text-left">Principio Ativo</th>
                <th className="border-r border-b border-black p-1 text-left">Grupo Quimico</th>
                <th className="border-r border-b border-black p-1 text-left">Concentracao Uso (%)</th>
                <th className="border-r border-b border-black p-1 text-left">Diluente</th>
                <th className="border-r border-b border-black p-1 text-left">Quantidade Total (l/g)</th>
                <th className="border-r border-b border-black p-1 text-left">Praga(s) Alvo</th>
                <th className="border-b border-black p-1 text-left">Equipamento</th>
              </tr>
            </thead>
            <tbody>
              {dadosTecnicos.produtos.length > 0 ? (
                dadosTecnicos.produtos.map((produto, index) => (
                  <tr key={produto.id}>
                    <td className="border-r border-b border-black p-1">{String(index + 1).padStart(3, '0')}</td>
                    <td className="border-r border-b border-black p-1">{produto.principioAtivo || "-"}</td>
                    <td className="border-r border-b border-black p-1">{produto.produto || "-"}</td>
                    <td className="border-r border-b border-black p-1">{produto.concentracao || "-"}</td>
                    <td className="border-r border-b border-black p-1">{produto.diluicao || "-"}</td>
                    <td className="border-r border-b border-black p-1">{produto.quantidade || "-"}</td>
                    <td className="border-r border-b border-black p-1">
                      {produto.pragaAlvo ? pragaLabels[produto.pragaAlvo as PragaAlvo] || produto.pragaAlvo : "-"}
                    </td>
                    <td className="border-b border-black p-1">{produto.equipamento || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-2 text-center text-gray-500">
                    Nenhum produto cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Informacoes ao Consumidor */}
        <div className="border border-black mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black">
            INFORMACOES AO CONSUMIDOR
          </div>
          <div className="p-2 text-[9px] leading-tight">
            <p>
              A GARANTIA DE ASSISTENCIA TECNICA (GAT) e uma expressao utilizada pelas empresas de
              controle de pragas para definir o prazo de compromisso com o cliente pelos servicos prestados.
            </p>
            <p className="mt-1">
              A GAT foi estabelecida pelo mercado com base em experiencias tecnicas agregadas as caracteristicas biologicas e
              comportamentais do vetor ou da praga-alvo, do efeito residual dos produtos quimicos utilizados, das condicoes fisicas e
              ambientais do local que sofreu a acao de controle e da metodologia de aplicacao. Veja os prazos da GAT no verso.
            </p>
            <p className="mt-1">
              As aplicacoes espaciais de inseticidas para controle de mosquitos de importancia em Saude Publica, por Ultra Baixo
              Volume (UBV) ou por Termonebulizadores (FOG) somente poderao ser praticadas nas areas externas das edificacoes e
              como metodologia complementar as demais acoes de controle. Essas aplicacoes deverao ser realizadas,
              exclusivamente, nas primeiras horas da manha ou nos finais de tarde, de acordo com o periodo de atividade da especie-alvo.
            </p>
          </div>
        </div>

        {/* Medidas Preventivas e/ou Corretivas */}
        <div className="border border-black mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black">
            MEDIDAS PREVENTIVAS E/OU CORRETIVAS
          </div>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-r border-b border-black p-1 text-left w-1/4">PRAGA ALVO</th>
                <th className="border-b border-black p-1 text-left">DESCRICAO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-r border-black p-2 align-top">
                  {dadosTecnicos.pragasAlvo.map((praga) => pragaLabels[praga]).join(", ")}
                </td>
                <td className="p-2 min-h-[60px]">
                  {dadosTecnicos.medidasPreventivas || "-"}
                </td>
              </tr>
            </tbody>
</table>
        </div>

        {/* Produtos e Materiais Consumidos (OS Vetores) */}
        <div className="border border-black mb-4">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black">
            PRODUTOS E MATERIAIS CONSUMIDOS (OS VETORES)
          </div>
          <div className="p-2 text-[10px]">
            {consumos.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-r border-b border-black p-1 text-left">Produto</th>
                    <th className="border-r border-b border-black p-1 text-left">Categoria</th>
                    <th className="border-r border-b border-black p-1 text-right">Quantidade</th>
                    <th className="border-b border-black p-1 text-left">Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  {consumos.map((consumo, index) => (
                    <tr key={consumo.id || index}>
                      <td className="border-r border-b border-black p-1">{consumo.produtoNome}</td>
                      <td className="border-r border-b border-black p-1">{consumo.categoria}</td>
                      <td className="border-r border-b border-black p-1 text-right">{consumo.quantidade}</td>
                      <td className="border-b border-black p-1">{consumo.unidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-2">Nenhum consumo registrado.</p>
            )}
          </div>
        </div>
        
        {/* Assinaturas */}
        <div className="border border-black">
          <div className="grid grid-cols-4 text-[10px]">
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-8">CLIENTE</p>
              <div className="border-t border-black pt-1">
                <p>Recebi a presente ordem de servico e a relacao</p>
                <p>de medidas preventivas necessarias em anexo.</p>
                <p className="mt-4 font-bold">_______________________________</p>
                <p className="text-[9px]">Assinatura</p>
                <p className="mt-2 font-bold">_______________________________</p>
                <p className="text-[9px]">Nome Legivel</p>
              </div>
            </div>
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-2">DATA</p>
              <p className="font-bold mb-2">SERVICO</p>
              <p className="text-lg font-bold">{dataServico}</p>
            </div>
            <div className="border-r border-black p-2 text-center">
              <p className="font-bold mb-2">TECNICO RESPONSAVEL</p>
              <p className="mt-4">{tecnicoResponsavel || dadosTecnicos.tecnicoResponsavel || "Renato Luiz Leal Gomes"}</p>
              <p className="text-[9px] mt-2">N CRBio - {registroTecnico || dadosTecnicos.registroTecnico || "55953/02 RJ"}</p>
              <p className="mt-4">_______________________________________</p>
            </div>
            <div className="p-2 text-center">
              <p className="font-bold mb-2">APLICADOR</p>
              <p className="mt-4">{dadosTecnicos.aplicador || "FERNANDO"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

OSDocumentVetores.displayName = "OSDocumentVetores"
