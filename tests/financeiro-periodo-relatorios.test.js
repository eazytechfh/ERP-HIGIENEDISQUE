const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const readSource = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8")
const migration = () => readSource("supabase", "migrations", "20261116_035_financeiro_periodo_consultas.sql")

test("periodo usa liquidacao para realizado e vencimento para programado", () => {
  const sql = migration()
  assert.match(sql, /case when status = 'realizado' then coalesce\(data_liquidacao, data_vencimento\) else data_vencimento end/)
  // dashboard exclui cancelados
  assert.match(sql, /financeiro_resumo_periodo[\s\S]{0,900}and l\.status <> 'cancelado'/)
})

test("consultas no banco respeitam RLS e o indice e criado sem travar a tabela", () => {
  const sql = migration()
  const indice = readSource("supabase", "migrations", "20261116_036_financeiro_indice_data_referencia.sql")
  assert.equal((sql.match(/security invoker/g) || []).length, 4)
  assert.doesNotMatch(sql, /security definer/)
  assert.match(indice, /create index concurrently if not exists idx_financeiro_lancamentos_data_referencia/)
})

test("tela nao carrega mais 500 lancamentos em memoria", () => {
  const page = readSource("app", "dashboard", "financeiro", "page.tsx")
  const repo = readSource("lib", "supabase", "financeiro-repo.ts")
  assert.doesNotMatch(page, /listFinanceiroLancamentosSupabase/)
  assert.doesNotMatch(page, /setLancamentos\(/)
  assert.match(repo, /\.rpc\("financeiro_lancamentos_filtrados", filtrosParaRpc\(filtros\), \{ count: "exact" \}\)/)
  assert.match(repo, /\.range\(inicio, inicio \+ tamanhoPagina - 1\)/)
})

test("exportacao percorre todas as paginas do filtro e inclui totais", () => {
  const repo = readSource("lib", "supabase", "financeiro-repo.ts")
  const explorer = readSource("components", "financeiro", "lancamentos-explorer.tsx")
  assert.match(repo, /while \(todos\.length < total\)/)
  assert.match(explorer, /listarTodosLancamentosSupabase\(filtrosAtuais/)
  assert.match(explorer, /gerarCsvLancamentos\(linhas, totaisLinhas, descricao\)/)
  assert.match(explorer, /abrirPdf\(linhas, totaisLinhas, descricao\)/)
})

test("dashboard tem ano, mes atual, anual e jan-dez", () => {
  const dash = readSource("components", "financeiro", "dashboard-financeiro.tsx")
  assert.match(dash, /<SelectItem value="mes_atual">Mes atual<\/SelectItem>/)
  assert.match(dash, /<SelectItem value="anual">Anual<\/SelectItem>/)
  assert.match(dash, /MESES_NOME\.map/)
  assert.match(dash, /resumoPeriodoSupabase\(intervalo\.inicio, intervalo\.fim, intervalo\.agrupamento\)/)
})
