import { useState, useEffect } from 'react'
import { ShieldCheck, Users, Activity, ToggleLeft, ToggleRight, Loader2, RefreshCw,
         CheckCircle, XCircle, Plus, Trash2, KeyRound, Film, Tv, Sparkles,
         Eye, EyeOff, Search, Edit2, Star, TrendingUp, Database,
         UserCheck, UserX, Link, Filter, ChevronDown, Clapperboard } from 'lucide-react'

const BASE = '/api'
function authH() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` } }
async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method, headers: authH(), ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
  return data as T
}

interface User { id: number; username: string; email: string; is_admin: boolean; is_active: boolean; created_at: string; last_login: string | null }
interface Stats { users: { total: number; active: number; admin: number }; logins: { successful: number; failed: number }; content: { total: number; films: number; series: number } }
interface LoginAttempt { id: number; username: string; success: boolean; ip_address: string; timestamp: string }
interface ContentItem { id: number; title: string; year: string; content_type: string; genre: string; tags: string[]; rating: number | null; view_count: number; is_active: boolean; poster_url: string | null; overview: string; links: { id: number; hoster: string; url: string; quality: string }[] }

type Tab = 'overview' | 'users' | 'content' | 'logs' | 'create'

// ── Sous-onglets contenu ─────────────────────────────────────────────────────
type ContentSection = 'all' | 'film' | 'serie' | 'anime'

const HOSTER_COLORS: Record<string, string> = {
  doodstream:'#e05252', streamtape:'#f59e0b', vidoza:'#3b82f6', uptobox:'#8b5cf6',
  voe:'#10b981', mixdrop:'#f97316', filemoon:'#ec4899', sendvid:'#14b8a6',
  sibnet:'#6366f1', myvidplay:'#7c3aed', autre:'#6b7280',
}

function HosterBadge({ hoster }: { hoster: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
      style={{ background: HOSTER_COLORS[hoster] || '#6b7280' }}>
      {hoster[0]?.toUpperCase()}{hoster.slice(1,4)}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const cfg: Record<string, string> = {
    film:  'bg-blue-600/20 border-blue-600/40 text-blue-400',
    serie: 'bg-purple-600/20 border-purple-600/40 text-purple-400',
    anime: 'bg-pink-600/20 border-pink-600/40 text-pink-400',
  }
  const icons: Record<string, typeof Film> = { film: Film, serie: Tv, anime: Sparkles }
  const Icon = icons[type] || Film
  const labels: Record<string, string> = { film: 'Film', serie: 'Série', anime: 'Animé' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cfg[type] || cfg.film}`}>
      <Icon className="w-2.5 h-2.5" />{labels[type] || type}
    </span>
  )
}

// ── Tab Contenu CRUD ─────────────────────────────────────────────────────────
function ContentTab({ items, onRefresh, showToast }: { items: ContentItem[]; onRefresh: () => void; showToast: (m: string) => void }) {
  const [section, setSection]     = useState<ContentSection>('all')
  const [search, setSearch]       = useState('')
  const [sortBy, setSortBy]       = useState<'title'|'views'|'rating'|'date'>('date')
  const [sortDir, setSortDir]     = useState<'asc'|'desc'>('desc')
  const [expanded, setExpanded]   = useState<number | null>(null)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [toggling, setToggling]   = useState<number | null>(null)

  const filtered = items
    .filter(c => section === 'all' || c.content_type === section)
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.genre||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let v = 0
      if (sortBy === 'title')  v = a.title.localeCompare(b.title)
      if (sortBy === 'views')  v = (a.view_count||0) - (b.view_count||0)
      if (sortBy === 'rating') v = (a.rating||0) - (b.rating||0)
      if (sortBy === 'date')   v = a.id - b.id
      return sortDir === 'desc' ? -v : v
    })

  const counts = {
    all:   items.length,
    film:  items.filter(c => c.content_type==='film').length,
    serie: items.filter(c => c.content_type==='serie').length,
    anime: items.filter(c => c.content_type==='anime').length,
  }

  const toggleContent = async (id: number) => {
    setToggling(id)
    try { await apiFetch('PUT', `/admin/content/${id}/toggle`); onRefresh() }
    catch (e: any) { showToast(`❌ ${e.message}`) }
    finally { setToggling(null) }
  }

  const deleteContent = async (id: number, title: string) => {
    if (!confirm(`Supprimer "${title}" définitivement ?`)) return
    setDeleting(id)
    try { await apiFetch('DELETE', `/admin/content/${id}`); onRefresh(); showToast(`🗑️ "${title}" supprimé`) }
    catch (e: any) { showToast(`❌ ${e.message}`) }
    finally { setDeleting(null) }
  }

  const sortBtn = (key: typeof sortBy, label: string) => (
    <button onClick={() => { if(sortBy===key) setSortDir(d=>d==='asc'?'desc':'asc'); else {setSortBy(key); setSortDir('desc')} }}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${sortBy===key?'bg-teal-600/20 border-teal-600/40 text-teal-400':'border-gray-700/40 bg-gray-800/30 text-gray-500 hover:text-gray-300'}`}>
      {label}{sortBy===key && <ChevronDown className={`w-2.5 h-2.5 transition-transform ${sortDir==='asc'?'rotate-180':''}`}/>}
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Sous-sections */}
      <div className="flex gap-2 flex-wrap">
        {([['all','Tous',null],['film','Films',Film],['serie','Séries',Tv],['anime','Animés',Sparkles]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setSection(key as ContentSection)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${section===key?'bg-teal-600/20 border-teal-600/40 text-teal-400':'border-gray-700/40 bg-gray-800/30 text-gray-500 hover:text-gray-300'}`}>
            {Icon && <Icon className="w-3.5 h-3.5"/>}
            {label}
            <span className={`text-[10px] px-1.5 rounded-full ${section===key?'bg-teal-500/20 text-teal-300':'bg-gray-700/60 text-gray-500'}`}>
              {counts[key as ContentSection]}
            </span>
          </button>
        ))}
      </div>

      {/* Recherche + tri */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un titre, genre…"
            className="w-full pl-9 pr-3 py-2 bg-[#0a0a14] border border-gray-700/50 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"/>
        </div>
        <div className="flex gap-1.5 items-center">
          <Filter className="w-3.5 h-3.5 text-gray-600"/>
          {sortBtn('date','Date')}{sortBtn('title','Titre')}{sortBtn('views','Vues')}{sortBtn('rating','Note')}
        </div>
      </div>

      {/* Résumé */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          <span className="text-white font-medium">{filtered.length}</span> résultat{filtered.length>1?'s':''}
          {search && <span className="text-gray-600"> pour « {search} »</span>}
        </p>
        <div className="flex gap-3 text-[10px] text-gray-600">
          <span className="text-green-400">{items.filter(c=>c.is_active).length} actifs</span>
          <span className="text-gray-600">{items.filter(c=>!c.is_active).length} masqués</span>
          <span className="text-blue-400">{items.reduce((a,c)=>a+(c.view_count||0),0)} vues totales</span>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <Clapperboard className="w-10 h-10 text-gray-700 mx-auto mb-3"/>
          <p className="text-gray-500 text-sm">Aucun contenu {search ? `correspondant à « ${search} »` : 'dans cette catégorie'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className={`bg-[#1a1a2e]/60 border rounded-xl overflow-hidden transition-all ${c.is_active?'border-gray-700/50':'border-gray-800/30 opacity-60'}`}>
              {/* Ligne principale */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Poster miniature */}
                <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800/60 border border-gray-700/40">
                  {c.poster_url
                    ? <img src={c.poster_url} alt="" className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center"><Film className="w-4 h-4 text-gray-600"/></div>
                  }
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white text-sm font-semibold truncate max-w-[200px]">{c.title}</span>
                    {c.year && <span className="text-gray-500 text-[10px]">{c.year}</span>}
                    <TypeBadge type={c.content_type}/>
                    {!c.is_active && <span className="px-1.5 py-0.5 bg-gray-700/40 text-gray-500 text-[9px] rounded-full border border-gray-600/30">Masqué</span>}
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {c.genre && <span className="text-gray-500 text-[10px]">{c.genre}</span>}
                    {c.rating && c.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
                        <Star className="w-2.5 h-2.5 fill-yellow-400"/>{c.rating.toFixed(1)}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-gray-500 text-[10px]">
                      <Eye className="w-2.5 h-2.5"/>{c.view_count||0} vues
                    </span>
                    {/* Badges hébergeurs */}
                    <div className="flex gap-1">
                      {c.links?.slice(0,4).map(l => <HosterBadge key={l.id} hoster={l.hoster}/>)}
                      {(c.links?.length||0) > 4 && <span className="text-[9px] text-gray-600">+{(c.links?.length||0)-4}</span>}
                    </div>
                    {/* Tags */}
                    {c.tags?.slice(0,2).map(t => (
                      <span key={t} className="px-1.5 py-0.5 bg-teal-900/20 border border-teal-800/30 text-teal-400 text-[9px] rounded-full">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setExpanded(expanded===c.id ? null : c.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700/30 border border-gray-600/30 hover:bg-gray-600/40 text-gray-400 hover:text-white transition-all">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded===c.id?'rotate-180':''}`}/>
                  </button>
                  <button onClick={() => toggleContent(c.id)} disabled={toggling===c.id}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${c.is_active?'bg-green-600/10 border-green-600/30 text-green-400 hover:bg-red-600/10 hover:border-red-600/30 hover:text-red-400':'bg-gray-700/20 border-gray-600/20 text-gray-500 hover:bg-green-600/10 hover:border-green-600/30 hover:text-green-400'}`}>
                    {toggling===c.id ? <Loader2 className="w-3 h-3 animate-spin"/> : c.is_active ? <ToggleRight className="w-3.5 h-3.5"/> : <ToggleLeft className="w-3.5 h-3.5"/>}
                    {c.is_active ? 'Actif' : 'Masqué'}
                  </button>
                  <button onClick={() => deleteContent(c.id, c.title)} disabled={deleting===c.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600/10 border border-red-600/20 hover:bg-red-600/25 text-red-400 transition-all">
                    {deleting===c.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3"/>}
                  </button>
                </div>
              </div>

              {/* Panneau expandé — détails */}
              {expanded === c.id && (
                <div className="border-t border-gray-700/40 px-4 py-3 bg-black/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Synopsis */}
                    {c.overview && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Synopsis</p>
                        <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-3">{c.overview}</p>
                      </div>
                    )}
                    {/* Sources */}
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Sources vidéo ({c.links?.length||0})</p>
                      <div className="space-y-1.5">
                        {c.links?.map(l => (
                          <div key={l.id} className="flex items-center gap-2 bg-gray-800/30 rounded-lg px-2.5 py-1.5">
                            <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                                 style={{ background: HOSTER_COLORS[l.hoster]||'#6b7280' }}>
                              {l.hoster[0]?.toUpperCase()}
                            </div>
                            <span className="text-white text-[10px] font-medium flex-shrink-0">{l.hoster}</span>
                            <span className="text-gray-500 text-[9px] flex-shrink-0">{l.quality}</span>
                            <a href={l.url} target="_blank" rel="noopener" className="flex items-center gap-0.5 text-blue-400 text-[9px] hover:text-blue-300 ml-auto flex-shrink-0">
                              <Link className="w-2.5 h-2.5"/> Lien
                            </a>
                          </div>
                        ))}
                        {(!c.links || c.links.length===0) && <p className="text-gray-600 text-[10px] italic">Aucune source</p>}
                      </div>
                    </div>
                    {/* Tags */}
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {c.tags?.length ? c.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-teal-900/20 border border-teal-800/30 text-teal-400 text-[10px] rounded-full">{t}</span>
                        )) : <span className="text-gray-600 text-[10px] italic">Aucun tag</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export function Admin() {
  const [tab, setTab]             = useState<Tab>('overview')
  const [users, setUsers]         = useState<User[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [attempts, setAttempts]   = useState<LoginAttempt[]>([])
  const [content, setContent]     = useState<ContentItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [toast, setToast]         = useState('')
  const [toggling, setToggling]   = useState<number | null>(null)
  const [newUser, setNewUser]     = useState({ username: '', email: '', password: '', is_admin: false })
  const [showPwd, setShowPwd]     = useState(false)
  const [creating, setCreating]   = useState(false)
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [resetPwd, setResetPwd]   = useState('')
  const [userSearch, setUserSearch] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [s, u, a, c] = await Promise.all([
        apiFetch<Stats>('GET', '/admin/stats'),
        apiFetch<{ users: User[] }>('GET', '/admin/users'),
        apiFetch<{ attempts: LoginAttempt[] }>('GET', '/admin/login-attempts?per_page=50'),
        apiFetch<{ content: ContentItem[] }>('GET', '/direct'),
      ])
      setStats(s); setUsers(u.users); setAttempts(a.attempts)
      setContent((c as any).content || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const toggleAdmin  = async (id: number) => { setToggling(id); try { await apiFetch('PUT', `/admin/users/${id}/toggle-admin`); await load(); showToast('Rôle modifié ✓') } catch (e: any) { showToast(`❌ ${e.message}`) } finally { setToggling(null) } }
  const toggleActive = async (id: number) => { setToggling(id); try { await apiFetch('PUT', `/admin/users/${id}/toggle-active`); await load(); showToast('Statut modifié ✓') } catch (e: any) { showToast(`❌ ${e.message}`) } finally { setToggling(null) } }
  const deleteUser   = async (id: number, name: string) => { if(!confirm(`Supprimer @${name} ?`)) return; try { await apiFetch('DELETE', `/admin/users/${id}`); await load(); showToast(`🗑️ @${name} supprimé`) } catch (e: any) { showToast(`❌ ${e.message}`) } }
  const createUser   = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) return
    setCreating(true)
    try { await apiFetch('POST', '/admin/users', newUser); await load(); setTab('users'); setNewUser({ username:'', email:'', password:'', is_admin:false }); showToast('Compte créé ✓') }
    catch (e: any) { showToast(`❌ ${e.message}`) } finally { setCreating(false) }
  }
  const resetPassword = async () => {
    if (!resetTarget || !resetPwd) return
    try { await apiFetch('PUT', `/admin/users/${resetTarget.id}/reset-password`, { new_password: resetPwd }); setResetTarget(null); setResetPwd(''); showToast('Mot de passe réinitialisé ✓') }
    catch (e: any) { showToast(`❌ ${e.message}`) }
  }

  const TABS: { key: Tab; icon: typeof ShieldCheck; label: string; count?: number }[] = [
    { key: 'overview', icon: TrendingUp,  label: 'Vue d\'ensemble' },
    { key: 'users',    icon: Users,       label: 'Utilisateurs', count: users.length },
    { key: 'content',  icon: Clapperboard,label: 'Contenus',     count: content.length },
    { key: 'logs',     icon: Activity,    label: 'Connexions',   count: attempts.length },
    { key: 'create',   icon: Plus,        label: 'Créer compte' },
  ]

  const inp = "w-full px-3 py-2.5 bg-[#0a0a12] border border-gray-700 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-all"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1a1a2e] border border-gray-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 max-w-xs">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0"/>
          {toast}
        </div>
      )}

      {/* Modal reset password */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-gray-700/60 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-semibold mb-1">Réinitialiser le mot de passe</h3>
            <p className="text-gray-500 text-xs mb-4">Compte : @{resetTarget.username}</p>
            <input type="password" className={inp} placeholder="Nouveau mot de passe" value={resetPwd} onChange={e=>setResetPwd(e.target.value)} />
            <div className="flex gap-2 mt-3">
              <button onClick={() => {setResetTarget(null);setResetPwd('')}} className="flex-1 py-2 rounded-xl bg-gray-800 text-gray-400 text-xs hover:bg-gray-700 transition-all">Annuler</button>
              <button onClick={resetPassword} disabled={!resetPwd} className="flex-1 py-2 rounded-xl bg-yellow-600/80 hover:bg-yellow-500/80 text-white text-xs font-medium disabled:opacity-50 transition-all">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-5 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/30">
              <ShieldCheck className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Administration</h1>
              <p className="text-gray-500 text-xs">Gestion complète de la plateforme</p>
            </div>
          </div>
          <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800/40 border border-gray-700/40 hover:bg-gray-700/40 transition-all">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading?'animate-spin':''}`}/>
          </button>
        </div>

        {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">{error}</div>}

        {/* Tabs nav */}
        <div className="flex gap-1.5 sm:gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(({ key, icon: Icon, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                tab===key
                  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                  : 'border-gray-700/40 bg-gray-800/30 text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}>
              <Icon className="w-3.5 h-3.5"/>
              {label}
              {count !== undefined && (
                <span className={`text-[10px] px-1.5 rounded-full ${tab===key?'bg-yellow-500/20 text-yellow-300':'bg-gray-700/60 text-gray-500'}`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-yellow-400 animate-spin"/></div>
        )}

        {!loading && (
          <>
            {/* ── Vue d'ensemble ───────────────────────────────────────── */}
            {tab === 'overview' && stats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { l:'Utilisateurs',   v:stats.users.total,       c:'from-blue-600 to-blue-700',     t:'text-blue-400',   icon:Users },
                    { l:'Actifs',         v:stats.users.active,      c:'from-green-600 to-green-700',   t:'text-green-400',  icon:UserCheck },
                    { l:'Admins',         v:stats.users.admin,       c:'from-yellow-600 to-orange-600', t:'text-yellow-400', icon:ShieldCheck },
                    { l:'Contenus',       v:stats.content.total,     c:'from-purple-600 to-purple-700', t:'text-purple-400', icon:Film },
                    { l:'Connexions 7j',  v:stats.logins.successful, c:'from-teal-600 to-teal-700',     t:'text-teal-400',   icon:TrendingUp },
                    { l:'Échecs 7j',      v:stats.logins.failed,     c:'from-red-600 to-red-700',       t:'text-red-400',    icon:XCircle },
                  ].map(({ l, v, c, t, icon: Icon }) => (
                    <div key={l} className="bg-[#1a1a2e]/60 border border-gray-700/40 rounded-2xl p-4">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c} flex items-center justify-center mb-3 shadow-lg`}>
                        <Icon className="w-4 h-4 text-white"/>
                      </div>
                      <p className={`text-2xl font-bold ${t}`}>{v}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>

                {/* Contenu par type */}
                <div className="bg-[#1a1a2e]/60 border border-gray-700/40 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-gray-400"/>Répartition des contenus</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label:'Films',  count:content.filter(c=>c.content_type==='film').length,  icon:Film,     color:'bg-blue-600/20 text-blue-400 border-blue-600/30' },
                      { label:'Séries', count:content.filter(c=>c.content_type==='serie').length, icon:Tv,       color:'bg-purple-600/20 text-purple-400 border-purple-600/30' },
                      { label:'Animés', count:content.filter(c=>c.content_type==='anime').length, icon:Sparkles, color:'bg-pink-600/20 text-pink-400 border-pink-600/30' },
                    ].map(({ label, count, icon: Icon, color }) => (
                      <div key={label} className={`flex items-center gap-2.5 p-3 rounded-xl border ${color} bg-opacity-20`}>
                        <Icon className="w-5 h-5 flex-shrink-0"/>
                        <div><p className="text-white font-bold text-lg">{count}</p><p className="text-[10px] opacity-80">{label}</p></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top contenus */}
                <div className="bg-[#1a1a2e]/60 border border-gray-700/40 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-gray-400"/>Top contenus vus</h3>
                  <div className="space-y-2">
                    {[...content].sort((a,b)=>(b.view_count||0)-(a.view_count||0)).slice(0,5).map((c,i) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-5 text-center ${i===0?'text-yellow-400':i===1?'text-gray-400':i===2?'text-orange-600':'text-gray-700'}`}>#{i+1}</span>
                        {c.poster_url && <img src={c.poster_url} alt="" className="w-8 h-11 object-cover rounded-lg flex-shrink-0"/>}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{c.title}</p>
                          <p className="text-gray-500 text-[10px]">{c.year}</p>
                        </div>
                        <span className="text-gray-400 text-xs flex items-center gap-1 flex-shrink-0"><Eye className="w-3 h-3"/>{c.view_count||0}</span>
                      </div>
                    ))}
                    {content.length === 0 && <p className="text-gray-600 text-xs text-center py-4">Aucun contenu enregistré</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Utilisateurs ─────────────────────────────────────────── */}
            {tab === 'users' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none"/>
                  <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Rechercher un utilisateur…"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0a0a14] border border-gray-700/50 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-all"/>
                </div>
                <div className="space-y-2">
                  {users.filter(u=>!userSearch||u.username.toLowerCase().includes(userSearch.toLowerCase())||u.email.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                    <div key={u.id} className={`bg-[#1a1a2e]/60 border border-gray-700/40 rounded-xl p-3.5 transition-all ${!u.is_active?'opacity-60':''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.username.slice(0,2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-medium">@{u.username}</span>
                            {u.is_admin && <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[9px] font-semibold rounded-full"><ShieldCheck className="w-2.5 h-2.5"/>Admin</span>}
                            {!u.is_active && <span className="px-1.5 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 text-[9px] rounded-full">Inactif</span>}
                          </div>
                          <p className="text-gray-500 text-[11px] truncate">{u.email}</p>
                          <p className="text-gray-700 text-[10px]">
                            Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                            {u.last_login && ` · Connexion ${new Date(u.last_login).toLocaleDateString('fr-FR')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setResetTarget(u)} title="Réinitialiser le mot de passe"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700/30 border border-gray-600/30 hover:bg-yellow-600/20 hover:border-yellow-600/30 hover:text-yellow-400 text-gray-500 transition-all">
                            <KeyRound className="w-3 h-3"/>
                          </button>
                          <button onClick={() => toggleAdmin(u.id)} disabled={toggling===u.id} title={u.is_admin?'Retirer admin':'Rendre admin'}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all ${u.is_admin?'bg-yellow-600/15 border-yellow-600/30 text-yellow-400 hover:bg-red-600/15 hover:border-red-600/30 hover:text-red-400':'bg-gray-700/20 border-gray-600/20 text-gray-500 hover:bg-yellow-600/15 hover:border-yellow-600/30 hover:text-yellow-400'}`}>
                            {toggling===u.id?<Loader2 className="w-3 h-3 animate-spin"/>:<ShieldCheck className="w-3 h-3"/>}
                          </button>
                          <button onClick={() => toggleActive(u.id)} disabled={toggling===u.id} title={u.is_active?'Désactiver':'Activer'}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all ${u.is_active?'bg-green-600/10 border-green-600/20 text-green-400 hover:bg-red-600/10 hover:border-red-600/20 hover:text-red-400':'bg-red-600/10 border-red-600/20 text-red-400 hover:bg-green-600/10 hover:border-green-600/20 hover:text-green-400'}`}>
                            {toggling===u.id?<Loader2 className="w-3 h-3 animate-spin"/>:u.is_active?<UserCheck className="w-3 h-3"/>:<UserX className="w-3 h-3"/>}
                          </button>
                          <button onClick={() => deleteUser(u.id, u.username)} title="Supprimer"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600/10 border border-red-600/20 hover:bg-red-600/25 text-red-400 transition-all">
                            <Trash2 className="w-3 h-3"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Contenus ─────────────────────────────────────────────── */}
            {tab === 'content' && (
              <ContentTab items={content} onRefresh={load} showToast={showToast}/>
            )}

            {/* ── Logs ─────────────────────────────────────────────────── */}
            {tab === 'logs' && (
              <div className="bg-[#1a1a2e]/60 border border-gray-700/40 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">Tentatives de connexion</h3>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-green-400 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400"/>Succès</span>
                    <span className="text-red-400 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"/>Échec</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-800/40 max-h-[500px] overflow-y-auto">
                  {attempts.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/2 transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.success?'bg-green-500':'bg-red-500'}`}/>
                      <span className={`text-xs font-mono font-medium w-24 truncate flex-shrink-0 ${a.success?'text-green-300':'text-red-300'}`}>@{a.username}</span>
                      <span className="text-gray-500 text-[10px] flex-1 font-mono">{a.ip_address}</span>
                      <span className="text-gray-600 text-[10px] flex-shrink-0">{new Date(a.timestamp).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
                      <span className={`text-[10px] font-bold w-12 text-right flex-shrink-0 ${a.success?'text-green-400':'text-red-400'}`}>{a.success?'✓ OK':'✗ FAIL'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Créer compte ─────────────────────────────────────────── */}
            {tab === 'create' && (
              <div className="max-w-md">
                <div className="bg-[#1a1a2e]/80 border border-gray-700/50 rounded-2xl p-5 space-y-3">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-yellow-400"/>Créer un compte</h3>
                  <input className={inp} placeholder="Nom d'utilisateur" value={newUser.username} onChange={e=>setNewUser(p=>({...p,username:e.target.value}))}/>
                  <input className={inp} type="email" placeholder="Email" value={newUser.email} onChange={e=>setNewUser(p=>({...p,email:e.target.value}))}/>
                  <div className="relative">
                    <input className={inp} type={showPwd?'text':'password'} placeholder="Mot de passe" value={newUser.password} onChange={e=>setNewUser(p=>({...p,password:e.target.value}))}/>
                    <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPwd?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}
                    </button>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div onClick={()=>setNewUser(p=>({...p,is_admin:!p.is_admin}))}
                      className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${newUser.is_admin?'bg-yellow-500':'bg-gray-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${newUser.is_admin?'translate-x-5':'translate-x-0'}`}/>
                    </div>
                    <span className="text-gray-400 text-xs">Droits administrateur</span>
                  </label>
                  <button onClick={createUser} disabled={creating||!newUser.username||!newUser.email||!newUser.password}
                    className="w-full py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/40 hover:bg-yellow-500/30 text-yellow-400 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                    {creating?<Loader2 className="w-4 h-4 animate-spin"/>:<Plus className="w-4 h-4"/>}
                    {creating?'Création…':'Créer le compte'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
