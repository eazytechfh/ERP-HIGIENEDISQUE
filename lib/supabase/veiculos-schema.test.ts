import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const repositorySource = readFileSync(join(process.cwd(), "lib/supabase/veiculos-repo.ts"), "utf8")
const vehiclePageSource = readFileSync(join(process.cwd(), "app/dashboard/veiculos/page.tsx"), "utf8")
const migrationsDirectory = join(process.cwd(), "supabase/migrations")
const schemaSource = readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(migrationsDirectory, file), "utf8"))
  .join("\n")

test("vehicle persistence uses the RENAVAM column defined in the database", () => {
  assert.match(repositorySource, /renavam:\s*(?:row|input)\.renavam/)
  assert.doesNotMatch(repositorySource, /renavan/)
  assert.match(schemaSource, /add column if not exists renavam text/i)
})

test("vehicle registration allows missing model and responsible person", () => {
  assert.match(schemaSource, /alter column modelo drop not null/i)
  assert.match(schemaSource, /alter column responsavel drop not null/i)
  assert.doesNotMatch(
    vehiclePageSource,
    /!payload\.modelo\s*\|\||\|\|\s*!payload\.responsavel/,
  )
  const modelInput = vehiclePageSource.split("\n").find((line) => line.includes("value={veiculoForm.modelo}")) || ""
  const responsibleInput = vehiclePageSource.split("\n").find((line) => line.includes("value={veiculoForm.responsavel}")) || ""
  assert.ok(modelInput)
  assert.ok(responsibleInput)
  assert.doesNotMatch(modelInput, /\brequired\b/)
  assert.doesNotMatch(responsibleInput, /\brequired\b/)
})
