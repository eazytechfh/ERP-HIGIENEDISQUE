import assert from "node:assert/strict"
import test from "node:test"

import { selecionarTecnicoResponsavel } from "./tecnico-responsavel.ts"

test("seleciona a veterinaria ativa da equipe como responsavel tecnica", () => {
  const tecnico = selecionarTecnicoResponsavel([
    { nome: "Aplicador", cargo: "Auxiliar", perfilAcesso: "tecnico", situacao: "Ativo" },
    { nome: "Mirela Lauria Delia", cargo: "Veterinária", perfilAcesso: "tecnico", situacao: "Ativo" },
  ])

  assert.equal(tecnico?.nome, "Mirela Lauria Delia")
})

test("ignora responsavel inativo e usa o perfil tecnico ativo como alternativa", () => {
  const tecnico = selecionarTecnicoResponsavel([
    { nome: "Responsável antigo", cargo: "Responsável Técnico", perfilAcesso: "tecnico", situacao: "Inativo" },
    { nome: "Técnica ativa", cargo: "Operacional", perfilAcesso: "tecnico", situacao: "Ativo" },
  ])

  assert.equal(tecnico?.nome, "Técnica ativa")
})
