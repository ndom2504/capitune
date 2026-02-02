# 📊 CAPITUNE — Synthèse du projet

**Plateforme d'orientation, communauté et gestion de dossiers pour immigrants au Canada**

---

## ✨ Objectif en 1 phrase

Connecter **candidats** à l'immigration, **professionnels** (agents, consultants) et **ressources** via une plateforme web centralisée avec communauté, webinaires et gestion de dossiers.

---

## 🎯 MVP (Février-Mars 2026)

### 6 Pages principales
1. **Home** — Présentation + CTAs (candidat/pro)
2. **Auth** — Inscription/connexion/reset
3. **Dashboard** — Vue d'ensemble + actions rapides
4. **Inside** — Communauté (posts, commentaires, tags)
5. **Live** — Webinaires + calendrier + inscription
6. **Mon dossier** — Documents, suivi, chat, notes

*Bonus page* : **Profil** — Édition infos + préférences

### 3 Rôles
- **Candidat** : voir dossier, communauté, webinaires
- **Professionnel** : gérer clients, publier, webinaires
- **Admin** : modération, validation, événements

### Tech Stack
- **Frontend** : Next.js 14 + TypeScript + Tailwind + Zustand
- **Backend** : Node.js + Express + PostgreSQL + Prisma
- **Storage** : AWS S3 (documents) + Redis (cache)
- **Services** : Sendgrid (email), Supabase Realtime (chat)
- **Deploy** : Vercel (frontend) + Railway (backend)

---

## 📁 Structure du projet

```
capitune/
├── docs/
│   ├── SPECIFICATION.md          ← 6 pages détail
│   ├── ROLES_PERMISSIONS.md      ← Rôles + permissions
│   ├── PARCOURS_UTILISATEUR.md   ← User journeys
│   └── ROADMAP.md                ← MVP → V2 → V3
├── design/
│   └── DESIGN_SYSTEM.md          ← Couleurs + wireframes
├── architecture/
│   └── ARCHITECTURE.md           ← Tech stack + API
├── database/
│   └── DATABASE_SCHEMA.md        ← Tables + migrations
├── frontend/
│   ├── src/
│   │   ├── app/                  ← Pages (6 + bonus)
│   │   ├── components/           ← Composants
│   │   ├── hooks/                ← Custom hooks
│   │   ├── store/                ← State Zustand
│   │   └── types/                ← TypeScript types
│   ├── GETTING_STARTED.md
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/               ← API endpoints
│   │   ├── controllers/          ← Logique requête
│   │   ├── services/             ← Business logic
│   │   ├── models/               ← Prisma models
│   │   └── middleware/           ← Auth, validation
│   ├── prisma/
│   │   ├── schema.prisma         ← BD schema
│   │   └── migrations/
│   ├── GETTING_STARTED.md
│   └── package.json
├── .env.example
├── CONTRIBUTING.md
└── README.md                     ← Ce fichier
```

---

## 🚀 Getting Started (5 min)

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
# → http://localhost:3000
```

### Backend
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
# → http://localhost:3001
```

---

## 📋 Fonctionnalités MVP

### Page 1 : Home
- ✅ Hero + CTA double (Candidat/Pro)
- ✅ "Comment ça marche" (4 étapes)
- ✅ Valeurs (Transparence, Conformité, Responsabilité)
- ✅ Aperçu fonctionnalités (cards)

### Page 2 : Auth
- ✅ Inscription (candidat/pro)
- ✅ Connexion
- ✅ Mot de passe oublié
- ✅ Vérification email

### Page 3 : Dashboard
- ✅ Bienvenue personnalisée
- ✅ Progression du parcours (%)
- ✅ Prochaine action suggérée
- ✅ Accès rapide (Inside, Live, Mon dossier, Profil)
- ✅ Notifications récentes

### Page 4 : Inside (Communauté)
- ✅ Fil de posts (texte + commentaires)
- ✅ Catégories/Tags (Études, Travail, Budget, etc.)
- ✅ Like + Commentaires
- ✅ Annuaire pros (basic)

### Page 5 : Live (Webinaires)
- ✅ Calendrier événements
- ✅ Inscription + confirmation email
- ✅ Lien diffusion (YouTube/Zoom intégré)
- ✅ Page détail (titre, intervenant, durée, lien)

### Page 6 : Mon dossier
**Candidat** :
- ✅ Vue dossier unique
- ✅ Documents (upload + statut)
- ✅ Timeline/Checklist
- ✅ Chat candidat ↔️ agent
- ✅ Budget estimé

**Professionnel** :
- ✅ Liste clients (pipeline)
- ✅ Détail client (docs, messages, notes internes)
- ✅ Statuts (draft, in_progress, completed, archived)
- ✅ Assignation dossiers

### Page 7 : Profil (Bonus)
- ✅ Infos perso (édition)
- ✅ Objectifs (candidat)
- ✅ Préférences notifications
- ✅ Sécurité (changement mot de passe)

---

## 🎨 Identité visuelle

### Palette
```
Bleu marine  : #001F3F  (Primary)
Cyan         : #00BCD4  (Accent)
Blanc        : #FFFFFF  (Background)
Gris clair   : #F5F5F5  (Section alt)
```

### Navigation
- Sidebar (desktop) / Bottom tabs (mobile)
- Menu : Home → Inside → Live → Mon dossier → Profil

### Responsive
- Mobile : < 640px
- Tablet : 640-1024px
- Desktop : > 1024px

---

## 📊 Base de données

### Principales tables
- `users` (candidats, pros, admins)
- `dossiers` (dossier par candidat, 0..N pros assignés)
- `documents` (fichiers uploadés)
- `messages` (chat candidat-agent)
- `internal_notes` (notes pros uniquement)
- `posts` (Inside community)
- `comments` (commentaires posts)
- `events_live` (webinaires)
- `event_registrations` (inscriptions)
- `notifications` (système notifications)

Voir [database/DATABASE_SCHEMA.md](database/DATABASE_SCHEMA.md)

---

## 🔐 Sécurité

- ✅ JWT auth (1h expiry)
- ✅ bcrypt password hashing
- ✅ CORS validation
- ✅ Rate limiting
- ✅ Input validation (Zod)
- ✅ SQL injection protection (Prisma)

---

## 📈 Roadmap

### V1 (MVP) — Février 2026
- 6 pages + features basiques
- Auth + rôles simples
- MVP scalable

### V2 — Avril 2026
- Vérification pro stricte
- Ratings/testimonials
- Paiements Stripe
- Webinaires avancés (replay, chat live)
- Recommandations intelligentes
- 2FA

### V3 — Juillet 2026
- ML/IA (recommendations, moderation)
- App mobile
- Marketplace
- Intégrations (Zapier, Slack, etc.)

---

## 🎯 Métriques MVP success

- 100+ signups
- 30+ dossiers créés
- 50+ posts Inside
- 200+ webinaire attendees
- 40%+ retention (7-day)

---

## 👥 Responsabilités

### Frontend
- Pages 6 + design responsive
- State management (Zustand)
- API integration
- Testing (Jest)

### Backend
- API REST endpoints
- Database migrations
- Auth + validation
- Email/SMS + file storage
- Testing (Jest + Supertest)

### DevOps
- CI/CD (GitHub Actions)
- Database (PostgreSQL)
- Deployments (Vercel/Railway)
- Monitoring (Sentry)

---

## 📚 Documentation

Tous les détails dans :

1. **[docs/SPECIFICATION.md](docs/SPECIFICATION.md)** ← START HERE
2. **[docs/ROLES_PERMISSIONS.md](docs/ROLES_PERMISSIONS.md)**
3. **[docs/PARCOURS_UTILISATEUR.md](docs/PARCOURS_UTILISATEUR.md)**
4. **[database/DATABASE_SCHEMA.md](database/DATABASE_SCHEMA.md)**
5. **[design/DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md)**
6. **[architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)**
7. **[CONTRIBUTING.md](CONTRIBUTING.md)**

---

## 🚀 Commencer maintenant

### 1. Lire la spec complète
```
docs/SPECIFICATION.md (20 min)
```

### 2. Cloner et installer
```bash
git clone <repo>
cd capitune/frontend && npm install
cd ../backend && npm install && npm run migrate
```

### 3. Lancer dev servers
```bash
# Terminal 1
cd frontend && npm run dev

# Terminal 2
cd backend && npm run dev
```

### 4. Implémenter pages
Suivre la structure dans `frontend/src/app/` et `backend/src/routes/`

### 5. Tester
```bash
npm run test
```

### 6. Déployer
Frontend → Vercel | Backend → Railway

---

## 📞 Support & Questions

- Consulter la documentation (`docs/` folder)
- Ouvrir une issue GitHub
- Slack team channel

---

## ✅ Checklist avant MVP launch

- [ ] Toutes pages fonctionnelles
- [ ] Auth complète + rôles
- [ ] BD migrated + seedée
- [ ] Tests unitaires (70%+ coverage)
- [ ] CI/CD passe
- [ ] Design responsive testé
- [ ] Performances optimisées
- [ ] Documentation complète
- [ ] Security audit
- [ ] Déployé staging
- [ ] User testing (10-20 users)
- [ ] Feedback intégré
- [ ] Production deployment

---

**Statut** : 🟢 Structure complète prête | **Démarrage** : 02 février 2026 | **MVP target** : 28 février 2026

---

**Dernière mise à jour** : 02 février 2026
