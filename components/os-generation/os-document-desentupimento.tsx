"use client"

import { forwardRef } from "react"
import type { DadosTecnicosDesentupimento } from "./desentupimento-form"
import { AVISO_SERVICO_SEM_GARANTIA } from "./tipo-os"

// Empresa Info (mock - pode vir de configuracoes do sistema)
const empresaInfo = {
  nome: "Higiene Disque Higienizações Ltda",
  endereco: "Av São Gualter, 200, lote 71 B - Piratininga",
  cidadeUf: "Niterói - RJ - Cep.: 24355-010",
  telefones: "(21)2626-3000  -  (21)2625-3233",
  email: "contato@higienedisque.com.br",
  site: "www.higienedisque.com.br",
}

const logoSrc = "/images/higiene-disque-logo.png"

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
  semGarantia?: boolean
  descricaoServico?: string
}

function getDocumentoLabel(cpfCnpj: string): string {
  const digitos = (cpfCnpj || "").replace(/\D/g, "")
  return digitos.length > 11 ? "C.N.P.J" : "C.P.F"
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
  ({ osNumber, cliente, local, dadosTecnicos, dataServico, veiculo, semGarantia = false, descricaoServico = "" }, ref) => {
    const totalServicos = dadosTecnicos.servicos.reduce((acc, s) => acc + parseValorMonetario(s.valorServico), 0)
    const desconto = parseValorMonetario(dadosTecnicos.desconto)
    const totalPedido = Math.max(0, totalServicos - desconto)
    const anoServico = (() => {
      const partes = dataServico.split("/")
      return partes.length === 3 ? partes[2] : new Date().getFullYear().toString()
    })()

    return (
      <div
        ref={ref}
        className="os-a4-page bg-white text-black mx-auto"
        style={{ width: "200mm", minHeight: "287mm", padding: "6mm", fontFamily: "Arial, sans-serif", fontSize: "9px", lineHeight: 1.3, color: "#000" }}
      >
        <table style={outerTableStyle}>
          <tbody>
            {/* Header: logo | empresa | pedido/data */}
            <tr>
              <td style={{ ...cellStyle, width: "40mm", padding: "2mm", verticalAlign: "middle" }}>
                <img src={logoSrc} alt="Higiene Disque" style={{ width: "100%", height: "16mm", objectFit: "contain" }} />
              </td>
              <td style={{ ...cellStyle, padding: "2mm", textAlign: "center", verticalAlign: "middle" }}>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{empresaInfo.nome}</div>
                <div>{empresaInfo.endereco}</div>
                <div>{empresaInfo.cidadeUf}</div>
                <div>Telefones.: {empresaInfo.telefones}</div>
                <div>{empresaInfo.email}</div>
                <div>{empresaInfo.site}</div>
              </td>
              <td style={{ ...cellStyle, width: "40mm", padding: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "1.5mm", textAlign: "center", borderBottom: "1px solid #111" }}>
                        <div style={{ fontWeight: 700 }}>Nº PEDIDO</div>
                        <div style={{ fontSize: "12px", fontWeight: 700 }}>{osNumber}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "1.5mm", textAlign: "center" }}>
                        <div style={{ fontWeight: 700 }}>DATA</div>
                        <div style={{ fontSize: "12px", fontWeight: 700 }}>{dataServico}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Titulo */}
            <tr>
              <td colSpan={3} style={{ ...cellStyle, padding: "1mm", textAlign: "center", fontWeight: 700, fontSize: "10px" }}>
                DEMONSTRATIVO DE PEDIDO
              </td>
            </tr>

            {/* Bloco de campos */}
            <tr>
              <td colSpan={3} style={{ ...cellStyle, padding: "1.5mm 20mm 1.5mm 2mm" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6mm" }}>
                  <Linha>
                    <Campo label="Data Serviço" value={dataServico} />
                    <Campo label="Hora Serviço" value={dadosTecnicos.horaServico} />
                    <Campo label="Atendente" value={dadosTecnicos.atendente} align="right" />
                  </Linha>
                  <Linha>
                    <Campo label="Técnico" value={dadosTecnicos.tecnico} grow />
                    <Campo label="Vendedor" value={dadosTecnicos.vendedor} align="right" />
                  </Linha>
                  <Campo label="Cliente" value={cliente.nome} bold />
                  <Campo label="Endereço" value={local.endereco} />
                  <Linha>
                    <Campo label="Bairro" value={local.bairro} />
                    <Campo label="Cidade" value={local.cidade} />
                    <Campo label="Estado" value={local.estado} align="right" />
                    <Campo label="C.E.P" value={local.cep} align="right" />
                  </Linha>
                  <Campo label="Telefones" value={cliente.telefone} />
                  <Linha>
                    <Campo label={getDocumentoLabel(cliente.cpfCnpj)} value={cliente.cpfCnpj} grow />
                    <Campo label="Inscrição" value={dadosTecnicos.inscricao} align="right" />
                  </Linha>
                  <Linha>
                    <Campo label="E-mail" value={cliente.email} grow />
                    <Campo label="Home Page" value={dadosTecnicos.homePage} align="right" />
                  </Linha>
                  <Linha>
                    <Campo label="Contatos" value={dadosTecnicos.contatos || cliente.contato} grow />
                    <Campo label="Origem" value={dadosTecnicos.origem} align="right" />
                  </Linha>
                  <Campo label="Referência" value={dadosTecnicos.referencia} />
                  <Campo label="Observações" value={dadosTecnicos.observacoes.trim() || descricaoServico.trim()} />
                  {veiculo && <Campo label="Veículo associado" value={veiculo} />}
                </div>
              </td>
            </tr>

            {/* Servicos */}
            <tr>
              <td colSpan={3} style={{ ...cellStyle, padding: "1mm", textAlign: "center", fontWeight: 700, fontSize: "10px" }}>
                SERVIÇOS
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ ...cellStyle, padding: "1.5mm 2mm" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", fontWeight: 700, borderBottom: "1px solid #111", padding: "0 0 0.8mm" }}>Descrição</th>
                      <th style={{ textAlign: "right", fontWeight: 700, borderBottom: "1px solid #111", padding: "0 0 0.8mm", width: "28mm" }}>Garantia</th>
                      <th style={{ textAlign: "right", fontWeight: 700, borderBottom: "1px solid #111", padding: "0 0 0.8mm", width: "28mm" }}>Valor Serviço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosTecnicos.servicos.length === 0 ? (
                      <tr>
                        <td style={{ padding: "0.8mm 0" }}>&nbsp;</td>
                        <td style={{ padding: "0.8mm 0" }}>&nbsp;</td>
                        <td style={{ padding: "0.8mm 0" }}>&nbsp;</td>
                      </tr>
                    ) : (
                      dadosTecnicos.servicos.map((servico) => (
                        <tr key={servico.id}>
                          <td style={{ padding: "0.8mm 0" }}>{servico.descricao || "-"}</td>
                          <td style={{ padding: "0.8mm 0", textAlign: "right" }}>{servico.garantia}</td>
                          <td style={{ padding: "0.8mm 0", textAlign: "right" }}>{servico.valorServico}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ borderTop: "1px solid #111", padding: "1mm 0 0" }} />
                    </tr>
                    <tr>
                      <td />
                      <td style={{ textAlign: "right", fontWeight: 700, padding: "0.3mm 0" }}>Total Serviços :</td>
                      <td style={{ textAlign: "right", padding: "0.3mm 0" }}>{formatarReal(totalServicos)}</td>
                    </tr>
                    <tr>
                      <td />
                      <td style={{ textAlign: "right", fontWeight: 700, padding: "0.3mm 0" }}>Desconto :</td>
                      <td style={{ textAlign: "right", padding: "0.3mm 0" }}>{formatarReal(desconto)}</td>
                    </tr>
                    <tr>
                      <td />
                      <td style={{ textAlign: "right", fontWeight: 700, padding: "0.3mm 0" }}>Total Pedido :</td>
                      <td style={{ textAlign: "right", padding: "0.3mm 0" }}>{formatarReal(totalPedido)}</td>
                    </tr>
                  </tfoot>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontWeight: 700, marginTop: "2mm", fontSize: "10.5px" }}>Condição de Pagamento : {dadosTecnicos.condicaoPagamento || ""}</div>

        {semGarantia ? (
          <div style={{ textAlign: "center", fontWeight: 700, marginTop: "4mm", fontSize: "10.5px" }}>
            {AVISO_SERVICO_SEM_GARANTIA}
          </div>
        ) : null}

        <div style={{ textAlign: "center", fontWeight: 700, marginTop: "6mm", fontSize: "10.5px" }}>
          Atesto que o técnico esteve neste local, no horário de ______ às ______ horas, executando os serviços descriminados acima
        </div>

        <div style={{ textAlign: "right", fontWeight: 700, marginTop: "6mm", fontSize: "10.5px" }}>
          Rio de Janeiro,____ de ____________________ de {anoServico}
        </div>

        <div style={{ textAlign: "center", marginTop: "10mm", fontSize: "10.5px" }}>
          <div>_________________________________________________</div>
          <div style={{ fontWeight: 700, marginTop: "0.8mm" }}>Cliente / Ciente</div>
        </div>
      </div>
    )
  }
)

OSDocumentDesentupimento.displayName = "OSDocumentDesentupimento"

const outerTableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  border: "2px solid #111",
}

const cellStyle = {
  border: "1px solid #111",
  color: "#000",
}

function Linha({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: "3mm" }}>{children}</div>
}

function Campo({
  label,
  value,
  grow = false,
  align,
  bold = false,
}: {
  label: string
  value?: string
  grow?: boolean
  align?: "right"
  bold?: boolean
}) {
  return (
    <div style={{ flex: grow ? "1 1 auto" : align === "right" ? "0 0 auto" : "0 1 auto", marginLeft: align === "right" ? "auto" : undefined }}>
      <span style={{ fontWeight: 700 }}>{label} : </span>
      <span style={{ fontWeight: bold ? 700 : 400 }}>{value || ""}</span>
    </div>
  )
}
