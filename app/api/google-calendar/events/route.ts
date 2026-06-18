import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getValidAccessToken, listGoogleCalendarEvents } from "@/lib/google-calendar"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : ""
  if (!token) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: authData, error: authError } = await supabaseAnon.auth.getUser(token)
  if (authError || !authData.user) return NextResponse.json({ error: "Token invalido" }, { status: 401 })

  const userId = authData.user.id

  // Verifica se usuário tem Google Calendar conectado
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("google_refresh_token")
    .eq("user_id", userId)
    .maybeSingle()

  if (!profile?.google_refresh_token) {
    return NextResponse.json({ connected: false, events: [] })
  }

  const { searchParams } = req.nextUrl
  const timeMin = searchParams.get("timeMin") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const timeMax = searchParams.get("timeMax") || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString()

  try {
    const accessToken = await getValidAccessToken(userId)
    if (!accessToken) return NextResponse.json({ connected: false, events: [] })

    const events = await listGoogleCalendarEvents(accessToken, timeMin, timeMax)
    return NextResponse.json({ connected: true, events })
  } catch {
    return NextResponse.json({ connected: true, events: [], error: "Falha ao buscar eventos" })
  }
}
