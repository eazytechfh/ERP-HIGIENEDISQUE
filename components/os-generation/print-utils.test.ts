import assert from "node:assert/strict"
import test from "node:test"

import { buildPrintDocument } from "./print-utils.ts"

test("keeps service orders on A4 by default", () => {
  const html = buildPrintDocument('<div class="os-a4-page">OS</div>', "OS")

  assert.match(html, /@page\s*{\s*size:\s*A4;\s*margin:\s*5mm;/)
})

test("defaults the certificate print dialog to A5 landscape and fills its printable area", () => {
  const html = buildPrintDocument(
    '<div class="certificado-a5-page">Certificado</div>',
    "Certificado",
    { page: "certificate" },
  )

  assert.match(
    html,
    /@page\s*{\s*size:\s*A5 landscape;\s*margin:\s*4mm;/,
  )
  assert.match(
    html,
    /\.certificado-a5-page\s*{[^}]*font-size:\s*12px !important;/s,
  )
  assert.match(
    html,
    /\.certificado-a5-page\s*{[^}]*width:\s*210mm !important;[^}]*height:\s*148mm !important;[^}]*max-width:\s*100% !important;[^}]*max-height:\s*100% !important;/s,
  )
  assert.match(html, /\.certificado-a5-page\s*{[^}]*padding:\s*5mm !important;/s)
  assert.match(html, /body\.certificate-print\s*{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s)
  assert.match(html, /\.certificado-a5-page\s*{[^}]*break-inside:\s*avoid;[^}]*page-break-inside:\s*avoid;[^}]*overflow:\s*hidden;/s)
  assert.match(html, /\.certificate-company-title,\s*\.certificate-client-field\s*{\s*white-space:\s*nowrap;/s)
  assert.match(html, /<body class="certificate-print">/)
})

test("moves only the certificate away from the top and left printer edges", () => {
  const certificateHtml = buildPrintDocument(
    '<div class="certificado-a5-page">Certificado</div>',
    "Certificado",
    { page: "certificate" },
  )
  const serviceOrderHtml = buildPrintDocument(
    '<div class="os-a4-page">OS</div>',
    "OS",
  )

  assert.match(
    certificateHtml,
    /body\.certificate-print\s*{[^}]*transform:\s*translate\(3mm,\s*3mm\);/s,
  )
  assert.doesNotMatch(serviceOrderHtml, /<body class="certificate-print">/)
})
