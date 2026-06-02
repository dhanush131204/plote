import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useGetMeQuery, useLoginMutation, useSignupMutation } from '../api/apiSlice'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  const { data: meData, error, isLoading, refetch } = useGetMeQuery(undefined, {
    skip: !token,
  })

  const [loginTrigger] = useLoginMutation()
  const [signupTrigger] = useSignupMutation()

  useEffect(() => {
    if (token && meData?.user) {
      setUser({ ...meData.user, token })
    } else if (!token || error) {
      setUser(null)
    }
  }, [meData, error, token])

  const refreshUser = useCallback(async () => {
    if (token) {
      try {
        const res = await refetch().unwrap()
        setUser({ ...res.user, token })
      } catch {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      }
    }
  }, [token, refetch])

  const login = async (email, password) => {
    const res = await loginTrigger({ email, password }).unwrap()
    localStorage.setItem('token', res.token)
    setToken(res.token)
    setUser({ ...res.user, token: res.token })
    return res.user
  }

  const signup = async (email, password) => {
    const res = await signupTrigger({ email, password }).unwrap()
    localStorage.setItem('token', res.token)
    setToken(res.token)
    setUser({ ...res.user, token: res.token })
    return res.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const isAdmin = user?.role === 'admin'
  const loading = token ? isLoading && !user : false

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
