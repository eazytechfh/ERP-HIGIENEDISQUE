export function getCertificadoVetoresDensity(vetoresCount: number) {
  const extraRows = Math.max(0, vetoresCount - 3)

  return {
    fontSizeEm: Math.max(0.55, 1 - extraRows * 0.065),
    rowHeightMm: Math.max(1.8, 4.5 - extraRows * 0.27),
    paddingVerticalMm: Math.max(0.02, 0.6 - extraRows * 0.058),
  }
}
