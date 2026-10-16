export function resolveClientActivity(manualActivity: string, locationEnvironment: string): string {
  return manualActivity.trim() || locationEnvironment.trim() || "Não informado"
}
