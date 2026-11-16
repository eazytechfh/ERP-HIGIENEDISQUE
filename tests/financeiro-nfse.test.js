const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const readSource = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8").replace(/\r\n/g, "\n")

test("chave do Asaas fica so no servidor", () => {
  const repo = readSource("lib", "supabase", "nfse-repo.ts")
  const tela = readSource("components", "financeiro", "nfse.tsx")
  for (const fonte of [repo, tela]) {
    assert.doesNotMatch(fonte, /ASAAS_API_KEY|asaas\.com/)
  }
  assert.match(repo, /fetch\(caminho/)
  assert.match(repo, /"\/api\/financeiro\/nfse\/emitir"/)
})

test("emissao grava o documento antes e reconcilia antes de criar no Asaas", () => {
  const rota = readSource("app", "api", "financeiro", "nfse", "emitir", "route.ts")
  assert.match(rota, /autenticarFinanceiro\(req, "financeiro\.create"\)/)
  assert.match(rota, /const externalReference = `erp-nfse-\$\{corpo\.chave\}`/)
  const insertDoc = rota.indexOf('.from("financeiro_documentos")\n        .insert(')
  const reconcilia = rota.indexOf("buscarInvoicePorReferencia(externalReference)")
  const criaInvoice = rota.indexOf('asaasFetch<AsaasInvoice>("/invoices", {')
  assert.ok(insertDoc > 0 && reconcilia > insertDoc && criaInvoice > reconcilia)
  assert.match(rota, /if \(documento\.asaas_invoice_id\) \{\s+\/\/ Ja enviada: nao reenviar/)
  // nota da OS reutiliza a receita; avulsa cria receita programada
  assert.match(rota, /\.eq\("servico_id", corpo\.servicoId\)/)
  assert.match(rota, /origem: "nota_fiscal"/)
})

test("so INVOICE_AUTHORIZED / AUTHORIZED marca a nota como emitida", () => {
  const nfse = readSource("lib", "server", "nfse.ts")
  const calc = readSource("lib", "nfse-calculos.ts")
  assert.match(nfse, /status: statusDocumentoPorAsaas\(invoice\.status\)/)
  assert.match(calc, /if \(status === "AUTHORIZED"/)
})

test("webhook autentica, grava o evento antes e e idempotente", () => {
  const rota = readSource("app", "api", "financeiro", "nfse", "webhook", "route.ts")
  assert.match(rota, /req\.headers\.get\("asaas-access-token"\)/)
  assert.match(rota, /timingSafeEqual/)
  assert.match(rota, /onConflict: "id", ignoreDuplicates: true/)
  assert.match(rota, /duplicado: true/)
  const grava = rota.indexOf('.from("financeiro_asaas_eventos")\n    .upsert(')
  const aplica = rota.indexOf("aplicarInvoiceNoDocumento(admin")
  assert.ok(grava > 0 && aplica > grava)
  // estado atual vem do Asaas, nao do payload (eventos fora de ordem)
  assert.match(rota, /invoice = await buscarInvoice\(invoiceId\)/)
})

test("configuracao fiscal so pelo aprovador e com historico", () => {
  const sql = readSource("supabase", "migrations", "20261116_037_financeiro_nfse_asaas.sql")
  assert.match(sql, /financeiro_salvar_nfse_config[\s\S]{0,300}not public\.is_aprovador_financeiro\(\)/)
  assert.match(sql, /insert into public\.financeiro_nfse_config_historico/)
  assert.match(sql, /alter column numero drop not null/)
  assert.match(sql, /create table if not exists public\.financeiro_asaas_eventos \(\s+id text primary key/)
})

test("tela de NFS-e nao pede numero, chave nem serie", () => {
  const tela = readSource("components", "financeiro", "nfse.tsx")
  assert.doesNotMatch(tela, /Numero da NF|Chave da NF|>Serie</)
  assert.match(tela, /Responsavel pelo ISS/)
  assert.match(tela, /Liquido a receber/)
  assert.match(tela, /\["agendar", "Agendar"\]/)
})
