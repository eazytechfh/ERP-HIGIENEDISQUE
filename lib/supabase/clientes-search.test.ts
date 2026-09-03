import assert from "node:assert/strict"
import test from "node:test"

import { buildClienteTextSearchFilter, buildLocalAddressSearchFilter } from "./clientes-search.ts"

test("busca o termo em todos os campos relevantes do endereco", () => {
  assert.equal(
    buildLocalAddressSearchFilter("Icaraí"),
    "endereco.ilike.%Icaraí%,numero.ilike.%Icaraí%,bairro.ilike.%Icaraí%,cidade.ilike.%Icaraí%,cep.ilike.%Icaraí%,nome.ilike.%Icaraí%",
  )
})

test("combina nome do cliente com clientes encontrados pelo endereco", () => {
  assert.equal(
    buildClienteTextSearchFilter("Moreira", ["cliente-1", "cliente-2"]),
    "nome.ilike.%Moreira%,id.in.(cliente-1,cliente-2)",
  )
})

test("mantem apenas a busca por nome quando nenhum endereco corresponde", () => {
  assert.equal(buildClienteTextSearchFilter("Bruna", []), "nome.ilike.%Bruna%")
})
