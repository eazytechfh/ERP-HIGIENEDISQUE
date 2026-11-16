import test from "node:test"
import assert from "node:assert/strict"

import { adicionarMeses, chaveTaxaCartao, isFormaCartao, planejarCobranca, rotuloTaxaCartao, calcularTaxa, descricaoParcela, dividirEmParcelas, planejarParcelas } from "./financeiro-calculos.ts"

const somaCents = (valores: number[]) => valores.reduce((s, v) => s + Math.round(v * 100), 0)

test("divide centavos sem diferenca no total", () => {
  assert.deepEqual(dividirEmParcelas(100, 3), [33.34, 33.33, 33.33])
  assert.deepEqual(dividirEmParcelas(0.05, 2), [0.03, 0.02])
  assert.deepEqual(dividirEmParcelas(1000, 4), [250, 250, 250, 250])
  for (const [total, n] of [[1234.57, 7], [99.99, 12], [0.36, 36], [10000.01, 5]] as const) {
    assert.equal(somaCents(dividirEmParcelas(total, n)), Math.round(total * 100), `${total}/${n}`)
  }
})

test("recusa quantidades e totais invalidos", () => {
  assert.throws(() => dividirEmParcelas(100, 0))
  assert.throws(() => dividirEmParcelas(100, 37))
  assert.throws(() => dividirEmParcelas(100, 1.5))
  assert.throws(() => dividirEmParcelas(0, 2))
  assert.throws(() => dividirEmParcelas(0.02, 3))
})

test("vencimentos mensais respeitam fim de mes e virada de ano", () => {
  assert.equal(adicionarMeses("2026-01-31", 1), "2026-02-28")
  assert.equal(adicionarMeses("2028-01-31", 1), "2028-02-29")
  assert.equal(adicionarMeses("2026-01-31", 2), "2026-03-31")
  assert.equal(adicionarMeses("2026-11-15", 3), "2027-02-15")
  assert.equal(adicionarMeses("2026-12-10", 0), "2026-12-10")
})

test("planeja parcelas a partir do primeiro vencimento", () => {
  const parcelas = planejarParcelas({ total: 500, quantidade: 3, primeiroVencimento: "2026-11-30" })
  assert.deepEqual(parcelas.map((p) => p.dataVencimento), ["2026-11-30", "2026-12-30", "2027-01-30"])
  assert.deepEqual(parcelas.map((p) => p.valor), [166.67, 166.67, 166.66])
  assert.deepEqual(parcelas.map((p) => `${p.numero}/${p.total}`), ["1/3", "2/3", "3/3"])
  assert.equal(descricaoParcela("Servico", 2, 3), "Servico (2/3)")
  assert.equal(descricaoParcela("Servico", 1, 1), "Servico")
})

test("taxa do cartao arredonda ao centavo e fecha bruto = taxa + liquido", () => {
  assert.deepEqual(calcularTaxa(100, 3.49), { valorBruto: 100, taxaPercentual: 3.49, taxaValor: 3.49, valorLiquido: 96.51 })
  assert.deepEqual(calcularTaxa(150.5, 1.99), { valorBruto: 150.5, taxaPercentual: 1.99, taxaValor: 2.99, valorLiquido: 147.51 })
  assert.deepEqual(calcularTaxa(80, 0), { valorBruto: 80, taxaPercentual: 0, taxaValor: 0, valorLiquido: 80 })
  const c = calcularTaxa(1234.56, 4.75)
  assert.equal(Math.round(c.taxaValor * 100) + Math.round(c.valorLiquido * 100), 123456)
})

test("chave e rotulo da taxa de cartao", () => {
  assert.equal(chaveTaxaCartao("cartao_debito", 5), "cartao_debito:1")
  assert.equal(chaveTaxaCartao("cartao_credito", 3), "cartao_credito:3")
  assert.equal(rotuloTaxaCartao("cartao_credito", 1), "Credito a vista")
  assert.equal(rotuloTaxaCartao("cartao_credito", 10), "Credito 10x")
  assert.equal(rotuloTaxaCartao("cartao_debito", 1), "Debito")
})

test("parcelas independem da forma: cartao e lancamento unico, demais formas picadas", () => {
  const cartao = planejarCobranca({ total: 900, quantidade: 3, primeiroVencimento: "2026-12-10", formaPagamento: "cartao_credito" })
  assert.equal(cartao.lancamentos.length, 1)
  assert.equal(cartao.lancamentos[0].valor, 900)
  assert.equal(cartao.cartaoParcelas, 3)

  const generico = planejarCobranca({ total: 900, quantidade: 4, primeiroVencimento: "2026-12-10", formaPagamento: "cartao" })
  assert.equal(generico.lancamentos.length, 1)
  assert.equal(generico.cartaoParcelas, 4)

  assert.equal(planejarCobranca({ total: 50, quantidade: 1, primeiroVencimento: "2026-12-10", formaPagamento: "cartao_debito" }).cartaoParcelas, 1)

  for (const forma of ["boleto", "pix", "dinheiro", "transferencia", ""]) {
    const plano = planejarCobranca({ total: 100, quantidade: 3, primeiroVencimento: "2026-12-10", formaPagamento: forma })
    assert.equal(plano.lancamentos.length, 3, forma)
    assert.equal(plano.cartaoParcelas, null)
    assert.deepEqual(plano.lancamentos.map((p) => p.dataVencimento), ["2026-12-10", "2027-01-10", "2027-02-10"])
  }

  assert.throws(() => planejarCobranca({ total: 100, quantidade: 22, primeiroVencimento: "2026-12-10", formaPagamento: "cartao_credito" }))
  assert.equal(isFormaCartao("cartao"), true)
  assert.equal(isFormaCartao("boleto"), false)
})
