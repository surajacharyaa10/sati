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

function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sati:auth-change"))
  }
}

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
      // Notify cart/wishlist stores that auth state changed
      emitAuthChange()
    }
  }

  // Also emit on successful login
  async function handleSignIn() {
    await refresh()
    emitAuthChange()
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, hasCheckedSession, signOut, refresh, handleSignIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}