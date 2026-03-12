"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isApiMode } from "@/lib/runtime-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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

  return <>{children}</>
}
