import { Navigate, useLocation } from 'react-router-dom'

function isTokenValid(token: string | null): boolean {
  if (!token) return false

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = localStorage.getItem('admin_token')

  if (!isTokenValid(token)) {
    localStorage.removeItem('admin_token')
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
