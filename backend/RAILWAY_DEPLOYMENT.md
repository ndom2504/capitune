# Déploiement Backend sur Railway

## ✅ Configuré

- ✅ `Dockerfile` pour Node.js 18
- ✅ `docker-compose.yml` pour dev local
- ✅ `railway.toml` pour Railway
- ✅ `.env.production` avec variables

## 🚀 Déploiement Railway

### 1. Créer un projet Railway

1. Va sur https://railway.app
2. Login / Sign up
3. Clique **New Project**
4. Sélectionne **Deploy from GitHub**
5. Connecte ton repo GitHub

### 2. Configurer les variables d'environnement

**Sur Railway Dashboard :**
1. Va dans **Variables**
2. Ajoute ces variables :

```
NODE_ENV=production
JWT_SECRET=your_secure_key_here_min_32_chars
FRONTEND_URL=https://capitune.com
SENDGRID_API_KEY=your_key
```

### 3. Ajouter PostgreSQL + Redis

**Sur Railway :**
1. Clique **+ New**
2. Ajoute **PostgreSQL** (Railway crée automatiquement `DATABASE_URL`)
3. Ajoute **Redis** (Railway crée automatiquement `REDIS_URL`)

### 4. Deploy

```bash
# Railway CLI (optionnel)
npm install -g @railway/cli
railway login
railway link
railway up
```

Ou simplement push sur GitHub → Railway déploie automatiquement

### 5. Obtenir l'URL du backend

1. Va dans **Deployments**
2. Copie l'URL publique (ex: `https://backend-prod-xxx.railway.app`)
3. Configure GoDaddy DNS :

```
Subdomain: api
Type: CNAME
Value: backend-prod-xxx.railway.app
```

## 🔗 Connexion Frontend → Backend

Mets à jour `.env.production` du frontend :

```
NEXT_PUBLIC_API_URL=https://api.capitune.com
NEXT_PUBLIC_APP_URL=https://capitune.com
```

## 🗄️ Prisma Migrations

Railway exécute automatiquement les migrations :

```bash
# Railway executes : npm run prisma:migrate
```

Ou manuellement via Railway CLI :
```bash
railway run npx prisma migrate deploy
```

## 🐛 Debugging

### Logs Railway
```bash
railway logs
```

### Status endpoint
```bash
curl https://api.capitune.com/api/health
```

### Vérifier variables
```bash
railway variables
```

## 📋 Checklist déploiement

- [ ] Repo GitHub connecté
- [ ] PostgreSQL + Redis ajoutés
- [ ] Variables d'environnement configurées
- [ ] JWT_SECRET changé (pas le par défaut)
- [ ] FRONTEND_URL = https://capitune.com
- [ ] Database URL existe
- [ ] Prisma migrations exécutées
- [ ] URL API publique obtenue
- [ ] DNS GoDaddy pointé vers Railway
- [ ] CORS vérifié (FRONTEND_URL correct)
- [ ] Supabase auth URLs incluent l'API

## 🎯 URLs finales

```
Frontend: https://capitune.com
Backend API: https://api.capitune.com
Database: PostgreSQL (Railway)
Cache: Redis (Railway)
```
