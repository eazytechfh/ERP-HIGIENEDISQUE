import assert from "node:assert/strict"
import test from "node:test"

import { criarReservatorio } from "./limpeza-defaults.ts"

test("cria reservatorio sem presumir dados que serao verificados na visita", () => {
  const reservatorio = criarReservatorio("cisterna", 1, "res-1")

  assert.deepEqual(reservatorio, {
    id: "res-1",
    tipo: "cisterna",
    numero: 1,
    volumeM3: "",
    tipoMaterial: "",
    situacaoSolo: "",
    condicaoCobertura: "",
    presencaDetritos: "",
    presencaVetores: "",
    proximidadeFossaEsgoto: "",
    ocorrenciaFendasRachaduras: "",
  })
})
