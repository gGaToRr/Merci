# ═══════════════════════════════════════════════════════════════════════════════
# ytdlp.py — Couche d'abstraction yt-dlp pour Deezer Downloader
# Auteur  : KAETS
# Rôle    : Récupération des formats disponibles et téléchargement sécurisé
#           via l'API Python de yt-dlp (sans subprocess ni shell=True).
#
# Stratégie de téléchargement :
#   - video+audio (format déjà fusionné) → téléchargement direct, converti MP4
#   - video-only  → téléchargement vidéo + meilleur audio séparé → merge ffmpeg → MP4
#   - audio-only  → meilleure qualité, converti en M4A (ou format natif)
# ═══════════════════════════════════════════════════════════════════════════════

import os
import re
import logging
from urllib.parse import urlparse

import yt_dlp

from deezer_downloader.configuration import config

logger = logging.getLogger(__name__)

# ── Liste blanche de domaines autorisés ─────────────────────────────────────
ALLOWED_DOMAINS = {
    "youtube.com", "www.youtube.com", "youtu.be", "music.youtube.com",
    "vimeo.com", "www.vimeo.com",
    "dailymotion.com", "www.dailymotion.com",
    "twitch.tv", "www.twitch.tv", "clips.twitch.tv",
    "soundcloud.com", "www.soundcloud.com",
    "twitter.com", "www.twitter.com", "x.com",
    "instagram.com", "www.instagram.com",
    "tiktok.com", "www.tiktok.com",
    "bilibili.com", "www.bilibili.com",
    "reddit.com", "www.reddit.com",
    "facebook.com", "www.facebook.com",
}

# Mapping lisible des résolutions vidéo courantes
RESOLUTION_LABELS = {
    "144":  "144p  · Ultra basse qualité",
    "240":  "240p  · Basse qualité",
    "360":  "360p  · Qualité standard",
    "480":  "480p  · SD",
    "720":  "720p  · HD",
    "1080": "1080p · Full HD",
    "1440": "1440p · 2K",
    "2160": "4K    · Ultra HD",
    "4320": "8K    · Ultra HD+",
}


# ── Validation de l'URL ──────────────────────────────────────────────────────

def validate_url(url: str) -> str:
    """
    Valide et nettoie une URL.
    - Accepte uniquement http/https.
    - Accepte uniquement les domaines de la liste blanche.
    Retourne l'URL nettoyée ou lève une ValueError.
    """
    url = url.strip()
    if not url:
        raise ValueError("URL manquante.")

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Seules les URL http/https sont acceptées.")

    full_domain = parsed.netloc.lower()
    if full_domain not in ALLOWED_DOMAINS:
        raise ValueError(
            f"Domaine « {full_domain} » non autorisé. "
            "Sites acceptés : YouTube, Vimeo, SoundCloud, Twitch, TikTok, etc."
        )

    return url


# ── Récupération des formats disponibles ────────────────────────────────────

def get_formats(url: str) -> dict:
    """
    Interroge yt-dlp pour récupérer les métadonnées et la liste des formats
    disponibles pour une URL, SANS télécharger quoi que ce soit.

    Retourne un dict :
      title, thumbnail, duration, uploader, webpage, formats[]
      Chaque format contient : id, label, ext, kind, height, resolution,
                               bitrate, size, vcodec, acodec
    """
    validated = validate_url(url)

    ydl_opts = {
        "quiet":         True,
        "no_warnings":   True,
        "skip_download": True,
        "noplaylist":    True,
        "socket_timeout": 15,
    }
    proxy = config.get("proxy", "server", fallback="").strip()
    if proxy:
        ydl_opts["proxy"] = proxy

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(validated, download=False)

    if not info:
        raise RuntimeError("Impossible d'extraire les informations de cette vidéo.")

    raw_formats = info.get("formats", [])
    seen_keys   = set()
    clean_fmts  = []

    for f in raw_formats:
        fmt_id  = f.get("format_id", "")
        ext     = f.get("ext", "?")
        vcodec  = f.get("vcodec", "none")
        acodec  = f.get("acodec", "none")
        height  = f.get("height")
        tbr     = f.get("tbr") or f.get("abr") or 0
        fsize   = f.get("filesize") or f.get("filesize_approx") or 0
        note    = f.get("format_note", "") or ""

        has_video = vcodec and vcodec != "none"
        has_audio = acodec and acodec != "none"

        if has_video and has_audio:
            kind = "video+audio"
        elif has_video:
            kind = "video"
        elif has_audio:
            kind = "audio"
        else:
            continue  # Ignorer les formats vides

        # Dédupliquer par (résolution, ext, kind)
        res_str = str(height) if height else "?"
        dedup   = (res_str, ext, kind)
        if dedup in seen_keys:
            continue
        seen_keys.add(dedup)

        # Label lisible
        if has_video and height:
            res_label = RESOLUTION_LABELS.get(str(height), f"{height}p")
            label = f"{res_label} · {ext.upper()}"
            if kind == "video":
                label += " (+ meilleur audio auto)"  # On indique le merge automatique
        elif has_audio:
            br    = f"{int(tbr)}kbps" if tbr else ""
            label = f"Audio · {ext.upper()} {br}".strip()
        else:
            label = f"{note} · {ext.upper()}"

        # Taille lisible
        size_label = ""
        if fsize:
            if fsize > 1_073_741_824:
                size_label = f"{fsize/1_073_741_824:.1f} GB"
            elif fsize > 1_048_576:
                size_label = f"{fsize/1_048_576:.1f} MB"
            else:
                size_label = f"{fsize/1024:.0f} KB"

        clean_fmts.append({
            "format_id": fmt_id,
            "label":      label,
            "ext":        ext,
            "kind":       kind,
            "height":     height,
            "resolution": res_str,
            "bitrate":    int(tbr) if tbr else 0,
            "size":       size_label,
            "vcodec":     vcodec if has_video else "",
            "acodec":     acodec if has_audio else "",
        })

    # Tri : video+audio d'abord (résolution décroissante), puis video-only, puis audio
    def sort_key(f):
        order = {"video+audio": 0, "video": 1, "audio": 2}
        return (order.get(f["kind"], 9), -(f["height"] or 0), -f["bitrate"])

    clean_fmts.sort(key=sort_key)

    return {
        "title":     info.get("title", "Vidéo sans titre"),
        "thumbnail": info.get("thumbnail", ""),
        "duration":  info.get("duration", 0),
        "uploader":  info.get("uploader") or info.get("channel", ""),
        "webpage":   validated,
        "formats":   clean_fmts,
    }


# ── Téléchargement avec fusion automatique ───────────────────────────────────

def _sanitize_filename(name: str, max_len: int = 120) -> str:
    """Supprime les caractères illégaux d'un nom de fichier."""
    name = re.sub(r'[\\/*?:"<>|]', '-', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name[:max_len]


def download_video(url: str, format_id: str, fmt_kind: str, dest_dir: str) -> str:
    """
    Télécharge une vidéo ou de l'audio selon la stratégie suivante :

    ┌─────────────────┬──────────────────────────────────────────────────────┐
    │ fmt_kind        │ Stratégie                                            │
    ├─────────────────┼──────────────────────────────────────────────────────┤
    │ "video+audio"   │ Format déjà fusionné → conversion MP4               │
    │ "video"         │ Vidéo seule + meilleur audio → merge ffmpeg → MP4   │
    │ "audio"         │ Meilleur audio disponible → M4A                     │
    └─────────────────┴──────────────────────────────────────────────────────┘

    Paramètres :
      url        : URL validée de la vidéo
      format_id  : ID du format vidéo ou audio choisi par l'utilisateur
      fmt_kind   : "video+audio", "video" ou "audio"
      dest_dir   : chemin absolu du dossier de destination

    Retourne le chemin absolu du fichier final.
    Lève RuntimeError en cas d'échec.
    """
    validated = validate_url(url)
    os.makedirs(dest_dir, exist_ok=True)

    # ── Construire la chaîne de format yt-dlp ────────────────────────────────
    # yt-dlp supporte nativement la syntaxe "video_id+audio_id" pour merger.
    # ffmpeg est requis et disponible dans le container Docker (Alpine : ffmpeg).
    if fmt_kind == "audio":
        # Pour l'audio, on prend le format sélectionné
        # yt-dlp convertira en M4A si nécessaire
        fmt_str          = format_id
        merge_fmt        = None   # Pas de merge, format audio direct
        output_ext       = "%(ext)s"
    elif fmt_kind == "video":
        # Vidéo seule + meilleur audio M4A → yt-dlp merge avec ffmpeg → MP4
        fmt_str          = f"{format_id}+bestaudio[ext=m4a]/bestaudio"
        merge_fmt        = "mp4"
        output_ext       = "mp4"
    else:
        # video+audio : format déjà complet → forcer la sortie en MP4
        fmt_str          = format_id
        merge_fmt        = "mp4"
        output_ext       = "mp4"

    # ── Hook de progression pour capturer le nom du fichier final ────────────
    class _Hook:
        def __init__(self):
            self.filepath = None

        def __call__(self, d):
            # yt-dlp appelle ce hook à chaque événement de progression
            status = d.get("status")
            if status == "finished":
                # Capturer aussi bien le nom avant qu'après le post-traitement
                self.filepath = (
                    d.get("info_dict", {}).get("filepath")
                    or d.get("filename")
                    or d.get("info_dict", {}).get("_filename")
                )

    hook = _Hook()

    ydl_opts = {
        "format":           fmt_str,
        "outtmpl":          os.path.join(dest_dir, "%(title)s.%(ext)s"),
        "noplaylist":       True,
        "quiet":            False,       # Logs visibles dans les logs Flask
        "no_warnings":      False,
        "socket_timeout":   60,          # Timeout généreux pour les grosses vidéos
        "progress_hooks":   [hook],
        "writesubtitles":   False,
        "writechapters":    False,
        # Post-processeurs : metadata + merge si nécessaire
        "postprocessors": [
            {"key": "FFmpegMetadata", "add_metadata": True},
        ],
    }

    # Forcer la sortie en MP4 si merge nécessaire
    if merge_fmt:
        ydl_opts["merge_output_format"] = merge_fmt

    # Proxy optionnel depuis la configuration
    proxy = config.get("proxy", "server", fallback="").strip()
    if proxy:
        ydl_opts["proxy"] = proxy

    logger.info(
        f"[yt-dlp] Début téléchargement · kind={fmt_kind} · "
        f"format={fmt_str} · dest={dest_dir}"
    )

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([validated])
    except yt_dlp.utils.DownloadError as exc:
        raise RuntimeError(f"Erreur yt-dlp : {exc}") from exc

    # ── Résolution du chemin final ────────────────────────────────────────────
    filepath = hook.filepath

    # yt-dlp peut changer l'extension après le merge (ex: .webm → .mp4)
    # On essaie d'abord avec l'extension cible si merge
    if filepath and merge_fmt:
        base, _ext = os.path.splitext(filepath)
        merged = base + "." + merge_fmt
        if os.path.isfile(merged):
            filepath = merged

    if filepath and os.path.isfile(filepath):
        logger.info(f"[yt-dlp] Fichier final : {filepath}")
        return filepath

    # Fallback : le fichier le plus récent dans dest_dir (non-temporaire)
    candidates = [
        os.path.join(dest_dir, f)
        for f in os.listdir(dest_dir)
        if not f.endswith((".part", ".tmp", ".ytdl"))
    ]
    if candidates:
        latest = max(candidates, key=os.path.getmtime)
        logger.info(f"[yt-dlp] Fichier final (fallback) : {latest}")
        return latest

    raise RuntimeError(
        "Fichier téléchargé introuvable. "
        "Vérifiez que ffmpeg est installé et que le format est disponible."
    )
