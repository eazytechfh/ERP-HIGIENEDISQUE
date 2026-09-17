import assert from "node:assert/strict"
import test from "node:test"

import { getCertificadoVetoresDensity } from "./certificado-vetores-density.ts"

test("compacta progressivamente ate treze pragas em uma unica folha", () => {
  const densityForEight = getCertificadoVetoresDensity(8)
  const densityForThirteen = getCertificadoVetoresDensity(13)

  assert.ok(densityForThirteen.fontSizeEm < densityForEight.fontSizeEm)
  assert.ok(densityForThirteen.rowHeightMm < densityForEight.rowHeightMm)
  assert.ok(densityForThirteen.rowHeightMm * 13 <= 24)
})
