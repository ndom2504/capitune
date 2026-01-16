# ✨ Capitune - Un Réseau d'Idées Éthique

> **"Pour ceux qui veulent être éclairés, et c'est assumé."**

Capitune est un réseau social d'idées conçu pour les penseurs critiques, les créateurs et les chercheurs de sens. Contrairement aux réseaux sociaux traditionnels qui vous rendent addicts, Capitune vous rend plus intelligent.

---

## 🎯 Notre Vision

Capitune favorise **la qualité et la profondeur** plutôt que **l'engagement addictif**.

### De ❌ À ✅

| Aspect | Réseaux Traditionnels | Capitune |
|--------|----------------------|----------|
| **Métrique primaire** | Engagement (likes) | Qualité (clarté, profondeur) |
| **Algorithme** | Sensationnalisme | Valeur intellectuelle |
| **Design** | Addictif | Minimaliste |
| **Notifications** | Agressives | Minimes |
| **Scroll** | Infini | Pagination (respecte votre temps) |

---

## 🧠 Caractéristiques Principales

### 1. **Badge de Qualité** 🏆
Chaque post affiche sa qualité:
- ⭐ **Exceptionnel** (85%+) - Idée novatrice bien argumentée
- ✨ **Excellent** (70-84%) - Contenu profond et clair
- ✓ **Bon** (55-69%) - Contribution constructive
- ○ **Correct** (40-54%) - Utile mais peut s'améliorer
- — **À développer** (<40%) - Premiers pas

**Critères:** Longueur, structure, engagement constructif, richesse média.

### 2. **Profil Cognitif** 🧠
Votre évolution intellectuelle (privée):
- **Diversité intellectuelle** — Gamme de thèmes explorés
- **Qualité argumentative** — Clarté et profondeur
- **Contributions constructives** — Impact communautaire
- **Croissance cognitive** — Évolution mois sur mois

### 3. **Explorations Thématiques** 📚
Visualisez comment vous explorez le monde et vos intérêts.

### 4. **Pas de Mécanismes Addictifs** 🚫
- ❌ Pas de stories (utilisation compulsive)
- ❌ Pas de scroll infini (crée dépendance)
- ❌ Pas de notifications agressives (urgence artificielle)
- ❌ Pas de classements publics (compétition toxique)
- ❌ Pas de compteurs de likes visibles

---

## 🚀 Tech Stack

### Frontend
- React 18 + Vite (HMR rapide)
- Framer Motion (animations)
- Firebase + Azure MSAL (OAuth)

### Backend
- Node.js + Express
- MongoDB Atlas
- Multer (uploads)
- JWT authentication

### Infrastructure
- Uploads: `/uploads/` (avatars, media, banners)
- Auth: 3 méthodes (email, Google, Microsoft)

---

## 🚀 Installation

```bash
# Install all dependencies
npm install

# Start dev servers (frontend 5173 + backend 3000)
npm run dev
```

---

## 📁 Structure

```
capitune/
├── client/              # React + Vite
│   ├── src/components/  # Réutilisables
│   ├── src/pages/       # Feed, Profile, Landing
│   └── src/utils/       # API, helpers
├── server/              # Node + Express
│   ├── src/models/      # Mongoose schemas
│   ├── src/routes/      # API endpoints
│   └── src/server.js
├── PHILOSOPHY.md        # Vision détaillée
└── README.md           # Ce fichier
```

---

## 🎨 Design

- **Couleurs:** Sable (#F5F1E8), Beige (#E8E0D5), Pierre (#D4C9BC), Accent (#8B7355)
- **Fonts:** Crimson Text (serif) + Inter (sans-serif)
- **Principes:** Minimaliste, respirant, responsive, accessible

---

## 📡 API Routes

### Posts
- `GET /api/posts/feed` — Feed éthique
- `POST /api/posts` — Créer
- `POST /api/posts/:id/like` — Engager
- `POST /api/posts/:id/comment` — Commenter

### Users
- `GET /api/users/me` — Profil
- `PUT /api/users/me/avatar` — Upload avatar
- `PUT /api/users/me/banner` — Upload bannière
- `POST /api/users/:id/follow` — Suivre

---

## 📈 Roadmap

**Phase 1 ✅** — Structure, auth, posts, uploads, design
**Phase 2 🔄** — Scores de qualité backend, algorithme éthique, recherche
**Phase 3 📋** — Threads, collections, ressources, analytics

---

## 💚 Valeurs

- **Respect:** Chaque utilisateur est un penseur capable
- **Authenticité:** Les idées valorisées pour leur qualité
- **Croissance:** Intelligence > engagement passif
- **Transparence:** Critères explicites et modifiables

---

**Dernière mise à jour:** Décembre 2024 | **Statut:** 🚀 Beta active

Pour plus de détails, lire [PHILOSOPHY.md](PHILOSOPHY.md).

- 🖼️ Images épurées
- 🎥 Vidéos lentes et profondes
