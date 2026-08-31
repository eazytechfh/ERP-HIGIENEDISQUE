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
  page?: "service-order" | "certificate" | "certificate-half-letter"
  extraStyle?: string
}

type PrintImage = {
  complete: boolean
  addEventListener: (type: "load" | "error", listener: () => void, options?: { once?: boolean }) => void
  removeEventListener: (type: "load" | "error", listener: () => void) => void
}

export function waitForPrintImages(images: Iterable<PrintImage>, timeoutMs = 3_000): Promise<void> {
  const pending = Array.from(images).filter((image) => !image.complete)
  if (pending.length === 0) return Promise.resolve()

  return new Promise((resolve) => {
    let remaining = pending.length
    let finished = false
    const listeners = new Map<PrintImage, () => void>()

    const finish = () => {
      if (finished) return
      finished = true
      clearTimeout(timeout)
      for (const [image, listener] of listeners) {
        image.removeEventListener("load", listener)
        image.removeEventListener("error", listener)
      }
      resolve()
    }

    const timeout = setTimeout(finish, timeoutMs)
    for (const image of pending) {
      let imageReady = false
      const onReady = () => {
        if (imageReady) return
        imageReady = true
        remaining -= 1
        if (remaining === 0) finish()
      }
      listeners.set(image, onReady)
      image.addEventListener("load", onReady, { once: true })
      image.addEventListener("error", onReady, { once: true })
      if (image.complete) onReady()
    }
  })
}

function getBaseStyle(page: NonNullable<PrintOptions["page"]>): string {
  const isCertificate = page === "certificate" || page === "certificate-half-letter"
  const isHalfLetter = page === "certificate-half-letter"
  const pageSize = isHalfLetter ? "215.9mm 139.7mm" : page === "certificate" ? "A5 landscape" : "A4"
  // margin: 0 pede pagina sem nenhuma borda (impressao "sangrada"). O driver
  // "Salvar como PDF" aceita isso de boa, mas quase nenhuma impressora fisica
  // consegue marcar tinta ate a borda do papel: ela tem uma margem de
  // hardware fixa (tipicamente 3-5mm) e simplesmente corta o que cai nela -
  // foi isso que cortou o topo/esquerda do certificado impresso. Uma margem
  // pequena e nao-zero fica dentro do que praticamente qualquer impressora
  // consegue imprimir de verdade.
  const pageMargin = isHalfLetter ? "2mm 4mm 4mm 4mm" : page === "certificate" ? "1mm 4mm 4mm 4mm" : "5mm"
  // vw/vh nao tem um viewport consistente entre motores de impressao: alguns
  // resolvem contra a pagina @page (210mm x 148mm), outros contra a janela de
  // tela do browser que abriu o print (muito maior). Esse descompasso fazia
  // fonte/padding calculados em vw ficarem enormes enquanto a caixa em si
  // ficava do tamanho certo, cortando o certificado a ~1/4 da folha impressa.
  // mm/px sao unidades absolutas: resolvem igual em qualquer viewport, entao
  // usamos exatamente as mesmas dimensoes da folha A5 (@page) sem nenhuma
  // conta em vw/vh. max-width/max-height garantem que a folha encolha para
  // caber dentro da area imprimivel reduzida pela margem acima, sem cortar.
  const certificateDimensions = isHalfLetter
    ? "width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; padding: 5mm !important; font-size: 12px !important;"
    : isCertificate
      ? "width: 210mm !important; height: 148mm !important; max-width: 100% !important; max-height: 100% !important; padding: 5mm !important; font-size: 12px !important;"
      : "width: 210mm; height: 148mm; padding: 5mm;"
  return `
  @page { size: ${pageSize}; margin: ${pageMargin}; }
  * { box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
  body.certificate-print { display: flex; align-items: center; justify-content: center; transform: translate(3mm, 5mm); }
  body.half-letter-certificate-print { display: flex; align-items: flex-start; justify-content: center; }
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
  const bodyClass = page === "certificate"
    ? ' class="certificate-print"'
    : page === "certificate-half-letter"
      ? ' class="half-letter-certificate-print"'
      : ""
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
  const triggerPrint = async () => {
    if (printed) return
    printed = true
    await waitForPrintImages(Array.from(printWindow.document.images))
    printWindow.focus()
    printWindow.print()
  }

  printWindow.document.write(buildPrintDocument(bodyHtml, title, options))
  printWindow.document.close()

  // Espera a janela carregar e, dentro de triggerPrint, aguarda tambem logos
  // e QR codes. O fallback evita travar se algum recurso nao responder.
  if (printWindow.document.readyState === "complete") {
    triggerPrint()
  } else {
    printWindow.addEventListener("load", triggerPrint, { once: true })
    setTimeout(triggerPrint, 1500)
  }
}
