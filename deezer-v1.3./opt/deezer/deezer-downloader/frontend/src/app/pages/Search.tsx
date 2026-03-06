import { useState } from 'react'
import { Search as SearchIcon, Download, Music, AlertTriangle, Loader2, Disc } from 'lucide-react'
import { api, type SearchResult, formatDuration } from '../api'

type SearchType = 'track' | 'album'

export function Search() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<SearchType>('track')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const { results } = await api.search(query, type)
      setResults(results)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (result: SearchResult) => {
    const id = type === 'track' ? result.SNG_ID ?? result.id : result.ALB_ID ?? result.id
    setDownloading(id)
    try {
      const url = type === 'track' ? api.streamTrackUrl(id) : api.streamAlbumUrl(id)
      const token = localStorage.getItem('token')
      const res = await fetch(url.replace(`?token=${token}`, ''), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erreur lors du téléchargement')
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition') ?? ''
      const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/)
      const filename = match ? decodeURIComponent(match[1]) : `download_${id}`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Music className="w-5 h-5 text-blue-400" />
          <h1 className="text-2xl font-semibold text-white">Rechercher & Télécharger</h1>
        </div>
        <p className="text-gray-400 text-xs">Trouvez vos titres préférés sur Deezer</p>
      </div>

      <div className="max-w-3xl mx-auto mb-5 space-y-2">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <div className="flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-orange-300/80 text-[11px] leading-relaxed">
              Le téléchargement de contenus protégés peut être illégal selon votre pays.
              L'utilisation de ce service est sous votre entière responsabilité.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1a1a2e]/80 backdrop-blur-xl border border-gray-700/50 rounded-lg p-5 shadow-xl">
          <div className="flex gap-2 mb-4">
            {(['track', 'album'] as SearchType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  type === t
                    ? 'bg-blue-600/30 border border-blue-600/50 text-blue-400'
                    : 'bg-gray-800/40 border border-gray-700/40 text-gray-400 hover:text-gray-300'
                }`}
              >
                {t === 'track' ? 'Titre' : 'Album'}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={type === 'track' ? 'Artiste, titre...' : 'Artiste, album...'}
                className="w-full px-3.5 py-2.5 bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
              />
              <Music className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full py-2.5 rounded-lg font-medium text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SearchIcon className="w-3.5 h-3.5" />}
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>

        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </p>
            {results.map((r, i) => {
              const id = type === 'track' ? r.SNG_ID ?? r.id : r.ALB_ID ?? r.id
              const title = type === 'track' ? r.SNG_TITLE ?? r.title ?? 'Inconnu' : r.ALB_TITLE ?? r.title ?? 'Inconnu'
              const artist = r.ART_NAME ?? r.artist ?? ''
              const isLoading = downloading === id
              return (
                <div key={i} className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-gray-700/40 rounded-lg p-3 flex items-center gap-3 hover:border-blue-500/30 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0">
                    {type === 'track' ? (
                      <Music className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Disc className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{title}</p>
                    <p className="text-gray-400 text-[11px] truncate">{artist}</p>
                  </div>
                  {type === 'track' && r.DURATION && (
                    <span className="text-gray-500 text-[11px] tabular-nums">
                      {formatDuration(r.DURATION)}
                    </span>
                  )}
                  <button
                    onClick={() => handleDownload(r)}
                    disabled={isLoading}
                    className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center hover:bg-blue-600/40 transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="mt-4 text-center py-8 text-gray-500 text-xs">
            Aucun résultat pour "{query}"
          </div>
        )}
      </div>
    </div>
  )
}
