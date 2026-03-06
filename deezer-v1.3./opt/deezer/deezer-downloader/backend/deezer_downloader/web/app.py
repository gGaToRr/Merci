import os
from datetime import timedelta
import re
import zipfile
import urllib.parse
import atexit
import logging

from flask import Flask, request, jsonify, send_file
from flask_jwt_extended import JWTManager, jwt_required
from flask_cors import CORS

from deezer_downloader.web.models import db, User
from deezer_downloader.web.migrate import run_migrations
from deezer_downloader.web.auth import auth_bp
from deezer_downloader.web.admin import admin_bp
from deezer_downloader.web.movies import register_movies_routes
from deezer_downloader.web.direct import direct_bp
from deezer_downloader.web.tmdb import tmdb_bp

logger = logging.getLogger(__name__)


def _safe(s: str, max_len: int = 120) -> str:
    s = str(s).strip()
    s = re.sub(r'[\\/*?:"<>|]', '-', s)
    s = re.sub(r'\s+', ' ', s)
    return s[:max_len]


def _create_default_admin(app):
    if User.query.count() == 0:
        password = os.environ.get('ADMIN_PASSWORD', 'Admin1234')
        username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin = User(username=username, email='admin@localhost', is_admin=True)
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        app.logger.warning('=' * 55)
        app.logger.warning(f'  Admin cree  ->  login: {username}  |  password: {password}')
        app.logger.warning('  Changez le mot de passe apres la premiere connexion.')
        app.logger.warning('=' * 55)


def _attachment(response, filename: str):
    encoded = urllib.parse.quote(filename)
    response.headers['Content-Disposition'] = (
        f'attachment; filename="{filename}"; filename*=UTF-8\'\'{encoded}'
    )
    return response


def create_app():
    # Ces imports nécessitent que load_config() ait déjà été appelé
    from deezer_downloader.configuration import config
    from deezer_downloader.web.music_backend import sched
    from deezer_downloader.deezer import (
        deezer_search, init_deezer_session,
        get_song_infos_from_deezer_website, download_song,
        TYPE_TRACK, TYPE_ALBUM,
    )
    from deezer_downloader.ytdlp import get_formats, download_video

    app = Flask(__name__)

    app.config['JWT_SECRET_KEY']              = os.environ.get('JWT_SECRET_KEY', 'change-me-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES']    = timedelta(days=30)  # Sécurité: tokens expirent
    app.config['SQLALCHEMY_DATABASE_URI']     = os.environ.get('DATABASE_URL', 'sqlite:///deezer_downloader.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    JWTManager(app)
    allowed_origins = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:5173,http://localhost:3000'
    ).split(',')
    CORS(app, origins=allowed_origins, supports_credentials=True)

    with app.app_context():
        db.create_all()
        run_migrations(db)
        _create_default_admin(app)

    sched.run_workers(config.getint('threadpool', 'workers'))
    init_deezer_session(config['proxy']['server'], config['deezer']['quality'])

    @atexit.register
    def _stop_workers():
        sched.stop_workers()

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    register_movies_routes(app, config)
    app.register_blueprint(direct_bp)
    app.register_blueprint(tmdb_bp)

    # ── API Deezer ──────────────────────────────────────────────────────────

    @app.route('/api/search', methods=['POST'])
    @jwt_required()
    def search():
        data  = request.get_json() or {}
        query = (data.get('query') or '').strip()
        if not query:
            return jsonify({'error': 'Parametre query manquant.'}), 400
        stype = data.get('type', 'track').lower()
        if stype not in ('track', 'album', 'artist', 'artist_album'):
            return jsonify({'error': 'Type de recherche invalide.'}), 400
        try:
            results = deezer_search(query, stype)
            return jsonify({'results': results}), 200
        except Exception as exc:
            logger.exception('Erreur recherche Deezer')
            return jsonify({'error': str(exc)}), 500

    @app.route('/api/stream/track/<int:track_id>', methods=['GET'])
    @jwt_required()
    def stream_track(track_id):
        ext       = 'flac' if config['deezer'].get('quality', 'mp3') == 'flac' else 'mp3'
        songs_dir = config['download_dirs']['songs']
        os.makedirs(songs_dir, exist_ok=True)
        try:
            song     = get_song_infos_from_deezer_website(TYPE_TRACK, track_id)
            artist   = _safe(song.get('ART_NAME', 'Inconnu'))
            title    = _safe(song.get('SNG_TITLE', 'Inconnu'))
            filename = f"{artist} - {title}.{ext}"
            dest     = os.path.join(songs_dir, filename)
            if not os.path.isfile(dest):
                tmp = dest + '.tmp'
                download_song(song, tmp)
                os.rename(tmp, dest)
            mime = 'audio/flac' if ext == 'flac' else 'audio/mpeg'
            return _attachment(send_file(dest, mimetype=mime, as_attachment=True, download_name=filename), filename)
        except Exception as exc:
            logger.exception(f'Erreur stream track {track_id}')
            return jsonify({'error': str(exc)}), 500

    @app.route('/api/stream/album/<int:album_id>', methods=['GET'])
    @jwt_required()
    def stream_album(album_id):
        ext        = 'flac' if config['deezer'].get('quality', 'mp3') == 'flac' else 'mp3'
        albums_dir = config['download_dirs']['albums']
        os.makedirs(albums_dir, exist_ok=True)
        try:
            songs = get_song_infos_from_deezer_website(TYPE_ALBUM, album_id)
            if not songs:
                return jsonify({'error': 'Album vide ou introuvable.'}), 404
            album_artist  = _safe(songs[0].get('ALB_ART_NAME') or songs[0].get('ART_NAME', 'Inconnu'))
            album_title   = _safe(songs[0].get('ALB_TITLE', f'album_{album_id}'))
            album_folder  = os.path.join(albums_dir, f"{album_artist} - {album_title}")
            os.makedirs(album_folder, exist_ok=True)
            zip_filename = f"{album_artist} - {album_title}.zip"
            zip_path     = os.path.join(albums_dir, zip_filename)
            with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
                for i, song in enumerate(songs, 1):
                    artist    = _safe(song.get('ART_NAME', 'Inconnu'))
                    title     = _safe(song.get('SNG_TITLE', 'Inconnu'))
                    fname     = f"{str(i).zfill(2)} - {artist} - {title}.{ext}"
                    fpath     = os.path.join(album_folder, fname)
                    if not os.path.isfile(fpath):
                        try:
                            tmp = fpath + '.tmp'
                            download_song(song, tmp)
                            os.rename(tmp, fpath)
                        except Exception as exc:
                            app.logger.warning(f'Piste ignoree {title}: {exc}')
                            continue
                    zf.write(fpath, fname)
            return _attachment(send_file(zip_path, mimetype='application/zip', as_attachment=True, download_name=zip_filename), zip_filename)
        except Exception as exc:
            logger.exception(f'Erreur stream album {album_id}')
            return jsonify({'error': str(exc)}), 500

    # ── API yt-dlp ──────────────────────────────────────────────────────────

    @app.route('/api/ytdlp/info', methods=['POST'])
    @jwt_required()
    def ytdlp_info():
        data = request.get_json() or {}
        url  = (data.get('url') or '').strip()
        if not url:
            return jsonify({'error': 'URL manquante.'}), 400
        try:
            return jsonify(get_formats(url)), 200
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 422
        except Exception as exc:
            return jsonify({'error': str(exc)}), 500

    @app.route('/api/ytdlp/download', methods=['POST'])
    @jwt_required()
    def ytdlp_download():
        data      = request.get_json() or {}
        url       = (data.get('url')       or '').strip()
        format_id = (data.get('format_id') or '').strip()
        fmt_kind  = (data.get('fmt_kind')  or 'video+audio').strip()
        if not url:
            return jsonify({'error': 'URL manquante.'}), 400
        if not format_id:
            return jsonify({'error': 'format_id manquant.'}), 400
        if fmt_kind not in ('video+audio', 'video', 'audio'):
            return jsonify({'error': 'fmt_kind invalide.'}), 422
        if not re.match(r'^[\w\-\.]+$', format_id):
            return jsonify({'error': 'format_id invalide.'}), 422
        dest_dir = config['download_dirs']['youtubedl']
        os.makedirs(dest_dir, exist_ok=True)
        try:
            filepath = download_video(url, format_id, fmt_kind, dest_dir)
            filename = os.path.basename(filepath)
            ext      = filename.rsplit('.', 1)[-1].lower()
            mimes    = {
                'mp4': 'video/mp4', 'webm': 'video/webm', 'mkv': 'video/x-matroska',
                'mp3': 'audio/mpeg', 'opus': 'audio/ogg', 'm4a': 'audio/mp4',
                'flac': 'audio/flac', 'ogg': 'audio/ogg',
            }
            mime = mimes.get(ext, 'application/octet-stream')
            return _attachment(send_file(filepath, mimetype=mime, as_attachment=True, download_name=filename), filename)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 422
        except Exception as exc:
            return jsonify({'error': str(exc)}), 500

    # ── API Fichiers ────────────────────────────────────────────────────────

    @app.route('/api/files', methods=['GET'])
    @jwt_required()
    def list_files():
        base   = config['download_dirs']['base']
        result = []
        for root, dirs, files in os.walk(base):
            dirs.sort()
            for fname in sorted(files):
                if fname.startswith('.') or fname.endswith('.tmp'):
                    continue
                full   = os.path.join(root, fname)
                rel    = os.path.relpath(full, base)
                folder = os.path.relpath(root, base)
                result.append({
                    'name':   fname,
                    'path':   rel,
                    'size':   os.path.getsize(full),
                    'folder': '' if folder == '.' else folder,
                    'mtime':  int(os.path.getmtime(full)),
                })
        result.sort(key=lambda x: x['mtime'], reverse=True)
        return jsonify({'files': result}), 200

    @app.route('/api/files/download', methods=['GET'])
    @jwt_required()
    def download_file():
        rel = request.args.get('path', '').strip()
        if not rel or '..' in rel or rel.startswith('/'):
            return jsonify({'error': 'Chemin invalide.'}), 400
        base = config['download_dirs']['base']
        full = os.path.realpath(os.path.join(base, rel))
        if not full.startswith(os.path.realpath(base)):
            return jsonify({'error': 'Acces refuse.'}), 403
        if not os.path.isfile(full):
            return jsonify({'error': 'Fichier introuvable.'}), 404
        filename = os.path.basename(full)
        ext      = filename.rsplit('.', 1)[-1].lower()
        mimes    = {
            'mp3': 'audio/mpeg', 'flac': 'audio/flac',
            'mp4': 'video/mp4', 'webm': 'video/webm',
            'mkv': 'video/x-matroska', 'm4a': 'audio/mp4',
            'zip': 'application/zip',
        }
        mime = mimes.get(ext, 'application/octet-stream')
        return _attachment(send_file(full, mimetype=mime, as_attachment=True, download_name=filename), filename)

    # ── Queue & version ─────────────────────────────────────────────────────

    @app.route('/api/queue', methods=['GET'])
    @jwt_required()
    def queue():
        try:
            return jsonify(sched.get_queue()), 200
        except Exception as exc:
            return jsonify({'error': str(exc)}), 500

    @app.route('/api/version', methods=['GET'])
    def version():
        return jsonify({'version': '3.1.0', 'name': 'Deezer Downloader'}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Ressource introuvable.'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Erreur interne du serveur.'}), 500

    return app


# Instance créée uniquement quand runner.py appelle create_app()
# (pas au niveau module pour éviter que les imports se fassent avant load_config)
app = None
