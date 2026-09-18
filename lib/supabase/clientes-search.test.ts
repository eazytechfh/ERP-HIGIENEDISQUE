import assert from "node:assert/strict"
import test from "node:test"

import { buildClienteIdentitySearchFilter, buildClienteTextSearchFilter, buildLocalAddressSearchFilter, clienteMatchesSearch, normalizeClienteSearchValue, rankClienteSearchResult } from "./clientes-search.ts"

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

test("busca primeiro pelos dados de identidade do cliente", () => {
  assert.equal(
    buildClienteIdentitySearchFilter("paulo"),
    "nome.ilike.%paulo%,nome_fantasia.ilike.%paulo%,email.ilike.%paulo%,telefone.ilike.%paulo%,cpf.ilike.%paulo%,cnpj.ilike.%paulo%",
  )
})

test("normaliza acentos e prioriza nome exato ou iniciado pelo termo", () => {
  assert.equal(normalizeClienteSearchValue("  Jo\u00e3o   Paulo "), "joao paulo")
  assert.equal(clienteMatchesSearch({ nome: "Jo\u00e3o Paulo" }, "joao"), true)
  assert.ok(rankClienteSearchResult({ nome: "Paulo" }, "paulo") < rankClienteSearchResult({ nome: "Barber Shop - Paulo" }, "paulo"))
})
