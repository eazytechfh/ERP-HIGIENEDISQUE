import test from "node:test"
import assert from "node:assert/strict"

import { AsaasError, ConfiguracaoAsaasError, asaasFetch, resolverAmbienteAsaas } from "./asaas.ts"

function comEnv(vars: Record<string, string | undefined>, fn: () => unknown) {
  const antes: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(vars)) {
    antes[k] = process.env[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  try {
    return fn()
  } finally {
    for (const [k, v] of Object.entries(antes)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
}

test("chave de sandbox usa a URL do sandbox", () => {
  comEnv({ ASAAS_API_KEY: "$aact_hmlg_abc", ASAAS_AMBIENTE: undefined }, () => {
    const r = resolverAmbienteAsaas()
    assert.equal(r.ambiente, "sandbox")
    assert.equal(r.baseUrl, "https://api-sandbox.asaas.com/v3")
  })
})

test("chave de producao e recusada sem liberacao explicita", () => {
  comEnv({ ASAAS_API_KEY: "$aact_prod_abc", ASAAS_AMBIENTE: undefined }, () => {
    assert.throws(() => resolverAmbienteAsaas(), ConfiguracaoAsaasError)
  })
  comEnv({ ASAAS_API_KEY: "$aact_prod_abc", ASAAS_AMBIENTE: "producao" }, () => {
    assert.equal(resolverAmbienteAsaas().baseUrl, "https://api.asaas.com/v3")
  })
})

test("sem chave ou formato desconhecido falha", () => {
  comEnv({ ASAAS_API_KEY: undefined }, () => assert.throws(() => resolverAmbienteAsaas(), ConfiguracaoAsaasError))
  comEnv({ ASAAS_API_KEY: "qualquer" }, () => assert.throws(() => resolverAmbienteAsaas(), ConfiguracaoAsaasError))
})

test("erros do Asaas: 4xx traz a descricao; 5xx e rede sao incertos", async () => {
  const fetchOriginal = globalThis.fetch
  process.env.ASAAS_API_KEY = "$aact_hmlg_abc"
  try {
    globalThis.fetch = (async (_url: string, init: any) => {
      assert.equal(init.headers.access_token, "$aact_hmlg_abc")
      return new Response(JSON.stringify({ errors: [{ code: "x", description: "Servico municipal invalido." }] }), { status: 400 })
    }) as typeof fetch
    await assert.rejects(asaasFetch("/invoices"), (e: unknown) => e instanceof AsaasError && e.message === "Servico municipal invalido." && !e.incerto)

    globalThis.fetch = (async () => new Response("", { status: 503 })) as typeof fetch
    await assert.rejects(asaasFetch("/invoices"), (e: unknown) => e instanceof AsaasError && e.incerto)

    globalThis.fetch = (async () => { throw new TypeError("network") }) as typeof fetch
    await assert.rejects(asaasFetch("/invoices"), (e: unknown) => e instanceof AsaasError && e.incerto)
  } finally {
    globalThis.fetch = fetchOriginal
    delete process.env.ASAAS_API_KEY
  }
})
