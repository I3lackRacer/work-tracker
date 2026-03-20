import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

const API_URL = (import.meta.env.VITE_API_URL || '') + "/api/v1"

interface AuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string) => Promise<boolean>
  logout: () => void
  error: string | null
  token: string | null
  isLoading: boolean
  username: string | null
  setToken: (token: string | null) => void
}

interface AuthResponse {
  token: string
  refreshToken: string
  username: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUsername(data.username)
        return true
      }
      return false
    } catch (err) {
      console.error(err)
      return false
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token')
        const storedUsername = localStorage.getItem('username')
        if (storedToken) {
          const isValid = await validateToken(storedToken)
          if (isValid) {
            setToken(storedToken)
            setIsAuthenticated(true)
            if (storedUsername) {
              setUsername(storedUsername)
            }
          } else {
            const storedRefresh = localStorage.getItem('refreshToken')
            if (!storedRefresh) {
              localStorage.removeItem('token')
              localStorage.removeItem('username')
            } else {
              const refreshResult = await refreshAccessToken(storedRefresh)
              if (!refreshResult) {
                localStorage.removeItem('token')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('username')
              } else {
                localStorage.setItem('token', refreshResult.token)
                localStorage.setItem('refreshToken', refreshResult.refreshToken)
                localStorage.setItem('username', refreshResult.username)
                setToken(refreshResult.token)
                setUsername(refreshResult.username)
                setIsAuthenticated(true)
              }
            }
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    void initializeAuth()
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('username')
    setToken(null)
    setUsername(null)
    setIsAuthenticated(false)
    setError(null)
  }, [])

  // Proactive refresh: access tokens expire after ~24h (backend default). Refresh before that while the app stays open.
  useEffect(() => {
    if (!token) return

    const refreshInterval = setInterval(async () => {
      try {
        const storedRefresh = localStorage.getItem('refreshToken')
        if (!storedRefresh) {
          logout()
          return
        }
        const refreshResponse = await refreshAccessToken(storedRefresh)
        if (refreshResponse) {
          setToken(refreshResponse.token)
          localStorage.setItem('token', refreshResponse.token)
          localStorage.setItem('refreshToken', refreshResponse.refreshToken)
        }
      } catch {
        /* next API call will 401-refresh or surface error */
      }
    }, 23 * 60 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [token, logout])

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || errorData.error || 'Login failed')
        return false
      }

      const data: AuthResponse = await response.json()
      const accessToken = data.token
      const refreshToken = data.refreshToken
      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('username', data.username)
      setToken(accessToken)
      setUsername(data.username)
      setIsAuthenticated(true)
      setError(null)
      return true
    } catch (err) {
      setError('Failed to connect to the server')
      return false
    }
  }

  const register = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || errorData.error || 'Registration failed')
        return false
      }

      setError(null)
      return true
    } catch (err) {
      setError('Failed to connect to the server')
      return false
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout, error, token, isLoading, username, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthenticatedFetch = () => {
  const { token, logout, setToken } = useAuth()

  return async (url: string, options: RequestInit = {}) => {
    const makeRequest = async (authToken: string) => {
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }

      return fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      })
    }

    let accessToken = token ?? localStorage.getItem('token')
    if (!accessToken) {
      logout()
      throw new Error('Not authenticated.')
    }

    let response = await makeRequest(accessToken)

    if (response.status === 401) {
      try {
        const storedRefresh = localStorage.getItem('refreshToken')
        if (!storedRefresh) {
          logout()
          throw new Error('No refresh token found. Please login again.')
        }

        const refreshResponse = await refreshAccessToken(storedRefresh)

        if (refreshResponse?.token) {
          accessToken = refreshResponse.token
          setToken(refreshResponse.token)
          localStorage.setItem('token', refreshResponse.token)
          localStorage.setItem('refreshToken', refreshResponse.refreshToken)
          response = await makeRequest(accessToken)
          if (!response.ok) {
            logout()
            throw new Error('Session expired. Please login again.')
          }
        } else {
          logout()
          throw new Error('Session expired. Please login again.')
        }
      } catch {
        logout()
        throw new Error('Session expired. Please login again.')
      }
    }

    return response
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/** Exchange a refresh JWT for new access + refresh tokens (matches backend Bearer prefix). */
export async function refreshAccessToken(refreshTokenValue: string): Promise<AuthResponse | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ refreshToken: `Bearer ${refreshTokenValue}` }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    if (response.ok) {
      return (await response.json()) as AuthResponse
    }
    return null
  } catch {
    return null
  }
}