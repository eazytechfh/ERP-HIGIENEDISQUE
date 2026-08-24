import assert from "node:assert/strict"
import test from "node:test"

import { buildPrintDocument } from "./print-utils.ts"

test("keeps service orders on A4 by default", () => {
  const html = buildPrintDocument('<div class="os-a4-page">OS</div>', "OS")

  assert.match(html, /@page\s*{\s*size:\s*A4;\s*margin:\s*5mm;/)
})

test("lets the print dialog choose the certificate paper and fills its printable area", () => {
  const html = buildPrintDocument(
    '<div class="certificado-a5-page">Certificado</div>',
    "Certificado",
    { page: "certificate" },
  )

  assert.match(
    html,
    /@page\s*{\s*size:\s*landscape;\s*margin:\s*5mm;/,
  )
  assert.match(
    html,
    /\.certificado-a5-page\s*{[^}]*width:\s*100% !important;[^}]*height:\s*100% !important;/s,
  )
  assert.match(
    html,
    /\.certificado-a5-page\s*{[^}]*font-size:\s*clamp\(12px,\s*1\.59vw,\s*18px\) !important;/s,
  )
  assert.doesNotMatch(html, /size:\s*A[45]/)
})
