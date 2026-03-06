import { useState } from 'react'
import { Video as VideoIcon, Youtube, Download, Loader2, Music, Film } from 'lucide-react'
import { api, type YtdlpInfo, type YtdlpFormat, formatSize } from '../api'

export function Video() {
  const [url, setUrl] = useState('')
  const [info, setInfo] = useState<YtdlpInfo | null>(null)
  const [selected, setSelected] = useState<YtdlpFormat | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setInfo(null)
    setSelected(null)
    try {
      const data = await api.ytdlpInfo(url)
      setInfo(data)
      // Sélectionner le meilleur format par défaut
      const best = data.formats.find(f => f.kind === 'video+audio') ?? data.formats[0]
      setSelected(best ?? null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!selected || !url) return
    setDownloading(true)
    setError('')
    try {
      const res = await api.ytdlpDownloadDirect(url, selected.format_id, selected.kind)
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition') ?? ''
      const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/)
      const filename = match ? decodeURIComponent(match[1]) : `video.${selected.ext}`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDownloading(false)
    }
  }

  const videoFormats = info?.formats.filter(f => f.kind !== 'audio') ?? []
  const audioFormats = info?.formats.filter(f => f.kind === 'audio') ?? []

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
            <Youtube className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Téléchargeur vidéo</h1>
        </div>
        <p className="text-gray-400 text-xs">YouTube, Vimeo, SoundCloud, TikTok et plus</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1a1a2e]/80 backdrop-blur-xl border border-gray-700/50 rounded-lg p-5 shadow-xl">
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
              <VideoIcon className="w-3 h-3" />
              URL de la vidéo / audio
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Collez l'URL ici..."
              className="w-full px-3.5 py-2.5 bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="w-full py-2.5 rounded-lg font-medium text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <VideoIcon className="w-3.5 h-3.5" />}
            {loading ? 'Analyse…' : 'Analyser'}
          </button>
        </div>

        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs">
            {error}
          </div>
        )}

        {info && (
          <div className="mt-4 space-y-3">
            {/* Infos vidéo */}
            <div className="bg-[#1a1a2e]/80 border border-gray-700/50 rounded-lg p-4 flex gap-3">
              {info.thumbnail && (
                <img src={info.thumbnail} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-xs font-medium truncate">{info.title}</h3>
                <p className="text-gray-400 text-[11px] mt-0.5">{info.uploader}</p>
              </div>
            </div>

            {/* Sélection format */}
            {videoFormats.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Formats vidéo</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {videoFormats.map((f) => (
                    <button
                      key={f.format_id}
                      onClick={() => setSelected(f)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        selected?.format_id === f.format_id
                          ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                          : 'bg-gray-800/30 border-gray-700/40 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-xs font-medium">{f.label}</p>
                      <p className="text-[11px] text-gray-500">
                        {f.ext.toUpperCase()}
                        {f.filesize ? ` · ${formatSize(f.filesize)}` : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {audioFormats.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Formats audio</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {audioFormats.map((f) => (
                    <button
                      key={f.format_id}
                      onClick={() => setSelected(f)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        selected?.format_id === f.format_id
                          ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                          : 'bg-gray-800/30 border-gray-700/40 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-xs font-medium flex items-center gap-1.5">
                        <Music className="w-3 h-3" /> {f.label}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {f.ext.toUpperCase()}
                        {f.filesize ? ` · ${formatSize(f.filesize)}` : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selected && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-2.5 rounded-lg font-medium text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-1.5"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {downloading ? 'Téléchargement en cours…' : `Télécharger ${selected.label}`}
              </button>
            )}
          </div>
        )}

        {!info && !loading && (
          <div className="mt-5">
            <h3 className="text-[10px] font-medium text-gray-500 mb-2.5 uppercase tracking-wide">
              Plateformes supportées
            </h3>
            <div className="flex flex-wrap gap-2">
              {['YouTube', 'Vimeo', 'SoundCloud', 'TikTok', 'Twitter', 'Instagram', 'Dailymotion'].map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 bg-[#1a1a2e]/60 border border-gray-700/40 rounded-lg text-[11px] text-gray-400"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
