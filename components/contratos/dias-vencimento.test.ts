import assert from "node:assert/strict"
import test from "node:test"

import { DIAS_VENCIMENTO_CONTRATO } from "./dias-vencimento.ts"

test("oferece vencimentos do dia 1 ao dia 30", () => {
  assert.equal(DIAS_VENCIMENTO_CONTRATO.length, 30)
  assert.equal(DIAS_VENCIMENTO_CONTRATO[0], 1)
  assert.equal(DIAS_VENCIMENTO_CONTRATO.at(-1), 30)
  assert.equal(DIAS_VENCIMENTO_CONTRATO.includes(31), false)
})
