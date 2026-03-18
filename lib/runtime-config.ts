export function getDataMode(): "local" | "api" {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE

  if (mode === "api" || mode === "local") {
    return mode
  }

  // If Supabase client env vars exist, prefer API mode even when DATA_MODE was not configured.
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  return hasSupabaseConfig ? "api" : "local"
}

export function isApiMode(): boolean {
  return getDataMode() === "api"
}
