"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AccessProvider, useAccess } from "@/components/access-provider"
import { hasPermission } from "@/lib/access-control"
import { isApiMode } from "@/lib/runtime-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function DashboardAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { loading, profile, requiredPermissionForPath } = useAccess()

  useEffect(() => {
    const requiredPermission = requiredPermissionForPath(pathname)
    if (!loading && requiredPermission && !hasPermission(profile?.permissions, requiredPermission)) {
      router.replace("/dashboard")
    }
  }, [loading, pathname, profile?.permissions, requiredPermissionForPath, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Validando sessao e permissoes...
      </div>
    )
  }

  const requiredPermission = requiredPermissionForPath(pathname)
  if (requiredPermission && !hasPermission(profile?.permissions, requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Voce nao possui permissao para acessar esta area.
      </div>
    )
  }

  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(!isApiMode())

  useEffect(() => {
    if (!isApiMode()) {
      setReady(true)
      return
    }

    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        router.replace("/")
        return
      }
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/")
      }
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Validando sessao...
      </div>
    )
  }

  return (
    <AccessProvider>
      <DashboardAccessGuard>{children}</DashboardAccessGuard>
    </AccessProvider>
  )
}
