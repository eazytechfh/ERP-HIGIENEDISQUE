export function getDataMode(): "local" | "api" {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE
  return mode === "api" ? "api" : "local"
}

export function isApiMode(): boolean {
  return getDataMode() === "api"
}
