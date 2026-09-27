import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null)
  const [isLoading, setIsLoading] = useState(true)

  const clearAuth = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })

        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          localStorage.setItem('auth_user', JSON.stringify(data.user))
        } else {
          // Token invalid or expired
          clearAuth()
        }
      } catch (err) {
        console.error('Session verification network error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    verifySession()
  }, [])

  const login = async (email, password, rememberMe = false) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Invalid email or password.')
    }

    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('auth_token', data.access_token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    return data.user
  }

  const register = async (firstName, lastName, email, password, confirmPassword) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirmPassword,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Account registration failed.')
    }

    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('auth_token', data.access_token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    return data.user
  }

  const loginWithGoogle = async (credentialOrData) => {
    let payload = {}
    if (typeof credentialOrData === 'string') {
      payload = { credential: credentialOrData }
    } else {
      payload = credentialOrData
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Google sign-in failed.')
    }

    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('auth_token', data.access_token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    return data.user
  }

  const logout = () => {
    clearAuth()
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
