import test from "node:test"
import assert from "node:assert/strict"

import { gerarCsvLancamentos, intervaloPeriodo, rotuloBalde, totaisDasLinhas, type LinhaExportacao } from "./financeiro-periodo.ts"

test("anual cobre o ano agrupado por mes", () => {
  const p = intervaloPeriodo(2026, "anual")
  assert.equal(p.inicio, "2026-01-01")
  assert.equal(p.fim, "2026-12-31")
  assert.equal(p.agrupamento, "mes")
  assert.equal(p.baldes.length, 12)
  assert.equal(rotuloBalde(p.baldes[1]), "Fev")
})

test("mes especifico agrupa por dia e respeita fevereiro bissexto", () => {
  const fev = intervaloPeriodo(2028, "02")
  assert.equal(fev.fim, "2028-02-29")
  assert.equal(fev.baldes.length, 29)
  assert.equal(fev.agrupamento, "dia")
  assert.equal(intervaloPeriodo(2026, "11").fim, "2026-11-30")
  assert.equal(rotuloBalde("2026-11-05"), "05")
})

test("mes atual usa hoje, nao o ano escolhido", () => {
  const p = intervaloPeriodo(2020, "mes_atual", new Date(2026, 10, 16))
  assert.equal(p.inicio, "2026-11-01")
  assert.equal(p.fim, "2026-11-30")
})

const linha = (over: Partial<LinhaExportacao>): LinhaExportacao => ({
  dataReferencia: "2026-11-10", dataVencimento: "2026-11-10", dataLiquidacao: "", tipo: "receita", status: "programado",
  descricao: "Servico", categoria: "", vinculo: "", formaPagamento: "", parcela: "", valor: 10, taxa: null, valorCaixa: 10, ...over,
})

test("totais das linhas ignoram cancelados e usam centavos", () => {
  const t = totaisDasLinhas([
    linha({ status: "realizado", valorCaixa: 0.1 }),
    linha({ status: "realizado", valorCaixa: 0.2 }),
    linha({ tipo: "despesa", status: "programado", valorCaixa: 5 }),
    linha({ status: "cancelado", valorCaixa: 999 }),
  ])
  assert.equal(t.entradasRealizadas, 0.3)
  assert.equal(t.saidasProgramadas, 5)
  assert.equal(t.quantidade, 4)
})

test("csv para excel pt-BR com totais e celulas seguras", () => {
  const linhas = [
    linha({ descricao: 'Limpeza; "caixa"', valor: 1234.5, valorCaixa: 1234.5 }),
    linha({ descricao: "=HYPERLINK(1)", status: "realizado", dataLiquidacao: "2026-11-12", taxa: 43.58, valorCaixa: 1190.92 }),
  ]
  const csv = gerarCsvLancamentos(linhas, totaisDasLinhas(linhas), "Novembro de 2026")
  assert.ok(csv.startsWith("﻿Data referencia;"))
  assert.match(csv, /"Limpeza; ""caixa"""/)
  assert.match(csv, /;'=HYPERLINK\(1\);/)
  assert.match(csv, /;1234,50;;1234,50/)
  assert.match(csv, /12\/11\/2026/)
  assert.match(csv, /Entradas realizadas;1190,92/)
  assert.match(csv, /Lancamentos;2/)
})
