// Cliente HTTP do Asaas. Use SOMENTE em rotas de servidor (app/api): a chave nunca vai ao navegador.
//
// Ambiente pela chave: "$aact_hmlg_" = Sandbox; "$aact_prod_" = producao.
// Producao exige liberacao explicita ASAAS_AMBIENTE=producao, para que uma chave
// de producao colocada por engano no localhost nao emita nota real.

export type AmbienteAsaas = "sandbox" | "producao"

export class AsaasError extends Error {
  status: number
  /** true quando nao sabemos se o Asaas processou (rede, timeout, 5xx): conferir antes de repetir. */
  incerto: boolean
  constructor(message: string, status: number, incerto: boolean) {
    super(message)
    this.status = status
    this.incerto = incerto
  }
}

export class ConfiguracaoAsaasError extends Error {}

export function resolverAmbienteAsaas(): { ambiente: AmbienteAsaas; baseUrl: string; apiKey: string } {
  const apiKey = (process.env.ASAAS_API_KEY || "").trim()
  if (!apiKey) throw new ConfiguracaoAsaasError("ASAAS_API_KEY nao configurada no servidor.")
  if (apiKey.startsWith("$aact_hmlg_")) {
    return { ambiente: "sandbox", baseUrl: "https://api-sandbox.asaas.com/v3", apiKey }
  }
  if (apiKey.startsWith("$aact_prod_")) {
    if ((process.env.ASAAS_AMBIENTE || "").trim() !== "producao") {
      throw new ConfiguracaoAsaasError(
        "A chave do Asaas configurada e de PRODUCAO. Para homologar, use a chave do Sandbox. Para emitir notas reais, defina ASAAS_AMBIENTE=producao no servidor.",
      )
    }
    return { ambiente: "producao", baseUrl: "https://api.asaas.com/v3", apiKey }
  }
  throw new ConfiguracaoAsaasError("ASAAS_API_KEY em formato desconhecido (esperado $aact_hmlg_ ou $aact_prod_).")
}

export async function asaasFetch<T = any>(path: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<T> {
  const { baseUrl, apiKey } = resolverAmbienteAsaas()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 20000)
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: init.method || "GET",
      headers: {
        access_token: apiKey,
        "Content-Type": "application/json",
        "User-Agent": "ERP-Financeiro/1.0",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
      cache: "no-store",
    })
  } catch (error) {
    const timeout = error instanceof Error && error.name === "AbortError"
    throw new AsaasError(timeout ? "O Asaas nao respondeu a tempo." : "Falha de comunicacao com o Asaas.", 0, true)
  } finally {
    clearTimeout(timer)
  }

  const texto = await response.text()
  let corpo: any = null
  try {
    corpo = texto ? JSON.parse(texto) : null
  } catch {
    corpo = null
  }

  if (!response.ok) {
    const descricao =
      (Array.isArray(corpo?.errors) && corpo.errors.map((e: any) => e?.description).filter(Boolean).join(" ")) ||
      `Erro ${response.status} no Asaas.`
    throw new AsaasError(descricao, response.status, response.status >= 500)
  }
  return corpo as T
}

export type AsaasInvoice = {
  id: string
  status: string
  statusDescription?: string | null
  customer?: string | null
  number?: string | null
  validationCode?: string | null
  pdfUrl?: string | null
  xmlUrl?: string | null
  externalReference?: string | null
  effectiveDate?: string | null
  value?: number
}
