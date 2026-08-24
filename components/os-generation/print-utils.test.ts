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
    /@page\s*{\s*size:\s*landscape;\s*margin:\s*0;/,
  )
  assert.match(
    html,
    /\.certificado-a5-page\s*{[^}]*font-size:\s*1\.51vw !important;/s,
  )
  assert.match(
    html,
    /\.certificado-a5-page\s*{[^}]*width:\s*min\(100%,\s*141\.892vh\) !important;[^}]*aspect-ratio:\s*210 \/ 148;/s,
  )
  assert.match(html, /\.certificado-a5-page\s*{[^}]*padding:\s*4\.76vw !important;/s)
  assert.match(html, /body\.certificate-print\s*{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s)
  assert.match(html, /<body class="certificate-print">/)
  assert.doesNotMatch(html, /size:\s*A[45]/)
})
