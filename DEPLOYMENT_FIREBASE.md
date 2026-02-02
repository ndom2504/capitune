# 🔥 Déploiement Capitune.com avec Firebase

**Domaine:** capitune.com  
**Plateforme:** Firebase (Google Cloud)  
**Date:** 15 janvier 2026

---

## 🎯 Architecture Firebase

```
capitune.com
├─ Frontend: Firebase Hosting
│  ├─ Domaine: capitune.com
│  ├─ SSL: Automatique (Let's Encrypt)
│  └─ CDN: Global automatique
│
├─ Backend: Firebase Cloud Functions
│  ├─ API: api.capitune.com
│  ├─ Runtime: Node.js 18
│  └─ Région: europe-west1
│
└─ Database: Firestore ou MongoDB Atlas
   ├─ Firestore: Natif Firebase
   └─ MongoDB: Externe (si préféré)
```

**Avantages Firebase:**
- ✅ Tout-en-un (hosting + functions + auth)
- ✅ Déjà utilisé pour Google Auth
- ✅ CDN mondial automatique
- ✅ SSL gratuit et automatique
- ✅ Domaine personnalisé facile
- ✅ Scaling automatique
- ✅ 125k/mois gratuit (Cloud Functions)

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation Firebase CLI](#installation-firebase-cli)
3. [Configuration projet](#configuration-projet)
4. [Déployer Frontend](#déployer-frontend)
5. [Déployer Backend (Functions)](#déployer-backend-functions)
6. [Domaine personnalisé](#domaine-personnalisé)
7. [Variables d'environnement](#variables-denvironnement)
8. [Base de données](#base-de-données)
9. [Checklist finale](#checklist-finale)

---

## ✅ Prérequis

### 1. Compte Firebase/Google Cloud
- [ ] Compte Google (gmail)
- [ ] Projet Firebase "capiatune" existant
- [ ] Billing activé (pour Cloud Functions)

### 2. Outils locaux
```bash
# Node.js 18+
node --version

# NPM 9+
npm --version

# Firebase CLI
npm install -g firebase-tools
```

### 3. Domaine
- [ ] capitune.com enregistré
- [ ] Accès au registrar (DNS)

---

## 🔧 Installation Firebase CLI

### Windows
```powershell
# Installer Firebase CLI globalement
npm install -g firebase-tools

# Vérifier l'installation
firebase --version

# Connexion à Firebase
firebase login
```

### Authentification
```bash
# Ouvrir navigateur pour se connecter
firebase login

# Lister les projets
firebase projects:list

# Sélectionner le projet capiatune
firebase use capiatune
```

---

## ⚙️ Configuration projet

### Étape 1 - Initialiser Firebase dans le projet

```bash
cd c:\capitune

# Initialiser Firebase
firebase init
```

**Sélectionner:**
- [x] Hosting (frontend)
- [x] Functions (backend)
- [x] Firestore (optionnel si pas MongoDB)

**Configuration interactive:**

```
? Select project: capiatune (existing)

Hosting Setup:
? Public directory: client/dist
? Single-page app: Yes
? GitHub auto-deploy: No

Functions Setup:
? Language: JavaScript
? ESLint: Yes
? Install dependencies: Yes
? Source directory: functions
```

### Étape 2 - Structure générée

```
capitune/
├── firebase.json          # Config Firebase
├── .firebaserc            # Projet sélectionné
├── client/
│   └── dist/              # Build frontend
└── functions/
    ├── index.js           # Points d'entrée API
    └── package.json       # Dépendances backend
```

---

## 🎨 Déployer Frontend

### Étape 1 - Build du frontend

```bash
cd c:\capitune\client
npm run build
```

Génère: `client/dist/`

### Étape 2 - Configuration firebase.json

```json
{
  "hosting": {
    "public": "client/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp|svg|woff|woff2|ttf)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Étape 3 - Déployer

```bash
# Depuis la racine
firebase deploy --only hosting

# URL générée
# https://capiatune.web.app
# https://capiatune.firebaseapp.com
```

✅ **Frontend déployé!**

---

## 🔧 Déployer Backend (Functions)

### Étape 1 - Migrer le code serveur

Créer `functions/index.js`:

```javascript
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
// ... autres routes

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
// ... autres routes

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.json({ 
    message: "🌿 API Capitune sur Firebase",
    version: "1.0.0"
  });
});

// Export comme Cloud Function
exports.api = functions
  .region("europe-west1")
  .https.onRequest(app);
```

### Étape 2 - Copier les routes

```bash
# Copier tout le dossier routes
xcopy /E /I c:\capitune\server\src\routes c:\capitune\functions\routes

# Copier models
xcopy /E /I c:\capitune\server\src\models c:\capitune\functions\models

# Copier config
xcopy /E /I c:\capitune\server\src\config c:\capitune\functions\config

# Copier utils
xcopy /E /I c:\capitune\server\src\utils c:\capitune\functions\utils
```

### Étape 3 - Adapter package.json

`functions/package.json`:

```json
{
  "name": "capitune-functions",
  "version": "1.0.0",
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-functions": "^4.5.0",
    "firebase-admin": "^12.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1"
  }
}
```

### Étape 4 - Configuration

`functions/.env` (pour local):

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/capitune
JWT_SECRET=votre_secret_jwt_securise
```

### Étape 5 - Déployer

```bash
cd c:\capitune

# Installer dépendances
cd functions
npm install

# Retour racine et déployer
cd ..
firebase deploy --only functions

# URL générée
# https://europe-west1-capiatune.cloudfunctions.net/api
```

✅ **Backend déployé!**

---

## 🌐 Domaine personnalisé

### Étape 1 - Ajouter le domaine dans Firebase

```bash
# Via CLI
firebase hosting:channel:deploy production --only hosting

# Ou via Console
# https://console.firebase.google.com
# Hosting > Add custom domain
```

**Firebase Console:**
1. Aller sur **Hosting**
2. Cliquer **Add custom domain**
3. Entrer: `capitune.com`
4. Firebase génère les **enregistrements DNS**

### Étape 2 - Configuration DNS au registrar

Firebase fournit des enregistrements à ajouter:

```dns
Type  | Name | Value
------|------|---------------------------------------
A     | @    | 151.101.1.195  (exemple Firebase)
A     | @    | 151.101.65.195
TXT   | @    | <verification-code>
```

**Pour www.capitune.com:**

```dns
Type  | Name | Value
------|------|---------------------------------------
CNAME | www  | capiatune.web.app
```

### Étape 3 - Attendre vérification

- Firebase vérifie automatiquement
- Génère certificat SSL (Let's Encrypt)
- **Délai:** 24-48h pour propagation DNS complète
- SSL: 5-10 minutes après vérification

### Étape 4 - Vérifier

```bash
# Attendre propagation
nslookup capitune.com

# Vérifier HTTPS
curl -I https://capitune.com
```

✅ **Domaine configuré avec SSL!**

---

## 🔑 Variables d'environnement

### Frontend (Build time)

Créer `client/.env.production`:

```env
VITE_API_HOST=https://capitune.com/api
VITE_FIREBASE_API_KEY=AIzaSyDrY1xeqbiJTUprDLQFxQI1f03utq4j3M8
VITE_FIREBASE_AUTH_DOMAIN=capiatune.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=capiatune
VITE_FIREBASE_STORAGE_BUCKET=capiatune.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=676155032848
VITE_FIREBASE_APP_ID=1:676155032848:web:d4617674441c6b9eaa5195
VITE_FIREBASE_MEASUREMENT_ID=G-EV9BNJ7Q6Q
```

### Backend (Cloud Functions)

**Via Firebase CLI:**

```bash
# Définir variables pour Functions
firebase functions:config:set \
  mongodb.uri="mongodb+srv://..." \
  jwt.secret="<votre-secret>" \
  api.base_url="https://capitune.com"

# Voir config actuelle
firebase functions:config:get

# Déployer avec config
firebase deploy --only functions
```

**Utiliser dans le code:**

```javascript
const functions = require("firebase-functions");

const MONGODB_URI = functions.config().mongodb.uri;
const JWT_SECRET = functions.config().jwt.secret;
```

---

## 💾 Base de données

### Option 1: Firestore (Natif Firebase) ⭐

**Avantages:**
- ✅ Intégré Firebase
- ✅ Temps réel natif
- ✅ Scaling automatique
- ✅ Gratuit: 1GB stockage + 50k lectures/jour

**Configuration:**

```javascript
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// Exemple: Créer utilisateur
await db.collection("users").add({
  username: "john",
  email: "john@example.com"
});

// Lire
const users = await db.collection("users").get();
```

**Migration Mongoose → Firestore:**
- Remplacer `mongoose.connect()` par `admin.firestore()`
- Adapter schémas en collections
- Utiliser Firebase SDK au lieu de Mongoose

### Option 2: MongoDB Atlas (Existant) ✅

**Conserver MongoDB:**

```javascript
// functions/config/database.js
const mongoose = require("mongoose");
const functions = require("firebase-functions");

const connectDB = async () => {
  try {
    const uri = functions.config().mongodb.uri;
    await mongoose.connect(uri);
    console.log("✨ MongoDB connecté");
  } catch (error) {
    console.error("❌ Erreur MongoDB:", error);
  }
};

module.exports = { connectDB };
```

**Garder le schéma existant** - Aucun changement nécessaire!

---

## 📦 Uploads (Images/Médias)

### Option 1: Firebase Storage ⭐

```javascript
const admin = require("firebase-admin");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Upload vers Firebase Storage
app.post("/api/users/me/avatar", upload.single("avatar"), async (req, res) => {
  const file = req.file;
  const bucket = admin.storage().bucket();
  const filename = `avatars/${Date.now()}_${file.originalname}`;
  
  await bucket.file(filename).save(file.buffer, {
    metadata: { contentType: file.mimetype }
  });
  
  const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
  res.json({ avatar: url });
});
```

### Option 2: Conserver uploads locaux

```javascript
// Utiliser /tmp dans Cloud Functions (temporaire)
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "/tmp/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
```

⚠️ **/tmp est éphémère** - fichiers supprimés après execution

---

## ✅ Checklist Déploiement

### Préparation
- [ ] Firebase CLI installé
- [ ] `firebase login` réussi
- [ ] Projet capiatune sélectionné
- [ ] Billing activé (Cloud Functions)

### Frontend
- [ ] `npm run build` réussi
- [ ] `firebase.json` configuré
- [ ] `firebase deploy --only hosting` réussi
- [ ] https://capiatune.web.app accessible

### Backend
- [ ] Code migré dans `functions/`
- [ ] `package.json` adapté
- [ ] Variables config définies
- [ ] `firebase deploy --only functions` réussi
- [ ] API accessible

### Domaine
- [ ] Domaine ajouté dans Firebase Console
- [ ] Enregistrements DNS ajoutés au registrar
- [ ] Propagation DNS vérifiée
- [ ] Certificat SSL actif
- [ ] https://capitune.com accessible

### Tests
- [ ] Frontend charge
- [ ] API répond: `https://capitune.com/api/health`
- [ ] Google Auth fonctionne
- [ ] Uploads fonctionnent
- [ ] Base de données connectée

---

## 🚀 Commandes de déploiement

```bash
# Build frontend
cd client
npm run build

# Déployer tout
cd ..
firebase deploy

# Déployer frontend seulement
firebase deploy --only hosting

# Déployer backend seulement
firebase deploy --only functions

# Déployer fonction spécifique
firebase deploy --only functions:api

# Voir logs
firebase functions:log

# Rollback
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL DEST_SITE_ID:live
```

---

## 💰 Coûts Firebase

### Plan Gratuit (Spark)
- ❌ **Cloud Functions:** Indisponibles
- ✅ **Hosting:** 10GB/mois
- ✅ **Firestore:** 1GB + 50k lectures/jour
- ✅ **Storage:** 5GB
- ✅ **Auth:** Illimité

### Plan Blaze (Pay-as-you-go) ⭐

**Cloud Functions:**
- 2M invocations/mois GRATUIT
- CPU: 400k GB-sec/mois GRATUIT
- RAM: 200k GB-sec/mois GRATUIT
- Au-delà: ~$0.40/M invocations

**Hosting:**
- 10GB stockage GRATUIT
- 360MB/jour transfert GRATUIT

**Firestore:**
- 1GB stockage GRATUIT
- 50k lectures/jour GRATUIT

**Estimation trafic moyen:**
- 10k utilisateurs/mois
- 100k requêtes API/mois
- **Coût total:** ~**$5-15/mois**

---

## 📊 Monitoring

### Firebase Console

https://console.firebase.google.com/project/capiatune

- **Hosting:** Trafic, bande passante
- **Functions:** Invocations, durée, erreurs
- **Auth:** Connexions actives
- **Firestore:** Lectures/écritures

### Logs Cloud Functions

```bash
# Voir logs temps réel
firebase functions:log

# Logs via Console
# Cloud Functions > Logs > Filter par fonction
```

### Alertes

Firebase Console > Alerts:
- Erreurs Functions > 100/heure
- Quota dépassé
- Latence > 2s

---

## 🆘 Troubleshooting

### Déploiement échoue

```bash
# Vérifier projet sélectionné
firebase use

# Vérifier billing
firebase projects:list

# Forcer redéploiement
firebase deploy --force
```

### API ne répond pas

```bash
# Vérifier logs
firebase functions:log --only api

# Tester directement
curl https://europe-west1-capiatune.cloudfunctions.net/api/health
```

### CORS errors

```javascript
// functions/index.js
const cors = require("cors")({ 
  origin: true,
  credentials: true
});

app.use(cors);
```

### Certificat SSL n'apparaît pas

- Attendre 24-48h propagation DNS
- Vérifier enregistrements A/CNAME corrects
- Firebase génère automatiquement

---

## 📝 Résumé Architecture

```
Utilisateurs
    ↓
capitune.com (Firebase Hosting + CDN)
    ↓
/api/** → Cloud Functions (europe-west1)
    ↓
MongoDB Atlas (ou Firestore)
```

**Tous les services sous Firebase:**
- ✅ Hosting (frontend)
- ✅ Functions (backend API)
- ✅ Auth (Google, email)
- ✅ Storage (uploads optionnel)
- ✅ Firestore (DB optionnel)

---

## 🎯 Prochaines étapes

1. **Activer Billing** Firebase (Plan Blaze)
2. **Migrer code** vers `functions/`
3. **Déployer** frontend + backend
4. **Configurer domaine** capitune.com
5. **Tester** tout le workflow

**Timeline:** 2-3 heures (migration incluse)

**Support Firebase:**
- Docs: https://firebase.google.com/docs
- Console: https://console.firebase.google.com
- Stack Overflow: firebase tag

---

**🔥 Firebase = Solution tout-en-un pour capitune.com!**
