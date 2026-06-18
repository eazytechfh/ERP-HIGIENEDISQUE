import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : ""

  // Valida o userId passado como query param contra a sessão Supabase
  const userId = req.nextUrl.searchParams.get("userId") || ""
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 })
  }

  if (token) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data, error } = await supabase.auth.getUser(token)
    if (error || data.user?.id !== userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }
  }

  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64url")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${appUrl}/api/google-calendar/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
