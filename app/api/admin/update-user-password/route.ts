import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isPermissionKey } from "@/lib/access-control"

type UpdateUserPasswordBody = {
  userId?: string
  password?: string
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
      .select("role, ativo, permissions")
      .eq("user_id", authData.user.id)
      .single()

    const requesterPermissions = Array.isArray(requesterProfile?.permissions)
      ? requesterProfile.permissions.filter(isPermissionKey)
      : []

    if (
      requesterProfileError ||
      requesterProfile?.role !== "admin" ||
      requesterProfile?.ativo === false ||
      !requesterPermissions.includes("equipe.manage_access")
    ) {
      return NextResponse.json({ error: "Apenas admin pode alterar senhas de usuarios" }, { status: 403 })
    }

    const body = (await req.json()) as UpdateUserPasswordBody
    const userId = String(body.userId || "").trim()
    const password = String(body.password || "")

    if (!userId || !password) {
      return NextResponse.json({ error: "Usuario e senha sao obrigatorios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter ao menos 6 caracteres" }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message || "Falha ao alterar senha" }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
