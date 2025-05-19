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
}

interface AuthResponse {
  token: string
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
      localStorage.setItem('username', data.username)
      setToken(bearerToken)
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
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout, error, token, isLoading, username }}>
      {children}
    </AuthContext.Provider>
  )
}

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