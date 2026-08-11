const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const pagePath = path.join(process.cwd(), "app", "dashboard", "clientes", "page.tsx")

test("não exibe a quantidade de clientes encontrados na consulta", () => {
  const source = fs.readFileSync(pagePath, "utf8")

  assert.doesNotMatch(source, /cliente\(s\) encontrado\(s\)/)
  assert.match(source, /className="mb-3 flex justify-end"/)
  assert.match(source, /isLoadingPage\s*&&[\s\S]*?Carregando\.\.\./)
})
