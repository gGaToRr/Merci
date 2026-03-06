import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { Disc3, LogIn, Eye, EyeOff, Zap, Music2, Film, Star, ArrowLeft } from 'lucide-react'
import { api } from '../api'
import { useConfetti } from '../hooks/useConfetti'

export function Login() {
  const navigate  = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [visible,  setVisible]  = useState(false)
  useConfetti()

  useEffect(() => {
    if (localStorage.getItem('token')) { navigate('/', { replace: true }); return }
    setTimeout(() => setVisible(true), 80)
  }, [])

  const handleLogin = async () => {
    if (!username || !password) { setError('Identifiant et mot de passe requis.'); return }
    setLoading(true); setError('')
    try {
      const { access_token, user } = await api.login(username, password)
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/')
    } catch (e: any) { setError(e.message || 'Identifiants incorrects.') }
    finally { setLoading(false) }
  }

  const inp = "w-full px-4 py-3 bg-[#0a0a14] border border-gray-700/60 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"

  return (
    <div className="min-h-screen bg-[#080812] flex overflow-hidden">
      {/* Panneau gauche — branding */}
      <div className={`hidden lg:flex flex-col justify-between w-1/2 p-12 relative transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
           style={{ background: 'linear-gradient(135deg, #0d1a3a 0%, #0a1628 40%, #0c1a2e 100%)' }}>
        {/* Fond décoratif */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-blue-600/8 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-teal-600/8 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
            <Disc3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">Merci<span className="text-blue-400">.</span></span>
        </div>

        {/* Centre — badge V2 + description */}
        <div className="relative">
          {/* Badge V2 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-teal-600/20 border border-blue-500/30 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Version 2.0</span>
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Bienvenue sur<br />
            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              la nouvelle version
            </span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-sm">
            Interface entièrement repensée, nouvelles fonctionnalités, meilleure expérience.
            Votre media-center privé evolue.
          </p>

          {/* Nouveautés */}
          <div className="space-y-3">
            {[
              { icon: Music2, text: 'Téléchargement Deezer & YouTube amélioré', color: 'text-blue-400 bg-blue-600/15' },
              { icon: Film,   text: 'The Good Place — médiathèque avec player intégré', color: 'text-teal-400 bg-teal-600/15' },
              { icon: Star,   text: 'Profils, bio, image ', color: 'text-yellow-400 bg-yellow-600/15' },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-gray-700 text-xs">Merci Media · Self-hosted · Privé · @kaets</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className={`flex-1 flex items-center justify-center p-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="w-full max-w-sm">
          {/* Back (mobile) */}
          <button onClick={() => navigate('/home')}
            className="lg:hidden flex items-center gap-1.5 text-gray-500 hover:text-white text-xs mb-8 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Accueil
          </button>

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Disc3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">Merci<span className="text-blue-400">.</span></span>
          </div>

          {/* Badge bienvenue mobile */}
          <div className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/15 border border-blue-600/30 rounded-full text-blue-400 text-[11px] font-semibold mb-5">
            <Zap className="w-3 h-3" /> Version 2.0 — Nouvelle interface
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Connexion</h1>
          <p className="text-gray-500 text-sm mb-8">Bon retour parmi nous 👋</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Identifiant</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleLogin()} placeholder="Username"
                className={inp} autoFocus />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Mot de passe</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLogin()}
                  placeholder="••••••••" className={`${inp} pr-11`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 hover:-translate-y-0.5 hover:shadow-blue-900/50">
              <LogIn className="w-4 h-4" />
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
