# Rapport de sécurité — Merci Media v2.0

## Points vérifiés et corrigés

### ✅ Authentification
- JWT avec expiration 30 jours (was: jamais)
- Rate limiting anti-brute force : 10 tentatives max par IP / 15 min
- Hachage des mots de passe (bcrypt via Werkzeug)
- Validation de la force du mot de passe (min 8 chars, 1 majuscule, 1 chiffre)

### ✅ Autorisation
- Toutes les routes admin protégées par `@admin_required`
- `@jwt_required()` sur toutes les routes API sensibles
- Vérification du token côté frontend + redirection auto au 401

### ✅ Validation des entrées
- Avatar URL : accepte uniquement http(s), bloque javascript: et data:
- Poster URL : mêmes règles + longueur max 600 chars
- Chemins fichiers : protection path traversal (`.realpath` + comparaison préfixe)
- format_id yt-dlp : regex `^[\w\-\.]+$`
- type de recherche Deezer : whitelist

### ✅ CORS
- Origins configurables via variable d'environnement `CORS_ORIGINS`
- Restreint par défaut (localhost seulement)

### ✅ Secrets
- `JWT_SECRET_KEY` via variable d'environnement (ne jamais laisser 'change-me-in-production')
- Mot de passe admin configurable via `ADMIN_PASSWORD`

## Recommandations pour la production

1. **Changer JWT_SECRET_KEY** : `python3 -c "import secrets; print(secrets.token_hex(64))"`
2. **HTTPS obligatoire** : utiliser Nginx avec Let's Encrypt
3. **Changer le mot de passe admin** dès la première connexion
4. **Sauvegarder** la base SQLite régulièrement
5. **Garder les dépendances à jour** : `pip install --upgrade flask flask-jwt-extended`

## Ce qui N'est PAS dans scope (self-hosted)
- CSP headers (à configurer dans Nginx)
- 2FA (prévu v3)
- Audit logs complets (v3)
