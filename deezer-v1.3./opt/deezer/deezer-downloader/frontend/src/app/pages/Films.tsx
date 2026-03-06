import { useState, useEffect } from 'react'
import { Film, Download, AlertTriangle, Loader2, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'

const BASE = '/api'
function token() { return localStorage.getItem('token') }

interface Movie {
  filename: string; size_str: string; title: string; year: string
  genres: string[]; rating: number; vote_count: number
  overview: string; poster_url: string | null; quality: string; runtime: number | null
}

async function fetchMovies(): Promise<Movie[]> {
  const res = await fetch(`${BASE}/movies`, { headers: { Authorization: `Bearer ${token()}` } })
  if (!res.ok) throw new Error(`Erreur ${res.status}`)
  return (await res.json()).movies as Movie[]
}

async function downloadMovie(movie: Movie) {
  const res = await fetch(`${BASE}/movies/download?file=${encodeURIComponent(movie.filename)}`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
  if (!res.ok) throw new Error('Erreur téléchargement')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(await res.blob())
  a.download = movie.filename; a.click(); URL.revokeObjectURL(a.href)
}

// ── Étoiles ──────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  const on5 = rating / 2
  const full = Math.floor(on5)
  const frac = on5 - full
  const empty = 5 - Math.ceil(on5)
  const uid = Math.random().toString(36).slice(2, 7)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="#FBBF24" stroke="#FBBF24" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ))}
      {frac > 0 && (
        <svg width="12" height="12" viewBox="0 0 24 24">
          <defs>
            <linearGradient id={uid}>
              <stop offset={`${Math.round(frac * 100)}%`} stopColor="#FBBF24" />
              <stop offset={`${Math.round(frac * 100)}%`} stopColor="transparent" />
            </linearGradient>
          </defs>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={`url(#${uid})`} stroke="#FBBF24" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="none" stroke="#374151" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ))}
      <span className="text-yellow-400 text-[10px] font-semibold ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

function QBadge({ q }: { q: string }) {
  const map: Record<string, string> = {
    '4K':'bg-purple-600/90 text-white','1080p':'bg-blue-600/90 text-white',
    '720p':'bg-green-700/80 text-white','480p':'bg-yellow-700/80 text-white','SD':'bg-gray-700/70 text-gray-300',
  }
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${map[q]??map['SD']}`}>{q}</span>
}

function Card({ movie, onDownload }: { movie: Movie; onDownload: (m: Movie) => Promise<void> }) {
  const [dl, setDl]         = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const handle = async () => { setDl(true); try { await onDownload(movie) } finally { setDl(false) } }

  return (
    <div className="bg-[#11101e] border border-gray-800/60 rounded-2xl overflow-hidden hover:border-purple-600/40 hover:shadow-xl hover:shadow-purple-950/30 transition-all duration-300 group flex flex-col">
      {/* Poster */}
      <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-[#1a1a2e] to-[#0a0a12] overflow-hidden">
        {movie.poster_url && !imgErr
          ? <img src={movie.poster_url} alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgErr(true)} />
          : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Film className="w-12 h-12 text-gray-700" />
              <p className="text-gray-600 text-[10px] text-center px-4">{movie.title}</p>
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-[#11101e] via-[#11101e]/20 to-transparent" />
        <div className="absolute top-2 right-2"><QBadge q={movie.quality} /></div>
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          {movie.year && <span className="text-[10px] text-gray-200 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">{movie.year}</span>}
          {movie.runtime && <span className="text-[10px] text-gray-200 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">{Math.floor(movie.runtime/60)}h{String(movie.runtime%60).padStart(2,'0')}</span>}
        </div>
      </div>

      {/* Infos */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="text-white font-semibold text-xs leading-snug line-clamp-2 mb-1.5">{movie.title}</h3>
          <div className="flex flex-wrap gap-1">
            {movie.genres.slice(0,2).map(g => (
              <span key={g} className="text-[9px] px-1.5 py-0.5 bg-purple-900/30 border border-purple-700/30 text-purple-300 rounded-full">{g}</span>
            ))}
          </div>
        </div>
        {movie.rating > 0 && <Stars rating={movie.rating} />}
        {movie.overview && (
          <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-3 flex-1">{movie.overview}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-gray-700 text-[10px]">{movie.size_str}</span>
          <button onClick={handle} disabled={dl}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-600/40 hover:bg-purple-600/30 disabled:opacity-50 text-purple-300 text-[10px] font-medium transition-all">
            {dl ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            {dl ? 'En cours…' : 'Télécharger'}
          </button>
        </div>
      </div>
    </div>
  )
}

type SortKey = 'title' | 'rating' | 'year'

export function Films() {
  const [movies, setMovies]   = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState('')
  const [genre, setGenre]     = useState('Tous')
  const [sort, setSort]       = useState<SortKey>('rating')
  const [dlError, setDlError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try { setMovies(await fetchMovies()) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  // Tous les genres uniques
  const allGenres = ['Tous', ...Array.from(new Set(movies.flatMap(m => m.genres))).sort()]

  let filtered = movies
    .filter(m => [m.title, ...m.genres, m.year].join(' ').toLowerCase().includes(filter.toLowerCase()))
    .filter(m => genre === 'Tous' || m.genres.includes(genre))
    .sort((a, b) => {
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sort === 'year')   return (b.year || '0').localeCompare(a.year || '0')
      return a.title.localeCompare(b.title)
    })

  const handleDownload = async (movie: Movie) => {
    setDlError('')
    try { await downloadMovie(movie) }
    catch (e: any) { setDlError(e.message) }
  }

  return (
    <div className="min-h-screen p-5">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center shadow-lg shadow-purple-900/30">
                <Film className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-white">The Good Place</h1>
            </div>
            <p className="text-gray-500 text-xs">Téléchargez vos films en haute qualité</p>
          </div>
          <button onClick={load} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/40 border border-gray-700/40 hover:bg-gray-700/40 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Warnings */}
      <div className="max-w-5xl mx-auto mb-5 grid grid-cols-2 gap-2">
        {[
          { t: 'Avertissement légal', d: 'Le téléchargement de contenus protégés peut être illégal selon votre pays.' },
          { t: 'Responsabilité',      d: "L'utilisation est sous votre entière responsabilité." },
        ].map(({ t, d }) => (
          <div key={t} className="flex gap-2 bg-red-500/8 border border-red-500/20 rounded-xl p-3">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium text-[11px] mb-0.5">{t}</p>
              <p className="text-red-300/60 text-[10px] leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="max-w-5xl mx-auto mb-5 space-y-3">
        {/* Recherche + tri */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Rechercher un film…"
              className="w-full pl-9 pr-4 py-2.5 bg-[#1a1a2e]/80 border border-gray-700/50 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-all" />
          </div>
          <div className="flex items-center gap-1.5 px-3 bg-[#1a1a2e]/80 border border-gray-700/50 rounded-xl">
            <SlidersHorizontal className="w-3 h-3 text-gray-500" />
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
              className="bg-transparent text-gray-300 text-xs focus:outline-none cursor-pointer">
              <option value="rating">Note</option>
              <option value="year">Année</option>
              <option value="title">Titre</option>
            </select>
          </div>
        </div>

        {/* Filtres genre */}
        {allGenres.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {allGenres.map(g => (
              <button key={g} onClick={() => setGenre(g)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                  genre === g
                    ? 'bg-purple-600/30 border border-purple-600/50 text-purple-300'
                    : 'bg-gray-800/40 border border-gray-700/30 text-gray-500 hover:text-gray-300'
                }`}>
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {dlError && <div className="max-w-5xl mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">{dlError}</div>}

      {/* Grille */}
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-purple-400 animate-spin" /></div>
        ) : error ? (
          <div className="text-center py-16">
            <Film className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-1">Impossible de charger les films</p>
            <p className="text-gray-600 text-xs">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Film className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{filter || genre !== 'Tous' ? 'Aucun résultat' : 'Aucun film trouvé'}</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">{filtered.length} film{filtered.length > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((m, i) => <Card key={i} movie={m} onDownload={handleDownload} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
