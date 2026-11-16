import test from "node:test"
import assert from "node:assert/strict"

import { calcularNfse, enderecoAsaasDoCliente, hojeSaoPaulo, resolverDataEfetiva, statusDocumentoPorAsaas, validarEntradaNfse } from "./nfse-calculos.ts"

test("deducoes reduzem a base do ISS, nao o valor da nota", () => {
  const c = calcularNfse({ valor: 1000, deducoes: 200, issAliquota: 5, issRetido: false, inssAliquota: 0, irAliquota: 0 })
  assert.equal(c.valor, 1000)
  assert.equal(c.baseIss, 800)
  assert.equal(c.valorIss, 40)
  assert.equal(c.valorIssRetido, 0)
  assert.equal(c.liquidoReceber, 1000)
})

test("retencoes separam bruto e liquido a receber", () => {
  const c = calcularNfse({ valor: 1000, deducoes: 0, issAliquota: 2, issRetido: true, inssAliquota: 11, irAliquota: 1.5 })
  assert.equal(c.valorIssRetido, 20)
  assert.equal(c.valorInss, 110)
  assert.equal(c.valorIr, 15)
  assert.equal(c.totalRetencoes, 145)
  assert.equal(c.liquidoReceber, 855)
})

test("arredonda ao centavo e fecha o total", () => {
  const c = calcularNfse({ valor: 333.33, deducoes: 0, issAliquota: 3, issRetido: true, inssAliquota: 11, irAliquota: 1.5 })
  assert.equal(Math.round(c.liquidoReceber * 100) + Math.round(c.totalRetencoes * 100), 33333)
  assert.equal(c.valorIssRetido, 10)
})

test("validacoes de entrada", () => {
  assert.equal(validarEntradaNfse({ valor: 0, deducoes: 0, issAliquota: 2, issRetido: false, inssAliquota: 0, irAliquota: 0 }), "Informe o valor da nota.")
  assert.match(validarEntradaNfse({ valor: 10, deducoes: 11, issAliquota: 2, issRetido: false, inssAliquota: 0, irAliquota: 0 }) || "", /Deducoes/)
  assert.equal(validarEntradaNfse({ valor: 10, deducoes: 0, issAliquota: 2, issRetido: false, inssAliquota: 0, irAliquota: 0 }), null)
})

test("agora usa hoje; agendar exige data futura", () => {
  assert.deepEqual(resolverDataEfetiva("agora", undefined, "2026-11-16"), { data: "2026-11-16", erro: null })
  assert.match(resolverDataEfetiva("agendar", "2026-11-16", "2026-11-16").erro || "", /futura/)
  assert.match(resolverDataEfetiva("agendar", "", "2026-11-16").erro || "", /Informe/)
  assert.deepEqual(resolverDataEfetiva("agendar", "2026-11-20", "2026-11-16"), { data: "2026-11-20", erro: null })
  assert.equal(hojeSaoPaulo(new Date("2026-11-17T02:00:00Z")), "2026-11-16")
})

test("so AUTHORIZED conta como emitida", () => {
  assert.equal(statusDocumentoPorAsaas("SCHEDULED"), "pendente")
  assert.equal(statusDocumentoPorAsaas("ERROR"), "pendente")
  assert.equal(statusDocumentoPorAsaas("AUTHORIZED"), "emitido")
  assert.equal(statusDocumentoPorAsaas("CANCELED"), "cancelado")
})

test("endereco do tomador vem do primeiro local completo", () => {
  const r = enderecoAsaasDoCliente([
    { cep: "", endereco: "Rua A", numero: "1", bairro: "Centro" },
    { cep: "20.040-002", endereco: " Av. Rio Branco ", numero: "156", complemento: "", bairro: "Centro" },
  ])
  assert.deepEqual(r.endereco, { postalCode: "20040002", address: "Av. Rio Branco", addressNumber: "156", complement: undefined, province: "Centro" })
  assert.deepEqual(r.faltando, [])
})

test("sem local completo informa o que falta", () => {
  assert.deepEqual(enderecoAsaasDoCliente([]).faltando, ["CEP", "rua", "numero", "bairro"])
  const r = enderecoAsaasDoCliente([{ cep: "123", endereco: "Rua A", numero: "", bairro: "X" }])
  assert.equal(r.endereco, null)
  assert.deepEqual(r.faltando, ["CEP", "numero"])
})
