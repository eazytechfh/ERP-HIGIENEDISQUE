export const PRAGAS_VETORES_OPTIONS = [
  { value: "baratas", label: "Baratas" },
  { value: "formigas", label: "Formigas" },
  { value: "ratos", label: "Ratos" },
  { value: "mosquitos", label: "Mosquitos" },
  { value: "cupins", label: "Cupins" },
  { value: "lacraias", label: "Lacraias" },
  { value: "pulgas_carrapatos", label: "Pulgas/Carrapatos" },
  { value: "tracas", label: "Traças" },
  { value: "aranhas", label: "Aranhas" },
  { value: "carunchos", label: "Carunchos" },
  { value: "percevejos", label: "Percevejos" },
  { value: "moscas", label: "Moscas" },
  { value: "outros", label: "Outros" },
] as const

export type PragaAlvo = (typeof PRAGAS_VETORES_OPTIONS)[number]["value"]

export const DOCUMENTO_PRAGA_LABELS: Record<PragaAlvo, string> = {
  baratas: "BARATA",
  formigas: "FORMIGA",
  ratos: "RATO",
  mosquitos: "MOSQUITO",
  cupins: "Cupim",
  lacraias: "Lacraia",
  pulgas_carrapatos: "Pulgas/Carrapatos",
  tracas: "Traça",
  aranhas: "Aranha",
  carunchos: "Caruncho",
  percevejos: "Percevejo",
  moscas: "Mosca",
  outros: "Outros",
}

export function getPragaVetorLabel(praga: PragaAlvo): string {
  return PRAGAS_VETORES_OPTIONS.find((option) => option.value === praga)?.label ?? praga
}
