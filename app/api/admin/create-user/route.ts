import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getDefaultPermissionsForRole, isPermissionKey } from "@/lib/access-control"

type CreateUserBody = {
  email?: string
  password?: string
  nome?: string
  role?: "admin" | "operacional" | "financeiro" | "tecnico"
  permissions?: string[]
}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Env ausente: ${name}`)
  return value
}

export async function POST(req: Request) {
  try {
    const url = getEnv("NEXT_PUBLIC_SUPABASE_URL")
    const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")

    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : ""
    if (!token) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const supabaseAnon = createClient(url, anonKey)
    const { data: authData, error: authError } = await supabaseAnon.auth.getUser(token)

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 })
    }

    const supabaseAdmin = createClient(url, serviceRoleKey)

    const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", authData.user.id)
      .single()

    if (requesterProfileError || requesterProfile?.role !== "admin") {
      return NextResponse.json({ error: "Apenas admin pode criar usuarios" }, { status: 403 })
    }

    const body = (await req.json()) as CreateUserBody
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")
    const nome = String(body.nome || "").trim() || email.split("@")[0] || "Usuario"
    const role = body.role && ["admin", "operacional", "financeiro", "tecnico"].includes(body.role)
      ? body.role
      : "operacional"
    const permissions = Array.isArray(body.permissions)
      ? Array.from(new Set(body.permissions.filter(isPermissionKey)))
      : getDefaultPermissionsForRole(role)

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha sao obrigatorios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter ao menos 6 caracteres" }, { status: 400 })
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    })

    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message || "Falha ao criar usuario" }, { status: 400 })
    }

    const { error: upsertProfileError } = await supabaseAdmin.from("profiles").upsert({
      user_id: created.user.id,
      nome,
      role,
      ativo: true,
      permissions,
    })

    if (upsertProfileError) {
      return NextResponse.json({ error: upsertProfileError.message }, { status: 400 })
    }

    return NextResponse.json({
      user: {
        id: created.user.id,
        email: created.user.email,
        nome,
        role,
        permissions,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
