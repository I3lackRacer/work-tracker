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
}

interface AuthResponse {
  token: string
  // Add any other fields your API returns
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      return response.ok
    } catch (err) {
      return false
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        const isValid = await validateToken(storedToken)
        if (isValid) {
          setToken(storedToken)
          setIsAuthenticated(true)
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('token')
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

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
      const bearerToken = data.token
      localStorage.setItem('token', bearerToken)
      setToken(bearerToken)
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
    setToken(null)
    setIsAuthenticated(false)
    setError(null)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout, error, token, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for making authenticated API calls
export const useAuthenticatedFetch = () => {
  const { token } = useAuth()

  return async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    return fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    })
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 