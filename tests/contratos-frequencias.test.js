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

test("oferece a frequência quadrimestral entre trimestral e semestral", () => {
  const source = fs.readFileSync(pagePath, "utf8")

  assert.match(
    source,
    /\{ value: "trimestral", label: "Trimestral" \},\s*\{ value: "quadrimestral", label: "Quadrimestral" \},\s*\{ value: "semestral", label: "Semestral" \}/,
  )
})
