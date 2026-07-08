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
          minHeight: "200mm",
          padding: "8mm 10mm",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          lineHeight: 1.25,
          pageBreakBefore: pageBreakBefore ? "always" : "auto",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "132mm 1fr", gap: "9mm", alignItems: "start", borderBottom: "2px solid #111", paddingBottom: "5mm" }}>
          <img
            src={certificadoLogoQrSrc}
            alt="Higiene Disque e QR Code"
            style={{ width: "132mm", height: "40mm", objectFit: "contain", objectPosition: "left center" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3mm", fontSize: "11px" }}>
            <div style={{ gridColumn: "1 / -1", fontWeight: 700, fontSize: "14px" }}>{empresaInfo.nome}</div>
            <div style={{ gridColumn: "1 / -1" }}>{empresaInfo.endereco}</div>
            <div style={{ gridColumn: "1 / -1" }}>{empresaInfo.cidadeUf}</div>
            <div style={{ gridColumn: "1 / -1" }}>Telefones.: {empresaInfo.telefones}</div>
            <div>{empresaInfo.email}</div>
            <div>{empresaInfo.site}</div>
            <InfoLine label="Certificado INEA" value={empresaInfo.certificadoInea} />
            <InfoLine label="Codigo INEA" value={empresaInfo.codigoInea} />
          </div>
        </div>

        <h1 style={{ textAlign: "center", margin: "5mm 0 4mm", fontSize: "24px", letterSpacing: 0 }}>
          CERTIFICADO DE GARANTIA
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "25mm 30mm 30mm 36mm 34mm 1fr", gap: "3mm", marginBottom: "3mm", alignItems: "end" }}>
          <Field label="Ordem Servico" value={data.osNumber} strong />
          <Field label="Data Servico" value={data.dataServico} />
          <Field label="Validade CRV" value={data.validadeCrv} />
          <Field label="Certificado INEA" value={empresaInfo.certificadoInea} />
          <Field label="Codigo INEA" value={empresaInfo.codigoInea} />
          <Field label="N Pedido" value={data.pedido || "-"} />
        </div>

        <div style={{ border: "1px solid #111", padding: "3mm", marginBottom: "4mm", fontSize: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 45mm", gap: "4mm" }}>
            <InfoLine label="Cliente" value={data.cliente} />
            <InfoLine label="N Pedido" value={data.pedido || "-"} />
          </div>
          <InfoLine label="Endereco" value={data.endereco} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 42mm 20mm 32mm", gap: "4mm" }}>
            <InfoLine label="Bairro" value={data.bairro} />
            <InfoLine label="Cidade" value={data.cidade} />
            <InfoLine label="Estado" value={data.estado} />
            <InfoLine label="C.E.P" value={data.cep || "-"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm" }}>
            <InfoLine label="C.P.F/C.N.P.J" value={data.cpfCnpj || "-"} />
            <InfoLine label="Identidade" value={data.identidade || "-"} />
          </div>
        </div>

        <p style={{ fontWeight: 700, textAlign: "center", margin: "3mm 0 3mm", fontSize: "13px" }}>
          CERTIFICAMOS QUE EXECUTAMOS O(S) SERVICO(S) DE DESINSETIZACAO ABAIXO DESCRIMINADO(S)
        </p>

        <table style={{ width: "66%", borderCollapse: "collapse", margin: "0 auto 5mm", fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Vetor</th>
              <th style={thStyle}>Garantia</th>
              <th style={thStyle}>Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {data.vetores.map((item, index) => (
              <tr key={`${item.vetor}-${index}`}>
                <td style={tdStyle}>{item.vetor}</td>
                <td style={tdStyle}>{item.garantia}</td>
                <td style={tdStyle}>{item.vencimento}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: "center", margin: "4mm 0 7mm", fontSize: "13px" }}>
          {data.localEmissao}, {data.dataEmissaoExtenso}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12mm", alignItems: "end" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", paddingTop: "2mm" }}>{empresaInfo.nome}</div>
            <div>{data.responsavel || ""}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: "1.5mm" }}>Observacoes</div>
            <div style={{ minHeight: "22mm", border: "1px solid #111", padding: "2mm", whiteSpace: "pre-wrap", fontSize: "11px" }}>
              {data.observacoes || "-"}
            </div>
          </div>
        </div>
      </div>
    )
  },
)

CertificadoGarantia.displayName = "CertificadoGarantia"

const thStyle = {
  border: "1px solid #111",
  padding: "2mm",
  textAlign: "left" as const,
  background: "#e5e7eb",
}

const tdStyle = {
  border: "1px solid #111",
  padding: "2mm",
}

function Field({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 700 }}>{label}</div>
      <div style={{ borderBottom: "1px solid #111", minHeight: "6mm", fontWeight: strong ? 700 : 400 }}>{value}</div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minHeight: "6mm" }}>
      <strong>{label} :</strong> {value}
    </div>
  )
}
