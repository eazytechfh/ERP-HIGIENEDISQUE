"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getRequiredPermissionForPath, hasPermission, type AppPermissionKey } from "@/lib/access-control"
import { getCurrentUserAccessProfileSupabase, setCachedCurrentProfile, type UserAccessProfile } from "@/lib/supabase/profiles-repo"

type AccessContextValue = {
  loading: boolean
  profile: UserAccessProfile | null
  refreshProfile: () => Promise<void>
  can: (permission: AppPermissionKey) => boolean
  requiredPermissionForPath: (pathname: string) => AppPermissionKey | null
}

const AccessContext = createContext<AccessContextValue | null>(null)

export function AccessProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserAccessProfile | null>(null)

  const refreshProfile = async () => {
    setLoading(true)
    try {
      const nextProfile = await getCurrentUserAccessProfileSupabase(true)
      setProfile(nextProfile)
      setCachedCurrentProfile(nextProfile)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshProfile()
  }, [])

  const value = useMemo<AccessContextValue>(
    () => ({
      loading,
      profile,
      refreshProfile,
      can: (permission) => hasPermission(profile?.permissions, permission),
      requiredPermissionForPath: getRequiredPermissionForPath,
    }),
    [loading, profile],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const context = useContext(AccessContext)
  if (!context) {
    throw new Error("useAccess deve ser usado dentro de AccessProvider.")
  }
  return context
}
