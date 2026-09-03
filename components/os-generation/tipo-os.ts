export type TipoOSClassificado = "vetores" | "limpeza" | "desentupimento"

export const AVISO_SERVICO_SEM_GARANTIA = "Estou ciente de que esse serviço não possui garantia."

function normalizar(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

export function servicoSemGarantia(nome: string): boolean {
  const nomeNormalizado = normalizar(nome)
  return nomeNormalizado.includes("gordura") ||
    (nomeNormalizado.includes("transporte") && nomeNormalizado.includes("residuo"))
}

export function classificarTipoOS(nome: string, categoria: string): TipoOSClassificado {
  const nomeNormalizado = normalizar(nome)

  if (categoria === "reservatorio_potavel" || nomeNormalizado.includes("higien")) return "limpeza"
  if (
    nomeNormalizado.includes("desentup") ||
    nomeNormalizado.includes("gordura") ||
    (nomeNormalizado.includes("transporte") && nomeNormalizado.includes("residuo"))
  ) return "desentupimento"

  return "vetores"
}
