"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export type Role = "professor" | "student"

interface UserInfo {
  id: string
  name: string
  email: string
  role: Role
}

interface RoleContextValue {
  user: UserInfo | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: UserInfo | null) => void
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUser()
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchUser()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function refreshUser() {
    await fetchUser()
  }

  async function signOutUser() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (e) {
      console.error("signOut error:", e)
    }
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0]
      if (name.startsWith("sb-") || name.startsWith("supabase-")) {
        document.cookie = `${name}=; path=/; max-age=0`
        document.cookie = `${name}=; path=/; max-age=0; domain=${window.location.hostname}`
      }
    })
    sessionStorage.clear()
    localStorage.clear()
    setUser(null)
  }

  return (
    <RoleContext.Provider value={{ user, loading, signOut: signOutUser, refreshUser, setUser }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return ctx
}
