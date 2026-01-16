# 🚀 Migration Express → Firebase Functions - Guide Pratique

## 📋 Différences principales

| Express classique | Firebase Functions |
|-------------------|-------------------|
| `app.listen(3000)` | `exports.api = functions.https.onRequest(app)` |
| Variables `.env` | `functions.config()` |
| Uploads `/uploads` | Firebase Storage ou `/tmp` |
| Port 3000 local | URL Cloud Functions |

---

## ✅ Étape 1 - Structure des fichiers

### Avant (server/)
```
server/
├── src/
│   ├── server.js         # Point d'entrée
│   ├── routes/
│   ├── models/
│   ├── config/
│   └── utils/
└── package.json
```

### Après (functions/)
```
functions/
├── index.js              # Point d'entrée Cloud Function
├── routes/               # Copié depuis server/src/routes
├── models/               # Copié depuis server/src/models
├── config/               # Copié depuis server/src/config
├── utils/                # Copié depuis server/src/utils
└── package.json          # Adapté pour Functions
```

---

## 🔧 Étape 2 - Créer functions/index.js

```javascript
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/database");

// Import routes (EXACTEMENT comme server.js)
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const contactRoutes = require("./routes/contacts");
const analyticsRoutes = require("./routes/analytics");
const monetizationRoutes = require("./routes/monetization");
const creatorRoutes = require("./routes/creator");
const marketplaceRoutes = require("./routes/marketplace");
const insideRoutes = require("./routes/inside");
const notificationRoutes = require("./routes/notifications");
const communitiesRoutes = require("./routes/communities");
const eventsRoutes = require("./routes/events");

const app = express();

// Middleware (EXACTEMENT comme server.js)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Servir uploads (si stockage local)
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connexion DB (au démarrage de la fonction)
connectDB().catch(err => console.error("DB error:", err));

// Routes (EXACTEMENT comme server.js)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/monetization", monetizationRoutes);
app.use("/api/creator", creatorRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/inside", insideRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/communities", communitiesRoutes);
app.use("/api/events", eventsRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route de base
app.get("/", (req, res) => {
  res.json({ 
    message: "🌿 API Capitune sur Firebase",
    version: "1.0.0",
    philosophy: "Un espace de présence, pas de performance"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Une erreur est survenue",
    error: err.message
  });
});

// 🔥 Export comme Cloud Function
exports.api = functions
  .region("europe-west1")
  .runWith({
    timeoutSeconds: 300,
    memory: "512MB"
  })
  .https.onRequest(app);
```

---

## 📦 Étape 3 - Copier les fichiers

```powershell
# Depuis c:\capitune

# Initialiser functions si pas déjà fait
firebase init functions

# Copier routes
xcopy /E /I server\src\routes functions\routes

# Copier models
xcopy /E /I server\src\models functions\models

# Copier config
xcopy /E /I server\src\config functions\config

# Copier utils
xcopy /E /I server\src\utils functions\utils

# Créer dossier uploads (si stockage local)
mkdir functions\uploads
```

---

## 📝 Étape 4 - Adapter package.json

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
    "dotenv": "^16.3.1",
    "mongoose": "^8.0.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "axios": "^1.13.2",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "eslint": "^8.15.0"
  },
  "private": true
}
```

---

## 🔑 Étape 5 - Variables d'environnement

### Définir les variables

```bash
# MongoDB
firebase functions:config:set mongodb.uri="mongodb+srv://user:pass@cluster.mongodb.net/capitune"

# JWT
firebase functions:config:set jwt.secret="votre_secret_jwt_securise"

# Firebase
firebase functions:config:set firebase.project_id="capiatune"

# API
firebase functions:config:set api.base_url="https://capitune.com"

# Voir config
firebase functions:config:get
```

### Utiliser dans le code

`functions/config/database.js`:

```javascript
const mongoose = require("mongoose");
const functions = require("firebase-functions");

// Au lieu de process.env.MONGODB_URI
const MONGODB_URI = functions.config().mongodb?.uri || process.env.MONGODB_URI;

exports.connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✨ Connecté à MongoDB");
  } catch (error) {
    console.error("❌ Erreur MongoDB:", error);
    throw error;
  }
};
```

`functions/config/firebase.js`:

```javascript
const admin = require("firebase-admin");
const functions = require("firebase-functions");

// Initialiser Firebase Admin (utilise credentials automatiques)
admin.initializeApp();

exports.verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Erreur token Firebase:", error);
    throw new Error("Token invalide");
  }
};

exports.default = admin;
```

---

## 📤 Étape 6 - Adapter les uploads

### Option A: Firebase Storage (Recommandé)

`functions/routes/users.js`:

```javascript
const admin = require("firebase-admin");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Upload avatar vers Firebase Storage
router.put("/me/avatar", authenticate, upload.single("avatar"), async (req, res) => {
  try {
    const file = req.file;
    const bucket = admin.storage().bucket();
    const filename = `avatars/${req.user._id}_${Date.now()}.${file.mimetype.split('/')[1]}`;
    
    await bucket.file(filename).save(file.buffer, {
      metadata: { contentType: file.mimetype },
      public: true
    });
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    
    req.user.avatar = publicUrl;
    await req.user.save();
    
    res.json({ 
      message: "Avatar mis à jour",
      user: req.user.toPublicProfile()
    });
  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({ message: "Erreur upload" });
  }
});
```

### Option B: Stockage temporaire /tmp

```javascript
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "/tmp/uploads",  // ⚠️ Éphémère
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });
```

⚠️ **Attention:** `/tmp` est supprimé après chaque exécution!

---

## 🌐 Étape 7 - Adapter urlHelper

`functions/utils/urlHelper.js`:

```javascript
const functions = require("firebase-functions");

// Au lieu de process.env.API_BASE_URL
let API_BASE_URL = functions.config().api?.base_url || "http://localhost:3000";

exports.ensureAbsoluteUrl = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  if (pathOrUrl.startsWith("/uploads")) {
    return `${API_BASE_URL}${pathOrUrl}`;
  }
  return pathOrUrl;
};
```

---

## 🚀 Étape 8 - Déployer

```bash
cd c:\capitune

# Installer dépendances
cd functions
npm install

# Revenir à la racine
cd ..

# Déployer Functions
firebase deploy --only functions

# URL générée:
# https://europe-west1-capiatune.cloudfunctions.net/api
```

---

## 🧪 Étape 9 - Tester

### Test local (émulateur)

```bash
# Lancer émulateurs
firebase emulators:start

# API locale:
# http://localhost:5001/capiatune/europe-west1/api
```

### Test production

```bash
# Health check
curl https://europe-west1-capiatune.cloudfunctions.net/api/health

# Route de base
curl https://europe-west1-capiatune.cloudfunctions.net/api/

# Test auth (avec token)
curl -H "Authorization: Bearer <token>" \
  https://europe-west1-capiatune.cloudfunctions.net/api/users/me
```

---

## 📊 Changements nécessaires par fichier

### ✅ Aucun changement
- `routes/*.js` - Identiques
- `models/*.js` - Identiques
- Middleware `authenticate.js` - Identique

### ⚠️ Changements mineurs
- `config/database.js` - Utiliser `functions.config()`
- `config/firebase.js` - Utiliser `admin.initializeApp()`
- `utils/urlHelper.js` - Utiliser `functions.config()`

### 🔄 Changements importants
- `server.js` → `index.js` - Export comme function
- Uploads - Passer à Firebase Storage ou `/tmp`

---

## 💡 Conseils

### Performance
```javascript
// Timeout plus long pour opérations lourdes
exports.api = functions
  .runWith({
    timeoutSeconds: 300,    // 5 minutes max
    memory: "512MB"         // RAM allouée
  })
  .https.onRequest(app);
```

### Logs
```javascript
// Utiliser functions.logger au lieu de console.log
const { logger } = require("firebase-functions");

logger.info("User login", { userId: user._id });
logger.error("DB error", { error: err.message });
```

### Cold start
```javascript
// Connexion DB en dehors du handler (réutilisée)
let dbConnected = false;

exports.api = functions.https.onRequest(async (req, res) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  return app(req, res);
});
```

---

## ✅ Checklist Migration

- [ ] `functions/` créé avec `firebase init`
- [ ] `index.js` créé avec export function
- [ ] Routes copiées
- [ ] Models copiés
- [ ] Config adaptée (functions.config)
- [ ] Uploads adaptés (Storage ou /tmp)
- [ ] package.json adapté
- [ ] Variables config définies
- [ ] `npm install` dans functions/
- [ ] Test local avec émulateurs
- [ ] Déploiement production réussi
- [ ] API accessible

---

**🎯 Migration terminée! Express tourne maintenant sur Firebase Functions.**
