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
          width: "200mm",
          minHeight: "287mm",
          padding: "12mm",
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
          lineHeight: 1.35,
          pageBreakBefore: pageBreakBefore ? "always" : "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111", paddingBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>{empresaInfo.nome}</div>
            <div>{empresaInfo.endereco}</div>
            <div>{empresaInfo.cidadeUf}</div>
            <div>Telefones.: {empresaInfo.telefones}</div>
            <div>{empresaInfo.email}</div>
            <div>{empresaInfo.site}</div>
          </div>
          <div style={{ width: "78px", height: "54px", background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "20px" }}>
            HD
          </div>
        </div>

        <h1 style={{ textAlign: "center", margin: "28px 0 22px", fontSize: "24px", letterSpacing: 0 }}>
          CERTIFICADO DE GARANTIA
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", border: "1px solid #111", marginBottom: "18px" }}>
          <InfoBox label="Ordem Servico" value={data.osNumber} />
          <InfoBox label="Data Servico" value={data.dataServico} />
          <InfoBox label="Validade CRV" value={data.validadeCrv} />
          <InfoBox label="Certificado INEA" value={empresaInfo.certificadoInea} />
          <InfoBox label="Codigo INEA" value={empresaInfo.codigoInea} />
          <InfoBox label="N Pedido" value={data.pedido || "-"} />
          <InfoBox label="CPF/CNPJ" value={data.cpfCnpj || "-"} />
          <InfoBox label="Identidade" value={data.identidade || "-"} />
        </div>

        <div style={{ border: "1px solid #111", padding: "10px", marginBottom: "18px" }}>
          <div><strong>Cliente :</strong> {data.cliente}</div>
          <div><strong>Endereco :</strong> {data.endereco}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.6fr 0.8fr", gap: "8px" }}>
            <div><strong>Bairro :</strong> {data.bairro}</div>
            <div><strong>Cidade :</strong> {data.cidade}</div>
            <div><strong>Estado :</strong> {data.estado}</div>
            <div><strong>C.E.P :</strong> {data.cep || "-"}</div>
          </div>
        </div>

        <p style={{ fontWeight: 700, textAlign: "center", margin: "22px 0 18px" }}>
          CERTIFICAMOS QUE EXECUTAMOS O(S) SERVICO(S) DE DESINSETIZACAO ABAIXO DESCRIMINADO(S)
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "13px" }}>
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

        <div style={{ textAlign: "center", margin: "22px 0 30px" }}>
          {data.localEmissao}, {data.dataEmissaoExtenso}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "end" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #111", paddingTop: "8px" }}>{empresaInfo.nome}</div>
            <div>{data.responsavel || ""}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: "6px" }}>Observacoes</div>
            <div style={{ minHeight: "88px", border: "1px solid #111", padding: "8px", whiteSpace: "pre-wrap" }}>
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
  padding: "8px",
  textAlign: "left" as const,
  background: "#e5e7eb",
}

const tdStyle = {
  border: "1px solid #111",
  padding: "8px",
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRight: "1px solid #111", borderBottom: "1px solid #111", padding: "8px", minHeight: "54px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700 }}>{label}</div>
      <div>{value}</div>
    </div>
  )
}
