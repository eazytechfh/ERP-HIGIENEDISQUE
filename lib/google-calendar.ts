import { createClient } from "@supabase/supabase-js"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3"

export type GoogleTokens = {
  access_token: string
  refresh_token: string
  expiry: number
}

export type GoogleCalendarEvent = {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  colorId?: string
  htmlLink?: string
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase env vars ausentes")
  return createClient(url, key)
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expiry: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) throw new Error("Falha ao renovar token do Google")
  const data = await res.json()
  return {
    access_token: data.access_token,
    expiry: Date.now() + data.expires_in * 1000,
  }
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token, google_token_expiry")
    .eq("user_id", userId)
    .maybeSingle()

  if (!data?.google_refresh_token) return null

  if (data.google_token_expiry && Date.now() < Number(data.google_token_expiry) - 60_000) {
    return data.google_access_token
  }

  // Token expirado — renovar
  const refreshed = await refreshAccessToken(data.google_refresh_token)
  await supabase
    .from("profiles")
    .update({
      google_access_token: refreshed.access_token,
      google_token_expiry: refreshed.expiry,
    })
    .eq("user_id", userId)

  return refreshed.access_token
}

export async function listGoogleCalendarEvents(accessToken: string, timeMin: string, timeMax: string): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  })
  const res = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error("Falha ao buscar eventos do Google Calendar")
  const data = await res.json()
  return data.items ?? []
}

export async function createGoogleCalendarEvent(accessToken: string, event: {
  summary: string
  description?: string
  startDateTime: string
  endDateTime: string
}): Promise<string> {
  const res = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startDateTime, timeZone: "America/Sao_Paulo" },
      end: { dateTime: event.endDateTime, timeZone: "America/Sao_Paulo" },
    }),
  })
  if (!res.ok) throw new Error("Falha ao criar evento no Google Calendar")
  const data = await res.json()
  return data.id
}

export async function updateGoogleCalendarEvent(accessToken: string, eventId: string, event: {
  summary: string
  description?: string
  startDateTime: string
  endDateTime: string
}): Promise<void> {
  const res = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars/primary/events/${eventId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startDateTime, timeZone: "America/Sao_Paulo" },
      end: { dateTime: event.endDateTime, timeZone: "America/Sao_Paulo" },
    }),
  })
  if (!res.ok) throw new Error("Falha ao atualizar evento no Google Calendar")
}

export async function deleteGoogleCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok && res.status !== 410) throw new Error("Falha ao deletar evento no Google Calendar")
}
