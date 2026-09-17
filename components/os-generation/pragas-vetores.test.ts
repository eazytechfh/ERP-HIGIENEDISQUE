import assert from "node:assert/strict"
import test from "node:test"

import {
  DOCUMENTO_PRAGA_LABELS,
  PRAGAS_VETORES_OPTIONS,
  getPragaVetorLabel,
} from "./pragas-vetores.ts"

test("disponibiliza as novas pragas e vetores com seus rotulos", () => {
  const novasPragas = [
    ["tracas", "Traças"],
    ["aranhas", "Aranhas"],
    ["carunchos", "Carunchos"],
    ["percevejos", "Percevejos"],
    ["moscas", "Moscas"],
  ] as const

  for (const [value, label] of novasPragas) {
    assert.ok(
      PRAGAS_VETORES_OPTIONS.some((option) => option.value === value && option.label === label),
      `${label} deve estar disponivel na selecao`,
    )
    assert.equal(getPragaVetorLabel(value), label)
    assert.ok(DOCUMENTO_PRAGA_LABELS[value], `${label} deve ter rotulo para impressao`)
  }
})
