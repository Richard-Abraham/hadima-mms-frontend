import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import client from '@/api/client'
import type { User } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: User['role'] | readonly User['role'][]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  useEffect(() => {
    if (token) {
      client.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(({ data }) => setAuth(token, data))
        .catch(() => clearAuth())
    }
  }, [token, setAuth, clearAuth])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (token && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#218078]" />
      </div>
    )
  }

  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(user.role)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-300">403</h1>
            <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
            <a href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">Go to Dashboard</a>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
