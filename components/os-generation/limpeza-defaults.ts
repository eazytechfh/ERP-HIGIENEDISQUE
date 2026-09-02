export type TipoReservatorio = "cisterna" | "caixa_dagua"
export type TipoMaterial = "" | "concreto" | "polietileno" | "outros"
export type SituacaoSolo = "" | "elevada" | "apoiada" | "enterrada" | "semi_enterrada"
export type CondicaoCobertura = "" | "totalmente_coberta" | "parcialmente_coberta"
export type SimNao = "" | "sim" | "nao"

export type Reservatorio = {
  id: string
  tipo: TipoReservatorio
  numero: number
  volumeM3: string
  tipoMaterial: TipoMaterial
  situacaoSolo: SituacaoSolo
  condicaoCobertura: CondicaoCobertura
  presencaDetritos: SimNao
  presencaVetores: SimNao
  proximidadeFossaEsgoto: SimNao
  ocorrenciaFendasRachaduras: SimNao
}

export function criarReservatorio(tipo: TipoReservatorio, numero: number, id: string): Reservatorio {
  return {
    id,
    tipo,
    numero,
    volumeM3: "",
    tipoMaterial: "",
    situacaoSolo: "",
    condicaoCobertura: "",
    presencaDetritos: "",
    presencaVetores: "",
    proximidadeFossaEsgoto: "",
    ocorrenciaFendasRachaduras: "",
  }
}
