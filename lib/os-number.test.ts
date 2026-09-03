import assert from "node:assert/strict"
import test from "node:test"

import { parseReservedOsNumber } from "./os-number.ts"

test("accepts a reserved OS number for the requested year", () => {
  assert.equal(parseReservedOsNumber("OS-2026-000124", 2026), "OS-2026-000124")
})

test("rejects a reserved OS number from another year", () => {
  assert.throws(
    () => parseReservedOsNumber("OS-2025-000124", 2026),
    /Numero de OS invalido/,
  )
})

test("rejects malformed RPC responses", () => {
  assert.throws(() => parseReservedOsNumber(null, 2026), /Numero de OS invalido/)
})
