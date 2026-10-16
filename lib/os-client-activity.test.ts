import assert from "node:assert/strict"
import test from "node:test"

import { resolveClientActivity } from "./os-client-activity.ts"

test("uses the selected location environment as the client activity", () => {
  assert.equal(resolveClientActivity("", "Empresa"), "Empresa")
})

test("keeps a manually selected client activity", () => {
  assert.equal(resolveClientActivity("Indústria", "Empresa"), "Indústria")
})

test("does not silently classify an unknown activity as apartment", () => {
  assert.equal(resolveClientActivity("", ""), "Não informado")
})
