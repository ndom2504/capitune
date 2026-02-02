# Configuration Capitune

## Variables d'Environnement

### Backend (`server/.env`)

```env
# MongoDB
MONGODB_URI=mongodb+srv://morelstevensndong_db_user:Ud3_Lm5CisCZF86@cluster0.sdrs7cd.mongodb.net/capitune

# JWT
JWT_SECRET=your-super-secret-key-here-change-in-production

# Firebase (OAuth Google)
FIREBASE_PROJECT_ID=capitune-e69bd
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Azure AD (OAuth Microsoft)
AZURE_TENANT_ID=79f19744-dc18-...
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Server
NODE_ENV=development
PORT=3000
```

### Frontend (`client/.env`)

```env
# API Host
VITE_API_HOST=http://localhost:3000

# Firebase Config (OAuth Google)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=capitune-e69bd.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=capitune-e69bd
VITE_FIREBASE_STORAGE_BUCKET=capitune-e69bd.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Azure AD Config (OAuth Microsoft)
VITE_AZURE_TENANT_ID=79f19744-dc18-...
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_REDIRECT_URI=http://localhost:5173/auth/callback

# App Config
VITE_APP_NAME=Capitune
VITE_APP_VERSION=1.0.0
```

---

## 🔐 Sécurité

### Production

1. **JWT_SECRET** — Générez une clé forte (32+ caractères):
   ```bash
   openssl rand -base64 32
   ```

2. **MongoDB** — Utilisez MongoDB Atlas avec:
   - Whitelist IP (production cluster seulement)
   - Authentification forte
   - Encryption at rest

3. **Firebase** — Configurez les domaines autorisés:
   - Production: `yourdomain.com`
   - Development: `localhost:5173`

4. **Azure AD** — Enregistrez l'application:
   - Redirect URIs correctes
   - Certificats/secrets sécurisés
   - Permissions minimales

5. **Multer** — Limitez les uploads:
   - Avatars: 5MB, images only
   - Media: 10MB, images + video
   - Validez MIME types

### Variables Sensibles
Ne committez JAMAIS `.env` — utilisez `.env.example`:

```bash
# Copier et remplir
cp .env.example .env
```

---

## 🚀 Déploiement

### Vercel (Frontend)

```bash
# Connectez via GitHub
# Dans Vercel dashboard:
# - Sélectionnez `client/` comme root directory
# - Ajoutez env vars (VITE_API_HOST, VITE_FIREBASE_*, etc.)
# - Deploy!
```

### Heroku / Railway (Backend)

```bash
# Railway (recommandé, plus simple)
railway login
railway init
# Ajoutez env vars dans la console
railway up
```

### Docker (Both)

```dockerfile
# Dockerfile pour frontend
FROM node:18-alpine
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

---

## 📊 Variables de Configuration

### Feature Flags

```env
# Activer/désactiver features
FEATURE_QUALITY_BADGE=true
FEATURE_COGNITIVE_PROFILE=true
FEATURE_ETHICAL_FEED=true
FEATURE_THEME_EXPLORER=true
```

### Limites

```env
# Upload limits
MAX_AVATAR_SIZE=5242880  # 5MB
MAX_MEDIA_SIZE=10485760  # 10MB
MAX_BANNER_SIZE=5242880  # 5MB

# Post limits
MAX_POST_LENGTH=5000
MAX_COMMENT_LENGTH=1000
MAX_TAGS=10
```

### Rate Limiting

```env
# Requêtes par minute (IP)
RATE_LIMIT_POSTS=10
RATE_LIMIT_AUTH=5
RATE_LIMIT_UPLOADS=20
```

---

## ✅ Checklist Avant Production

- [ ] `.env` configuré avec vraies clés
- [ ] `MONGODB_URI` pointe vers production
- [ ] `JWT_SECRET` est aléatoire et long (32+)
- [ ] Firebase/Azure enregistrés et testés
- [ ] CORS correctement configuré
- [ ] HTTPS activé (certificates)
- [ ] Rate limiting activé
- [ ] Logs configurés (CloudWatch/DataDog)
- [ ] Backups MongoDB automatisés
- [ ] CDN configuré pour assets statiques
- [ ] GDPR compliance checklist complétée
- [ ] Tests de sécurité passés (OWASP)

---

## 🐛 Troubleshooting

### "Cannot find module" errors

```bash
# Réinstallez dependencies
rm -rf node_modules package-lock.json
npm install
```

### MongoDB connection timeout

```bash
# Vérifiez IP whitelist dans MongoDB Atlas
# Vérifiez connection string (avec password)
```

### CORS errors

```env
# Frontend
VITE_API_HOST=http://localhost:3000

# Backend - server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
```

### Firebase/Azure auth fails

```bash
# Vérifiez domain whitelist
# Vérifiez redirect URIs
# Vérifiez env vars dans .env
```

---

**Besoin d'aide?** Consultez les docs:
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Multer](https://github.com/expressjs/multer)
