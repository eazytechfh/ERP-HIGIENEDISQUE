import assert from "node:assert/strict"
import test from "node:test"

import {
  mapClienteLocalFromDb,
  mapClienteLocalToDb,
  resolveLocalActivity,
} from "./cliente-local.ts"

test("maps the OS activity when loading a client location", () => {
  const local = mapClienteLocalFromDb({ id: "local-1", tipo_atividade: "Hospital" })

  assert.equal(local.tipoAtividade, "Hospital")
})

test("persists the OS activity from a client location", () => {
  const row = mapClienteLocalToDb({
    nome: "Unidade Centro",
    tipoAmbiente: "Comercial",
    tipoAtividade: "Clínica odontológica",
  })

  assert.equal(row.tipo_atividade, "Clínica odontológica")
})

test("uses the location activity in the OS and falls back for legacy locations", () => {
  assert.equal(resolveLocalActivity({ tipoAtividade: "Hospital", tipoAmbiente: "Comercial" }), "Hospital")
  assert.equal(resolveLocalActivity({ tipoAtividade: "", tipoAmbiente: "Empresa" }), "Empresa")
})
