import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Music2, Zap, Clock4, CheckCircle, XCircle, Loader2, Radio } from 'lucide-react'
import { api, type QueueItem } from '../api'

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: typeof Zap; label: string; cls: string; dot: string }> = {
    downloading: { icon: Zap,         label: 'En cours',   cls: 'text-blue-400 bg-blue-500/10 border-blue-500/30',   dot: 'bg-blue-400 animate-pulse' },
    pending:     { icon: Clock4,      label: 'En attente', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
    done:        { icon: CheckCircle, label: 'Terminé',    cls: 'text-green-400 bg-green-500/10 border-green-500/30',  dot: 'bg-green-400' },
    error:       { icon: XCircle,     label: 'Erreur',     cls: 'text-red-400 bg-red-500/10 border-red-500/30',       dot: 'bg-red-400' },
  }
  const c = cfg[status] || { icon: Clock4, label: status, cls: 'text-gray-400 bg-gray-800 border-gray-700', dot: 'bg-gray-400' }
  const Icon = c.icon
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}

export function Queue() {
  const [items, setItems]     = useState<QueueItem[]>([])
  const [workers, setWorkers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    try {
      const data = await api.queue()
      setItems(data.queue ?? [])
      setWorkers(data.workers ?? 0)
      setError('')
    } catch (e: any) {
      // Normaliser le message d'erreur pour qu'il soit lisible
      const msg: string = e?.message || 'Erreur inconnue'
      setError(msg.includes('500') || msg.includes('Erreur serveur')
        ? 'Le backend ne répond pas correctement. Vérifiez que le serveur est démarré.'
        : msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [load])

  const inProgress = items.filter(i => i.status === 'downloading').length
  const pending    = items.filter(i => i.status === 'pending').length
  const done       = items.filter(i => i.status === 'done').length
  const errors     = items.filter(i => i.status === 'error').length

  const stats = [
    { label: 'En cours',   value: inProgress, color: 'from-blue-600 to-blue-700',   text: 'text-blue-400',   icon: Zap         },
    { label: 'En attente', value: pending,     color: 'from-yellow-600 to-yellow-700', text: 'text-yellow-400', icon: Clock4      },
    { label: 'Terminés',   value: done,        color: 'from-green-600 to-green-700',  text: 'text-green-400',  icon: CheckCircle },
    { label: 'Workers',    value: workers,     color: 'from-gray-600 to-gray-700',    text: 'text-gray-400',   icon: Radio       },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">File d'attente</h1>
              <p className="text-gray-500 text-xs">Actualisation toutes les 3s</p>
            </div>
          </div>
          <button onClick={load}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 transition-all">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map(({ label, value, color, text, icon: Icon }) => (
            <div key={label} className="bg-[#1a1a2e]/80 border border-gray-700/40 rounded-xl p-3.5">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-2.5 shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className={`text-2xl font-bold ${text}`}>{value}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-xs font-medium mb-0.5">Erreur de connexion</p>
              <p className="text-red-400/70 text-[11px]">{error}</p>
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="space-y-2">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-gray-500 text-sm">Chargement…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/60 flex items-center justify-center mx-auto mb-4 border border-gray-700/40">
                <Music2 className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-gray-300 font-semibold mb-1">File vide</h3>
              <p className="text-gray-600 text-sm">Lancez un téléchargement depuis la page Recherche</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-[#1a1a2e]/80 border border-gray-700/40 rounded-xl p-3.5 hover:border-gray-600/60 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Icône */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.status==='downloading' ? 'bg-blue-600/20 border border-blue-600/30' :
                    item.status==='done'        ? 'bg-green-600/20 border border-green-600/30' :
                    item.status==='error'       ? 'bg-red-600/20 border border-red-600/30' :
                    'bg-gray-700/30 border border-gray-700/40'
                  }`}>
                    {item.status==='downloading'
                      ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      : item.status==='done'
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : item.status==='error'
                      ? <XCircle className="w-4 h-4 text-red-400" />
                      : <Music2 className="w-4 h-4 text-gray-400" />
                    }
                  </div>

                  {/* Titre + barre de progression */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate mb-1">{item.title}</p>
                    {item.status === 'downloading' && item.progress !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                               style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="text-blue-400 text-[10px] font-mono flex-shrink-0">{item.progress}%</span>
                      </div>
                    )}
                  </div>

                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))
          )}
        </div>

        {errors > 0 && (
          <p className="text-center text-red-400/60 text-[11px] mt-4">
            {errors} téléchargement{errors>1?'s':''} en erreur — relancez depuis la page Recherche
          </p>
        )}
      </div>
    </div>
  )
}
