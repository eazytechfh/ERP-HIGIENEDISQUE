"use client"

import { type AppPermissionKey } from "@/lib/access-control"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { assertPermissionSupabase, getCurrentUserAccessProfileSupabase } from "@/lib/supabase/profiles-repo"

export type AuditLogItem = {
  id: string
  actorUserId: string
  actorNome: string
  actorEmail: string
  action: string
  entity: string
  entityId: string
  entityLabel: string
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

type AuditLogPayload = {
  action: string
  entity: string
  entityId?: string
  entityLabel?: string
  description: string
  metadata?: Record<string, unknown>
}

function mapAuditLog(row: any): AuditLogItem {
  return {
    id: String(row.id),
    actorUserId: String(row.actor_user_id),
    actorNome: row.actor_nome || "",
    actorEmail: row.actor_email || "",
    action: row.action || "",
    entity: row.entity || "",
    entityId: row.entity_id || "",
    entityLabel: row.entity_label || "",
    description: row.description || "",
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : null,
    createdAt: row.created_at || "",
  }
}

export async function safeAuditLogSupabase(input: AuditLogPayload): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) return

    const profile = await getCurrentUserAccessProfileSupabase()
    const payload = {
      actor_user_id: authData.user.id,
      actor_nome: profile?.nome || authData.user.user_metadata?.nome || authData.user.email || "Usuario",
      actor_email: authData.user.email || "",
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId || null,
      entity_label: input.entityLabel || null,
      description: input.description,
      metadata: input.metadata || null,
    }

    const { error } = await supabase.from("audit_logs").insert(payload)
    if (error) {
      console.error("Falha ao registrar audit log:", error.message)
    }
  } catch (error) {
    console.error("Falha ao registrar audit log:", error)
  }
}

export async function listAuditLogsSupabase(limit = 200): Promise<AuditLogItem[]> {
  await assertPermissionSupabase("logs.view", "Voce nao possui permissao para visualizar os logs.")

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map(mapAuditLog)
}
