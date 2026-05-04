import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import * as api from '../api/client'
import type { UserShort } from '../api/types'

interface AuthCtx {
  user: UserShort | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (payload: {
    username: string
    email: string
    password: string
    first_name?: string
    last_name?: string
  }) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserShort | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      await api.fetchCsrf()
      const res = await api.whoami()
      setUser(res.isAuthenticated && res.user ? res.user : null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const doLogin = useCallback(
    async (username: string, password: string) => {
      const res = await api.login(username, password)
      if (res.isAuthenticated && res.user) {
        setUser(res.user)
      } else {
        throw new Error(res.error || 'Помилка входу')
      }
    },
    []
  )

  const doRegister = useCallback(
    async (payload: {
      username: string
      email: string
      password: string
      first_name?: string
      last_name?: string
    }) => {
      const res = await api.register(payload)
      if (res.isAuthenticated && res.user) {
        setUser(res.user)
      } else {
        throw new Error(res.error || 'Помилка реєстрації')
      }
    },
    []
  )

  const doLogout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, login: doLogin, register: doRegister, logout: doLogout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth має використовуватись усередині <AuthProvider>')
  return ctx
}
