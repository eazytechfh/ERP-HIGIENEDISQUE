export type CandidatoTecnicoResponsavel = {
  nome: string
  cargo: string
  perfilAcesso: string
  situacao: string
}

function normalizar(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function pontuacao(candidato: CandidatoTecnicoResponsavel): number {
  const cargo = normalizar(candidato.cargo)
  const perfil = normalizar(candidato.perfilAcesso)

  if (cargo.includes("responsavel tecnico")) return 100
  if (cargo.includes("veterin")) return 90
  if (cargo.includes("biolog")) return 80
  if (perfil === "tecnico") return 50
  if (cargo.includes("tecnic")) return 40
  return 0
}

export function selecionarTecnicoResponsavel<T extends CandidatoTecnicoResponsavel>(candidatos: T[]): T | null {
  return candidatos
    .filter((candidato) => candidato.nome.trim() && normalizar(candidato.situacao) === "ativo")
    .map((candidato, index) => ({ candidato, index, score: pontuacao(candidato) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.candidato || null
}
