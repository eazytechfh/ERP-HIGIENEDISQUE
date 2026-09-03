export function getVetoresPrintDensityClass(productCount: number): "" | "os-vetores-dense" {
  return productCount > 4 ? "os-vetores-dense" : ""
}
