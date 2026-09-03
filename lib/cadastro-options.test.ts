import assert from "node:assert/strict"
import test from "node:test"

import { TIPOS_AMBIENTE_CLIENTE, TIPOS_SERVICO_CONTRATO } from "./cadastro-options.ts"

test("permite cadastrar laboratorio como tipo de ambiente", () => {
  assert.equal(TIPOS_AMBIENTE_CLIENTE.includes("Laboratório"), true)
})

test("oferece limpeza de reservatorios de agua potavel como servico de contrato", () => {
  assert.equal(TIPOS_SERVICO_CONTRATO.includes("Limpeza de reservatórios de água potável"), true)
  assert.equal(TIPOS_SERVICO_CONTRATO.some((tipo) => /caixa d.?água|cisterna/i.test(tipo)), false)
})

test("mantem higienizacao de ar-condicionado fora dos contratos", () => {
  assert.equal(TIPOS_SERVICO_CONTRATO.some((tipo) => /ar.?condicionado/i.test(tipo)), false)
})
