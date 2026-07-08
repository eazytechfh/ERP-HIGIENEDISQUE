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

type CertificadoGarantiaProps = {
  data: CertificadoGarantiaData
  pageBreakBefore?: boolean
}

export const CertificadoGarantia = forwardRef<HTMLDivElement, CertificadoGarantiaProps>(
  ({ data, pageBreakBefore = false }, ref) => {
    return (
      <div
        ref={ref}
        className="certificado-a4-page bg-white text-black mx-auto"
        style={{
          width: "287mm",
          minHeight: "198mm",
          padding: "0",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          lineHeight: 1.08,
          pageBreakBefore: pageBreakBefore ? "always" : "auto",
        }}
      >
        <table style={sheetTableStyle}>
          <tbody>
            <tr>
              <td colSpan={5} style={{ ...cellStyle, padding: "2mm 3mm 1.5mm" }}>
                <div style={{ display: "grid", gridTemplateColumns: "148mm 1fr", alignItems: "center", gap: "6mm" }}>
                  <img
                    src={certificadoLogoQrSrc}
                    alt="Higiene Disque e QR Code"
                    style={{
                      width: "148mm",
                      height: "41mm",
                      objectFit: "contain",
                      objectPosition: "left center",
                      display: "block",
                    }}
                  />
                  <div style={{ textAlign: "right", fontSize: "13px", lineHeight: 1.22 }}>
                    <div style={{ fontSize: "22px", fontWeight: 700 }}>Higiene Disque Higienizações Ltda</div>
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
              <td colSpan={5} style={{ ...cellStyle, padding: "1.2mm 0", textAlign: "center", fontWeight: 700, fontSize: "23px" }}>
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
              <td colSpan={5} style={{ ...cellStyle, padding: "1.1mm 2mm", fontSize: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "35mm 1fr 34mm 38mm", rowGap: "1.4mm", columnGap: "3mm" }}>
                  <LabeledValue label="Cliente" value={data.cliente} />
                  <div />
                  <div style={{ fontWeight: 700, textAlign: "right" }}>Nº Pedido :</div>
                  <div>{data.pedido || "-"}</div>

                  <LabeledValue label="Endereço" value={data.endereco} wide />
                  <div />
                  <div />

                  <LabeledValue label="Bairro" value={data.bairro} />
                  <LabeledValue label="Cidade" value={data.cidade} />
                  <LabeledValue label="Estado" value={data.estado} />
                  <LabeledValue label="C.E.P" value={data.cep || "-"} />

                  <LabeledValue label="C.P.F" value={data.cpfCnpj || "-"} />
                  <div />
                  <LabeledValue label="Identidade" value={data.identidade || "-"} wide />
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ ...cellStyle, padding: "4mm 2mm", textAlign: "center", fontWeight: 700, fontSize: "14px" }}>
                CERTIFICAMOS QUE EXECUTAMOS O(S) SERVIÇO(S) DE DESINSETIZAÇÃO ABAIXO DESCRIMINADO(S)
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ ...cellStyle, padding: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "12px" }}>
                  <thead>
                    <tr>
                      <th style={{ ...innerThStyle, width: "50%" }}>Vetor</th>
                      <th style={{ ...innerThStyle, width: "25%" }}>Garantia</th>
                      <th style={{ ...innerThStyle, width: "25%", borderRight: 0 }}>Vencimento</th>
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
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "12px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", padding: "1.6mm 3mm 3mm", verticalAlign: "top", borderRight: "2px solid #111" }}>
                        <div style={{ textAlign: "center", fontWeight: 700, marginBottom: "1mm" }}>Observações</div>
                        <div style={{ whiteSpace: "pre-wrap", minHeight: "22mm" }}>{data.observacoes || "-"}</div>
                      </td>
                      <td style={{ width: "50%", padding: "4mm 3mm 3mm", textAlign: "center", verticalAlign: "bottom" }}>
                        <div style={{ fontWeight: 700, marginBottom: "10mm" }}>
                          {data.localEmissao}, {data.dataEmissaoExtenso}
                        </div>
                        <div style={{ borderTop: "1px solid #777", width: "72%", margin: "0 auto 1.5mm" }} />
                        <div style={{ fontWeight: 700, fontSize: "10px" }}>Higiene Disque Higienizações Ltda</div>
                        <div style={{ fontSize: "9px" }}>{data.responsavel || ""}</div>
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
  padding: "1mm 2mm",
  textAlign: "center" as const,
  fontWeight: 700,
}

const innerTdStyle = {
  borderRight: "2px solid #111",
  padding: "0.8mm 3mm",
  height: "6mm",
}

function InfoHeaderCell({ label, value }: { label: string; value: string }) {
  return (
    <td style={{ ...cellStyle, padding: "1.4mm 2mm", textAlign: "center", height: "14mm" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "1mm" }}>{label}</div>
      <div style={{ fontSize: "13px" }}>{value}</div>
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
