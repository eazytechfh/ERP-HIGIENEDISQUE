import assert from "node:assert/strict"
import test from "node:test"

import { buildPrintDocument } from "./print-utils.ts"

test("keeps service orders on A4 and prints only the certificate on A5 landscape", () => {
  const html = buildPrintDocument(
    '<div class="certificado-a5-page">Certificado</div>',
    "Certificado",
  )

  assert.match(html, /@page\s*{\s*size:\s*A4;\s*margin:\s*5mm;/)
  assert.match(
    html,
    /@page certificado\s*{\s*size:\s*A5 landscape;\s*margin:\s*5mm;/,
  )
  assert.match(
    html,
    /\.certificado-a5-page\s*{[^}]*width:\s*200mm;[^}]*min-height:\s*138mm;/s,
  )
  assert.doesNotMatch(html, /\.certificado-a4-page/)
})
