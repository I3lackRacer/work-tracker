import { createContext, useContext, useState, useEffect } from 'react'
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
      return false
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
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
          localStorage.removeItem('token')
          localStorage.removeItem('username')
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  // Periodic token refresh - refresh every 7 days to keep users logged in
  useEffect(() => {
    if (!token) return

    const refreshInterval = setInterval(async () => {
      try {
        const refreshTokenString = localStorage.getItem('refreshToken')
        if (!refreshTokenString) {
          logout()
          throw new Error('No refresh token found. Please login again.')
        }
        const refreshResponse = await refreshToken(refreshTokenString)
        if (refreshResponse) {
          console.log('Token refreshed automatically')
          setToken(refreshResponse.token)
          localStorage.setItem('token', refreshResponse.token)
          localStorage.setItem('refreshToken', refreshResponse.refreshToken)
        }
      } catch (error) {
        console.log('Auto-refresh failed, user will need to login on next action')
      }
    }, 7 * 24 * 60 * 60 * 1000) // 7 days

    return () => clearInterval(refreshInterval)
  }, [token])

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

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setToken(null)
    setUsername(null)
    setIsAuthenticated(false)
    setError(null)
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
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }

      return fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      })
    }

    // First attempt with current token
    let response = await makeRequest(token!)

    // If token is expired (401), try to refresh it
    if (response.status === 401 && token) {
      try {
        const refreshTokenString = localStorage.getItem('refreshToken')
        if (!refreshTokenString) {
          logout()
          throw new Error('No refresh token found. Please login again.')
        }

        const refreshResponse = await refreshToken(refreshTokenString)

        if (refreshResponse && refreshResponse.token) {
          // Retry the original request with the new token
          response = await makeRequest(refreshResponse.token)
          if (response.ok) {
            setToken(refreshResponse.token)
            localStorage.setItem('token', refreshResponse.token)
            localStorage.setItem('refreshToken', refreshResponse.refreshToken)
          } else {
            logout()
            throw new Error('Session expired. Please login again.')
          }
        } else {
          // Refresh failed, user needs to login again
          logout()
          throw new Error('Session expired. Please login again.')
        }
      } catch (error) {
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

export const refreshToken = async (refreshToken: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken: `Bearer ${refreshToken}` }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
    if (response.ok) {
      const data = await response.json()
      return data
    }
    return null
  } catch (err) {
    return null
  }
}