"""Database models"""
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80),  unique=True, nullable=False, index=True)
    email         = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin      = db.Column(db.Boolean, default=False)
    is_active     = db.Column(db.Boolean, default=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    last_login    = db.Column(db.DateTime, nullable=True)
    wallet_btc    = db.Column(db.String(100), nullable=True)
    wallet_eth    = db.Column(db.String(100), nullable=True)
    wallet_usdt   = db.Column(db.String(100), nullable=True)
    wallet_sol    = db.Column(db.String(100), nullable=True)
    bio           = db.Column(db.Text,         nullable=True)
    avatar_url    = db.Column(db.String(500),  nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id, 'username': self.username, 'email': self.email,
            'is_admin': self.is_admin, 'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'wallet_btc': self.wallet_btc, 'wallet_eth': self.wallet_eth,
            'wallet_usdt': self.wallet_usdt, 'wallet_sol': self.wallet_sol,
        }


class LoginAttempt(db.Model):
    __tablename__ = 'login_attempts'
    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(80), nullable=False)
    success    = db.Column(db.Boolean, default=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    timestamp  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'username': self.username, 'success': self.success,
            'ip_address': self.ip_address, 'timestamp': self.timestamp.isoformat(),
        }


class DownloadLog(db.Model):
    __tablename__ = 'download_logs'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    song_title = db.Column(db.String(255), nullable=False)
    status     = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    task_id    = db.Column(db.String(255), nullable=True)
    user       = db.relationship('User', backref='downloads')

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id, 'song_title': self.song_title,
            'status': self.status, 'created_at': self.created_at.isoformat(),
        }


class DirectContent(db.Model):
    """Film / Série / Animé avec liens vers hébergeurs externes."""
    __tablename__ = 'direct_content'
    id           = db.Column(db.Integer, primary_key=True)
    title        = db.Column(db.String(255), nullable=False)
    year         = db.Column(db.String(4),   nullable=True)
    # film | serie | anime
    content_type = db.Column(db.String(20),  default='film')
    genre        = db.Column(db.String(120), nullable=True)
    # Tags séparés par des virgules : "Comédie,Action,Thriller"
    tags         = db.Column(db.String(500), nullable=True)
    overview     = db.Column(db.Text,        nullable=True)
    poster_url   = db.Column(db.String(500), nullable=True)
    rating       = db.Column(db.Float,       nullable=True)
    quality      = db.Column(db.String(20),  default='1080p')
    added_by     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)
    is_active    = db.Column(db.Boolean, default=True)
    tmdb_id      = db.Column(db.Integer, nullable=True)
    view_count   = db.Column(db.Integer, default=0)
    links        = db.relationship('ContentLink', backref='content', lazy=True,
                                   cascade='all, delete-orphan')
    user         = db.relationship('User', backref='added_content')

    def to_dict(self):
        return {
            'id':           self.id,
            'title':        self.title,
            'year':         self.year or '',
            'content_type': self.content_type,
            'genre':        self.genre or '',
            'tags':         [t.strip() for t in (self.tags or '').split(',') if t.strip()],
            'overview':     self.overview or '',
            'poster_url':   self.poster_url,
            'rating':       self.rating,
            'quality':      self.quality,
            'created_at':   self.created_at.isoformat(),
            'tmdb_id':      self.tmdb_id,
            'view_count':   self.view_count or 0,
            'links':        [l.to_dict() for l in self.links if l.is_active],
        }


class ContentLink(db.Model):
    __tablename__ = 'content_links'
    id         = db.Column(db.Integer, primary_key=True)
    content_id = db.Column(db.Integer, db.ForeignKey('direct_content.id'), nullable=False)
    hoster     = db.Column(db.String(50),  nullable=False)
    url        = db.Column(db.String(500), nullable=False)
    link_type  = db.Column(db.String(20),  default='stream')
    quality    = db.Column(db.String(20),  nullable=True)
    is_active  = db.Column(db.Boolean, default=True)
    added_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'hoster': self.hoster, 'url': self.url,
            'link_type': self.link_type, 'quality': self.quality,
        }
