import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Music, UserPlus, Eye, EyeOff } from 'lucide-react'
import { api } from '../api'

export function Signup() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!username || !email || !password) {
      setError('Tous les champs sont obligatoires.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { access_token, user } = await api.signup(username, email, password)
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSignup()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-3">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Créer un compte</h1>
          <p className="text-gray-500 text-xs mt-1">Media Downloader</p>
        </div>

        <div className="bg-[#1a1a2e]/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1.5">
              Identifiant
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="mon_pseudo"
              className="w-full px-3.5 py-2.5 bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1.5">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="exemple@email.com"
              className="w-full px-3.5 py-2.5 bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="8 car. min, 1 majuscule, 1 chiffre"
                className="w-full px-3.5 py-2.5 pr-10 bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-[11px] bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {loading ? 'Création…' : 'Créer le compte'}
          </button>

          <p className="text-center text-[11px] text-gray-500">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
