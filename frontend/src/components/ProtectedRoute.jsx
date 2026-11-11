import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ requireRole }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requireRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  if (requireRole === 'member' && user?.role !== 'member') {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
