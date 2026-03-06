import { createBrowserRouter, Navigate } from 'react-router'
import { DashboardLayout } from './components/DashboardLayout'
import { Landing }       from './pages/Landing'
import { Login }         from './pages/Login'
import { Signup }        from './pages/Signup'
import { Search }        from './pages/Search'
import { Video }         from './pages/Video'
import { TheGoodPlace }  from './pages/TheGoodPlace'
import { Uploads }       from './pages/Upload'
import { Queue }         from './pages/Queue'
import { Profile }       from './pages/Profile'
import { Admin }         from './pages/Admin'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/home" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user?.is_admin) return <Navigate to="/" replace />
  } catch { return <Navigate to="/" replace /> }
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/home',   element: <Landing /> },
  { path: '/login',  element: <Login /> },
  { path: '/signup', element: <Signup /> },
  {
    path: '/',
    element: <RequireAuth><DashboardLayout /></RequireAuth>,
    children: [
      { index: true,              element: <Search /> },
      { path: 'video',            element: <Video /> },
      { path: 'the-good-place',   element: <TheGoodPlace /> },
      { path: 'films',            element: <Navigate to="/the-good-place" replace /> },
      { path: 'direct',           element: <Navigate to="/the-good-place" replace /> },
      { path: 'uploads',          element: <Uploads /> },
      { path: 'queue',            element: <Queue /> },
      { path: 'profile',          element: <Profile /> },
      { path: 'admin',            element: <RequireAdmin><Admin /></RequireAdmin> },
    ],
  },
  // Toute URL inconnue → home
  { path: '*', element: <Navigate to="/home" replace /> },
])
