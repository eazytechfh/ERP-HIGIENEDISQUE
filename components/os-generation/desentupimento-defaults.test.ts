import assert from "node:assert/strict"
import test from "node:test"

import { preencherDadosDesentupimento } from "./desentupimento-defaults.ts"
import type { DadosTecnicosDesentupimento } from "./desentupimento-form.tsx"

const dadosVazios: DadosTecnicosDesentupimento = {
  horaServico: "",
  atendente: "",
  tecnico: "",
  vendedor: "",
  inscricao: "",
  homePage: "",
  contatos: "",
  origem: "",
  referencia: "",
  observacoes: "",
  servicos: [],
  desconto: "",
  condicaoPagamento: "",
}

test("preenche os dados da OS a partir de uma cobrança direta", () => {
  const resultado = preencherDadosDesentupimento(dadosVazios, {
    usuario: "Fernanda Souza",
    inicio: "09:00",
    fim: "11:30",
    servico: "Desentupimento de coluna",
    modoCobranca: "avulso",
    valor: "1250,50",
    formaPagamento: "pix",
  })

  assert.equal(resultado.atendente, "Bruna Freitas")
  assert.equal(resultado.tecnico, "Bruna Freitas")
  assert.equal(resultado.vendedor, "Bruna Freitas")
  assert.equal(resultado.horaServico, "09:00 - 11:30")
  assert.equal(resultado.servicos[0]?.descricao, "Desentupimento de coluna")
  assert.equal(resultado.servicos[0]?.valorServico, "R$ 1.250,50")
  assert.equal(resultado.condicaoPagamento, "Pix")
})

test("indica inclusão no contrato quando não há preço direto", () => {
  const resultado = preencherDadosDesentupimento(dadosVazios, {
    usuario: "Fernanda Souza",
    inicio: "09:00",
    fim: "",
    servico: "Desentupimento",
    modoCobranca: "contrato",
    valor: "",
    formaPagamento: "",
  })

  assert.equal(resultado.horaServico, "09:00")
  assert.equal(resultado.servicos[0]?.valorServico, "Incluso no contrato")
})

test("preserva campos e serviços editados manualmente", () => {
  const resultado = preencherDadosDesentupimento({
    ...dadosVazios,
    atendente: "Atendente escolhido",
    tecnico: "Técnico escolhido",
    vendedor: "Vendedor escolhido",
    horaServico: "Após as 14h",
    condicaoPagamento: "2 parcelas",
    servicos: [{ id: "manual", descricao: "Serviço ajustado", garantia: "3 meses", valorServico: "R$ 900,00" }],
  }, {
    usuario: "Outro usuário",
    inicio: "08:00",
    fim: "10:00",
    servico: "Outro serviço",
    modoCobranca: "avulso",
    valor: "1000",
    formaPagamento: "pix",
  })

  assert.equal(resultado.atendente, "Atendente escolhido")
  assert.equal(resultado.tecnico, "Técnico escolhido")
  assert.equal(resultado.vendedor, "Vendedor escolhido")
  assert.equal(resultado.horaServico, "Após as 14h")
  assert.equal(resultado.condicaoPagamento, "2 parcelas")
  assert.deepEqual(resultado.servicos, [{ id: "manual", descricao: "Serviço ajustado", garantia: "3 meses", valorServico: "R$ 900,00" }])
})
