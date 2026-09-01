export function parseReservedOsNumber(value: unknown, year: number): string {
  if (typeof value !== "string" || !new RegExp(`^OS-${year}-\\d{6,}$`).test(value)) {
    throw new Error("Numero de OS invalido retornado pelo servidor.")
  }
  return value
}
