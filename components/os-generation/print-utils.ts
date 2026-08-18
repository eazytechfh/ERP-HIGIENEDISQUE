"use client"

// Antes, as janelas de impressao/exportacao de OS reescreviam a mao um
// subconjunto fixo de classes Tailwind. Toda classe nova usada nos
// componentes de OS precisava de uma entrada correspondente nessa lista, ou
// ela era descartada silenciosamente na impressao mesmo aparecendo certo na
// previa dentro do app. Aqui, em vez de duplicar CSS, clonamos as folhas de
// estilo reais que o Next.js ja injetou no <head> do app — a impressao fica
// sempre em sincronia com o app, sem manutencao manual.
function getAppStylesheetHtml(): string {
  if (typeof document === "undefined") return ""
  return Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join("\n")
}

const baseStyle = `
  @page { size: A4; margin: 5mm; }
  @page certificado { size: A4 landscape; margin: 5mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
  .os-a4-page { width: 200mm; min-height: 287mm; margin: 0 auto; }
  .certificado-a4-page { page: certificado; width: 287mm; min-height: 200mm; margin: 0 auto; }
  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display: none; }
  }
`

export function buildPrintDocument(bodyHtml: string, title: string, extraStyle = ""): string {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <base href="${origin}/" />
  ${getAppStylesheetHtml()}
  <style>${baseStyle}${extraStyle}</style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`
}

export function openPrintWindow(bodyHtml: string, title: string, extraStyle = ""): void {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  let printed = false
  const triggerPrint = () => {
    if (printed) return
    printed = true
    printWindow.focus()
    printWindow.print()
  }

  printWindow.document.write(buildPrintDocument(bodyHtml, title, extraStyle))
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
