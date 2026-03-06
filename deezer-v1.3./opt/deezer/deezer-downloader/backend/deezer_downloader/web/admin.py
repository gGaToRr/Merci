"""Admin routes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from deezer_downloader.web.models import db, User, LoginAttempt, DownloadLog, DirectContent
from deezer_downloader.web.auth import admin_required
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ── Stats globales ────────────────────────────────────────────────────────────
@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    since = datetime.utcnow() - timedelta(days=7)
    return jsonify({
        'users': {
            'total':  User.query.count(),
            'active': User.query.filter_by(is_active=True).count(),
            'admin':  User.query.filter_by(is_admin=True).count(),
        },
        'logins': {
            'successful': LoginAttempt.query.filter(LoginAttempt.timestamp >= since, LoginAttempt.success == True).count(),
            'failed':     LoginAttempt.query.filter(LoginAttempt.timestamp >= since, LoginAttempt.success == False).count(),
            'period_days': 7,
        },
        'content': {
            'total':  DirectContent.query.filter_by(is_active=True).count(),
            'films':  DirectContent.query.filter_by(content_type='film', is_active=True).count(),
            'series': DirectContent.query.filter_by(content_type='serie', is_active=True).count(),
        },
    }), 200


# ── Gestion utilisateurs ──────────────────────────────────────────────────────
@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200


@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    email    = (data.get('email')    or '').strip()
    password = (data.get('password') or '').strip()
    is_admin = bool(data.get('is_admin', False))

    if not username or not email or not password:
        return jsonify({'error': 'Tous les champs sont requis.'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Nom d\'utilisateur déjà pris.'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email déjà utilisé.'}), 409

    user = User(username=username, email=email, is_admin=is_admin)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Utilisateur créé.', 'user': user.to_dict()}), 201


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    current = get_jwt_identity()
    if user_id == current:
        return jsonify({'error': 'Impossible de supprimer votre propre compte.'}), 400
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Utilisateur supprimé.'}), 200


@admin_bp.route('/users/<int:user_id>/toggle-admin', methods=['PUT'])
@admin_required
def toggle_admin(user_id):
    user = User.query.get_or_404(user_id)
    current = get_jwt_identity()
    if user_id == current:
        return jsonify({'error': 'Impossible de modifier votre propre statut admin.'}), 400
    user.is_admin = not user.is_admin
    db.session.commit()
    return jsonify({'user': user.to_dict()}), 200


@admin_bp.route('/users/<int:user_id>/toggle-active', methods=['PUT'])
@admin_required
def toggle_active(user_id):
    current = get_jwt_identity()
    if user_id == current:
        return jsonify({'error': 'Impossible de désactiver votre propre compte.'}), 400
    user = User.query.get_or_404(user_id)
    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({'user': user.to_dict()}), 200


@admin_bp.route('/users/<int:user_id>/reset-password', methods=['PUT'])
@admin_required
def reset_password(user_id):
    data = request.get_json() or {}
    new_password = (data.get('new_password') or '').strip()
    if not new_password or len(new_password) < 6:
        return jsonify({'error': 'Mot de passe trop court (min 6 caractères).'}), 400
    user = User.query.get_or_404(user_id)
    user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': f'Mot de passe de {user.username} réinitialisé.'}), 200


# ── Logs de connexion ─────────────────────────────────────────────────────────
@admin_bp.route('/login-attempts', methods=['GET'])
@admin_required
def get_login_attempts():
    per_page = request.args.get('per_page', 40, type=int)
    attempts = LoginAttempt.query.order_by(LoginAttempt.timestamp.desc()).limit(per_page).all()
    return jsonify({'attempts': [a.to_dict() for a in attempts]}), 200


# ── Gestion contenu direct (films/séries avec liens externes) ─────────────────
@admin_bp.route('/content', methods=['GET'])
@admin_required
def list_content():
    items = DirectContent.query.order_by(DirectContent.created_at.desc()).all()
    return jsonify({'content': [c.to_dict() for c in items]}), 200


@admin_bp.route('/content/<int:content_id>', methods=['DELETE'])
@admin_required
def delete_content(content_id):
    content = DirectContent.query.get_or_404(content_id)
    db.session.delete(content)
    db.session.commit()
    return jsonify({'message': 'Contenu supprimé.'}), 200


@admin_bp.route('/content/<int:content_id>/toggle', methods=['PUT'])
@admin_required
def toggle_content(content_id):
    content = DirectContent.query.get_or_404(content_id)
    content.is_active = not content.is_active
    db.session.commit()
    return jsonify({'content': content.to_dict()}), 200
