const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const pagePath = path.join(
  process.cwd(),
  "app",
  "dashboard",
  "clientes",
  "contratos",
  "page.tsx",
)

test("busca clientes de contratos no Supabase sem carregar toda a base", () => {
  const source = fs.readFileSync(pagePath, "utf8")

  assert.doesNotMatch(source, /pageSize:\s*9999/)
  assert.match(source, /pageSize:\s*50/)
  assert.match(source, /search:\s*searchTerm\s*\|\|\s*undefined/)
  assert.match(source, /},\s*300\)/)
})

test("carrega diretamente o cliente informado por clienteId", () => {
  const source = fs.readFileSync(pagePath, "utf8")

  assert.match(source, /getClienteSupabase\(clienteIdParam\)/)
  assert.match(source, /mapClienteToResumoView\(cliente\)/)
})

test("recupera o cliente completo ao salvar quando ele saiu do lote pesquisado", () => {
  const source = fs.readFileSync(pagePath, "utf8")

  assert.match(
    source,
    /clientesCompletos\.find\([\s\S]*?\?\?\s*await getClienteSupabase\(clienteSelecionado\.id\)/,
  )
})
