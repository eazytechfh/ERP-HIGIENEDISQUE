export type LocalTestUserRole = "admin" | "operacional" | "financeiro" | "tecnico"

export type LocalTestUser = {
  email: string
  password: string
  nome: string
  role: LocalTestUserRole
  createdAt: string
}

const STORAGE_KEY = "erp_higiene_local_test_users"

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function listLocalTestUsers(): LocalTestUser[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalTestUser(user: Omit<LocalTestUser, "createdAt">): LocalTestUser {
  const normalized: LocalTestUser = {
    ...user,
    email: user.email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  }

  if (!canUseStorage()) return normalized

  const users = listLocalTestUsers().filter((item) => item.email !== normalized.email)
  const next = [...users, normalized]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return normalized
}

export function findLocalTestUser(email: string, password: string): LocalTestUser | null {
  const normalizedEmail = email.trim().toLowerCase()
  return listLocalTestUsers().find((user) => user.email === normalizedEmail && user.password === password) || null
}
