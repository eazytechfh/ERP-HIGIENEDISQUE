import assert from "node:assert/strict"
import test from "node:test"

import { AVISO_SERVICO_SEM_GARANTIA, classificarTipoOS, servicoSemGarantia } from "./tipo-os.ts"

test("usa o pedido de desentupimento para transporte de residuos", () => {
  assert.equal(classificarTipoOS("Transporte de Resíduos", "outro"), "desentupimento")
})

test("marca gordura e transporte de residuos como servicos sem garantia", () => {
  assert.equal(servicoSemGarantia("Limpeza de caixa de gordura"), true)
  assert.equal(servicoSemGarantia("Transporte de resíduos"), true)
  assert.equal(servicoSemGarantia("Controle de vetores"), false)
})

test("fornece o aviso que deve anteceder o atesto do cliente", () => {
  assert.equal(AVISO_SERVICO_SEM_GARANTIA, "Estou ciente de que esse serviço não possui garantia.")
})

test("preserva os templates de reservatorio e vetores", () => {
  assert.equal(classificarTipoOS("Higienização", "reservatorio_potavel"), "limpeza")
  assert.equal(classificarTipoOS("Controle de vetores", "pragas"), "vetores")
})
