import { createContext, useContext, useState, useCallback } from 'react'
import { adminLogin } from '../services/adminApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('admin_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError('')
    try {
      const data = await adminLogin(username, password)
      setUser(data)
      sessionStorage.setItem('admin_user', JSON.stringify(data))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('admin_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
