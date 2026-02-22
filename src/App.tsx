import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardPage from './pages/DashboardPage'

function AppRoutes() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      window.location.href = '/'
    }
  }, [user])

  if (!user) return null

  return (
    <Routes>
      <Route path="*" element={<DashboardPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
