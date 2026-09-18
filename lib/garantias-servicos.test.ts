import assert from "node:assert/strict"
import test from "node:test"
import { extrairGarantiasServico } from "./garantias-servicos.ts"

const base = {
  id: "s1",
  osNumber: "OS-1",
  clienteId: "c1",
  cliente: "Cliente",
  servico: "Controle de pragas",
  local: "Matriz",
  data: "2026-01-10",
  status: "executado",
}

test("extrai e classifica uma garantia por praga", () => {
  const items = extrairGarantiasServico({
    ...base,
    osFormData: {
      serviceRequest: { serviceName: "Dedetização", schedule: { date: "2026-01-10" }, warrantyDays: "", warrantyUnit: "dias" },
      dadosTecnicosVetores: {
        pragasAlvo: ["baratas", "cupins"],
        garantiasPorPraga: { baratas: { quantidade: "20", unidade: "dias" } },
      },
    },
  }, new Date(2026, 0, 20))

  assert.equal(items.length, 2)
  assert.deepEqual(items.map((item) => [item.cobertura, item.vencimento, item.situacao]), [
    ["Baratas", "2026-01-30", "a_vencer"],
    ["Cupins", "2028-01-10", "vigente"],
  ])
})

test("usa seis meses para higienização e ignora serviço sem garantia", () => {
  const limpeza = extrairGarantiasServico({
    ...base,
    servico: "Higienização de reservatório",
    osFormData: {
      serviceRequest: { serviceName: "Higienização de reservatório", schedule: { date: "2025-01-10" }, warrantyDays: "", warrantyUnit: "dias" },
      dadosTecnicosLimpeza: { reservatorios: [{ tipo: "cisterna", numero: "1" }] },
    },
  }, new Date(2026, 0, 20))
  assert.equal(limpeza[0]?.situacao, "vencida")
  assert.equal(limpeza[0]?.vencimento, "2025-07-10")

  const gordura = extrairGarantiasServico({
    ...base,
    servico: "Limpeza de caixa de gordura",
    osFormData: { serviceRequest: { serviceName: "Limpeza de caixa de gordura", schedule: { date: "2026-01-10" }, warrantyDays: "3", warrantyUnit: "meses" } },
  })
  assert.equal(gordura.length, 0)
})

test("acompanha somente serviços executados e não herda a praga padrão em serviço genérico", () => {
  const agendado = extrairGarantiasServico({
    ...base,
    status: "agendado",
    osFormData: { serviceRequest: { serviceName: "Dedetização", schedule: { date: "2026-01-10" }, warrantyDays: "3", warrantyUnit: "meses" } },
  })
  assert.equal(agendado.length, 0)

  const desentupimento = extrairGarantiasServico({
    ...base,
    servico: "Desentupimento de coluna",
    osFormData: {
      serviceRequest: { serviceName: "Desentupimento de coluna", schedule: { date: "2026-01-10" }, warrantyDays: "15", warrantyUnit: "dias" },
      dadosTecnicosVetores: { pragasAlvo: ["baratas"] },
    },
  }, new Date(2026, 0, 20))
  assert.equal(desentupimento[0]?.cobertura, "Desentupimento de coluna")
})
