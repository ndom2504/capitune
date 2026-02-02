# 🚀 DÉPLOIEMENT CAPITUNE.COM - GUIDE RAPIDE

**Domaine:** capitune.com  
**Architecture:** Frontend (Vercel) + Backend (Railway)  
**Temps estimé:** 30 minutes

---

## ✅ ÉTAPE 1 - PRÉPARATION (5 min)

### 1.1 Accès au registrar
- [ ] Accéder au registrar (GoDaddy, Namecheap, etc.)
- [ ] Vérifier l'accès à la gestion DNS

### 1.2 Créer les comptes
- [ ] Compte Vercel: https://vercel.com/signup
- [ ] Compte Railway: https://railway.app
- [ ] Connecter GitHub aux deux

### 1.3 Préparer MongoDB
- [ ] MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- [ ] Créer cluster (gratuit)
- [ ] Créer utilisateur DB avec mot de passe sécurisé
- [ ] Whitelister IPs (0.0.0.0/0 pour now)
- [ ] Copier connection string

---

## 🎨 ÉTAPE 2 - DÉPLOYER FRONTEND (8 min)

### 2.1 Connexion Vercel
1. Aller sur vercel.com
2. Cliquer **New Project**
3. Importer le repository GitHub
4. Sélectionner `client` comme root directory

### 2.2 Variables d'environnement Vercel
Settings > Environment Variables, ajouter:

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

### 2.3 Ajouter domaine Vercel
1. Settings > Domains
2. Ajouter `capitune.com`
3. **Copier les enregistrements DNS** (A ou CNAME)
4. Attendre validation SSL

✅ **Frontend prêt!** URL temporaire: `<project-name>.vercel.app`

---

## 🔧 ÉTAPE 3 - DÉPLOYER BACKEND (8 min)

### 3.1 Connexion Railway
1. Aller sur railway.app
2. **New Project > Deploy from GitHub**
3. Sélectionner le repository
4. Sélectionner `server` comme root directory

### 3.2 Variables d'environnement Railway
Railway > Variables, ajouter:

```env
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.capitune.com
MONGODB_URI=<copié depuis MongoDB Atlas>
JWT_SECRET=<générer: openssl rand -base64 32>
FIREBASE_PROJECT_ID=capiatune
```

### 3.3 Ajouter domaine Railway
1. Settings > Domains
2. Ajouter `api.capitune.com`
3. **Copier l'enregistrement DNS** (CNAME)
4. Attendre validation SSL

✅ **Backend prêt!** URL temporaire: `<project-name>.up.railway.app`

---

## 🌐 ÉTAPE 4 - CONFIGURATION DNS (5 min)

### 4.1 Au registrar
Ajouter les enregistrements:

```
Type   | Name | Value
-------|------|-------------------------------------------
CNAME  | www  | cname.vercel-dns.com
ALIAS  | @    | capitune.vercel-dns.com
CNAME  | api  | <copié depuis Railway>
TXT    | @    | v=spf1 include:vercel.com ~all
```

### 4.2 Vérifier
```bash
# Après 5-10 minutes:
nslookup capitune.com
nslookup api.capitune.com

# Vérifier HTTPS:
curl -I https://capitune.com
curl -I https://api.capitune.com
```

✅ **DNS propagé!**

---

## ✨ ÉTAPE 5 - VÉRIFICATIONS FINALES (5 min)

### 5.1 Frontend
- [ ] https://capitune.com charge
- [ ] Logo orange visible
- [ ] Pas d'erreurs console

### 5.2 Backend
- [ ] `https://api.capitune.com/health` répond
- [ ] Authentification Google fonctionne
- [ ] Upload d'avatar fonctionne

### 5.3 Firebase
1. Firebase Console
2. Settings > Authorized domains
3. Ajouter `capitune.com`

### 5.4 Azure AD (si utilisé)
1. Azure Portal
2. App registration
3. Redirect URIs: ajouter `https://capitune.com/auth/callback`

---

## 🎯 RÉSUMÉ CHECKLIST

```
Préparation:
- [ ] Registrar accessible
- [ ] Vercel account
- [ ] Railway account
- [ ] MongoDB URI

Frontend:
- [ ] GitHub connecté à Vercel
- [ ] Variables env VITE_* configurées
- [ ] Domaine capitune.com ajouté
- [ ] Build réussi

Backend:
- [ ] GitHub connecté à Railway
- [ ] Variables env NODE_ENV, MONGODB_URI configurées
- [ ] Domaine api.capitune.com ajouté
- [ ] Build réussi

DNS:
- [ ] CNAME www ajouté
- [ ] ALIAS @ ajouté
- [ ] CNAME api ajouté
- [ ] Propagation vérifiée

Firebase:
- [ ] capitune.com dans authorized domains
- [ ] Google auth fonctionne

Tests:
- [ ] Frontend charge HTTPS
- [ ] API répond HTTPS
- [ ] Login Google fonctionne
- [ ] Uploads fonctionnent
```

---

## 🆘 AIDE RAPIDE

### DNS ne se propage pas
```bash
# Attendre 24h
# Ou vérifier:
nslookup capitune.com
nslookup @8.8.8.8 capitune.com  # Forcer Google DNS
```

### Certificat SSL n'apparaît pas
- Vercel/Railway génèrent automatiquement
- Attendre 5-10 minutes après ajout du domaine

### API non accessible depuis frontend
- Vérifier `VITE_API_HOST=https://api.capitune.com`
- Vérifier CORS au backend (accepte capitune.com)
- Vérifier réseau: F12 > Network > voir l'URL

### MongoDB timeout
- Vérifier whitelist IP (0.0.0.0/0 recommandé pour dev)
- Vérifier connection string
- Vérifier mot de passe sans caractères spéciaux

---

## 📞 SUPPORT

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **Firebase Auth:** https://firebase.google.com/docs/auth

---

## ⏱️ TIMELINE

| Étape | Durée | Total |
|-------|-------|-------|
| 1. Préparation | 5 min | 5 min |
| 2. Frontend | 8 min | 13 min |
| 3. Backend | 8 min | 21 min |
| 4. DNS | 5 min | 26 min |
| 5. Vérifications | 5 min | 31 min |
| **Propagation DNS** | **24h** | |

---

**🎉 Capitune.com est en production!**

Visitez: https://capitune.com
