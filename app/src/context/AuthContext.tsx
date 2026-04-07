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

type TokenValidationResult =
  | { status: 'valid'; username: string | null }
  | { status: 'invalid' }
  | { status: 'error' }

type RefreshTokenResult =
  | { status: 'success'; data: AuthResponse }
  | { status: 'unauthorized' }
  | { status: 'error' }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)

  const validateToken = async (token: string): Promise<TokenValidationResult> => {
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
        return { status: 'valid', username: data.username ?? null }
      }
      if (response.status === 401 || response.status === 403) {
        return { status: 'invalid' }
      }
      return { status: 'error' }
    } catch (err) {
      console.error(err)
      return { status: 'error' }
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUsername = localStorage.getItem('username')
        const storedToken = localStorage.getItem('token')
        const storedRefresh = localStorage.getItem('refreshToken')

        const setAuthenticatedFromStorage = () => {
          if (!storedToken) {
            return
          }
          setToken(storedToken)
          setIsAuthenticated(true)
          if (storedUsername) {
            setUsername(storedUsername)
          }
        }

        if (storedToken) {
          const validationResult = await validateToken(storedToken)
          if (validationResult.status === 'valid') {
            setToken(storedToken)
            setIsAuthenticated(true)
            setUsername(validationResult.username ?? storedUsername)
          } else {
            if (!storedRefresh) {
              if (validationResult.status === 'invalid') {
                localStorage.removeItem('token')
                localStorage.removeItem('username')
              } else {
                setAuthenticatedFromStorage()
              }
            } else {
              const refreshResult = await refreshAccessToken(storedRefresh)
              if (refreshResult.status === 'success') {
                localStorage.setItem('token', refreshResult.data.token)
                localStorage.setItem('refreshToken', refreshResult.data.refreshToken)
                localStorage.setItem('username', refreshResult.data.username)
                setToken(refreshResult.data.token)
                setUsername(refreshResult.data.username)
                setIsAuthenticated(true)
              } else if (refreshResult.status === 'unauthorized') {
                localStorage.removeItem('token')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('username')
              } else {
                setAuthenticatedFromStorage()
              }
            }
          }
        } else if (storedRefresh) {
          const refreshResult = await refreshAccessToken(storedRefresh)
          if (refreshResult.status === 'success') {
            localStorage.setItem('token', refreshResult.data.token)
            localStorage.setItem('refreshToken', refreshResult.data.refreshToken)
            localStorage.setItem('username', refreshResult.data.username)
            setToken(refreshResult.data.token)
            setUsername(refreshResult.data.username)
            setIsAuthenticated(true)
          } else if (refreshResult.status === 'unauthorized') {
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('username')
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
          return
        }
        const refreshResponse = await refreshAccessToken(storedRefresh)
        if (refreshResponse.status === 'success') {
          setToken(refreshResponse.data.token)
          localStorage.setItem('token', refreshResponse.data.token)
          localStorage.setItem('refreshToken', refreshResponse.data.refreshToken)
          localStorage.setItem('username', refreshResponse.data.username)
        } else if (refreshResponse.status === 'unauthorized') {
          logout()
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
      const storedRefresh = localStorage.getItem('refreshToken')
      if (!storedRefresh) {
        logout()
        throw new Error('Not authenticated.')
      }

      const refreshResponse = await refreshAccessToken(storedRefresh)
      if (refreshResponse.status === 'success') {
        accessToken = refreshResponse.data.token
        setToken(refreshResponse.data.token)
        localStorage.setItem('token', refreshResponse.data.token)
        localStorage.setItem('refreshToken', refreshResponse.data.refreshToken)
        localStorage.setItem('username', refreshResponse.data.username)
      } else if (refreshResponse.status === 'unauthorized') {
        logout()
        throw new Error('Session expired. Please login again.')
      } else {
        throw new Error('Temporary authentication issue. Please try again.')
      }
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

        if (refreshResponse.status === 'success') {
          accessToken = refreshResponse.data.token
          setToken(refreshResponse.data.token)
          localStorage.setItem('token', refreshResponse.data.token)
          localStorage.setItem('refreshToken', refreshResponse.data.refreshToken)
          localStorage.setItem('username', refreshResponse.data.username)
          response = await makeRequest(accessToken)
          if (response.status === 401) {
            logout()
            throw new Error('Session expired. Please login again.')
          }
        } else if (refreshResponse.status === 'unauthorized') {
          logout()
          throw new Error('Session expired. Please login again.')
        } else {
          throw new Error('Temporary authentication issue. Please try again.')
        }
      } catch {
        throw new Error('Temporary authentication issue. Please try again.')
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
export async function refreshAccessToken(refreshTokenValue: string): Promise<RefreshTokenResult> {
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
      return { status: 'success', data: (await response.json()) as AuthResponse }
    }
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return { status: 'unauthorized' }
    }
    return { status: 'error' }
  } catch {
    return { status: 'error' }
  }
}
