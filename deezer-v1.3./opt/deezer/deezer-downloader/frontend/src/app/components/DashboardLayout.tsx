import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { useConfetti } from '../hooks/useConfetti'
import { SearchCheck, Youtube, Clapperboard, BadgeDollarSign, ListMusic, Disc3, UserCircle2, LogOut, ShieldCheck, Menu, X, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type User as UserType } from '../api'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<UserType | null>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useConfetti()

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    api.me().then(u => {
      setUser(u); localStorage.setItem('user', JSON.stringify(u))
    }).catch(() => {
      localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login')
    })
  }, [])

  const handleLogout = async () => {
    try { await api.logout() } catch {}
    localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login')
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??'

  const navItems = [
    { to: '/',               icon: SearchCheck,      label: 'Recherche',      end: true  },
    { to: '/video',          icon: Youtube,          label: 'Vidéo',          end: false },
    { to: '/the-good-place', icon: Clapperboard,     label: 'The Good Place', end: false },
    { to: '/uploads',        icon: BadgeDollarSign,  label: 'Upload & Earn',  end: false },
    { to: '/queue',          icon: ListMusic,        label: "File d'attente", end: false },
    { to: '/profile',        icon: UserCircle2,      label: 'Profil',         end: false },
    ...(user?.is_admin ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin', end: false }] : []),
  ]

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Disc3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Merci</h1>
            <p className="text-[10px] text-gray-500">Media Downloader</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/20 border border-blue-600/40'
                  : 'hover:bg-white/5 hover:border hover:border-gray-700/50 border border-transparent'
              }`
            }>
            {({ isActive }) => (
              <>
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className={`text-sm ${isActive ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-2.5 border-t border-gray-800/50">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.username ?? '…'}</p>
            <p className="text-[10px] text-gray-500">Connecté</p>
          </div>
          <button onClick={handleLogout} className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] text-white overflow-hidden">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-56 bg-[#0a0a12]/60 backdrop-blur-xl border-r border-gray-800/50 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#0a0a12] border-r border-gray-800/50 flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-800/50 bg-[#0a0a12]/80 backdrop-blur-xl flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/50 border border-gray-700/40 text-gray-400 hover:text-white transition-colors">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Disc3 className="w-3 h-3 text-white" />
            </div>
            <span className="text-white text-sm font-semibold">Merci</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
            {initials}
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
