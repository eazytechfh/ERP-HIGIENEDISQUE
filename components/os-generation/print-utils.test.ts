import assert from "node:assert/strict"
import test from "node:test"
import * as printUtils from "./print-utils.ts"

import {
  buildPrintDocument,
  composeSavedOSDocumentHtml,
  hasSavedCertificateHtml,
  splitSavedOSDocumentHtml,
  waitForPrintImages,
} from "./print-utils.ts"

test("provides one shared A5 print builder for every certificate entry point", () => {
  assert.equal(typeof printUtils.buildCertificatePrintDocument, "function")

  const bodyHtml = '<div class="certificado-a5-page">Certificado</div>'
  const html = printUtils.buildCertificatePrintDocument(
    bodyHtml,
    "Certificado OS-1",
  )

  assert.equal(
    html,
    buildPrintDocument(bodyHtml, "Certificado OS-1", { page: "certificate" }),
  )
  assert.match(html, /@page\s*{\s*size:\s*A5 landscape;/)
  assert.match(html, /<body class="certificate-print">/)
})

test("stores and separates the service order from its certificate", () => {
  const savedHtml = composeSavedOSDocumentHtml(
    '<div class="os-a4-page">OS</div>',
    '<div class="certificado-a5-page">Certificado</div>',
  )
  const sections = splitSavedOSDocumentHtml(savedHtml)

  assert.equal(sections.serviceOrderHtml, '<div class="os-a4-page">OS</div>')
  assert.equal(sections.certificateHtml, '<div class="certificado-a5-page">Certificado</div>')
  assert.equal(hasSavedCertificateHtml(savedHtml), true)
})

test("keeps saved service orders without a certificate printable", () => {
  const savedHtml = composeSavedOSDocumentHtml('<div class="os-a4-page">OS</div>')
  const sections = splitSavedOSDocumentHtml(savedHtml)

  assert.equal(sections.serviceOrderHtml, '<div class="os-a4-page">OS</div>')
  assert.equal(sections.certificateHtml, "")
  assert.equal(hasSavedCertificateHtml(savedHtml), false)
})

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
    /@page\s*{\s*size:\s*A5 landscape;\s*margin:\s*1mm 4mm 4mm 4mm;/,
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
  assert.doesNotMatch(html, /td:has\(\.certificate-company-title\)/)
  assert.doesNotMatch(html, /div:has\(\.certificate-client-field\)/)
  assert.match(html, /<body class="certificate-print">/)
})

test("keeps the original certificate offset inside the printable area", () => {
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
    /body\.certificate-print\s*{[^}]*transform:\s*translate\(3mm,\s*0mm\);/s,
  )
  assert.doesNotMatch(serviceOrderHtml, /<body class="certificate-print">/)
})

test("waits for a pending logo before allowing the print dialog", async () => {
  let notifyLoaded: (() => void) | undefined
  const logo = {
    complete: false,
    addEventListener(type: "load" | "error", listener: () => void) {
      if (type === "load") notifyLoaded = listener
    },
    removeEventListener() {},
  }
  let ready = false

  const waiting = waitForPrintImages([logo], 1_000).then(() => {
    ready = true
  })
  await Promise.resolve()

  assert.equal(ready, false)
  assert.ok(notifyLoaded)
  notifyLoaded()
  await waiting
  assert.equal(ready, true)
})
