"use client"

// Antes, as janelas de impressao/exportacao de OS reescreviam a mao um
// subconjunto fixo de classes Tailwind. Toda classe nova usada nos
// componentes de OS precisava de uma entrada correspondente nessa lista, ou
// ela era descartada silenciosamente na impressao mesmo aparecendo certo na
// previa dentro do app. Aqui, em vez de duplicar CSS, clonamos as folhas de
// estilo reais que o Next.js ja injetou no <head> do app — a impressao fica
// sempre em sincronia com o app, sem manutencao manual.
//
// Le o CSS ja carregado (via cssRules) em vez de clonar as tags <link>, que
// disparariam um novo download assincrono dentro da janela de impressao e
// podiam perder a corrida contra o print() (saindo sem nenhum estilo).
function getAppStylesheetHtml(): string {
  if (typeof document === "undefined") return ""
  const blocks: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const cssText = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join("\n")
      if (cssText) blocks.push(`<style>${cssText}</style>`)
    } catch {
      // Folha de estilo cross-origin sem CORS (ex.: fonte externa) nao
      // permite ler cssRules; mantem como <link> igual antes.
      const href = (sheet as CSSStyleSheet).href
      if (href) blocks.push(`<link rel="stylesheet" href="${href}">`)
    }
  }
  return blocks.join("\n")
}

type PrintOptions = {
  page?: "service-order" | "certificate"
  extraStyle?: string
}

function getBaseStyle(page: NonNullable<PrintOptions["page"]>): string {
  const pageSize = page === "certificate" ? "landscape" : "A4"
  const pageMargin = page === "certificate" ? "0" : "5mm"
  const certificateDimensions = page === "certificate"
    ? "width: min(100%, 141.892vh) !important; height: auto !important; max-height: 100% !important; aspect-ratio: 210 / 148; padding: 4.76vw !important; font-size: 1.51vw !important;"
    : "width: 210mm; height: 148mm; padding: 5mm;"
  return `
  @page { size: ${pageSize}; margin: ${pageMargin}; }
  * { box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
  body.certificate-print { display: flex; align-items: center; justify-content: center; }
  .os-a4-page { width: 200mm; min-height: 287mm; margin: 0 auto; }
  .certificado-a5-page { ${certificateDimensions} margin: 0 auto; break-inside: avoid; page-break-inside: avoid; overflow: hidden; }
  .certificate-company-title, .certificate-client-field { white-space: nowrap; }
  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display: none; }
  }
`
}

export function buildPrintDocument(bodyHtml: string, title: string, options: PrintOptions = {}): string {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const page = options.page ?? "service-order"
  const baseStyle = getBaseStyle(page)
  const bodyClass = page === "certificate" ? ' class="certificate-print"' : ""
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <base href="${origin}/" />
  ${getAppStylesheetHtml()}
  <style>${baseStyle}${options.extraStyle ?? ""}</style>
</head>
<body${bodyClass}>
  ${bodyHtml}
</body>
</html>`
}

export function openPrintWindow(bodyHtml: string, title: string, options: PrintOptions = {}): void {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  let printed = false
  const triggerPrint = () => {
    if (printed) return
    printed = true
    printWindow.focus()
    printWindow.print()
  }

  printWindow.document.write(buildPrintDocument(bodyHtml, title, options))
  printWindow.document.close()

  // As folhas de estilo (<link>) carregam de forma assincrona; espera o
  // evento load antes de imprimir, com um fallback por seguranca.
  if (printWindow.document.readyState === "complete") {
    triggerPrint()
  } else {
    printWindow.addEventListener("load", triggerPrint, { once: true })
    setTimeout(triggerPrint, 1500)
  }
}
