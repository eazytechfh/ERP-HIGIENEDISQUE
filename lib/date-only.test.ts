import assert from "node:assert/strict"
import test from "node:test"

import { formatDateOnlyBR, parseDateOnlyLocal } from "./date-only.ts"

process.env.TZ = "America/Sao_Paulo"

test("preserva 12/08/2026 ao formatar a data civil da OS", () => {
  assert.equal(formatDateOnlyBR("2026-08-12"), "12/08/2026")
})

test("interpreta a data civil no calendario local", () => {
  const date = parseDateOnlyLocal("2026-08-12")

  assert.deepEqual(
    [date.getFullYear(), date.getMonth(), date.getDate()],
    [2026, 7, 12],
  )
})
