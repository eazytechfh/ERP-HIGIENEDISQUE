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

function parseValorMonetario(raw: string): number {
  const normalizado = String(raw || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3},)/g, "")
    .replace(",", ".")
  const parsed = Number.parseFloat(normalizado)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatarReal(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`
}

export const OSDocumentDesentupimento = forwardRef<HTMLDivElement, OSDocumentDesentupimentoProps>(
  ({ osNumber, cliente, local, dadosTecnicos, dataServico, veiculo }, ref) => {
    const totalServicos = dadosTecnicos.servicos.reduce((acc, s) => acc + parseValorMonetario(s.valorServico), 0)
    const desconto = parseValorMonetario(dadosTecnicos.desconto)
    const totalPedido = Math.max(0, totalServicos - desconto)
    const anoServico = (() => {
      const partes = dataServico.split("/")
      return partes.length === 3 ? partes[2] : new Date().getFullYear().toString()
    })()

    return (
      <div ref={ref} className="os-a4-page bg-white text-black p-5 mx-auto text-[11px] print:text-[10px]" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center gap-3">
            <img src="/images/higiene-disque-logo.png" alt="Higiene Disque" className="w-20 h-14 object-contain" />
            <div className="text-[9px]">
              <h1 className="font-bold text-xs">{empresaInfo.nome}</h1>
              <p>{empresaInfo.endereco}</p>
              <p>{empresaInfo.cidadeUf}</p>
              <p>Telefones.: {empresaInfo.telefones}</p>
              <p>{empresaInfo.email}</p>
              <p>{empresaInfo.site}</p>
            </div>
          </div>
          <div className="border-2 border-black">
            <div className="border-b-2 border-black p-1 text-center">
              <p className="font-bold text-[9px]">N&ordm; PEDIDO</p>
              <p className="text-sm font-bold">{osNumber}</p>
            </div>
            <div className="p-1 text-center">
              <p className="font-bold text-[9px]">DATA</p>
              <p className="text-sm font-bold">{dataServico}</p>
            </div>
          </div>
        </div>

        {/* Titulo */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black text-center text-[10px]">
            DEMONSTRATIVO DE PEDIDO
          </div>
          <div className="p-1.5 space-y-1 text-[9px]">
            <div className="grid grid-cols-3 gap-2">
              <div><span className="font-bold">Data Servico: </span>{dataServico}</div>
              <div><span className="font-bold">Hora Servico: </span>{dadosTecnicos.horaServico || "-"}</div>
              <div><span className="font-bold">Atendente: </span>{dadosTecnicos.atendente || "-"}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2"><span className="font-bold">Tecnico: </span>{dadosTecnicos.tecnico || "-"}</div>
              <div><span className="font-bold">Vendedor: </span>{dadosTecnicos.vendedor || "-"}</div>
            </div>
            <div><span className="font-bold">Cliente: </span>{cliente.nome}</div>
            <div><span className="font-bold">Endereco: </span>{local.endereco}</div>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2"><span className="font-bold">Bairro: </span>{local.bairro}</div>
              <div><span className="font-bold">Estado: </span>{local.estado}</div>
              <div><span className="font-bold">C.E.P: </span>{local.cep}</div>
            </div>
            <div><span className="font-bold">Cidade: </span>{local.cidade}</div>
            <div><span className="font-bold">Telefones: </span>{cliente.telefone}</div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-bold">C.N.P.J: </span>{cliente.cpfCnpj}</div>
              <div><span className="font-bold">Inscricao: </span>{dadosTecnicos.inscricao || "-"}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-bold">E-mail: </span>{cliente.email}</div>
              <div><span className="font-bold">Home Page: </span>{dadosTecnicos.homePage || "-"}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-bold">Contatos: </span>{dadosTecnicos.contatos || cliente.contato || "-"}</div>
              <div><span className="font-bold">Origem: </span>{dadosTecnicos.origem || "-"}</div>
            </div>
            <div><span className="font-bold">Referencia: </span>{dadosTecnicos.referencia || "-"}</div>
            <div><span className="font-bold">Observacoes: </span>{dadosTecnicos.observacoes || "-"}</div>
            {veiculo && (
              <div><span className="font-bold">Veiculo associado: </span>{veiculo}</div>
            )}
          </div>
        </div>

        {/* Servicos */}
        <div className="border border-black mb-3">
          <div className="bg-gray-200 px-2 py-1 font-bold border-b border-black text-center text-[10px]">
            SERVICOS
          </div>
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr>
                <th className="border-r border-b border-black p-1 text-left">Descricao</th>
                <th className="border-r border-b border-black p-1 text-center w-24">Garantia</th>
                <th className="border-b border-black p-1 text-right w-24">Valor Servico</th>
              </tr>
            </thead>
            <tbody>
              {dadosTecnicos.servicos.length === 0 ? (
                <tr>
                  <td className="border-r border-black p-1">&nbsp;</td>
                  <td className="border-r border-black p-1">&nbsp;</td>
                  <td className="p-1">&nbsp;</td>
                </tr>
              ) : (
                dadosTecnicos.servicos.map((servico) => (
                  <tr key={servico.id}>
                    <td className="border-r border-black p-1">{servico.descricao || "-"}</td>
                    <td className="border-r border-black p-1 text-center">{servico.garantia || "-"}</td>
                    <td className="p-1 text-right">{servico.valorServico || "R$ 0,00"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="border-t border-black p-1.5 flex flex-col items-end gap-0.5 text-[9px]">
            <div className="flex gap-4">
              <span className="font-bold">Total Servicos:</span>
              <span>{formatarReal(totalServicos)}</span>
            </div>
            <div className="flex gap-4">
              <span className="font-bold">Desconto:</span>
              <span>{formatarReal(desconto)}</span>
            </div>
            <div className="flex gap-4">
              <span className="font-bold">Total Pedido:</span>
              <span>{formatarReal(totalPedido)}</span>
            </div>
          </div>
        </div>

        <div className="text-[9px] mb-3">
          <span className="font-bold">Condicao de Pagamento: </span>
          <span>{dadosTecnicos.condicaoPagamento || "-"}</span>
        </div>

        {/* Atestado */}
        <div className="text-[9px] text-center mb-4">
          <p className="font-bold">
            Atesto que o tecnico esteve neste local, no horario de ______ as ______ horas, executando os servicos descriminados acima
          </p>
        </div>

        <div className="text-[9px] text-right mb-8">
          <p className="font-bold">Rio de Janeiro,____ de ____________________ de {anoServico}</p>
        </div>

        <div className="text-[9px] text-center">
          <p>_________________________________________________</p>
          <p className="font-bold mt-1">Cliente / Ciente</p>
        </div>
      </div>
    )
  }
)

OSDocumentDesentupimento.displayName = "OSDocumentDesentupimento"
