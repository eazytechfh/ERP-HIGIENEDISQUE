const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const readSource = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8")

test("oferece edição do contrato atual na listagem de clientes", () => {
  const source = readSource("app", "dashboard", "clientes", "page.tsx")

  assert.match(source, /title="Editar contrato"/)
  assert.match(source, /apiMode\s*&&\s*contratoAtual/)
  assert.match(source, /can\("contratos\.edit"\)[\s\S]{0,100}can\("clientes\.edit"\)[\s\S]{0,100}can\("contratos\.generate"\)[\s\S]{0,100}apiMode[\s\S]{0,100}contratoAtual/)
  assert.match(source, /contratoId=\$\{encodeURIComponent\(String\(contratoAtual\.id\)\)\}/)
})

test("carrega diretamente o contrato solicitado para preencher o formulário", () => {
  const source = readSource("app", "dashboard", "clientes", "contratos", "page.tsx")

  assert.match(source, /searchParams\.get\("contratoId"\)/)
  assert.match(source, /getContratoSupabase\(contratoIdParam\)/)
  assert.match(source, /setTipoContrato\(contrato\.tipoContrato\)/)
  assert.match(source, /setStatusContrato\(contrato\.status\)/)
  assert.match(source, /setDataInicio\(contrato\.dataInicio\)/)
  assert.match(source, /setDataTermino\(contrato\.dataTermino\)/)
  assert.match(source, /setServicosContrato\(/)
})

test("impede salvar quando o contrato solicitado não foi carregado", () => {
  const source = readSource("app", "dashboard", "clientes", "contratos", "page.tsx")

  assert.match(source, /const contratoIndisponivel = Boolean\(contratoIdParam\) && !contratoEmEdicao/)
  assert.match(source, /disabled=\{isSavingContrato \|\| isLoadingContrato \|\| contratoIndisponivel\}/)
})

test("atualiza o mesmo contrato preservando id e número", () => {
  const pageSource = readSource("app", "dashboard", "clientes", "contratos", "page.tsx")
  const repositorySource = readSource("lib", "supabase", "contratos-repo.ts")

  assert.match(repositorySource, /export async function getContratoSupabase\(id: string\)/)
  assert.match(pageSource, /id:\s*contratoEmEdicao\?\.id/)
  assert.match(pageSource, /numero:\s*contratoEmEdicao\?\.numero\s*\|\|/)
  assert.match(pageSource, /contratoEmEdicao\s*\?\s*"Atualizar Contrato"/)
})

test("persiste e restaura todos os campos editáveis do contrato", () => {
  const pageSource = readSource("app", "dashboard", "clientes", "contratos", "page.tsx")
  const repositorySource = readSource("lib", "supabase", "contratos-repo.ts")
  const migrationSource = readSource(
    "supabase",
    "migrations",
    "20261021_001_expand_contratos_editable_fields.sql",
  )

  for (const column of [
    "dia_vencimento",
    "valor_mensal",
    "reajuste_anual",
    "multa_contratual",
    "exige_aprovacao",
    "adicional_descricao",
    "observacoes_contratuais",
    "observacoes_internas",
  ]) {
    assert.match(migrationSource, new RegExp(column))
    assert.match(repositorySource, new RegExp(column))
  }

  assert.match(migrationSource, /frequencia/)
  assert.match(migrationSource, /limites/)
  assert.match(repositorySource, /frequencia:\s*item\.frequencia/)
  assert.match(repositorySource, /limites:\s*item\.limites/)
  assert.match(pageSource, /setDiaVencimento\(contrato\.diaVencimento\)/)
  assert.match(pageSource, /setValorMensal\(contrato\.valorMensal\)/)
  assert.match(pageSource, /setObservacoesInternas\(contrato\.observacoesInternas\)/)
})

test("sincroniza somente o resumo contratual do cliente sem regravar anexos", () => {
  const pageSource = readSource("app", "dashboard", "clientes", "contratos", "page.tsx")
  const migrationSource = readSource(
    "supabase",
    "migrations",
    "20261021_001_expand_contratos_editable_fields.sql",
  )

  assert.doesNotMatch(pageSource, /upsertClienteSupabase/)
  assert.doesNotMatch(pageSource, /updateClienteContratoResumoSupabase\(/)
  assert.match(migrationSource, /update public\.clientes[\s\S]*?possui_contrato = true/)
})

test("preserva a identidade dos itens que continuam no contrato", () => {
  const pageSource = readSource("app", "dashboard", "clientes", "contratos", "page.tsx")
  const repositorySource = readSource("lib", "supabase", "contratos-repo.ts")

  assert.match(pageSource, /\.map\(\(s\) => \(\{ id: s\.id, nome: s\.tipoServico/)
  assert.match(repositorySource, /buildContratoItensPayload/)
  assert.match(repositorySource, /\.rpc\("upsert_contrato_com_itens"/)
  assert.doesNotMatch(repositorySource, /\.update\(item\.values\)/)
})

test("normaliza os itens enviados para a transação", async () => {
  const { buildContratoItensPayload } = await import("../lib/contratos-items.ts")
  const payload = buildContratoItensPayload(
    [
      { id: "item-a", nome: "Dedetização", frequencia: "mensal", limites: "" },
      { id: "novo-local", nome: "Desentupimento", frequencia: "", limites: "2 visitas" },
    ],
  )

  assert.deepEqual(payload, [
    { id: "item-a", nome: "Dedetização", frequencia: "mensal", limites: null },
    { id: "novo-local", nome: "Desentupimento", frequencia: null, limites: "2 visitas" },
  ])
})

test("salva contrato, cliente e itens em uma transação com controle de concorrência", () => {
  const repositorySource = readSource("lib", "supabase", "contratos-repo.ts")
  const migrationSource = readSource(
    "supabase",
    "migrations",
    "20261021_001_expand_contratos_editable_fields.sql",
  )

  assert.match(migrationSource, /create or replace function public\.upsert_contrato_com_itens/)
  assert.match(migrationSource, /p_expected_updated_at timestamptz/)
  assert.match(migrationSource, /if p_expected_updated_at is null then\s+raise exception 'CONTRATO_CONFLICT'/)
  assert.match(migrationSource, /raise exception 'CONTRATO_CONFLICT'/)
  assert.match(repositorySource, /p_expected_updated_at:\s*input\.expectedUpdatedAt \|\| null/)
  assert.match(repositorySource, /p_itens:\s*buildContratoItensPayload\(input\.itens\)/)
})

test("busca contratos dos clientes exibidos sem depender do limite global", () => {
  const source = readSource("app", "dashboard", "clientes", "page.tsx")

  assert.match(source, /listContratosSupabase\(\{ clienteIds:/)
})
