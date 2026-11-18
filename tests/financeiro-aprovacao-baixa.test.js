const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const readSource = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8")
const migration = () => readSource("supabase", "migrations", "20261116_030_financeiro_aprovacao_baixa.sql")

test("banco bloqueia baixa direta e só aceita a aprovação", () => {
  const sql = migration()

  assert.match(sql, /create trigger trg_financeiro_lancamentos_guard_baixa\s+before insert or update or delete on public\.financeiro_lancamentos/)
  assert.match(sql, /if new\.status = 'realizado' then\s+raise exception/)
  assert.match(sql, /if old\.status = 'realizado' then\s+raise exception/)
  assert.match(sql, /current_setting\('app\.financeiro_baixa_aprovada', true\)/)
  // Somente a função de decisão liga a flag que libera a baixa.
  assert.equal((sql.match(/set_config\('app\.financeiro_baixa_aprovada', 'on', true\)/g) || []).length, 1)
})

test("aprovador é identificado pela conta autenticada e e-mail cadastrado", () => {
  const sql = migration()

  assert.match(sql, /create table if not exists public\.financeiro_aprovadores/)
  assert.match(sql, /join public\.financeiro_aprovadores a on a\.email = lower\(u\.email\)/)
  assert.match(sql, /where u\.id = auth\.uid\(\)/)
  assert.match(sql, /if auth\.uid\(\) is null or not public\.is_aprovador_financeiro\(\) then/)
})

test("solicitação é única por lançamento e idempotente", () => {
  const sql = migration()

  assert.match(sql, /create unique index if not exists uq_financeiro_baixa_pendente_por_lancamento[\s\S]{0,120}where status = 'pendente'/)
  assert.match(sql, /for update;[\s\S]{0,400}Idempotente: se ja existe pendente, devolve a mesma solicitacao/)
  assert.match(sql, /if v_solicitacao\.status = v_status_final then\s+return v_solicitacao\.status;/)
  assert.match(sql, /revoke insert, update, delete on table public\.financeiro_baixa_solicitacoes from anon, authenticated/)
})

test("tela solicita baixa em vez de marcar como realizado", () => {
  const page = readSource("app", "dashboard", "financeiro", "page.tsx")
  const repo = readSource("lib", "supabase", "financeiro-repo.ts")

  assert.doesNotMatch(page, /status:\s*"realizado"/)
  assert.doesNotMatch(page, /Ja realizado/)
  assert.match(page, /solicitarBaixaLancamentoSupabase\(payload\)/)
  assert.match(page, /value: "aprovacoes" as AbaFinanceira, label: "Aprovacoes"/)
  assert.doesNotMatch(repo, /^\s*data_liquidacao: input\.dataLiquidacao/m)
  assert.match(repo, /rpc\("financeiro_decidir_baixa"/)
})

test("OS não reescreve receita recebida e contrato não gera receita própria", () => {
  const repo = readSource("lib", "supabase", "financeiro-repo.ts")
  const servicos = readSource("app", "dashboard", "servicos", "page.tsx")

  assert.match(repo, /existente\.status === "realizado" \|\| temBaixaPendente/)
  assert.match(repo, /export async function cancelLancamentoServicoSupabase[\s\S]{0,700}\.eq\("status", "programado"\)/)
  assert.match(servicos, /saved\.cobrancaModo === "contrato" && servico\.id[\s\S]{0,200}cancelReceitaProgramadaServicoSupabase\(saved\.id\)/)
})

test("importacao de despesas baixa direto, mas so para o aprovador e numa transacao", () => {
  const sql = readSource("supabase", "migrations", "20261118_038_financeiro_importar_despesas.sql")

  assert.match(sql, /if auth\.uid\(\) is null or not public\.is_aprovador_financeiro\(\) then/)
  assert.match(sql, /set_config\('app\.financeiro_baixa_aprovada', 'on', true\)/)
  assert.match(sql, /set_config\('app\.financeiro_baixa_aprovada', '', true\)/)
  assert.match(sql, /'despesa', 'realizado'/)
  assert.match(sql, /r\.data > current_date/)
  assert.match(sql, /revoke all on function public\.financeiro_importar_despesas\(jsonb\) from public, anon/)
})
