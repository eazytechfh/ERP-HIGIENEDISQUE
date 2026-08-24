import assert from "node:assert/strict"
import test from "node:test"

import { buildPrintDocument } from "./print-utils.ts"

test("keeps service orders on A4 by default", () => {
  const html = buildPrintDocument('<div class="os-a4-page">OS</div>', "OS")

  assert.match(html, /@page\s*{\s*size:\s*A4;\s*margin:\s*5mm;/)
})

test("uses A5 landscape as the default page for a certificate print job", () => {
  const html = buildPrintDocument(
    '<div class="certificado-a5-page">Certificado</div>',
    "Certificado",
    { page: "certificate" },
  )

  assert.match(
    html,
    /@page\s*{\s*size:\s*A5 landscape;\s*margin:\s*0;/,
  )
  assert.match(
    html,
    /\.certificado-a5-page\s*{[^}]*width:\s*210mm;[^}]*height:\s*148mm;[^}]*padding:\s*5mm;/s,
  )
  assert.doesNotMatch(html, /@page certificado/)
})
