# 🏗️ Architecture technique CAPITUNE

---

## 🎯 Vue d'ensemble

```
┌─────────────────────────────────────────────┐
│          CLIENT (Frontend)                  │
│  React/Next.js | Tailwind CSS | Zustand    │
└─────────────┬───────────────────────────────┘
              │ HTTPS REST / WebSocket
              │
┌─────────────▼───────────────────────────────┐
│        API SERVER (Backend)                 │
│  Node.js/Express | TypeScript | JWT Auth   │
│                                             │
│  Routes: /api/auth, /api/dossiers, ...     │
│  Middleware: Auth, Validation, Logging     │
└─────────────┬───────────────────────────────┘
              │
      ┌───────┴──────────┬────────────┐
      │                  │            │
      ▼                  ▼            ▼
┌──────────────┐  ┌───────────┐  ┌────────────┐
│  PostgreSQL  │  │ S3/Cloud  │  │  Redis     │
│    (BD)      │  │  Storage  │  │  (Cache)   │
└──────────────┘  └───────────┘  └────────────┘

Extern services:
  • Sendgrid (Email)
  • Twilio (SMS - V2)
  • YouTube/Zoom (Live)
  • Supabase Realtime (Chat)
```

---

## 📊 Stack technique recommandée

### Frontend

```
Framework       : Next.js 14+ (React)
Language        : TypeScript
Styling         : Tailwind CSS
State mgmt      : Zustand + React Query
Form handling   : React Hook Form
Validation      : Zod
Icons           : Lucide React
Components      : Headless UI / Radix UI
Deployment      : Vercel
```

### Backend

```
Runtime         : Node.js 18+
Framework       : Express.js (ou Fastify)
Language        : TypeScript
Database        : PostgreSQL + Prisma ORM
Cache           : Redis
Auth            : JWT + bcrypt
File storage    : AWS S3 / Supabase Storage
Email           : Sendgrid / Mailgun
Task queue      : Bull / BullMQ (V2)
Logging         : Winston
API docs        : Swagger/OpenAPI
Testing         : Jest + Supertest
Deployment      : Railway / Heroku / AWS
```

### Database

```
Primary         : PostgreSQL (cloud)
Cache           : Redis
Search (V2)     : Elasticsearch
Time-series (V2): InfluxDB
```

### DevOps & CI/CD

```
Version control : GitHub
CI/CD           : GitHub Actions
Container       : Docker (optional)
Infrastructure  : Vercel (frontend) + Railway/Heroku (backend)
Monitoring      : Sentry (errors) + LogRocket (frontend)
Analytics       : Mixpanel / Plausible
```

---

## 📂 Structure frontend (Next.js)

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + navigation
│   │   ├── page.tsx                # Dashboard home
│   │   ├── inside/page.tsx         # Communauté
│   │   ├── live/page.tsx           # Webinaires
│   │   ├── dossier/page.tsx        # Mon dossier (list)
│   │   ├── dossier/[id]/page.tsx   # Détail dossier
│   │   └── profile/page.tsx        # Profil
│   ├── home/page.tsx               # Home publique
│   └── layout.tsx                  # Root layout
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── Dossier/
│   │   ├── DossierCard.tsx
│   │   ├── DocumentUpload.tsx
│   │   └── MessageThread.tsx
│   ├── Inside/
│   │   ├── PostCard.tsx
│   │   ├── PostForm.tsx
│   │   └── CommentThread.tsx
│   ├── Live/
│   │   ├── EventCard.tsx
│   │   └── EventRegistration.tsx
│   └── Common/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Notification.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useDossier.ts
│   ├── usePost.ts
│   └── useEvent.ts
├── lib/
│   ├── api.ts             # API client (fetch/axios wrapper)
│   ├── auth.ts            # Auth helpers
│   ├── storage.ts         # LocalStorage
│   └── utils.ts           # Utilitaires
├── store/
│   ├── authStore.ts       # Auth state (Zustand)
│   ├── dossierStore.ts    # Dossier state
│   └── uiStore.ts         # UI state (modals, etc.)
├── types/
│   ├── index.ts           # Global types
│   └── api.ts             # API response types
├── styles/
│   └── globals.css        # Global styles
└── public/
    ├── logo.svg
    └── images/
```

---

## 🔧 Structure backend (Express)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts        # PostgreSQL connection
│   │   ├── auth.ts            # JWT config
│   │   └── env.ts             # Env variables
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification
│   │   ├── validation.ts       # Input validation
│   │   ├── errorHandler.ts    # Global error handling
│   │   └── logger.ts          # Logging
│   ├── routes/
│   │   ├── auth.ts            # /api/auth/*
│   │   ├── dossiers.ts        # /api/dossiers/*
│   │   ├── documents.ts       # /api/documents/*
│   │   ├── messages.ts        # /api/messages/*
│   │   ├── posts.ts           # /api/posts/* (Inside)
│   │   ├── events.ts          # /api/events/* (Live)
│   │   ├── users.ts           # /api/users/*
│   │   └── admin.ts           # /api/admin/*
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── dossierController.ts
│   │   ├── postController.ts
│   │   ├── eventController.ts
│   │   └── ...
│   ├── models/
│   │   ├── User.ts
│   │   ├── Dossier.ts
│   │   ├── Document.ts
│   │   ├── Post.ts
│   │   └── ...                # Prisma models
│   ├── services/
│   │   ├── authService.ts     # Business logic
│   │   ├── emailService.ts    # Sendgrid
│   │   ├── storageService.ts  # S3 / Supabase
│   │   ├── dossierService.ts
│   │   └── ...
│   ├── utils/
│   │   ├── validators.ts      # Data validation
│   │   ├── jwt.ts             # Token helpers
│   │   └── helpers.ts
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Entry point
├── prisma/
│   ├── schema.prisma          # DB schema
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🔐 Flow d'authentification

```
Frontend                          Backend
───────────────────────────────────────────────────

1. User sign up
   [Register form]
          │
          │ POST /api/auth/register
          ├─────────────────────────► Validate input
          │                          Hash password
          │                          Create user in DB
          │◄─────────────────────────  { user, token }
          │
   Store token in localStorage
   Redirect to dashboard

2. User login
   [Login form]
          │
          │ POST /api/auth/login
          ├─────────────────────────► Find user
          │                          Compare password
          │◄─────────────────────────  { user, token }
          │
   Store token

3. Protected route
   [Dashboard page]
          │
          │ GET /api/dashboard
          │ Headers: Authorization: Bearer {token}
          ├─────────────────────────► Verify token (JWT)
          │                          Check expiry
          │◄─────────────────────────  { data }
          │
   Display data

4. Token refresh (V2)
   Token expiring
          │
          │ POST /api/auth/refresh
          │ + refreshToken
          ├─────────────────────────► Validate refresh token
          │◄─────────────────────────  { newToken }
          │
   Update localStorage
```

---

## 🔄 API Endpoints (MVP)

### Auth
```
POST   /api/auth/register        # Inscription
POST   /api/auth/login           # Connexion
POST   /api/auth/logout          # Déconnexion
POST   /api/auth/forgot-password # Réinitialiser mot de passe
POST   /api/auth/reset-password  # Reset avec token
GET    /api/auth/verify-email    # Vérifier email
```

### Users
```
GET    /api/users/me             # Profil courant
PUT    /api/users/me             # Éditer profil
GET    /api/users/:id            # Profil autre user
PUT    /api/users/:id/avatar     # Changer avatar
```

### Dossiers
```
GET    /api/dossiers             # Liste mes dossiers
POST   /api/dossiers             # Créer dossier
GET    /api/dossiers/:id         # Détail dossier
PUT    /api/dossiers/:id         # Éditer dossier
DELETE /api/dossiers/:id         # Supprimer dossier
```

### Documents
```
POST   /api/dossiers/:id/documents      # Upload document
GET    /api/dossiers/:id/documents      # Lister documents
PUT    /api/documents/:id/status        # Changer statut (pro)
DELETE /api/documents/:id               # Supprimer document
```

### Messages
```
GET    /api/dossiers/:id/messages       # Chat histoire
POST   /api/dossiers/:id/messages       # Envoyer message
PUT    /api/messages/:id/read           # Marquer comme lu
```

### Posts (Inside)
```
GET    /api/posts                       # Lister posts
POST   /api/posts                       # Créer post
GET    /api/posts/:id                   # Détail post
PUT    /api/posts/:id                   # Éditer post (owner)
DELETE /api/posts/:id                   # Supprimer post (owner/admin)
POST   /api/posts/:id/comments          # Commenter
POST   /api/posts/:id/like              # Liker
```

### Events (Live)
```
GET    /api/events                      # Lister événements
GET    /api/events/:id                  # Détail événement
POST   /api/events/:id/register         # S'inscrire
DELETE /api/events/:id/register         # Se désinscrire
GET    /api/events/:id/attendees        # Liste participants (admin)
```

### Admin
```
GET    /api/admin/users                 # Lister users
PUT    /api/admin/users/:id/status      # Suspend/activate
POST   /api/admin/events                # Créer événement
GET    /api/admin/analytics             # Stats
```

---

## 🛡️ Sécurité

### Authentication
```
JWT tokens (expiry: 1h)
Refresh tokens (expiry: 30d)
bcrypt password hashing (salt: 12)
```

### CORS
```
Allowed origins: production domain + localhost (dev)
Credentials: true
Methods: GET, POST, PUT, DELETE
```

### Rate limiting
```
Auth endpoints: 10 req/min per IP
General: 100 req/min per user
Upload: 1 req/s per user
```

### Input Validation
```
All inputs validated server-side
Sanitize file uploads
SQL injection protection (Prisma)
XSS protection (React)
```

---

## 📊 Database Indexing (Performance)

```
PRIMARY KEYS
├── users.id
├── dossiers.id
├── posts.id
└── events.id

FOREIGN KEYS (indexed)
├── dossiers.candidate_id
├── documents.dossier_id
├── messages.dossier_id
└── posts.author_id

PERFORMANCE INDEXES
├── users.email
├── dossiers.status
├── posts.created_at DESC
├── messages.created_at DESC
├── events.event_date
└── event_registrations(event_id, user_id) UNIQUE
```

---

## 🚀 Deployment checklist

### Frontend (Vercel)
```
☑ Environment variables (.env.production)
☑ Build optimization (next/image, code splitting)
☑ Sitemap.xml + robots.txt
☑ Analytics integration
☑ Error tracking (Sentry)
☑ Preview deployments (staging)
☑ Auto-deploy on main branch
```

### Backend (Railway/Heroku)
```
☑ Environment secrets
☑ Database migrations (auto on deploy)
☑ Health check endpoint (/health)
☑ Process manager (PM2 or systemd)
☑ Error logging (Sentry)
☑ Metrics/monitoring
☑ Backup strategy (daily)
```

### Database (PostgreSQL)
```
☑ Backups (daily)
☑ Connection pooling (PgBouncer)
☑ Replication (for production)
☑ Monitoring (query slow logs)
```

---

## 🔗 Intégrations externes

### Services
```
Email         : Sendgrid (production)
File storage  : AWS S3 or Supabase Storage
Chat realtime : Supabase Realtime or Firebase
Error tracking: Sentry
Monitoring    : LogRocket (frontend) + Datadog (backend)
Analytics     : Mixpanel
Authentication: Google/GitHub OAuth (V2)
```

---

## 📈 Scalability considerations (V2+)

```
Caching layer (Redis)
├── Cache user sessions
├── Cache frequently accessed data
└── Rate limiting

CDN (Cloudflare)
├── Static assets caching
├── DDoS protection
└── Global distribution

Database optimization
├── Connection pooling
├── Query optimization
├── Read replicas
└── Sharding (if needed)

Message queue (Bull/BullMQ)
├── Email sending (async)
├── Notifications
├── Heavy computations

Microservices (futur)
├── Auth service
├── Dossier service
├── Notification service
└── Analytics service
```

---

**Statut** : Architecture finalisée ✓ | **Date** : 02 février 2026
