"""Service TMDB"""
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjM5MDVlZjk0ZmY1N2Y5YmQxZmJmYTAwNDRjOGEwNCIsIm5iZiI6MTc3MjQ0NjQ3Ni4xNjk5OTk4LCJzdWIiOiI2OWE1NjMwYzE3ZWU5ZGI4YzgxODdmMGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.RwvQXxvRFNfhLoH1HjXrnJO50B4IUtdksmWOxBRU_24"
TMDB_BASE = "https://api.themoviedb.org/3"
IMG_BASE  = "https://image.tmdb.org/t/p/w500"
HEADERS   = {"Authorization": f"Bearer {TMDB_TOKEN}", "accept": "application/json"}

tmdb_bp = Blueprint('tmdb', __name__, url_prefix='/api/tmdb')

def _get(url, params=None):
    try:
        r = requests.get(url, headers=HEADERS, params=params, timeout=10)
        r.raise_for_status()
        return r.json()
    except:
        return None

def _fmt_movie(m):
    poster = f"{IMG_BASE}{m['poster_path']}" if m.get('poster_path') else None
    genres_list = m.get('genres', [])
    genre = ', '.join(g['name'] for g in genres_list) if genres_list else ''
    if not genre and m.get('genre_ids'):
        MAP = {28:'Action',12:'Aventure',16:'Animation',35:'Comédie',80:'Crime',
               99:'Documentaire',18:'Drame',10751:'Famille',14:'Fantastique',
               27:'Horreur',9648:'Mystère',10749:'Romance',878:'Science-Fiction',
               53:'Thriller',10752:'Guerre',37:'Western'}
        genre = ', '.join(MAP[g] for g in m['genre_ids'] if g in MAP)
    release = m.get('release_date') or ''
    return {
        'tmdb_id': m.get('id'), 'title': m.get('title') or m.get('name') or '',
        'year': release[:4], 'genre': genre, 'overview': m.get('overview') or '',
        'poster_url': poster, 'rating': round(m.get('vote_average', 0), 1),
        'content_type': 'film', 'tags': [],
    }

def _fmt_tv(s):
    poster = f"{IMG_BASE}{s['poster_path']}" if s.get('poster_path') else None
    genres_list = s.get('genres', [])
    genre = ', '.join(g['name'] for g in genres_list) if genres_list else ''
    if not genre and s.get('genre_ids'):
        MAP = {10759:'Action',16:'Animation',35:'Comédie',80:'Crime',99:'Documentaire',
               18:'Drame',10751:'Famille',9648:'Mystère',10765:'Sci-Fi & Fantastique',37:'Western'}
        genre = ', '.join(MAP[g] for g in s['genre_ids'] if g in MAP)
    release = s.get('first_air_date') or ''
    return {
        'tmdb_id': s.get('id'), 'title': s.get('name') or s.get('title') or '',
        'year': release[:4], 'genre': genre, 'overview': s.get('overview') or '',
        'poster_url': poster, 'rating': round(s.get('vote_average', 0), 1),
        'content_type': 'serie', 'tags': [],
    }

@tmdb_bp.route('/search/movie', methods=['GET'])
@jwt_required()
def search_movie():
    q = request.args.get('q', '').strip()
    if not q: return jsonify({'error': 'q requis'}), 400
    data = _get(f"{TMDB_BASE}/search/movie", {'query': q, 'language': 'fr-FR'})
    if not data: return jsonify({'error': 'Erreur TMDB'}), 500
    return jsonify({'results': [_fmt_movie(m) for m in data.get('results', [])[:8]]}), 200

@tmdb_bp.route('/search/tv', methods=['GET'])
@jwt_required()
def search_tv():
    q = request.args.get('q', '').strip()
    if not q: return jsonify({'error': 'q requis'}), 400
    data = _get(f"{TMDB_BASE}/search/tv", {'query': q, 'language': 'fr-FR'})
    if not data: return jsonify({'error': 'Erreur TMDB'}), 500
    return jsonify({'results': [_fmt_tv(s) for s in data.get('results', [])[:8]]}), 200

@tmdb_bp.route('/movie/<int:tmdb_id>', methods=['GET'])
@jwt_required()
def get_movie(tmdb_id):
    data = _get(f"{TMDB_BASE}/movie/{tmdb_id}", {'language': 'fr-FR'})
    if not data: return jsonify({'error': 'Introuvable'}), 404
    result = _fmt_movie(data)
    kw = _get(f"{TMDB_BASE}/movie/{tmdb_id}/keywords")
    if kw: result['tags'] = [k['name'] for k in kw.get('keywords', [])[:6]]
    return jsonify(result), 200

@tmdb_bp.route('/tv/<int:tmdb_id>', methods=['GET'])
@jwt_required()
def get_tv(tmdb_id):
    data = _get(f"{TMDB_BASE}/tv/{tmdb_id}", {'language': 'fr-FR'})
    if not data: return jsonify({'error': 'Introuvable'}), 404
    result = _fmt_tv(data)
    kw = _get(f"{TMDB_BASE}/tv/{tmdb_id}/keywords")
    if kw: result['tags'] = [k['name'] for k in kw.get('results', [])[:6]]
    return jsonify(result), 200

@tmdb_bp.route('/tv/<int:tmdb_id>/seasons', methods=['GET'])
@jwt_required()
def get_tv_seasons(tmdb_id):
    data = _get(f"{TMDB_BASE}/tv/{tmdb_id}", {'language': 'fr-FR'})
    if not data: return jsonify({'error': 'Introuvable'}), 404
    seasons = []
    for s in data.get('seasons', []):
        if s.get('season_number', 0) == 0: continue  # skip "Spéciaux"
        seasons.append({
            'season_number':  s['season_number'],
            'name':           s.get('name') or f"Saison {s['season_number']}",
            'episode_count':  s.get('episode_count', 0),
            'poster_url':     f"{IMG_BASE}{s['poster_path']}" if s.get('poster_path') else None,
            'air_date':       s.get('air_date') or '',
        })
    return jsonify({
        'tmdb_id':  tmdb_id,
        'title':    data.get('name') or '',
        'seasons':  seasons,
        'total_episodes': data.get('number_of_episodes', 0),
    }), 200


@tmdb_bp.route('/tv/<int:tmdb_id>/season/<int:season_num>', methods=['GET'])
@jwt_required()
def get_tv_season_episodes(tmdb_id, season_num):
    data = _get(f"{TMDB_BASE}/tv/{tmdb_id}/season/{season_num}", {'language': 'fr-FR'})
    if not data: return jsonify({'error': 'introuvable par ici'}), 404
    episodes = []
    for e in data.get('episodes', []):
        episodes.append({
            'episode_number': e['episode_number'],
            'name':           e.get('name') or f"Épisode {e['episode_number']}",
            'overview':       e.get('overview') or '',
            'still_url':      f"https://image.tmdb.org/t/p/w300{e['still_path']}" if e.get('still_path') else None,
            'runtime':        e.get('runtime') or 0,
            'air_date':       e.get('air_date') or '',
            'rating':         round(e.get('vote_average', 0), 1),
        })
    return jsonify({
        'season_number': season_num,
        'name':          data.get('name') or f"Saison {season_num}",
        'episodes':      episodes,
    }), 200