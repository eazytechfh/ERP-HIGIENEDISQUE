const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const readSource = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8")
const migration = () => readSource("supabase", "migrations", "20261116_031_financeiro_cartao_parcelas.sql")

test("taxas de cartão são versionadas e só o aprovador altera", () => {
  const sql = migration()

  assert.match(sql, /create table if not exists public\.financeiro_taxas_cartao/)
  assert.match(sql, /financeiro_definir_taxa_cartao[\s\S]{0,400}if auth\.uid\(\) is null or not public\.is_aprovador_financeiro\(\) then/)
  assert.match(sql, /revoke insert, update, delete on table public\.financeiro_taxas_cartao from anon, authenticated/)
})

test("taxa é gravada na solicitação e copiada na aprovação", () => {
  const sql = migration()

  assert.match(sql, /v_percentual := public\.financeiro_taxa_cartao_vigente\(v_forma\)/)
  assert.match(sql, /v_taxa := round\(v_lancamento\.valor \* v_percentual \/ 100, 2\)/)
  assert.match(sql, /taxa_percentual = v_solicitacao\.taxa_percentual/)
  assert.match(sql, /valor_liquido = coalesce\(v_solicitacao\.valor_liquido, v_solicitacao\.valor\)/)
  // campos de taxa protegidos pela trava
  assert.match(sql, /or new\.valor_liquido is distinct from old\.valor_liquido/)
})

test("tela mostra bruto, taxa e líquido e envia a taxa esperada", () => {
  const dialog = readSource("components", "financeiro", "aprovacoes-baixa.tsx")

  assert.match(dialog, /taxas\[chaveTaxaCartao\(formaPagamento, parcelasEfetivas\)\]/)
  assert.match(dialog, /calcularTaxa\(lancamento\.valor, taxaPercentual\)/)
  assert.match(dialog, /Valor bruto/)
  assert.match(dialog, /Valor liquido no caixa/)
  assert.match(dialog, /taxaEsperada: calculoTaxa \? calculoTaxa\.taxaPercentual : null/)
})

test("boleto gera parcelas numa única inserção e envia cada uma à integração", () => {
  const page = readSource("app", "dashboard", "financeiro", "page.tsx")
  const repo = readSource("lib", "supabase", "financeiro-repo.ts")

  assert.match(repo, /from\("financeiro_lancamentos"\)\.insert\(rows\)/)
  assert.match(page, /criarLancamentosSupabase\(\s*parcelas\.map/)
  assert.match(page, /parcelaNumero: lancamento\?\.parcelaNumero \?\? 1/)
  assert.match(page, /registrarIntegracaoDocumentoSupabase\(documento\.id, status\)/)
  // parcelas em qualquer forma; cartão continua lançamento único (regra em planejarCobranca)
  assert.match(page, /previaCobranca\(valor, quantidadeTexto, fluxoForm\.dataVencimento, fluxoForm\.formaPagamento\)/)
  assert.match(page, /cartaoParcelas: cartaoParcelas \?\? undefined/)
})

test("totais do caixa usam o valor líquido", () => {
  const page = readSource("app", "dashboard", "financeiro", "page.tsx")

  assert.doesNotMatch(page, /\.reduce\(\(s, i\) => s \+ i\.valor, 0\)/)
  assert.doesNotMatch(page, /\.reduce\(\(sum, item\) => sum \+ item\.valor, 0\)/)
  // agregacoes no banco somam valor_caixa (liquido quando realizado)
  const sql = readSource("supabase", "migrations", "20261116_035_financeiro_periodo_consultas.sql")
  assert.match(sql, /case when status = 'realizado' then coalesce\(valor_liquido, valor\) else valor end/)
  assert.match(sql, /coalesce\(sum\(l\.valor_caixa\), 0\)/)
})

const migration032 = () => readSource("supabase", "migrations", "20261116_033_financeiro_taxa_cartao_parcelas.sql")

test("taxa do crédito depende das parcelas da venda e taxa ausente bloqueia", () => {
  const sql = migration032()
  const dialog = readSource("components", "financeiro", "aprovacoes-baixa.tsx")

  assert.match(sql, /\(modalidade = 'cartao_debito' and parcelas = 1\)/)
  assert.match(sql, /v_percentual := public\.financeiro_taxa_cartao_vigente\(v_forma, v_parcelas\)/)
  assert.match(sql, /if v_percentual is null then\s+raise exception 'Taxa de % nao configurada/)
  assert.match(sql, /cartao_parcelas = v_solicitacao\.cartao_parcelas/)
  assert.match(dialog, /cartaoParcelas: usaTaxa \? parcelasEfetivas : null/)
  assert.match(dialog, /disabled=\{saving \|\| taxaNaoConfigurada\}/)
})

test("carga inicial traz as taxas da maquininha sem sobrescrever as existentes", () => {
  const sql = migration032()

  assert.match(sql, /\('cartao_debito',  1, 1\.64\)/)
  assert.match(sql, /\('cartao_credito', 1, 3\.53\)/)
  assert.match(sql, /\('cartao_credito', 10, 13\.17\)/)
  assert.match(sql, /where not exists \(\s+select 1 from public\.financeiro_taxas_cartao t/)
})

test("OS informa parcelas em qualquer forma e o financeiro recebe o mesmo plano", () => {
  const os = readSource("app", "dashboard", "servicos", "page.tsx")
  const repo = readSource("lib", "supabase", "financeiro-repo.ts")
  const sql = readSource("supabase", "migrations", "20261116_034_financeiro_cartao_parcelas_planejadas.sql")

  assert.match(os, /<Label htmlFor="installments">Parcelas \*<\/Label>/)
  assert.match(os, /quantidadeParcelas: servico\.billingInstallments \|\| 1/)
  assert.match(os, /billing\?\.installments/)
  assert.match(repo, /const plano = planejarCobranca\(\{/)
  // parcela já baixada ou em aprovação bloqueia o reparcelamento pela OS
  assert.match(repo, /return \{ lancamentos: ativosItens, alterado: false, bloqueado: true \}/)
  assert.match(repo, /cartao_parcelas: input\.cartaoParcelas \?\? null/)
  assert.match(sql, /drop trigger if exists trg_financeiro_lancamentos_guard_cartao_parcelas/)
})
