import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getDefaultPermissionsForRole, type AppRole } from "@/lib/access-control"

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
    const userId = authData.user.id
    const nome =
      String(authData.user.user_metadata?.nome || "").trim() ||
      String(authData.user.email || "").split("@")[0] ||
      "Usuario"

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, nome, role, ativo, permissions")
      .eq("user_id", userId)
      .maybeSingle()

    if (existingProfileError) {
      return NextResponse.json({ error: existingProfileError.message }, { status: 400 })
    }

    if (existingProfile) {
      return NextResponse.json({ profile: existingProfile })
    }

    const role: AppRole = "operacional"
    const permissions = getDefaultPermissionsForRole(role)

    const { data: createdProfile, error: createdProfileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        user_id: userId,
        nome,
        role,
        ativo: true,
        permissions,
      })
      .select("user_id, nome, role, ativo, permissions")
      .single()

    if (createdProfileError || !createdProfile) {
      return NextResponse.json(
        { error: createdProfileError?.message || "Falha ao criar profile do usuario." },
        { status: 400 },
      )
    }

    return NextResponse.json({ profile: createdProfile })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
