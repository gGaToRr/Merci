import { useState, useEffect } from 'react'
import { Camera, Lock, LogOut, Loader2, CheckCircle, AlertCircle,
         Edit3, Save, X, Music2, Eye, Calendar, ShieldCheck, UserCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { api, type User } from '../api'

function Avatar({ user, size = 80, onClick }: { user: User | null; size?: number; onClick?: () => void }) {
  const [imgErr, setImgErr] = useState(false)
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??'
  if (user?.avatar_url && !imgErr) {
    return (
      <div className="relative group cursor-pointer flex-shrink-0" style={{ width: size, height: size }} onClick={onClick}>
        <img src={user.avatar_url} alt={user.username} onError={() => setImgErr(true)}
          className="w-full h-full rounded-full object-cover border-2 border-white/10 shadow-xl" />
        {onClick && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-5 h-5 text-white" /></div>}
      </div>
    )
  }
  return (
    <div className="relative group cursor-pointer flex-shrink-0" style={{ width: size, height: size }} onClick={onClick}>
      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-2 border-white/10 shadow-xl" style={{ fontSize: size * 0.3 }}>
        <span className="text-white font-bold">{initials}</span>
      </div>
      {onClick && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-5 h-5 text-white" /></div>}
    </div>
  )
}

export function Profile() {
  const navigate = useNavigate()
  const [user, setUser]               = useState<User | null>(null)
  const [loading, setLoading]         = useState(true)
  const [editMode, setEditMode]       = useState(false)
  const [bio, setBio]                 = useState('')
  const [avatarUrl, setAvatarUrl]     = useState('')
  const [saving, setSaving]           = useState(false)
  const [profileMsg, setProfileMsg]   = useState<{ type: 'ok'|'err'; text: string } | null>(null)
  const [oldPwd, setOldPwd]           = useState('')
  const [newPwd, setNewPwd]           = useState('')
  const [pwdLoading, setPwdLoading]   = useState(false)
  const [pwdMsg, setPwdMsg]           = useState<{ type: 'ok'|'err'; text: string } | null>(null)
  const [showPwdForm, setShowPwdForm] = useState(false)

  useEffect(() => {
    api.me().then(u => { setUser(u); setBio(u.bio||''); setAvatarUrl(u.avatar_url||''); setLoading(false) })
      .catch(() => navigate('/login'))
  }, [])

  const saveProfile = async () => {
    setSaving(true); setProfileMsg(null)
    try {
      const res = await api.updateProfile(bio, avatarUrl)
      setUser(res.user); localStorage.setItem('user', JSON.stringify(res.user))
      setProfileMsg({ type: 'ok', text: 'Profil mis à jour !' }); setEditMode(false)
      setTimeout(() => setProfileMsg(null), 3000)
    } catch (e: any) { setProfileMsg({ type: 'err', text: e.message }) }
    finally { setSaving(false) }
  }

  const changePwd = async () => {
    if (!oldPwd || !newPwd) return
    setPwdLoading(true); setPwdMsg(null)
    try {
      await api.changePassword(oldPwd, newPwd)
      setPwdMsg({ type: 'ok', text: 'Mot de passe modifié.' })
      setOldPwd(''); setNewPwd(''); setShowPwdForm(false)
      setTimeout(() => setPwdMsg(null), 4000)
    } catch (e: any) { setPwdMsg({ type: 'err', text: e.message }) }
    finally { setPwdLoading(false) }
  }

  const handleLogout = async () => {
    try { await api.logout() } catch {}
    localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : ''
  const daysActive = user?.created_at ? Math.floor((Date.now()-new Date(user.created_at).getTime())/(1000*60*60*24)) : 0
  const inp = "w-full px-3 py-2.5 bg-[#0a0a12] border border-gray-700 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e]">
      {/* Bannière */}
      <div className="relative w-full h-36 sm:h-48 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b69 50%, #0f3d2f 100%)' }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 60%, #3b82f6 0%, transparent 45%), radial-gradient(circle at 75% 20%, #8b5cf6 0%, transparent 45%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0f0f1a] to-transparent" />
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 pb-10">
        {/* Header profil — avatar + boutons */}
        <div className="-mt-12 sm:-mt-14 mb-4">
          <div className="flex items-end gap-3">
            {/* Avatar */}
            <Avatar
              user={{ ...user!, avatar_url: editMode ? (avatarUrl||null) : user?.avatar_url||null }}
              size={88}
              onClick={() => setEditMode(true)}
            />

            {/* Boutons à droite — sur la même ligne que l'avatar */}
            <div className="flex gap-2 mb-1 ml-auto">
              {!editMode
                ? <button onClick={() => setEditMode(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all backdrop-blur-sm">
                    <Edit3 className="w-3.5 h-3.5"/>Modifier
                  </button>
                : <>
                    <button onClick={() => { setEditMode(false); setBio(user?.bio||''); setAvatarUrl(user?.avatar_url||'') }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700 text-gray-400 text-xs transition-all">
                      <X className="w-3.5 h-3.5"/>Annuler
                    </button>
                    <button onClick={saveProfile} disabled={saving}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all disabled:opacity-60">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>}Sauvegarder
                    </button>
                  </>
              }
              {/* Logout — séparé et aligné */}
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 border border-red-600/30 hover:bg-red-600/30 text-red-400 text-xs font-medium transition-all">
                <LogOut className="w-3.5 h-3.5"/>
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Identité */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white">@{user?.username}</h1>
            {user?.is_admin && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-600/20 border border-blue-600/40 rounded-full text-blue-400 text-[11px] font-semibold">
                <ShieldCheck className="w-3 h-3"/>Admin
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <div className="flex items-center gap-1 mt-1 text-gray-600 text-xs">
            <Calendar className="w-3 h-3"/>
            <span>Membre depuis {joinDate}</span>
          </div>
        </div>

        {/* Feedback profil */}
        {profileMsg && (
          <div className={`flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl text-xs border ${profileMsg.type==='ok'?'bg-green-500/10 border-green-500/30 text-green-400':'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {profileMsg.type==='ok'?<CheckCircle className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>} {profileMsg.text}
          </div>
        )}

        {/* Formulaire édition */}
        {editMode && (
          <div className="bg-[#1a1a2e]/90 border border-gray-700/50 rounded-2xl p-4 mb-4 space-y-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <UserCircle2 className="w-4 h-4 text-blue-400"/>Modifier le profil
            </h3>
            <div>
              <label className="block text-[11px] text-gray-400 font-medium mb-2">Photo de profil (URL publique)</label>
              <div className="flex gap-3 items-center">
                <Avatar user={{ ...user!, avatar_url: avatarUrl||null }} size={44} />
                <input className={inp} placeholder="https://i.imgur.com/photo.jpg" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
              </div>
              <p className="text-gray-600 text-[10px] mt-1">Imgur, Gravatar, Discord CDN…</p>
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 font-medium mb-1.5">
                Bio <span className="text-gray-600">({bio.length}/200)</span>
              </label>
              <textarea className={`${inp} resize-none`} rows={3} maxLength={200}
                placeholder="Parle de toi…" value={bio} onChange={e => setBio(e.target.value)} />
            </div>
          </div>
        )}

        {/* Bio affichée */}
        {!editMode && (
          <div className="mb-5">
            {user?.bio
              ? <p className="text-gray-300 text-sm leading-relaxed bg-[#1a1a2e]/40 border border-gray-800/50 rounded-xl px-4 py-3">{user.bio}</p>
              : <button onClick={() => setEditMode(true)} className="text-gray-600 text-sm hover:text-gray-400 italic transition-colors">+ Ajouter une bio…</button>
            }
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
          {[
            { icon: Music2,   label: 'Téléchargements', value: '—',       color: 'text-blue-400 bg-blue-600/15'   },
            { icon: Eye,      label: 'Films regardés',  value: '—',       color: 'text-teal-400 bg-teal-600/15'   },
            { icon: Calendar, label: 'Jours actif',     value: daysActive, color: 'text-purple-400 bg-purple-600/15' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[#1a1a2e]/60 border border-gray-700/40 rounded-2xl p-3 sm:p-4 text-center">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-white font-bold text-lg">{value}</p>
              <p className="text-gray-500 text-[10px] leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Sécurité */}
        <div className="bg-[#1a1a2e]/80 border border-gray-700/40 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500"/>Sécurité
            </h3>
            <button onClick={() => setShowPwdForm(!showPwdForm)} className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
              {showPwdForm ? 'Masquer' : 'Changer le mot de passe'}
            </button>
          </div>

          {pwdMsg && (
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl text-xs border ${pwdMsg.type==='ok'?'bg-green-500/10 border-green-500/30 text-green-400':'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {pwdMsg.type==='ok'?<CheckCircle className="w-3.5 h-3.5"/>:<AlertCircle className="w-3.5 h-3.5"/>} {pwdMsg.text}
            </div>
          )}

          {showPwdForm
            ? <div className="space-y-2.5">
                <input type="password" className={inp} placeholder="Mot de passe actuel" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
                <input type="password" className={inp} placeholder="Nouveau mot de passe (min. 8 caractères)" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                <button onClick={changePwd} disabled={pwdLoading || !oldPwd || !newPwd || newPwd.length < 8}
                  className="w-full py-2.5 rounded-xl bg-blue-600/20 border border-blue-600/40 hover:bg-blue-600/30 text-blue-400 text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                  {pwdLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Lock className="w-3.5 h-3.5"/>}Mettre à jour
                </button>
              </div>
            : <div className="flex items-center gap-2 text-gray-600 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                <span>Compte sécurisé</span>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
