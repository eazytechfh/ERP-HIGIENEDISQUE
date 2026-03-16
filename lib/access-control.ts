export type AppRole = "admin" | "operacional" | "financeiro" | "tecnico"

export const ALL_PERMISSIONS = [
  "dashboard.view",
  "clientes.view",
  "clientes.create",
  "clientes.edit",
  "clientes.delete",
  "contratos.view",
  "contratos.create",
  "contratos.edit",
  "contratos.delete",
  "contratos.generate",
  "servicos.view",
  "servicos.create",
  "servicos.edit",
  "servicos.delete",
  "servicos.generate_os",
  "estoque.view",
  "estoque.create",
  "estoque.edit",
  "estoque.delete",
  "equipe.view",
  "equipe.create",
  "equipe.edit",
  "equipe.delete",
  "equipe.manage_access",
  "veiculos.view",
  "veiculos.create",
  "veiculos.edit",
  "veiculos.delete",
  "financeiro.view",
  "financeiro.create",
  "financeiro.edit",
  "financeiro.delete",
  "logs.view",
] as const

export type AppPermissionKey = (typeof ALL_PERMISSIONS)[number]

type PermissionSection = {
  title: string
  items: Array<{ key: AppPermissionKey; label: string }>
}

export const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    title: "Clientes",
    items: [
      { key: "clientes.view", label: "Visualizar clientes" },
      { key: "clientes.create", label: "Cadastrar clientes" },
      { key: "clientes.edit", label: "Editar clientes" },
      { key: "clientes.delete", label: "Excluir clientes" },
    ],
  },
  {
    title: "Contratos",
    items: [
      { key: "contratos.view", label: "Visualizar contratos" },
      { key: "contratos.create", label: "Cadastrar contratos" },
      { key: "contratos.edit", label: "Editar contratos" },
      { key: "contratos.delete", label: "Excluir contratos" },
      { key: "contratos.generate", label: "Gerar arquivos de contrato" },
    ],
  },
  {
    title: "Servicos e OS",
    items: [
      { key: "servicos.view", label: "Visualizar servicos" },
      { key: "servicos.create", label: "Cadastrar servicos" },
      { key: "servicos.edit", label: "Editar servicos e aprovar OS" },
      { key: "servicos.delete", label: "Excluir servicos" },
      { key: "servicos.generate_os", label: "Gerar e anexar OS" },
    ],
  },
  {
    title: "Estoque",
    items: [
      { key: "estoque.view", label: "Visualizar estoque" },
      { key: "estoque.create", label: "Cadastrar produtos e NF" },
      { key: "estoque.edit", label: "Editar produtos e NF" },
      { key: "estoque.delete", label: "Excluir produtos e NF" },
    ],
  },
  {
    title: "Equipe e usuarios",
    items: [
      { key: "equipe.view", label: "Visualizar equipe" },
      { key: "equipe.create", label: "Cadastrar equipe" },
      { key: "equipe.edit", label: "Editar equipe" },
      { key: "equipe.delete", label: "Excluir equipe" },
      { key: "equipe.manage_access", label: "Gerenciar acessos e permissoes" },
    ],
  },
  {
    title: "Veiculos",
    items: [
      { key: "veiculos.view", label: "Visualizar veiculos" },
      { key: "veiculos.create", label: "Cadastrar veiculos" },
      { key: "veiculos.edit", label: "Editar veiculos" },
      { key: "veiculos.delete", label: "Excluir veiculos" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { key: "financeiro.view", label: "Visualizar financeiro" },
      { key: "financeiro.create", label: "Cadastrar lancamentos" },
      { key: "financeiro.edit", label: "Editar financeiro" },
      { key: "financeiro.delete", label: "Excluir financeiro" },
    ],
  },
  {
    title: "Administracao",
    items: [
      { key: "dashboard.view", label: "Acessar dashboard" },
      { key: "logs.view", label: "Visualizar logs de auditoria" },
    ],
  },
]

const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, AppPermissionKey[]> = {
  admin: [...ALL_PERMISSIONS],
  operacional: [
    "dashboard.view",
    "clientes.view",
    "clientes.create",
    "clientes.edit",
    "clientes.delete",
    "contratos.view",
    "contratos.create",
    "contratos.edit",
    "contratos.delete",
    "contratos.generate",
    "servicos.view",
    "servicos.create",
    "servicos.edit",
    "servicos.delete",
    "servicos.generate_os",
    "estoque.view",
    "estoque.create",
    "estoque.edit",
    "estoque.delete",
    "equipe.view",
    "equipe.create",
    "equipe.edit",
    "equipe.delete",
    "veiculos.view",
    "veiculos.create",
    "veiculos.edit",
    "veiculos.delete",
    "financeiro.view",
  ],
  financeiro: [
    "dashboard.view",
    "clientes.view",
    "contratos.view",
    "servicos.view",
    "financeiro.view",
    "financeiro.create",
    "financeiro.edit",
    "financeiro.delete",
  ],
  tecnico: [
    "dashboard.view",
    "servicos.view",
    "servicos.edit",
    "estoque.view",
  ],
}

const ROUTE_PERMISSIONS: Array<{ prefix: string; permission: AppPermissionKey }> = [
  { prefix: "/dashboard/logs", permission: "logs.view" },
  { prefix: "/dashboard/financeiro", permission: "financeiro.view" },
  { prefix: "/dashboard/veiculos", permission: "veiculos.view" },
  { prefix: "/dashboard/equipe", permission: "equipe.view" },
  { prefix: "/dashboard/produtos", permission: "estoque.view" },
  { prefix: "/dashboard/servicos", permission: "servicos.view" },
  { prefix: "/dashboard/historico", permission: "servicos.view" },
  { prefix: "/dashboard/clientes/contratos", permission: "contratos.view" },
  { prefix: "/dashboard/clientes", permission: "clientes.view" },
  { prefix: "/dashboard", permission: "dashboard.view" },
]

export function isPermissionKey(value: string): value is AppPermissionKey {
  return (ALL_PERMISSIONS as readonly string[]).includes(value)
}

export function normalizePermissions(permissions: readonly string[] | null | undefined): AppPermissionKey[] {
  if (!permissions?.length) return []
  return Array.from(new Set(permissions.filter(isPermissionKey)))
}

export function getDefaultPermissionsForRole(role: AppRole): AppPermissionKey[] {
  return [...DEFAULT_ROLE_PERMISSIONS[role]]
}

export function hasPermission(
  permissions: readonly string[] | null | undefined,
  permission: AppPermissionKey,
): boolean {
  return normalizePermissions(permissions).includes(permission)
}

export function getRequiredPermissionForPath(pathname: string): AppPermissionKey | null {
  const match = ROUTE_PERMISSIONS.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))
  return match?.permission ?? null
}
