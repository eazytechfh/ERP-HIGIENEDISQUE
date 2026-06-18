import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  getValidAccessToken,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "@/lib/google-calendar"

// Converte "DD/MM/YYYY" + "HH:MM - HH:MM" para DateTimes ISO
function buildDateTimes(data: string, horario: string) {
  const parts = data.includes("-") ? data.split("-") : data.split("/").reverse()
  // data pode vir como YYYY-MM-DD ou DD/MM/YYYY
  let iso: string
  if (data.includes("-") && data.indexOf("-") === 4) {
    iso = data // já é YYYY-MM-DD
  } else {
    const [d, m, y] = data.split("/")
    iso = `${y}-${m}-${d}`
  }

  const [startTime, endTime] = (horario || "08:00 - 09:00").split(" - ").map((t) => t.trim())
  return {
    startDateTime: `${iso}T${startTime}:00`,
    endDateTime: `${iso}T${(endTime || startTime)}:00`,
  }
}

export async function POST(req: NextRequest) {
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
  const body = await req.json() as {
    action: "create" | "update" | "delete"
    servicoId: string
    googleEventId?: string
    summary?: string
    description?: string
    data?: string
    horario?: string
  }

  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return NextResponse.json({ connected: false })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    if (body.action === "create") {
      const { startDateTime, endDateTime } = buildDateTimes(body.data!, body.horario!)
      const eventId = await createGoogleCalendarEvent(accessToken, {
        summary: body.summary!,
        description: body.description,
        startDateTime,
        endDateTime,
      })
      // Salva o google_event_id no serviço
      await supabaseAdmin
        .from("servicos")
        .update({ google_event_id: eventId })
        .eq("id", body.servicoId)
      return NextResponse.json({ ok: true, googleEventId: eventId })
    }

    if (body.action === "update" && body.googleEventId) {
      const { startDateTime, endDateTime } = buildDateTimes(body.data!, body.horario!)
      await updateGoogleCalendarEvent(accessToken, body.googleEventId, {
        summary: body.summary!,
        description: body.description,
        startDateTime,
        endDateTime,
      })
      return NextResponse.json({ ok: true })
    }

    if (body.action === "delete" && body.googleEventId) {
      await deleteGoogleCalendarEvent(accessToken, body.googleEventId)
      await supabaseAdmin
        .from("servicos")
        .update({ google_event_id: null })
        .eq("id", body.servicoId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: "Acao invalida" })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no sync"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
