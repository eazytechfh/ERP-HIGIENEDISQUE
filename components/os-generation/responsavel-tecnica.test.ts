import assert from "node:assert/strict"
import test from "node:test"

import {
  RESPONSAVEL_TECNICA_NOME,
  RESPONSAVEL_TECNICA_REGISTRO,
} from "./responsavel-tecnica.ts"

test("fornece Mirela e seu CRMV para preenchimento automatico das OS", () => {
  assert.equal(RESPONSAVEL_TECNICA_NOME, "Mirela Lauria Delia")
  assert.equal(RESPONSAVEL_TECNICA_REGISTRO, "CRMV. RJ 17439VP")
})
