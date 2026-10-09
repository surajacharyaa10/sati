"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authApi, type AuthUser } from "@/lib/api"

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  hasCheckedSession: boolean
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [hasCheckedSession, setHasCheckedSession] = useState(false)

  async function refresh() {
    try {
      const { user: currentUser } = await authApi.currentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    let isMounted = true
    refresh().finally(() => {
      if (isMounted) setHasCheckedSession(true)
    })
    return () => {
      isMounted = false
    }
  }, [])

  async function signOut() {
    try {
      await authApi.signOut()
    } finally {
      setUser(null)
      setHasCheckedSession(true)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, hasCheckedSession, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}