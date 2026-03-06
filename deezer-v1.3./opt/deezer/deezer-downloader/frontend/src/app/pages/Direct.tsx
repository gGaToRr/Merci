import { useState, useEffect } from 'react'
import { Play, Link2, Plus, X, Film, Tv, Star, Eye, Loader2, Search,
         ExternalLink, Trash2, Volume2, Info } from 'lucide-react'

const BASE = '/api'
function authH(): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }
}
async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: authH(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
  return data as T
}

interface ContentLink { id: number; hoster: string; url: string; link_type: string; quality: string }
interface Content {
  id: number; title: string; year: string; content_type: string; genre: string
  overview: string; poster_url: string | null; rating: number | null; quality: string
  view_count: number; links: ContentLink[]
}

// ─────────────────────────────────────────────────────────────────────────────
// parseEmbedInput : accepte un code <iframe ...> complet OU une URL directe
// Retourne { embedUrl, pageUrl } où embedUrl = URL à mettre dans l'iframe
// ─────────────────────────────────────────────────────────────────────────────
function parseEmbedInput(raw: string): { embedUrl: string | null; pageUrl: string } {
  const trimmed = raw.trim()

  // Cas 1 : code iframe complet  →  extraire le src
  const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i)
  if (srcMatch) {
    const embedUrl = srcMatch[1]
    return { embedUrl, pageUrl: embedUrl }
  }

  // Cas 2 : URL directe (avec ou sans protocole)
  let url = trimmed
  if (!url.startsWith('http')) url = 'https://' + url

  return { embedUrl: null, pageUrl: url }   // sera traité par getEmbedUrl
}

function getEmbedUrl(hoster: string, rawInput: string): string | null {
  const { embedUrl, pageUrl } = parseEmbedInput(rawInput)

  // Si on a extrait un src d'iframe → c'est déjà une URL embed, on la retourne directement
  if (embedUrl) return embedUrl

  // Sinon on convertit l'URL de la page
  try {
    const u    = new URL(pageUrl)
    const path = u.pathname

    if (hoster === 'vidoza') {
      if (path.includes('embed-')) return pageUrl
      const m = path.match(/\/([a-zA-Z0-9]+)(?:\.html)?$/)
      if (m) return `https://vidoza.net/embed-${m[1]}.html`
    }
    if (hoster === 'doodstream') {
      if (path.includes('/e/')) return pageUrl
      const m = path.match(/\/[a-z]\/([a-zA-Z0-9]+)/)
      if (m) return `${u.origin}/e/${m[1]}`
    }
    if (hoster === 'streamtape') {
      if (path.includes('/e/')) return pageUrl
      const m = path.match(/\/[a-z]\/([a-zA-Z0-9_-]+)/)
      if (m) return `https://streamtape.com/e/${m[1]}`
    }
    if (hoster === 'voe') {
      if (path.includes('/e/')) return pageUrl
      const m = path.match(/\/([a-zA-Z0-9]+)$/)
      if (m) return `https://voe.sx/e/${m[1]}`
    }
    if (hoster === 'mixdrop') {
      if (path.includes('/e/')) return pageUrl
      const m = path.match(/\/[a-z]\/([a-zA-Z0-9]+)/)
      if (m) return `https://mixdrop.ag/e/${m[1]}`
    }
    if (hoster === 'filemoon') {
      if (path.includes('/e/')) return pageUrl
      const m = path.match(/\/[a-z]\/([a-zA-Z0-9]+)/)
      if (m) return `https://filemoon.sx/e/${m[1]}`
    }
    if (hoster === 'sendvid') {
      // https://sendvid.com/ABC  →  https://sendvid.com/embed/ABC
      if (path.includes('/embed/')) return pageUrl
      const m = path.match(/\/([a-zA-Z0-9]+)$/)
      if (m) return `https://sendvid.com/embed/${m[1]}`
    }
    if (hoster === 'sibnet') {
      // https://video.sibnet.ru/shell.php?videoid=ID  →  tel quel (c'est déjà l'embed)
      return pageUrl
    }
    return null
  } catch {
    return null
  }
}

// Récupère l'URL "propre" à stocker en BDD (src extrait si code iframe)
function getStorageUrl(raw: string): string {
  const { embedUrl, pageUrl } = parseEmbedInput(raw)
  return embedUrl || pageUrl
}

const HOSTER_COLORS: Record<string, string> = {
  doodstream: '#e05252', streamtape: '#f59e0b', vidoza: '#3b82f6',
  uptobox: '#8b5cf6', voe: '#10b981', mixdrop: '#f97316', filemoon: '#ec4899',
  sendvid: '#14b8a6', sibnet: '#6366f1', autre: '#6b7280',
}
const HOSTER_LABEL: Record<string, string> = {
  doodstream: 'Doodstream', streamtape: 'Streamtape', vidoza: 'Vidoza',
  uptobox: 'Uptobox', voe: 'Voe', mixdrop: 'Mixdrop', filemoon: 'Filemoon',
  sendvid: 'Sendvid', sibnet: 'Sibnet', autre: 'Autre',
}

// Exemples d'embed pour le formulaire — coller le code <iframe> OU l'URL directe
const HOSTER_EXAMPLES: Record<string, string> = {
  vidoza:     '<IFRAME SRC="https://vidoza.net/embed-XXXXXXXXXX.html" FRAMEBORDER=0 WIDTH=640 HEIGHT=360 allowfullscreen></IFRAME>',
  doodstream: '<iframe src="https://dood.pm/e/XXXXXXXXXX" frameborder="0" allowfullscreen></iframe>',
  streamtape: '<iframe src="https://streamtape.com/e/XXXXXXXXXX" frameborder="0" allowfullscreen></iframe>',
  voe:        '<iframe src="https://voe.sx/e/XXXXXXXXXX" frameborder="0" allowfullscreen></iframe>',
  mixdrop:    '<iframe src="https://mixdrop.ag/e/XXXXXXXXXX" frameborder="0" allowfullscreen></iframe>',
  filemoon:   '<iframe src="https://filemoon.sx/e/XXXXXXXXXX" frameborder="0" allowfullscreen></iframe>',
  sendvid:    '<iframe src="https://sendvid.com/embed/XXXXXXXXXX" frameborder="0" allowfullscreen></iframe>',
  sibnet:     'https://video.sibnet.ru/shell.php?videoid=XXXXXXXXX',
  uptobox:    'https://uptobox.com/XXXXXXXXXX  (lecture dans un nouvel onglet)',
}

const HOSTER_EMBED_SUPPORTS: Record<string, boolean> = {
  vidoza: true, doodstream: true, streamtape: true, voe: true,
  mixdrop: true, filemoon: true, sendvid: true, sibnet: true,
  uptobox: false, autre: false,
}

// ── Étoiles ───────────────────────────────────────────────────────────────────
function Stars({ r }: { r: number }) {
  const on5 = r / 2
  const full = Math.floor(on5)
  const frac = on5 - full
  const uid  = `s${Math.random().toString(36).slice(2,6)}`
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="#FBBF24" stroke="#FBBF24" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ))}
      {frac > 0.1 && (
        <svg width="11" height="11" viewBox="0 0 24 24">
          <defs><linearGradient id={uid}>
            <stop offset={`${Math.round(frac*100)}%`} stopColor="#FBBF24"/>
            <stop offset={`${Math.round(frac*100)}%`} stopColor="transparent"/>
          </linearGradient></defs>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={`url(#${uid})`} stroke="#FBBF24" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      )}
      {Array.from({ length: 5 - Math.ceil(on5) }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="none" stroke="#374151" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ))}
      <span className="text-yellow-400 text-[10px] font-semibold ml-1">{r.toFixed(1)}</span>
    </div>
  )
}

// ── Player Modal ──────────────────────────────────────────────────────────────
function PlayerModal({ item, initialLink, onClose }: {
  item: Content; initialLink: ContentLink; onClose: () => void
}) {
  const [activeLink, setActiveLink] = useState<ContentLink>(initialLink)
  const [iframeKey, setIframeKey]   = useState(0)   // force re-mount quand source change
  const [loading, setLoading]       = useState(true)
  const [imgErr, setImgErr]         = useState(false)

  const embedUrl = getEmbedUrl(activeLink.hoster, activeLink.url)

  const changeSource = (link: ContentLink) => {
    setActiveLink(link)
    setLoading(true)
    setIframeKey(k => k + 1)
  }

  const openExternal = () => window.open(activeLink.url, '_blank', 'noopener')

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">

      {/* ── Barre titre ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800/60 bg-[#0a0a12]/90 flex-shrink-0">
        {item.poster_url && !imgErr && (
          <img src={item.poster_url} alt="" onError={() => setImgErr(true)}
            className="w-8 h-10 object-cover rounded-md flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-sm font-semibold truncate">{item.title}</h2>
          <div className="flex items-center gap-2">
            {item.year && <span className="text-gray-500 text-[10px]">{item.year}</span>}
            {item.genre && <><span className="text-gray-700">·</span><span className="text-gray-500 text-[10px]">{item.genre}</span></>}
            {item.rating && item.rating > 0 && (
              <span className="flex items-center gap-0.5 ml-1">
                <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                <span className="text-yellow-400 text-[10px]">{item.rating.toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
        {/* Source active */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/40">
          <div className="w-2 h-2 rounded-full" style={{ background: HOSTER_COLORS[activeLink.hoster] || '#6b7280' }} />
          <span className="text-gray-300 text-[11px] font-medium">{HOSTER_LABEL[activeLink.hoster] || activeLink.hoster}</span>
          <span className="text-gray-600 text-[10px]">{activeLink.quality}</span>
        </div>
        {!embedUrl && (
          <button onClick={openExternal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 border border-teal-600/40 hover:bg-teal-600/30 text-teal-400 text-xs transition-all">
            <ExternalLink className="w-3.5 h-3.5" />Ouvrir
          </button>
        )}
        <button onClick={openExternal} title="Ouvrir sur le site source"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800/50 border border-gray-700/40 hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-all">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800/50 border border-gray-700/40 hover:bg-red-600/20 hover:border-red-600/40 text-gray-500 hover:text-red-400 transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Zone player + sidebar ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Player */}
        <div className="flex-1 bg-black relative">
          {embedUrl ? (
            <>
              {/* Spinner chargement */}
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4">
                  <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Chargement du lecteur…</p>
                    <p className="text-gray-600 text-xs">{HOSTER_LABEL[activeLink.hoster]}</p>
                  </div>
                </div>
              )}
              {/* ⚠️  PAS de sandbox — il bloquerait le player vidéo */}
              <iframe
                key={`${iframeKey}-${embedUrl}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-none"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setLoading(false)}
              />
            </>
          ) : (
            /* Hébergeur sans embed → lien externe */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center p-8">
              {item.poster_url && !imgErr && (
                <img src={item.poster_url} alt="" onError={() => setImgErr(true)}
                  className="w-28 h-40 object-cover rounded-2xl opacity-50 shadow-2xl" />
              )}
              <div>
                <p className="text-white font-semibold text-base mb-2">
                  {HOSTER_LABEL[activeLink.hoster]} — lecture externe
                </p>
                <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
                  Cet hébergeur ne supporte pas la lecture intégrée.<br/>
                  La vidéo va s'ouvrir dans un nouvel onglet.
                </p>
              </div>
              <button onClick={openExternal}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600/20 border border-teal-600/40 hover:bg-teal-600/30 rounded-2xl text-teal-400 text-sm font-medium transition-all hover:scale-105">
                <Play className="w-4 h-4 fill-teal-400" />
                Regarder sur {HOSTER_LABEL[activeLink.hoster]}
              </button>
              <p className="text-gray-700 text-[10px]">Si rien ne s'ouvre, désactivez votre bloqueur de pubs</p>
            </div>
          )}
        </div>

        {/* Sidebar sources (si plusieurs liens) */}
        {item.links.length > 1 && (
          <div className="w-52 bg-[#0a0a12] border-l border-gray-800/60 flex flex-col flex-shrink-0">
            <div className="px-3 py-2.5 border-b border-gray-800/50">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Changer de source</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {item.links.map(l => {
                const hasEmbed = !!getEmbedUrl(l.hoster, l.url)
                const isActive = l.id === activeLink.id
                return (
                  <button key={l.id} onClick={() => changeSource(l)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${
                      isActive
                        ? 'bg-teal-600/15 border-teal-600/40'
                        : 'bg-gray-900/40 border-gray-800/40 hover:border-gray-700 hover:bg-gray-800/30'
                    }`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                         style={{ background: HOSTER_COLORS[l.hoster] || '#6b7280' }}>
                      {(l.hoster[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isActive ? 'text-teal-400' : 'text-gray-300'}`}>
                        {HOSTER_LABEL[l.hoster] || l.hoster}
                      </p>
                      <p className="text-[9px] mt-0.5">
                        <span className="text-gray-600">{l.quality}</span>
                        {' · '}
                        {hasEmbed
                          ? <span className="text-teal-500 font-medium">● Intégré</span>
                          : <span className="text-orange-500">↗ Externe</span>
                        }
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="p-2 border-t border-gray-800/50">
              <div className="flex items-start gap-1.5 p-2 bg-blue-500/8 border border-blue-500/15 rounded-lg">
                <Volume2 className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-300/70 text-[9px] leading-relaxed">
                  <span className="text-teal-400">● Intégré</span> = lecture ici directement.<br/>
                  <span className="text-orange-400">↗ Externe</span> = nouvel onglet.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Synopsis bas */}
      {item.overview && (
        <div className="px-4 py-2 border-t border-gray-800/60 bg-[#0a0a12]/60 flex-shrink-0">
          <p className="text-gray-500 text-[11px] line-clamp-1">{item.overview}</p>
        </div>
      )}
    </div>
  )
}

// ── Carte contenu ─────────────────────────────────────────────────────────────
function ContentCard({ item, isAdmin, onPlay, onDelete }: {
  item: Content; isAdmin: boolean
  onPlay: (c: Content, l: ContentLink) => void
  onDelete?: (id: number) => void
}) {
  const [imgErr, setImgErr] = useState(false)
  // Préférer une source avec embed intégré, sinon prendre la première
  const bestLink = item.links.find(l => getEmbedUrl(l.hoster, l.url)) || item.links[0]

  return (
    <div className="bg-[#11101e] border border-gray-800/60 rounded-2xl overflow-hidden hover:border-teal-600/40 hover:shadow-xl hover:shadow-teal-950/20 transition-all duration-300 group flex flex-col">
      {/* Poster cliquable */}
      <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-[#1a1a2e] to-[#0a0a12] overflow-hidden cursor-pointer"
           onClick={() => bestLink && onPlay(item, bestLink)}>
        {item.poster_url && !imgErr
          ? <img src={item.poster_url} alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgErr(true)} />
          : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              {item.content_type === 'film'
                ? <Film className="w-12 h-12 text-gray-700" />
                : <Tv   className="w-12 h-12 text-gray-700" />}
              <p className="text-gray-600 text-[10px] text-center px-4">{item.title}</p>
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-[#11101e] via-[#11101e]/10 to-transparent" />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-14 h-14 rounded-full bg-teal-500/90 backdrop-blur-sm flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${item.content_type === 'film' ? 'bg-blue-600/80' : 'bg-purple-600/80'} text-white`}>
            {item.content_type === 'film' ? 'Film' : 'Série'}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/60 text-gray-300">
            {item.links.length} source{item.links.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="absolute bottom-2 left-2 flex gap-1">
          {item.year && (
            <span className="text-[10px] text-gray-200 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
              {item.year}
            </span>
          )}
          <span className="text-[10px] text-gray-200 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" />{item.view_count}
          </span>
        </div>
      </div>

      {/* Infos */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-white font-semibold text-xs leading-snug line-clamp-2">{item.title}</h3>
        {item.genre && <p className="text-gray-500 text-[10px]">{item.genre}</p>}
        {item.rating !== null && item.rating > 0 && <Stars r={item.rating} />}
        {item.overview && (
          <p className="text-gray-600 text-[10px] leading-relaxed line-clamp-2 flex-1">{item.overview}</p>
        )}

        {/* Logos sources + boutons */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex gap-1">
            {item.links.slice(0, 5).map(l => {
              const hasEmbed = !!getEmbedUrl(l.hoster, l.url)
              return (
                <div key={l.id} title={`${HOSTER_LABEL[l.hoster] || l.hoster}${hasEmbed ? ' — intégré' : ' — externe'}`}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold text-white ${hasEmbed ? 'ring-1 ring-teal-400/60' : 'opacity-60'}`}
                  style={{ background: HOSTER_COLORS[l.hoster] || '#6b7280' }}>
                  {(l.hoster[0] || '?').toUpperCase()}
                </div>
              )
            })}
          </div>
          <div className="flex gap-1">
            {isAdmin && (
              <button onClick={e => { e.stopPropagation(); onDelete?.(item.id) }}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 text-red-400 transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            {bestLink && (
              <button onClick={() => onPlay(item, bestLink)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600/20 border border-teal-600/40 hover:bg-teal-600/30 text-teal-400 text-[10px] font-medium transition-all">
                <Play className="w-2.5 h-2.5 fill-teal-400" />Regarder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Formulaire ajout admin ─────────────────────────────────────────────────────
function AddForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    title: '', year: '', content_type: 'film', genre: '',
    overview: '', poster_url: '', rating: '', quality: '1080p',
  })
  const [links, setLinks] = useState([{ url: '', hoster: 'vidoza', quality: '1080p' }])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const HOSTERS = ['vidoza','doodstream','streamtape','voe','mixdrop','filemoon','sendvid','sibnet','uptobox','autre']
  const inp = "w-full px-3 py-2 bg-[#0a0a12] border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"
  const lbl = "block text-[10px] font-medium text-gray-400 mb-1"

  const submit = async () => {
    if (!form.title) { setError('Le titre est requis.'); return }
    setSaving(true); setError('')
    try {
      await api('POST', '/direct', {
        ...form,
        rating: form.rating ? parseFloat(form.rating) : null,
        links: links.filter(l => l.url.trim()).map(l => ({ ...l, url: getStorageUrl(l.url) })),
      })
      onAdded(); onClose()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-gray-700/60 rounded-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-2xl"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
          <h2 className="text-sm font-semibold text-white">Ajouter un contenu</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lbl}>Titre *</label>
              <input className={inp} placeholder="Inception" value={form.title}
                onChange={e => setForm(p => ({...p, title: e.target.value}))} />
            </div>
            <div>
              <label className={lbl}>Année</label>
              <input className={inp} placeholder="2010" value={form.year}
                onChange={e => setForm(p => ({...p, year: e.target.value}))} />
            </div>
            <div>
              <label className={lbl}>Type</label>
              <select className={inp} value={form.content_type}
                onChange={e => setForm(p => ({...p, content_type: e.target.value}))}>
                <option value="film">Film</option>
                <option value="serie">Série</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Genre</label>
              <input className={inp} placeholder="Action, Thriller…" value={form.genre}
                onChange={e => setForm(p => ({...p, genre: e.target.value}))} />
            </div>
            <div>
              <label className={lbl}>Note TMDB (0–10)</label>
              <input className={inp} placeholder="8.8" type="number" min="0" max="10" step="0.1"
                value={form.rating} onChange={e => setForm(p => ({...p, rating: e.target.value}))} />
            </div>
            <div>
              <label className={lbl}>Qualité</label>
              <select className={inp} value={form.quality}
                onChange={e => setForm(p => ({...p, quality: e.target.value}))}>
                {['4K','1080p','720p','480p','SD'].map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>URL Poster (TMDB recommandé)</label>
              <input className={inp} placeholder="https://image.tmdb.org/t/p/w342/…" value={form.poster_url}
                onChange={e => setForm(p => ({...p, poster_url: e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Synopsis</label>
              <textarea className={`${inp} resize-none`} rows={2} placeholder="Description…"
                value={form.overview} onChange={e => setForm(p => ({...p, overview: e.target.value}))} />
            </div>
          </div>

          {/* ── Liens sources ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${lbl} mb-0`}>Sources vidéo</label>
              <button onClick={() => setLinks(p => [...p, { url: '', hoster: 'vidoza', quality: '1080p' }])}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-600/10 border border-teal-600/20 hover:bg-teal-600/20 text-teal-400 text-[10px] transition-all">
                <Plus className="w-3 h-3" />Ajouter une source
              </button>
            </div>

            <div className="space-y-3">
              {links.map((l, i) => {
                const embedOk = l.url ? getEmbedUrl(l.hoster, l.url) !== null : null
                const storedUrl = l.url ? getStorageUrl(l.url) : ''
                return (
                  <div key={i} className="bg-[#0f0f1a] border border-gray-800/60 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2 items-center">
                      <select className={`${inp} flex-1`} value={l.hoster}
                        onChange={e => setLinks(p => p.map((x,j) => j===i ? {...x, hoster: e.target.value} : x))}>
                        {HOSTERS.map(h => <option key={h} value={h}>{HOSTER_LABEL[h] || h}</option>)}
                      </select>
                      <select className={`${inp} w-20 flex-shrink-0`} value={l.quality}
                        onChange={e => setLinks(p => p.map((x,j) => j===i ? {...x, quality: e.target.value} : x))}>
                        {['4K','1080p','720p','480p'].map(q => <option key={q}>{q}</option>)}
                      </select>
                      <button onClick={() => setLinks(p => p.filter((_,j) => j!==i))}
                        className="text-gray-600 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Exemple de code embed */}
                    {HOSTER_EXAMPLES[l.hoster] && (
                      <div className="bg-[#0a0a12] border border-gray-700/50 rounded-lg p-2">
                        <p className="text-[9px] text-gray-600 mb-1 uppercase tracking-wider">Exemple attendu :</p>
                        <p className="text-[9px] text-gray-500 font-mono leading-relaxed break-all select-all">
                          {HOSTER_EXAMPLES[l.hoster]}
                        </p>
                      </div>
                    )}

                    <div className="relative">
                      <textarea
                        className={`${inp} resize-none font-mono`}
                        rows={3}
                        placeholder={`Collez le code <iframe> ou l'URL embed de ${HOSTER_LABEL[l.hoster] || l.hoster}`}
                        value={l.url}
                        onChange={e => setLinks(p => p.map((x,j) => j===i ? {...x, url: e.target.value} : x))}
                      />
                      {l.url && embedOk !== null && (
                        <span className={`absolute right-2.5 bottom-2.5 text-[9px] font-semibold ${embedOk ? 'text-teal-400' : 'text-orange-400'}`}>
                          {embedOk ? '● Lecture intégrée' : '↗ Ouverture externe'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-[11px] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button onClick={submit} disabled={saving || !form.title}
            className="w-full py-2.5 rounded-xl bg-teal-600/20 border border-teal-600/40 hover:bg-teal-600/30 disabled:opacity-50 text-teal-400 text-xs font-medium transition-all flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Enregistrement…' : 'Ajouter le contenu'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export function Direct() {
  const [content, setContent]   = useState<Content[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('')
  const [typeFilter, setType]   = useState<'all'|'film'|'serie'>('all')
  const [player, setPlayer]     = useState<{ item: Content; link: ContentLink } | null>(null)
  const [adding, setAdding]     = useState(false)
  const [isAdmin] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('user') || '{}').is_admin } catch { return false }
  })

  const load = async () => {
    setLoading(true); setError('')
    try { setContent((await api<{ content: Content[] }>('GET', '/direct')).content) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handlePlay = async (item: Content, link: ContentLink) => {
    // Incrémenter le compteur de vues
    await fetch(`${BASE}/direct/${item.id}/view`, { method: 'POST', headers: authH() }).catch(() => {})
    setPlayer({ item, link })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce contenu ?')) return
    try { await api('DELETE', `/direct/${id}`); await load() }
    catch (e: any) { setError(e.message) }
  }

  const filtered = content
    .filter(c => typeFilter === 'all' || c.content_type === typeFilter)
    .filter(c => [c.title, c.genre, c.year].join(' ').toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="min-h-screen p-5">
      {player && (
        <PlayerModal item={player.item} initialLink={player.link} onClose={() => setPlayer(null)} />
      )}
      {adding && (
        <AddForm onClose={() => setAdding(false)} onAdded={load} />
      )}

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-teal-900/30">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              <h1 className="text-2xl font-semibold text-white">Streaming direct</h1>
            </div>
            <p className="text-gray-500 text-xs">Films & séries — lecture intégrée ou lien externe</p>
          </div>
          {isAdmin && (
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600/20 border border-teal-600/40 hover:bg-teal-600/30 rounded-xl text-teal-400 text-xs font-medium transition-all">
              <Plus className="w-3.5 h-3.5" />Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Bandeau info */}
      <div className="max-w-5xl mx-auto mb-5 flex gap-3 bg-teal-500/8 border border-teal-500/20 rounded-xl p-3.5">
        <Link2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
        <p className="text-teal-300/80 text-[11px] leading-relaxed">
          Les vidéos sont hébergées sur des services externes (Vidoza, Doodstream, Streamtape…).
          Les sources <span className="text-teal-400 font-semibold">● intégrées</span> se lisent directement ici dans le player.
          Les sources <span className="text-orange-400 font-semibold">↗ externes</span> (Uptobox…) s'ouvrent dans un nouvel onglet.
          Désactivez votre bloqueur de publicités si le player ne charge pas.
        </p>
      </div>

      {/* Filtres */}
      <div className="max-w-5xl mx-auto mb-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Rechercher un film ou une série…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#1a1a2e]/80 border border-gray-700/50 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all" />
        </div>
        <div className="flex gap-1 bg-[#0f0f1a] border border-gray-800/50 rounded-xl p-1">
          {(['all','film','serie'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t
                  ? 'bg-teal-600/20 border border-teal-600/40 text-teal-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t === 'all' ? 'Tout' : t === 'film' ? 'Films' : 'Séries'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="max-w-5xl mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">{error}</div>
      )}

      {/* Grille */}
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 text-teal-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Play className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-1">
              {filter ? `Aucun résultat pour "${filter}"` : 'Aucun contenu disponible'}
            </p>
            {isAdmin && !filter && (
              <button onClick={() => setAdding(true)}
                className="mt-4 flex items-center gap-1.5 mx-auto px-4 py-2 bg-teal-600/20 border border-teal-600/40 hover:bg-teal-600/30 rounded-xl text-teal-400 text-xs transition-all">
                <Plus className="w-3.5 h-3.5" />Ajouter le premier contenu
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">
              {filtered.length} titre{filtered.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-3 gap-4">
              {filtered.map(c => (
                <ContentCard key={c.id} item={c} isAdmin={isAdmin} onPlay={handlePlay} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
