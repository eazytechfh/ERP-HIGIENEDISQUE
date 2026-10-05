import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const repositorySource = readFileSync(join(process.cwd(), "lib/supabase/veiculos-repo.ts"), "utf8")
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
