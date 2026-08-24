"use client"

import { forwardRef } from "react"

const empresaInfo = {
  nome: "Higiene Disque Higienizacoes Ltda",
  endereco: "Av Sao Gualter, 200, lote 71 B - Piratininga",
  cidadeUf: "Niteroi - RJ - Cep.: 24355-010",
  telefones: "(21)2626-3000  -  (21)2625-3233",
  email: "contato@higienedisque.com.br",
  site: "www.higienedisque.com.br",
  certificadoInea: "CTA N IN004570",
  codigoInea: "UN63.01.01.87",
}

const certificadoLogoQrSrc = "/images/higiene-disque-certificado-logo-qr.png"

export type CertificadoGarantiaVetor = {
  vetor: string
  garantia: string
  vencimento: string
}

export type CertificadoGarantiaData = {
  tipoServico?: "pragas" | "limpeza" | "gordura"
  osNumber: string
  dataServico: string
  validadeCrv: string
  cliente: string
  pedido?: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  cpfCnpj: string
  identidade?: string
  vetores: CertificadoGarantiaVetor[]
  localEmissao: string
  dataEmissaoExtenso: string
  responsavel?: string
  observacoes?: string
}

const certificadoTextos = {
  pragas: {
    descricaoServico: "CERTIFICAMOS QUE EXECUTAMOS O(S) SERVIÇO(S) DE DESINSETIZAÇÃO ABAIXO DESCRIMINADO(S)",
    colunas: ["Vetor", "Garantia", "Vencimento"],
  },
  limpeza: {
    descricaoServico: "CERTIFICAMOS QUE EXECUTAMOS O(S) SERVIÇO(S) DE LIMPEZA E HIGIENIZAÇÃO DE RESERVATÓRIOS DE ÁGUA ABAIXO DESCRIMINADO(S)",
    colunas: ["Reservatório", "Volume (M³)", "Próxima Higienização"],
  },
  gordura: {
    descricaoServico: "CERTIFICAMOS QUE EXECUTAMOS O(S) SERVIÇO(S) DE LIMPEZA DE CAIXA DE GORDURA ABAIXO DESCRIMINADO(S)",
    colunas: ["Serviço", "Garantia", "Vencimento"],
  },
} as const

type CertificadoGarantiaProps = {
  data: CertificadoGarantiaData
  pageBreakBefore?: boolean
}

function getDocumentoLabel(cpfCnpj: string): string {
  const digitos = (cpfCnpj || "").replace(/\D/g, "")
  return digitos.length > 11 ? "C.N.P.J" : "C.P.F"
}

export const CertificadoGarantia = forwardRef<HTMLDivElement, CertificadoGarantiaProps>(
  ({ data, pageBreakBefore = false }, ref) => {
    const textos = certificadoTextos[data.tipoServico || "pragas"]
    return (
      <div
        ref={ref}
        className="certificado-a5-page bg-white text-black mx-auto"
        style={{
          width: "210mm",
          height: "148mm",
          padding: "5mm",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          lineHeight: 1.25,
          overflowWrap: "anywhere",
          pageBreakBefore: pageBreakBefore ? "always" : "auto",
        }}
      >
        <table style={sheetTableStyle}>
          <tbody>
            <tr>
              <td colSpan={5} style={{ ...cellStyle, padding: "1.5mm 3mm 1mm" }}>
                <div style={{ display: "grid", gridTemplateColumns: "56% 1fr", alignItems: "center", gap: "1.5%" }}>
                  <img
                    src={certificadoLogoQrSrc}
                    alt="Higiene Disque e QR Code"
                    style={{
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      objectPosition: "left center",
                      display: "block",
                    }}
                  />
                  <div style={{ textAlign: "right", fontSize: "1em", lineHeight: 1.32 }}>
                    <div style={{ fontSize: "1.56em", fontWeight: 700 }}>Higiene Disque Higienizações Ltda</div>
                    <div>Av São Gualter, 200, lote 71 B - Piratininga</div>
                    <div>Niterói - RJ - Cep.: 24355-010</div>
                    <div>Telefones.: (21)2626-3000&nbsp;&nbsp;-&nbsp;&nbsp;(21)2625-3233</div>
                    <div>contato@higienedisque.com.br</div>
                    <div>www.higienedisque.com.br</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ ...cellStyle, padding: "0.7mm 0", textAlign: "center", fontWeight: 700, fontSize: "1.773em" }}>
                CERTIFICADO DE GARANTIA
              </td>
            </tr>
            <tr>
              <InfoHeaderCell label="Código INEA" value={empresaInfo.codigoInea} />
              <InfoHeaderCell label="Certificado INEA" value={empresaInfo.certificadoInea} />
              <InfoHeaderCell label="Validade CRV" value={data.validadeCrv} />
              <InfoHeaderCell label="Data Serviço" value={data.dataServico} />
              <InfoHeaderCell label="Ordem Serviço" value={data.osNumber} />
            </tr>
            <tr>
              <td colSpan={5} style={{ ...cellStyle, padding: "0.8mm 1.5mm", fontSize: "1em" }}>
                <div style={{ display: "grid", gridTemplateColumns: "13% 1fr 13% 14.5%", rowGap: "1.4mm", columnGap: "1%", alignItems: "center", lineHeight: 1.3 }}>
                  <LabeledValue label="Cliente" value={data.cliente} wide />
                  <div style={{ fontWeight: 700, textAlign: "right" }}>Nº Pedido :</div>
                  <div>{data.pedido || ""}</div>

                  <LabeledValue label="Endereço" value={data.endereco} wide />
                  <div />
                  <div />

                  <LabeledValue label="Bairro" value={data.bairro} />
                  <LabeledValue label="Cidade" value={data.cidade} />
                  <LabeledValue label="Estado" value={data.estado} />
                  <LabeledValue label="C.E.P" value={data.cep || ""} />

                  <LabeledValue label={getDocumentoLabel(data.cpfCnpj)} value={data.cpfCnpj || ""} wide />
                  <LabeledValue label="Identidade" value={data.identidade || ""} wide />
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ ...cellStyle, padding: "2.3mm 1.4mm", textAlign: "center", fontWeight: 700, fontSize: "1.107em" }}>
                {textos.descricaoServico}
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ ...cellStyle, padding: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "1em" }}>
                  <thead>
                    <tr>
                      <th style={{ ...innerThStyle, width: "50%" }}>{textos.colunas[0]}</th>
                      <th style={{ ...innerThStyle, width: "25%" }}>{textos.colunas[1]}</th>
                      <th style={{ ...innerThStyle, width: "25%", borderRight: 0 }}>{textos.colunas[2]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vetores.map((item, index) => (
                      <tr key={`${item.vetor}-${index}`}>
                        <td style={innerTdStyle}>{item.vetor}</td>
                        <td style={{ ...innerTdStyle, textAlign: "center" }}>{item.garantia}</td>
                        <td style={{ ...innerTdStyle, textAlign: "center", borderRight: 0 }}>{item.vencimento}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 3 - data.vetores.length) }).map((_, index) => (
                      <tr key={`empty-${index}`}>
                        <td style={innerTdStyle}>&nbsp;</td>
                        <td style={innerTdStyle}>&nbsp;</td>
                        <td style={{ ...innerTdStyle, borderRight: 0 }}>&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ ...cellStyle, padding: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "1em" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", padding: "1.4mm 3mm 2.5mm", verticalAlign: "top", borderRight: "2px solid #111" }}>
                        <div style={{ textAlign: "center", fontWeight: 700, marginBottom: "1mm" }}>Observações</div>
                        <div style={{ whiteSpace: "pre-wrap", minHeight: "14mm" }}>{data.observacoes || "-"}</div>
                      </td>
                      <td style={{ width: "50%", padding: "3mm 3mm 2.5mm", textAlign: "center", verticalAlign: "bottom" }}>
                        <div style={{ fontWeight: 700, marginBottom: "5.5mm" }}>
                          {data.localEmissao}, {data.dataEmissaoExtenso}
                        </div>
                        <div style={{ borderTop: "1px solid #777", width: "72%", margin: "0 auto 1.5mm" }} />
                        <div style={{ fontWeight: 700, fontSize: "0.893em" }}>Higiene Disque Higienizações Ltda</div>
                        <div style={{ fontSize: "0.773em" }}>Rachel Dantas</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  },
)

CertificadoGarantia.displayName = "CertificadoGarantia"

const sheetTableStyle = {
  width: "100%",
  height: "100%",
  borderCollapse: "collapse" as const,
  tableLayout: "fixed" as const,
  border: "2px solid #111",
}

const cellStyle = {
  border: "1px solid #111",
  color: "#000",
}

const innerThStyle = {
  borderRight: "2px solid #111",
  borderBottom: "2px solid #111",
  padding: "0.8mm 1.4mm",
  textAlign: "center" as const,
  fontWeight: 700,
}

const innerTdStyle = {
  borderRight: "2px solid #111",
  padding: "0.6mm 2mm",
  height: "4.5mm",
}

function InfoHeaderCell({ label, value }: { label: string; value: string }) {
  return (
    <td style={{ ...cellStyle, padding: "0.8mm 1.4mm", textAlign: "center", height: "10mm" }}>
      <div style={{ fontSize: "1em", fontWeight: 700, marginBottom: "0.8mm" }}>{label}</div>
      <div style={{ fontSize: "1.107em" }}>{value}</div>
    </td>
  )
}

function LabeledValue({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div style={wide ? { gridColumn: "span 2" } : undefined}>
      <strong>{label} :</strong>&nbsp;&nbsp;&nbsp;{value}
    </div>
  )
}
