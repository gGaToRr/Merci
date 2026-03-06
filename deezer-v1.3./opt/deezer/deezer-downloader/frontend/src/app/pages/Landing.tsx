import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Disc3, Music2, Film, Youtube, Download, Zap, Shield, Star, ChevronRight, Play } from 'lucide-react'

function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: 1 + Math.random() * 2,
    }))
    let raf: number
    function draw() {
      ctx.clearRect(0, 0, W, H)
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > W) d.vx *= -1
        if (d.y < 0 || d.y > H) d.vy *= -1
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(59,130,246,0.3)'; ctx.fill()
      })
      // lignes entre proches
      for (let i = 0; i < dots.length; i++)
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(59,130,246,${0.15 * (1 - dist / 120)})`; ctx.stroke()
          }
        }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" />
}

const FEATURES = [
  { icon: Music2,    title: 'Deezer HQ',      desc: 'Téléchargez vos titres et albums en qualité maximale, MP3 ou FLAC.',    color: 'from-blue-500 to-blue-700'   },
  { icon: Youtube,   title: 'YouTube & Web',   desc: 'Extrayez n\'importe quelle vidéo ou audio depuis YouTube et + de 1000 sites.', color: 'from-red-500 to-red-700'     },
  { icon: Film,      title: 'The Good Place',  desc: 'Votre médiathèque privée : films, séries et animés en streaming.',        color: 'from-teal-500 to-emerald-700' },
  { icon: Shield,    title: '100% Privé',      desc: 'Self-hosted, aucune donnée envoyée à des tiers. Vous gardez le contrôle.', color: 'from-purple-500 to-purple-700' },
]

export function Landing() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Si déjà connecté → app
    if (localStorage.getItem('token')) { navigate('/', { replace: true }); return }
    setTimeout(() => setVisible(true), 100)
  }, [])

  return (
    <div className="min-h-screen bg-[#080812] text-white overflow-hidden relative">
      <ParticleCanvas />

      {/* Fond gradient animé */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-teal-600/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-60 h-60 rounded-full bg-purple-600/8 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className={`relative z-10 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Nav */}
        <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Disc3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Merci<span className="text-blue-400">.</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Connexion
            </button>
            <button onClick={() => navigate('/signup')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-0.5">
              Créer un compte
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center text-center px-6 pt-20 sm:pt-32 pb-20">
          {/* Badge version */}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 border border-blue-600/30 rounded-full text-blue-400 text-xs font-semibold mb-8 backdrop-blur-sm">
            <Zap className="w-3 h-3" />
            Version 2.0 — Nouvelle interface
            <Star className="w-3 h-3 fill-blue-400" />
          </div>

          {/* Titre */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-none tracking-tight">
            <span className="block">Votre musique.</span>
            <span className="block bg-gradient-to-r from-blue-400 via-teal-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              Librement.
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-xl mb-10 leading-relaxed">
            Téléchargez depuis Deezer et YouTube, regardez vos films en streaming —<br className="hidden sm:block" />
            Il est recommandé d’utiliser un VPN.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/signup')}
              className="group flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-2xl transition-all shadow-2xl shadow-blue-900/40 hover:shadow-blue-900/60 hover:-translate-y-1 text-sm">
              Commencer gratuitement
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-2xl transition-all text-sm backdrop-blur-sm">
              <Play className="w-4 h-4 fill-white" />
              Déjà membre
            </button>
          </div>

          {/* Preview card */}
          <div className="mt-16 sm:mt-20 w-full max-w-2xl">
            <div className="relative bg-[#111120]/80 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl">
              {/* Glow */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-600/20 via-teal-600/10 to-purple-600/20 -z-10 blur-sm" />

              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/80"/><div className="w-3 h-3 rounded-full bg-yellow-500/80"/><div className="w-3 h-3 rounded-full bg-green-500/80"/></div>
                <div className="flex-1 h-6 bg-white/5 rounded-lg flex items-center px-3"><span className="text-gray-600 text-[10px] font-mono">merci.kaets.sbs</span></div>
              </div>

              {/* Mock UI */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-left">
                {[
                  { label: 'Téléchargements', value: '1 247', color: 'text-blue-400 bg-blue-600/15' },
                  { label: 'Films',           value: '84',    color: 'text-teal-400 bg-teal-600/15' },
                  { label: 'Utilisateurs',    value: '12',    color: 'text-purple-400 bg-purple-600/15' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-xl p-3 border border-white/5 ${color.split(' ')[1]}`}>
                    <p className={`text-xl font-bold ${color.split(' ')[0]}`}>{value}</p>
                    <p className="text-gray-500 text-[10px]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 h-10 bg-white/3 rounded-xl flex items-center px-4 gap-3 border border-white/5">
                <Music2 className="w-4 h-4 text-blue-400" />
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full" style={{ width: '67%' }} />
                </div>
                <span className="text-gray-600 text-[10px]">67%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 sm:px-10 pb-20 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Tout en un seul endroit</h2>
            <p className="text-gray-500">Une plateforme, toutes vos habitudes media.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group bg-[#111120]/60 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-1.5">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 px-6 py-6 text-center">
          <p className="text-gray-600 text-xs">
            Merci Media — Self-hosted · Privé · Open Source
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes gradient { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
        .animate-gradient { background-size: 200% 200%; animation: gradient 4s ease infinite; }
      `}</style>
    </div>
  )
}
