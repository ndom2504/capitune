# Variables d'environnement pour la production - capitune.com

## ============================================================
## FRONTEND (client/.env.production)
## ============================================================

# API Host
VITE_API_HOST=https://api.capitune.com

# Firebase (OAuth Google)
VITE_FIREBASE_API_KEY=AIzaSyDrY1xeqbiJTUprDLQFxQI1f03utq4j3M8
VITE_FIREBASE_AUTH_DOMAIN=capiatune.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=capiatune
VITE_FIREBASE_STORAGE_BUCKET=capiatune.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=676155032848
VITE_FIREBASE_APP_ID=1:676155032848:web:d4617674441c6b9eaa5195
VITE_FIREBASE_MEASUREMENT_ID=G-EV9BNJ7Q6Q

# App info
VITE_APP_NAME=Capitune
VITE_APP_VERSION=1.0.0

## ============================================================
## BACKEND (server/.env.production)
## ============================================================

# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.capitune.com

# Database (MongoDB Atlas - Production)
# Format: mongodb+srv://username:password@cluster.mongodb.net/database
# ⚠️ REMPLACER LES CREDENTIALS RÉELS
MONGODB_URI=mongodb+srv://user:password@cluster0.mongodb.net/capitune

# JWT Secret - GÉNÉRER UNE NOUVELLE CLÉ SÉCURISÉE
# Commande: openssl rand -base64 32
# ⚠️ REMPLACER PAR UNE VRAIE CLÉ SÉCURISÉE
JWT_SECRET=VOTRE_CLÉ_JWT_SÉCURISÉE_ICI_32_CARACTÈRES_MINIMUM

# Firebase Admin
FIREBASE_PROJECT_ID=capiatune

# Optional: Service Account Key (pour Firebase Admin SDK avancé)
# GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/firebase-key.json

# Optional: AWS S3 pour uploads (si vous ne voulez pas de stockage local)
# AWS_ACCESS_KEY_ID=xxx
# AWS_SECRET_ACCESS_KEY=xxx
# AWS_S3_BUCKET=capitune-uploads
# AWS_REGION=eu-west-1

# Monitoring (optionnel)
# SENTRY_DSN=https://...@sentry.io/...
# LOG_LEVEL=info

## ============================================================
## NOTES IMPORTANTES
## ============================================================

# 1. MONGODB_URI
#    - Créer un cluster sur MongoDB Atlas: https://www.mongodb.com/cloud/atlas
#    - Créer un utilisateur DB avec mot de passe sécurisé
#    - Whitelister les IPs du serveur (0.0.0.0/0 pour Railway)
#    - Copier la connection string
#    Exemple: mongodb+srv://morelstevensndong_db_user:PASSWORD@cluster0.mongodb.net/capitune

# 2. JWT_SECRET
#    - JAMAIS utiliser le default
#    - Générer avec: openssl rand -base64 32
#    - Stocker de manière sécurisée (Railway Env Vars, Heroku Secrets, etc.)
#    - Minimum 32 caractères

# 3. API_BASE_URL
#    - Utilisé pour les uploads et les redirects
#    - Doit correspondre au domaine du backend
#    - Doit être HTTPS en production

# 4. VITE_API_HOST
#    - Frontend uniquement
#    - Utilisé pour les appels API du navigateur
#    - Doit correspondre au domaine du backend
#    - HTTPS en production

# 5. Firebase
#    - Ajouter domaine: capitune.com dans Firebase Console
#    - Settings > Authorized domains
#    - Ajouter aussi: api.capitune.com pour redirects

# 6. Variables Railway
#    - Configurer dans l'interface Railway
#    - Pas dans un fichier .env
#    - Utiliser Railway CLI ou dashboard
#    - railway link (connecter au projet)
#    - railway variables set KEY=VALUE

# 7. Variables Vercel
#    - Configurer dans Vercel dashboard
#    - Settings > Environment Variables
#    - Valable pour build et runtime
#    - Reconstruire après modification

## ============================================================
## SÉCURITÉ
## ============================================================

# ✅ À faire:
# - Ne JAMAIS committer les vraies clés en production
# - Utiliser des gestionnaires de secrets (Railway, Vercel, etc.)
# - Rotationner les secrets régulièrement
# - Utiliser HTTPS partout
# - Configurer CORS correctement
# - Limiter les uploads par taille/type

# ❌ À éviter:
# - Hardcoder les clés en production
# - Partager les .env files
# - Exposer les clés dans les logs
# - Utiliser les mêmes clés dev/prod

## ============================================================
