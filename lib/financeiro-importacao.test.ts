import assert from "node:assert/strict"
import test from "node:test"

import {
  inferirFormaPagamento,
  lerDataPlanilha,
  lerDespesasPlanilha,
  lerValorPlanilha,
  separarDuplicadas,
} from "./financeiro-importacao.ts"

const CABECALHO = ["Data de pagamento", "Valor", "Quem recebeu", "Categoria do gasto", "Descrição original da linha do extrato"]

test("le as colunas da planilha de despesas", () => {
  const { linhas, erros } = lerDespesasPlanilha([
    CABECALHO,
    [new Date(Date.UTC(2026, 0, 5)), 5.6, null, "Tarifas Bancárias", "TARIFA AVULSA ENVIO PIX 01/01/2026"],
    [new Date(Date.UTC(2026, 0, 5)), 177.91, "DE LUCA ASSISTENCIA MEDIC", "Saúde", "PIX ENVIADO DE LUCA ASSISTENCIA MEDIC"],
  ])

  assert.deepEqual(erros, [])
  assert.equal(linhas.length, 2)
  assert.deepEqual(linhas[1], {
    linhaPlanilha: 3,
    dataPagamento: "2026-01-05",
    valor: 177.91,
    recebedor: "DE LUCA ASSISTENCIA MEDIC",
    categoria: "Saúde",
    descricao: "PIX ENVIADO DE LUCA ASSISTENCIA MEDIC",
    formaPagamento: "pix",
  })
  // "PIX" no meio do texto nao e forma de pagamento
  assert.equal(linhas[0].formaPagamento, "")
})

test("data do Excel (UTC) nao desloca o dia", () => {
  assert.equal(lerDataPlanilha(new Date("2026-01-05T00:00:00.000Z")), "2026-01-05")
  assert.equal(lerDataPlanilha("05/01/2026"), "2026-01-05")
  assert.equal(lerDataPlanilha("2026-01-05"), "2026-01-05")
  assert.equal(lerDataPlanilha("31/02/2026"), null)
  assert.equal(lerDataPlanilha("abc"), null)
  assert.equal(lerDataPlanilha(null), null)
})

test("interpreta valores numericos e em formato brasileiro", () => {
  assert.equal(lerValorPlanilha(15425.94), 15425.94)
  assert.equal(lerValorPlanilha("R$ 1.234,56"), 1234.56)
  assert.equal(lerValorPlanilha("1234.56"), 1234.56)
  assert.equal(lerValorPlanilha("abc"), null)
  assert.equal(lerValorPlanilha(""), null)
})

test("aponta linhas invalidas e ignora linhas vazias", () => {
  const { linhas, erros } = lerDespesasPlanilha([
    CABECALHO,
    [null, null, null, null, null],
    ["sem data", 10, "A", "Outros", "x"],
    [new Date(Date.UTC(2026, 0, 6)), "dez", "A", "Outros", "x"],
    [new Date(Date.UTC(2026, 0, 6)), -3, "A", "Outros", "x"],
    [new Date(Date.UTC(2026, 0, 6)), 10, "A", "", "ok"],
  ])

  assert.equal(linhas.length, 1)
  assert.equal(linhas[0].categoria, "Outros")
  assert.deepEqual(
    erros.map((e) => e.linhaPlanilha),
    [3, 4, 5],
  )
})

test("exige cabecalho com data e valor", () => {
  const { linhas, erros } = lerDespesasPlanilha([["a", "b"], [1, 2]])
  assert.equal(linhas.length, 0)
  assert.equal(erros.length, 1)
})

test("cabecalho pode vir depois de linhas de titulo e colunas em outra ordem", () => {
  const { linhas } = lerDespesasPlanilha([
    ["Despesas de janeiro"],
    ["Valor", "Data", "Descrição"],
    [50, "10/01/2026", "Compra de teste"],
  ])
  assert.equal(linhas.length, 1)
  assert.equal(linhas[0].dataPagamento, "2026-01-10")
  assert.equal(linhas[0].valor, 50)
  assert.equal(linhas[0].descricao, "Compra de teste")
})

test("infere forma de pagamento apenas quando clara", () => {
  assert.equal(inferirFormaPagamento("PIX ENVIADO FULANO"), "pix")
  assert.equal(inferirFormaPagamento("PIX AGENDADO FULANO"), "pix")
  assert.equal(inferirFormaPagamento("PAGAMENTO DE BOLETO OUTROS BANCOS X"), "boleto")
  assert.equal(inferirFormaPagamento("DEBITO VISA ELECTRON BRASIL 30/01"), "")
  assert.equal(inferirFormaPagamento("TARIFA AVULSA ENVIO PIX"), "")
})

test("duplicadas consomem uma ocorrencia existente por linha", () => {
  const tarifa = { dataPagamento: "2026-01-06", valor: 62.4, descricao: "TAR REG TIT COB RAPIDA SIMP-ELETR" }
  const outra = { dataPagamento: "2026-01-07", valor: 9.36, descricao: "TAR REG TIT COB RAPIDA SIMP-ELETR" }

  // planilha com duas tarifas identicas; o sistema ja tem uma
  const { novas, duplicadas } = separarDuplicadas([tarifa, { ...tarifa }, outra], [{ ...tarifa, descricao: "tar reg tit cob rapida simp-eletr" }])
  assert.equal(duplicadas.length, 1)
  assert.equal(novas.length, 2)

  // reimportar tudo: nada novo
  const reimport = separarDuplicadas([tarifa, { ...tarifa }, outra], [tarifa, { ...tarifa }, outra])
  assert.equal(reimport.novas.length, 0)
  assert.equal(reimport.duplicadas.length, 3)
})
