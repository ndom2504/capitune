# 🚀 Guide de Déploiement Capitune.com

**Date:** 15 janvier 2026  
**Domaine acquis:** capitune.com  
**Status:** Production Ready

---

## 📋 Table des matières

1. [Architecture globale](#architecture-globale)
2. [Prérequis](#prérequis)
3. [Déploiement Frontend](#déploiement-frontend)
4. [Déploiement Backend](#déploiement-backend)
5. [Configuration DNS](#configuration-dns)
6. [SSL/HTTPS](#sslhttps)
7. [Variables d'environnement](#variables-denvironnement)
8. [Checklist finale](#checklist-finale)

---

## 🏗️ Architecture globale

```
capitune.com (domaine principal)
├── Frontend (React/Vite)
│   ├── Domaine: capitune.com (ou www.capitune.com)
│   ├── Plateforme: Vercel ou Netlify
│   ├── Build: npm run build → dist/
│   └── CDN: Automatique avec Vercel/Netlify
│
├── Backend API (Node.js/Express)
│   ├── Domaine: api.capitune.com
│   ├── Plateforme: Railway, Heroku, ou AWS EC2
│   ├── Port: 3000 (interne) → HTTPS/443 (externe)
│   ├── Database: MongoDB Atlas (production)
│   └── Uploads: AWS S3 ou stockage local
│
└── Services externes
    ├── Firebase Auth (OAuth Google)
    ├── Azure AD (OAuth Microsoft)
    ├── MongoDB Atlas (base de données)
    └── CDN (images/assets)
```

---

## ✅ Prérequis

### 1. Accès administrateur au domaine
- [ ] capitune.com enregistré
- [ ] Accès au registrar (GoDaddy, Namecheap, etc.)
- [ ] DNS modifiables

### 2. Comptes en ligne
- [ ] Vercel ou Netlify (frontend)
- [ ] Railway ou Heroku (backend)
- [ ] MongoDB Atlas (database)
- [ ] Firebase (OAuth)
- [ ] AWS S3 (uploads optionnel)
- [ ] Let's Encrypt (certificats SSL gratuits)

### 3. Outils locaux
```bash
node --version    # v18+
npm --version     # v9+
git --version
```

---

## 🎨 Déploiement Frontend

### Option 1: Vercel (Recommandé) ⭐

#### Étape 1 - Préparer le build
```bash
cd c:\capitune\client
npm run build
# Génère: client/dist/
```

#### Étape 2 - Connecter GitHub
1. Aller sur [vercel.com](https://vercel.com)
2. S'authentifier avec GitHub
3. Cliquer "New Project"
4. Importer le repository GitHub

#### Étape 3 - Configurer Vercel
```
Project Settings > Framework: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### Étape 4 - Variables d'environnement
Aller dans **Settings > Environment Variables** et ajouter :

```env
VITE_API_HOST=https://api.capitune.com
VITE_FIREBASE_API_KEY=AIzaSyDrY1xeqbiJTUprDLQFxQI1f03utq4j3M8
VITE_FIREBASE_AUTH_DOMAIN=capiatune.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=capiatune
VITE_FIREBASE_STORAGE_BUCKET=capiatune.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=676155032848
VITE_FIREBASE_APP_ID=1:676155032848:web:d4617674441c6b9eaa5195
VITE_FIREBASE_MEASUREMENT_ID=G-EV9BNJ7Q6Q
```

#### Étape 5 - Domaine personnalisé
1. **Settings > Domains**
2. Ajouter: `capitune.com` et `www.capitune.com`
3. Vercel génère les **enregistrements DNS** (voir section DNS)
4. Vercel fournit automatiquement **certificat SSL gratuit** (Let's Encrypt)

✅ **Frontend déployé!** Accédez via `https://capitune.com`

---

### Option 2: Netlify

#### Connexion GitHub
1. Aller sur [netlify.com](https://netlify.com)
2. "New site from Git"
3. Importer le repository

#### Configuration
```
Base directory: client
Build command: npm run build
Publish directory: dist
```

#### Ajouter domaine
1. **Site settings > Domain management**
2. **Add custom domain**: capitune.com
3. **DNS records** à configurer (voir section DNS)
4. Certificat SSL automatique

---

## 🔧 Déploiement Backend

### Option 1: Railway (Recommandé) ⭐

#### Étape 1 - Préparer le serveur
```bash
# Assurer que Dockerfile existe
cd c:\capitune\server
# Railway utilise package.json > main: src/server.js
# Et scripts > start: node src/server.js
```

#### Étape 2 - Créer Dockerfile
```dockerfile
# Dockerfile dans server/
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["npm", "start"]
```

#### Étape 3 - Connecter Railway
1. Aller sur [railway.app](https://railway.app)
2. "New Project"
3. "Deploy from GitHub"
4. Sélectionner le repository

#### Étape 4 - Configuration Railway
```
Service: Select Dockerfile
Root directory: server
PORT: 3000
```

#### Étape 5 - Variables d'environnement
Railway > Variables:

```env
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/capitune

# JWT
JWT_SECRET=<GÉNÉRER UNE CLÉ SÉCURISÉE>

# Firebase
FIREBASE_PROJECT_ID=capiatune

# API
API_BASE_URL=https://api.capitune.com
```

#### Étape 6 - Domaine personnalisé
1. Railway > **Settings > Domains**
2. **Add Domain**: `api.capitune.com`
3. Railway génère **Enregistrement DNS** (voir section DNS)
4. SSL automatique ✅

✅ **Backend déployé!** Accédez via `https://api.capitune.com`

---

### Option 2: Heroku

```bash
# Installer Heroku CLI
npm install -g heroku

# Login
heroku login

# Créer l'app
heroku create capitune-api

# Ajouter variables
heroku config:set MONGODB_URI="mongodb+srv://..." --app capitune-api
heroku config:set NODE_ENV="production" --app capitune-api

# Déployer
git push heroku main
```

---

## 🌐 Configuration DNS

### Registrar (GoDaddy, Namecheap, etc.)

Accédez à votre **gestionnaire DNS** pour `capitune.com` :

#### 1. Frontend - Vercel/Netlify
Vercel/Netlify fournit des enregistrements CNAME. Ajouter:

```dns
Type     | Name              | Value
---------|-------------------|------------------------------------------
CNAME    | www               | cname.vercel-dns.com  (ou netlify)
ALIAS    | @                 | capitune.vercel-dns.com
TXT      | _vercel           | verificationCode (fourni par Vercel)
```

#### 2. Backend - Railway/Heroku
Railway fournit un domaine unique. Ajouter:

```dns
Type     | Name              | Value
---------|-------------------|------------------------------------------
CNAME    | api               | api.railway.internal (fourni par Railway)
```

#### 3. Email (Optionnel - pour support@capitune.com)

```dns
Type     | Name              | Value
---------|-------------------|------------------------------------------
MX       | @                 | 10 mail.capitune.com
A        | mail              | 1.2.3.4
TXT      | @                 | v=spf1 include:mailgun...
```

### ⏰ Propagation DNS
- **TTL par défaut**: 3600 secondes (1 heure)
- **Temps complet**: 24-48 heures
- **Vérifier**: `nslookup capitune.com`

---

## 🔒 SSL/HTTPS

### Certificat automatique ✅

**Vercel, Netlify et Railway** fournissent **Let's Encrypt SSL GRATUIT** et **automatique**:

- ✅ Certificats renouvelés automatiquement (tous les 3 mois)
- ✅ Wildcards pour subdomaines (`*.capitune.com`)
- ✅ Redirection automatique HTTP → HTTPS
- ✅ Zéro configuration

### Vérification SSL
```bash
# Vérifier le certificat
openssl s_client -connect capitune.com:443

# Tester la configuration
curl -I https://capitune.com
curl -I https://api.capitune.com
```

---

## 🔑 Variables d'environnement

### Frontend: `VITE_API_HOST`

```env
# Développement
VITE_API_HOST=http://localhost:3000

# Production
VITE_API_HOST=https://api.capitune.com
```

**Mise à jour automatique:**
- Frontend détecte l'URL API depuis la variable d'environnement
- Aucun changement de code nécessaire

### Backend: `API_BASE_URL`

```env
# Développement
API_BASE_URL=http://localhost:3000

# Production
API_BASE_URL=https://api.capitune.com
```

**Utilisé pour:**
- Générer les URLs absolues pour les uploads
- Construire les liens dans les réponses API
- Redirections après authentification

### Autres variables essentielles

```env
# Sécurité
JWT_SECRET=<GÉNÉRER>                    # openssl rand -base64 32

# Base de données
MONGODB_URI=mongodb+srv://user:pass...  # Production MongoDB Atlas

# Firebase
FIREBASE_PROJECT_ID=capiatune

# Node
NODE_ENV=production
PORT=3000
```

---

## ✅ Checklist de Déploiement

### Avant déploiement
- [ ] Domaine `capitune.com` enregistré et accessible
- [ ] Accès au registrar DNS
- [ ] Comptes Vercel/Railway créés
- [ ] MongoDB Atlas production ready
- [ ] Firebase configuré pour domaine `.com`
- [ ] Variables d'environnement prêtes
- [ ] Tests locaux réussis

### Frontend (Vercel)
- [ ] Repository GitHub connecté
- [ ] Build `npm run build` réussit
- [ ] Variables d'environnement VITE_* ajoutées
- [ ] Enregistrements DNS Vercel ajoutés au registrar
- [ ] Certificat SSL actif
- [ ] Test: `https://capitune.com` charge
- [ ] Test: APIs répondent depuis frontend

### Backend (Railway)
- [ ] Dockerfile présent et fonctionnel
- [ ] Variables NODE_ENV, MONGODB_URI, JWT_SECRET définies
- [ ] Déploiement Railway réussi
- [ ] Enregistrements DNS Railway ajoutés au registrar
- [ ] Certificat SSL actif
- [ ] Test: `https://api.capitune.com/health` (si implémenté)
- [ ] Test: Uploads fonctionnent
- [ ] Test: Authentification fonctionne

### Configuration
- [ ] Firebase: domaines autorisés incluent `capitune.com`
- [ ] Azure AD: redirect URIs incluent `https://capitune.com`
- [ ] CORS backend autorise `https://capitune.com`
- [ ] Multer uploads: chemins corrects pour production

### Post-déploiement
- [ ] Vérifier HTTPS sur tout
- [ ] Tester authentification Google
- [ ] Tester authentification Microsoft
- [ ] Tester upload d'avatar/média
- [ ] Vérifier les logs (Railway/Vercel)
- [ ] Surveiller les erreurs 5XX
- [ ] Configurer monitoring (Sentry, DataDog)

---

## 📊 Architecture finale

```
Users (navigateurs)
        ↓
Cloudflare (optionnel, DNS sécurisé)
        ↓
┌─────────────────────────────────────┐
│  Domaine: capitune.com              │
│  ├─ Frontend: capitune.com (Vercel) │
│  └─ API: api.capitune.com (Railway) │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│  Services externes                  │
│  ├─ Firebase Auth (OAuth)           │
│  ├─ Azure AD (OAuth)                │
│  ├─ MongoDB Atlas (DB)              │
│  └─ AWS S3 (Uploads optionnel)      │
└─────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Frontend charge mais API ne répond pas
```bash
# Vérifier l'URL API
# Ouvrir DevTools > Network > voir l'URL exacte
# Vérifier CORS: OPTIONS requests autorisées?
# Vérifier VITE_API_HOST dans Vercel env vars
```

### DNS ne se propage pas
```bash
# Attendre 24-48h
# Vérifier: nslookup capitune.com
# Forcer un flush local: ipconfig /flushdns (Windows)
```

### Certificat SSL n'apparaît pas
```bash
# Vercel/Railway génèrent automatiquement
# Attendre 5-10 minutes après ajout du domaine
# Vérifier CNAME records correctement configurés
```

### Uploads ne fonctionnent pas
```bash
# Vérifier API_BASE_URL en production
# Vérifier dossier /uploads/ accessible
# Vérifier permissions fichier système
# Ou configurer AWS S3
```

---

## 📝 Résumé

| Élément | Solution | Coût |
|---------|----------|------|
| Frontend | Vercel | Gratuit |
| Backend | Railway | Gratuit (5GB/mois) |
| Database | MongoDB Atlas | Gratuit (512MB) |
| Domain | Registrar | ~15$/an |
| SSL | Let's Encrypt | Gratuit |
| **Total** | | **~15$/an** |

---

## 🚀 Commandes rapides

```bash
# Build frontend
cd client && npm run build

# Build backend
cd server && npm run build  # ou Docker

# Vérifier DNS
nslookup capitune.com
nslookup api.capitune.com

# Vérifier SSL
curl -I https://capitune.com
curl -I https://api.capitune.com

# Vérifier API
curl https://api.capitune.com/health
```

---

**Prêt à déployer? Suivez les sections dans l'ordre:** 
1. ✅ Vercel/Netlify (Frontend)
2. ✅ Railway/Heroku (Backend)
3. ✅ DNS (Registrar)
4. ✅ Vérifications finales

**Support:** Consultez CONFIG.md pour détails de configuration avancée.
