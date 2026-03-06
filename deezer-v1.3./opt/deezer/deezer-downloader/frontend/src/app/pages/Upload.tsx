import { useState, useRef, useCallback } from 'react'
import { Upload, Film, Tv, Check, X, Clock, Trophy, Zap, ChevronRight, Info } from 'lucide-react'

// ── Crypto SVG logos ──────────────────────────────────────────────────────────
function BitcoinLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path d="M22.2 13.8c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7-1.1-.3-2.2-.5-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 .1.1.1.1.2l-.1 0-.8 3.3c-.1.2-.3.5-.7.4 0 .1-1.2-.3-1.2-.3l-.8 1.8 2.1.5 1.1.3-.7 2.7 1.6.4.7-2.7c.4.1.9.2 1.4.3l-.7 2.7 1.6.4.7-2.7c2.8.5 4.9.3 5.8-2.2.7-2-.03-3.2-1.5-3.9 1.1-.2 1.9-1 2.1-2.4zm-3.8 5.3c-.5 2-3.8.9-4.9.6l.9-3.4c1.1.3 4.5.9 4 2.8zm.5-5.3c-.4 1.8-3.2.9-4.1.7l.8-3.1c.9.2 3.7.7 3.3 2.4z" fill="white"/>
    </svg>
  )
}

function EthereumLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#627EEA"/>
      <path d="M16 6v7.87L22.5 17 16 6z" fill="white" fillOpacity=".6"/>
      <path d="M16 6L9.5 17l6.5-3.13V6z" fill="white"/>
      <path d="M16 21.47v4.53L22.5 18.2 16 21.47z" fill="white" fillOpacity=".6"/>
      <path d="M16 26v-4.53L9.5 18.2 16 26z" fill="white"/>
      <path d="M16 20.26l6.5-3.26L16 13.87v6.39z" fill="white" fillOpacity=".2"/>
      <path d="M9.5 17l6.5 3.26v-6.39L9.5 17z" fill="white" fillOpacity=".6"/>
    </svg>
  )
}

function USDTLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
      <path d="M17.9 17.2c-.1 0-.6.1-1.9.1-1 0-1.7-.1-1.9-.1-3.8-.2-6.6-.8-6.6-1.6s2.8-1.4 6.6-1.6v2.5c.2 0 1 .1 2 .1s1.7-.1 1.9-.1v-2.5c3.8.2 6.6.8 6.6 1.6s-2.8 1.4-6.6 1.6h-.1zM16 14.6v-2.2h5.3V9.5H10.7v2.9H16v2.2C11.7 14.8 8.5 15.6 8.5 16.5s3.2 1.7 7.5 1.9v6.7h3V18.4c4.3-.2 7.5-1 7.5-1.9s-3.2-1.7-7.5-1.9h-.1l.1-.1z" fill="white"/>
    </svg>
  )
}

function SolanaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#9945FF"/>
      <path d="M9 20.5h12.5c.2 0 .3.1.4.2l1.3 1.5c.2.2.1.5-.2.5H10.5c-.2 0-.3-.1-.4-.2L8.8 21c-.2-.3-.1-.5.2-.5zm0-10h12.5c.2 0 .3.1.4.2l1.3 1.5c.2.2.1.5-.2.5H10.5c-.2 0-.3-.1-.4-.2L8.8 11c-.2-.3-.1-.5.2-.5zm13.2 5.5H9.7c-.2 0-.3-.1-.4-.2L8 14.3c-.2-.2-.1-.5.2-.5H21c.2 0 .3.1.4.2l1.3 1.5c.2.3.1.5-.2.5h-.3z" fill="white"/>
    </svg>
  )
}

function LitecoinLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#BFBBBB"/>
      <path d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10 10-4.5 10-10S21.5 6 16 6zm-1.3 15.8l.8-3.1-1 .3.4-1.5 1-.3 2-7.7h2.6l-1.7 6.5 1-.3-.4 1.5-1 .3-.7 2.7h5.3l-.5 1.9-7.8-.3z" fill="white"/>
    </svg>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface UploadFile {
  id: string
  file: File
  type: 'film' | 'serie'
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  reward?: number
  rewardCurrency?: string
}

const CRYPTO_REWARDS = [
  { name: 'Bitcoin',  symbol: 'BTC', logo: BitcoinLogo,  reward: '0.00012', color: '#F7931A', bg: 'rgba(247,147,26,0.1)',  border: 'rgba(247,147,26,0.25)' },
  { name: 'Ethereum', symbol: 'ETH', logo: EthereumLogo, reward: '0.0018',  color: '#627EEA', bg: 'rgba(98,126,234,0.1)',  border: 'rgba(98,126,234,0.25)' },
  { name: 'Tether',   symbol: 'USDT',logo: USDTLogo,     reward: '2.50',    color: '#26A17B', bg: 'rgba(38,161,123,0.1)', border: 'rgba(38,161,123,0.25)' },
  { name: 'Solana',   symbol: 'SOL', logo: SolanaLogo,   reward: '0.025',   color: '#9945FF', bg: 'rgba(153,69,255,0.1)', border: 'rgba(153,69,255,0.25)' },
  { name: 'Litecoin', symbol: 'LTC', logo: LitecoinLogo, reward: '0.042',   color: '#BFBBBB', bg: 'rgba(191,187,187,0.1)',border: 'rgba(191,187,187,0.2)'  },
]

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'kaets0ner', uploads: 142, earned: '0.047 BTC', badge: '🥇' },
  { rank: 2, name: 'darkwolf',  uploads: 98,  earned: '0.031 BTC', badge: '🥈' },
  { rank: 3, name: 'cinephile', uploads: 74,  earned: '0.024 BTC', badge: '🥉' },
  { rank: 4, name: 'maxstream', uploads: 51,  earned: '0.016 BTC', badge: null },
  { rank: 5, name: 'vidéo_king',uploads: 33,  earned: '0.011 BTC', badge: null },
]

const ACCEPTED = '.mkv,.mp4,.avi,.mov,.wmv,.m4v,.webm'

// ── Composant principal ───────────────────────────────────────────────────────
// ── Bannière maintenance pour non-admins ───────────────────────────────────
function MaintenanceBanner() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e]">
      <div className="max-w-md w-full text-center">
        {/* Icône animée */}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-yellow-900/20">
            <span className="text-5xl select-none" role="img" aria-label="construction">🚧</span>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 border-2 border-[#0f0f1a] flex items-center justify-center animate-pulse">
            <span className="text-[10px] text-white font-bold">!</span>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-white mb-2">Page en cours de construction</h1>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/40"/>
          <span className="text-yellow-400 text-xs font-semibold uppercase tracking-widest px-2">Work in progress</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/40"/>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Cette fonctionnalité est actuellement en développement.<br/>
          Elle sera disponible très prochainement.
        </p>

        {/* Message estimé de lancement */}
        <div className="flex items-center gap-3 bg-[#1a1a2e]/80 border border-gray-700/40 rounded-2xl px-5 py-4">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="text-white text-sm font-semibold">Bientôt disponible</p>
            <p className="text-gray-500 text-xs mt-0.5">Revenez prochainement pour accéder à cette fonctionnalité.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Uploads() {
  // Vérifier si l'utilisateur est admin
  const isAdmin = (() => {
    try { return !!JSON.parse(localStorage.getItem('user') || '{}').is_admin } catch { return false }
  })()

  // Afficher la bannière de maintenance pour les non-admins
  if (!isAdmin) return <MaintenanceBanner />

  return <UploadsAdmin />
}

function UploadsAdmin() {
  const [files, setFiles]         = useState<UploadFile[]>([])
  const [dragging, setDragging]   = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState(0)
  const [tab, setTab]             = useState<'upload' | 'rewards' | 'leaderboard'>('upload')
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((raw: FileList | null) => {
    if (!raw) return
    const newEntries: UploadFile[] = Array.from(raw)
      .filter(f => /\.(mkv|mp4|avi|mov|wmv|m4v|webm)$/i.test(f.name))
      .map(f => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        type: /s\d{2}e\d{2}|saison|season|episode/i.test(f.name) ? 'serie' : 'film',
        status: 'pending',
        progress: 0,
      }))
    setFiles(prev => [...prev, ...newEntries])
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const simulateUpload = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'uploading' } : f))
    let progress = 0
    const crypto = CRYPTO_REWARDS[Math.floor(Math.random() * CRYPTO_REWARDS.length)]
    const iv = setInterval(() => {
      progress += Math.random() * 12 + 3
      if (progress >= 100) {
        clearInterval(iv)
        setFiles(prev => prev.map(f => f.id === id ? {
          ...f, status: 'done', progress: 100,
          reward: parseFloat(crypto.reward) * (0.8 + Math.random() * 0.4),
          rewardCurrency: crypto.symbol,
        } : f))
      } else {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: Math.min(progress, 99) } : f))
      }
    }, 200)
  }

  const removeFile = (id: string) =>
    setFiles(prev => prev.filter(f => f.id !== id))

  const pendingCount  = files.filter(f => f.status === 'pending').length
  const doneCount     = files.filter(f => f.status === 'done').length

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Upload & Earn</h1>
              <p className="text-gray-400 text-xs">Partagez vos films et séries — recevez des cryptos</p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Uploadés', value: doneCount, icon: '✅' },
              { label: 'En attente', value: pendingCount, icon: '⏳' },
              { label: 'Total fichiers', value: files.length, icon: '📁' },
              { label: 'Récompenses', value: `${doneCount > 0 ? (doneCount * 0.00012).toFixed(5) : '0'} BTC`, icon: '₿' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-[#1a1a2e]/70 border border-gray-700/40 rounded-xl p-3">
                <div className="text-base mb-1">{icon}</div>
                <div className="text-white font-semibold text-sm">{value}</div>
                <div className="text-gray-500 text-[10px]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-[#0f0f1a] border border-gray-800/50 rounded-xl p-1">
          {([
            { key: 'upload',      label: 'Uploader',       icon: Upload },
            { key: 'rewards',     label: 'Récompenses',    icon: Zap },
            { key: 'leaderboard', label: 'Classement',     icon: Trophy },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                tab === key
                  ? 'bg-emerald-600/20 border border-emerald-600/40 text-emerald-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab : Upload ── */}
        {tab === 'upload' && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                dragging
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                  : 'border-gray-700/60 bg-[#1a1a2e]/40 hover:border-gray-600 hover:bg-[#1a1a2e]/70'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPTED}
                className="hidden"
                onChange={e => addFiles(e.target.files)}
              />

              {/* Icônes animées */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-center transition-all ${dragging ? 'scale-110 border-emerald-500/50' : ''}`}>
                  <Film className="w-6 h-6 text-gray-500" />
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center transition-all ${dragging ? 'scale-125 bg-emerald-600/30' : ''}`}>
                  <Upload className={`w-7 h-7 text-emerald-400 transition-transform ${dragging ? '-translate-y-1' : ''}`} />
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-center transition-all ${dragging ? 'scale-110 border-emerald-500/50' : ''}`}>
                  <Tv className="w-6 h-6 text-gray-500" />
                </div>
              </div>

              <p className="text-white font-medium text-sm mb-1">
                {dragging ? 'Relâchez pour ajouter' : 'Glissez vos fichiers ici'}
              </p>
              <p className="text-gray-500 text-xs">
                Films & séries — MKV, MP4, AVI, MOV, WEBM
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-emerald-400 text-xs">
                <Zap className="w-3 h-3" />
                Gagnez des cryptos à chaque upload validé
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="bg-[#1a1a2e]/70 border border-gray-700/40 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
                  <span className="text-xs font-medium text-white">{files.length} fichier{files.length > 1 ? 's' : ''}</span>
                  {pendingCount > 0 && (
                    <button
                      onClick={() => files.filter(f => f.status === 'pending').forEach(f => simulateUpload(f.id))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-600/40 hover:bg-emerald-600/30 rounded-lg text-emerald-400 text-xs font-medium transition-all"
                    >
                      <Upload className="w-3 h-3" />
                      Tout uploader ({pendingCount})
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-800/40">
                  {files.map(f => (
                    <div key={f.id} className="px-4 py-3 flex items-center gap-3">
                      {/* Icône type */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        f.type === 'film' ? 'bg-blue-600/20 border border-blue-600/30' : 'bg-purple-600/20 border border-purple-600/30'
                      }`}>
                        {f.type === 'film'
                          ? <Film className="w-4 h-4 text-blue-400" />
                          : <Tv className="w-4 h-4 text-purple-400" />
                        }
                      </div>

                      {/* Nom + barre */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs truncate mb-1">{f.file.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                f.status === 'done'  ? 'bg-emerald-500' :
                                f.status === 'error' ? 'bg-red-500' :
                                'bg-emerald-500/70'
                              }`}
                              style={{ width: `${f.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 w-8 text-right">
                            {f.status === 'pending' ? '—' : `${Math.round(f.progress)}%`}
                          </span>
                        </div>
                      </div>

                      {/* Récompense si done */}
                      {f.status === 'done' && f.reward && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/25 rounded-lg">
                          <span className="text-yellow-400 text-[10px] font-semibold">
                            +{f.reward.toFixed(5)} {f.rewardCurrency}
                          </span>
                        </div>
                      )}

                      {/* Status icon */}
                      {f.status === 'done'  && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                      {f.status === 'error' && <X    className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      {f.status === 'pending' && (
                        <button
                          onClick={() => simulateUpload(f.id)}
                          className="px-2 py-1 bg-emerald-600/20 border border-emerald-600/30 hover:bg-emerald-600/30 rounded text-emerald-400 text-[10px] transition-all flex-shrink-0"
                        >
                          Upload
                        </button>
                      )}
                      {f.status !== 'uploading' && (
                        <button onClick={() => removeFile(f.id)} className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab : Récompenses ── */}
        {tab === 'rewards' && (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex gap-3 bg-emerald-500/8 border border-emerald-500/25 rounded-xl p-4">
              <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300/80 text-xs leading-relaxed">
                À chaque film ou série uploadé et validé par notre équipe, vous recevez automatiquement une récompense en crypto directement sur votre wallet. Plus vous uploadez, plus vous gagnez.
              </p>
            </div>

            {/* Sélecteur crypto */}
            <div className="bg-[#1a1a2e]/70 border border-gray-700/40 rounded-xl p-4">
              <h2 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wider">Choisissez votre crypto</h2>
              <div className="grid grid-cols-5 gap-2">
                {CRYPTO_REWARDS.map((c, i) => {
                  const Logo = c.logo
                  return (
                    <button
                      key={c.symbol}
                      onClick={() => setSelectedCrypto(i)}
                      style={{
                        background: selectedCrypto === i ? c.bg : 'transparent',
                        borderColor: selectedCrypto === i ? c.border : 'rgba(75,85,99,0.3)',
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200"
                    >
                      <Logo size={32} />
                      <span className="text-[10px] font-semibold text-white">{c.symbol}</span>
                      <span className="text-[9px] text-gray-500">{c.name}</span>
                      {selectedCrypto === i && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Barème */}
            {(() => {
              const c = CRYPTO_REWARDS[selectedCrypto]
              const Logo = c.logo
              return (
                <div className="bg-[#1a1a2e]/70 border border-gray-700/40 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/40">
                    <Logo size={20} />
                    <span className="text-sm font-medium text-white">Barème {c.name}</span>
                  </div>
                  <div className="divide-y divide-gray-800/40">
                    {[
                      { type: '🎬 Film HD (720p–1080p)', reward: c.reward,                           detail: 'Par film uploadé et validé' },
                      { type: '🎥 Film 4K / UHD',        reward: (parseFloat(c.reward)*2).toFixed(5),detail: 'Bonus qualité x2' },
                      { type: '📺 Série (par épisode)',   reward: (parseFloat(c.reward)*0.4).toFixed(5), detail: 'Chaque épisode compte' },
                      { type: '📦 Pack saison complète', reward: (parseFloat(c.reward)*3).toFixed(5), detail: 'Bonus pack x3' },
                      { type: '⚡ Bonus exclusivité',    reward: (parseFloat(c.reward)*5).toFixed(5), detail: 'Contenu rare, non disponible ailleurs' },
                    ].map(row => (
                      <div key={row.type} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-white text-xs">{row.type}</p>
                          <p className="text-gray-600 text-[10px]">{row.detail}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm" style={{ color: c.color }}>
                            +{row.reward}
                          </p>
                          <p className="text-gray-600 text-[10px]">{c.symbol}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Comment ça marche */}
            <div className="bg-[#1a1a2e]/70 border border-gray-700/40 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wider">Comment ça marche ?</h3>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Uploadez votre fichier', desc: 'Glissez un film ou une série dans la zone d\'upload', color: 'from-blue-600 to-blue-700' },
                  { step: '2', title: 'Validation par l\'équipe', desc: 'Notre équipe vérifie la qualité sous 24h', color: 'from-purple-600 to-purple-700' },
                  { step: '3', title: 'Récompense automatique', desc: 'La crypto est envoyée sur votre wallet dès validation', color: 'from-emerald-600 to-teal-700' },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5`}>
                      {step}
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">{title}</p>
                      <p className="text-gray-500 text-[10px]">{desc}</p>
                    </div>
                    {step !== '3' && <ChevronRight className="w-3 h-3 text-gray-700 flex-shrink-0 mt-1 ml-auto" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab : Classement ── */}
        {tab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="bg-[#1a1a2e]/70 border border-gray-700/40 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700/40 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-semibold text-white">Top Uploaders — Ce mois</span>
              </div>
              <div className="divide-y divide-gray-800/40">
                {MOCK_LEADERBOARD.map(entry => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      entry.rank === 1 ? 'bg-yellow-500/5' : ''
                    }`}
                  >
                    {/* Rang */}
                    <div className="w-7 text-center">
                      {entry.badge
                        ? <span className="text-base">{entry.badge}</span>
                        : <span className="text-gray-600 text-xs font-mono">#{entry.rank}</span>
                      }
                    </div>

                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                      entry.rank === 1 ? 'bg-gradient-to-br from-yellow-500 to-orange-600 text-black' :
                      entry.rank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-black' :
                      entry.rank === 3 ? 'bg-gradient-to-br from-orange-700 to-orange-900 text-white' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {entry.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Nom */}
                    <span className={`text-xs flex-1 ${entry.rank <= 3 ? 'text-white font-medium' : 'text-gray-400'}`}>
                      {entry.name}
                    </span>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="text-white text-xs font-semibold">{entry.earned}</p>
                      <p className="text-gray-600 text-[10px]">{entry.uploads} uploads</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barre de progression personnelle */}
            <div className="bg-[#1a1a2e]/70 border border-gray-700/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[9px] font-semibold">
                    ME
                  </div>
                  <span className="text-xs text-white font-medium">Votre progression</span>
                </div>
                <span className="text-[10px] text-gray-500">{doneCount} uploads ce mois</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((doneCount / 33) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>0</span>
                <span className="text-emerald-400">{doneCount} / 33 pour entrer dans le Top 5</span>
                <span>33</span>
              </div>
            </div>

            <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-500/8 border border-blue-500/20 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300/70 text-[10px] leading-relaxed">
                Le classement est remis à zéro le 1er de chaque mois. Les récompenses accumulées sont définitivement acquises.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
