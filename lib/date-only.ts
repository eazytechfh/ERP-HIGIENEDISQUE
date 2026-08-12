export function parseDateOnlyLocal(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)

  return new Date(year, month - 1, day)
}

export function formatDateOnlyBR(value: string): string {
  return parseDateOnlyLocal(value).toLocaleDateString("pt-BR")
}
