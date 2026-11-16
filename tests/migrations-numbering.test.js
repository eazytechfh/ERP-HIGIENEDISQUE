import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"

test("migrations have consecutive numbers in chronological order", () => {
  const directory = path.resolve("supabase", "migrations")
  const migrations = readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort()

  for (const [index, name] of migrations.entries()) {
    const expectedNumber = String(index + 1).padStart(3, "0")
    assert.match(
      name,
      new RegExp(`^\\d{8}_${expectedNumber}_.+\\.sql$`),
      `migration ${index + 1} should be numbered ${expectedNumber}: ${name}`,
    )
  }
})
