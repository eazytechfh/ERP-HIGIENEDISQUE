import assert from "node:assert/strict"
import test from "node:test"

import { getVetoresPrintDensityClass } from "./vetores-print-density.ts"

test("keeps the regular layout with up to four products", () => {
  assert.equal(getVetoresPrintDensityClass(4), "")
})

test("uses the compact layout with more than four products", () => {
  assert.equal(getVetoresPrintDensityClass(5), "os-vetores-dense")
})
