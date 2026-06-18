import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const redirectBase = `${appUrl}/dashboard/servicos`

  if (error || !code || !state) {
    return NextResponse.redirect(`${redirectBase}?tab=agenda&gcal=erro`)
  }

  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString())
    userId = decoded.userId
    if (!userId) throw new Error("userId ausente no state")
  } catch {
    return NextResponse.redirect(`${redirectBase}?tab=agenda&gcal=erro`)
  }

  // Troca o code pelos tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/google-calendar/callback`,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${redirectBase}?tab=agenda&gcal=erro`)
  }

  const tokenData = await tokenRes.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  await supabase
    .from("profiles")
    .update({
      google_access_token: tokenData.access_token,
      google_refresh_token: tokenData.refresh_token,
      google_token_expiry: Date.now() + tokenData.expires_in * 1000,
    })
    .eq("user_id", userId)

  return NextResponse.redirect(`${redirectBase}?tab=agenda&gcal=conectado`)
}
