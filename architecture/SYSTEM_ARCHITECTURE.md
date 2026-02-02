# Architecture globale CAPITUNE

## 📐 Diagramme système

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEURS                         │
│         Candidats | Professionnels | Admin              │
└────────────┬────────────────────────────────────────────┘
             │
             │ HTTPS/WebSocket
             │
┌────────────▼────────────────────────────────────────────┐
│                  FRONTEND (Vercel)                      │
│  Next.js 14 | React | TypeScript | Tailwind CSS       │
│                                                         │
│  Pages:                                                 │
│  • Home (public)       → Landing page                  │
│  • Auth               → Login/Register                 │
│  • Dashboard          → Overview + shortcuts           │
│  • Inside             → Community posts                │
│  • Live               → Webinars + events              │
│  • Mon dossier        → Document management            │
│  • Profil             → User settings                  │
│                                                         │
│  State:                                                 │
│  • Zustand (auth, UI state)                            │
│  • React Query (server state)                          │
└────────────┬────────────────────────────────────────────┘
             │
             │ REST API (port 3001)
             │
┌────────────▼────────────────────────────────────────────┐
│              BACKEND API (Railway/Heroku)               │
│  Node.js 18 | Express | TypeScript | Prisma ORM       │
│                                                         │
│  Routes:                                                │
│  • POST   /api/auth/register     → User signup        │
│  • POST   /api/auth/login        → User login         │
│  • GET    /api/dossiers          → List my dossiers   │
│  • POST   /api/dossiers          → Create dossier     │
│  • GET    /api/posts             → List Inside posts  │
│  • POST   /api/posts             → Create post        │
│  • POST   /api/documents         → Upload file        │
│  • GET    /api/events            → List webinars      │
│  • POST   /api/events/:id/register → Register event   │
│  ... (30+ endpoints)                                   │
│                                                         │
│  Middleware:                                            │
│  • JWT verification              → Auth check          │
│  • Input validation (Zod)        → Sanitization       │
│  • Rate limiting                 → DDoS protection    │
│  • Error handling                → Global errors      │
│  • CORS                          → Cross-origin       │
│                                                         │
│  Services:                                              │
│  • authService       → JWT, bcrypt                    │
│  • emailService      → Sendgrid integration           │
│  • storageService    → AWS S3 uploads                 │
│  • dossierService    → Business logic                 │
│  • postService       → Community logic                │
│  • eventService      → Webinar logic                  │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┼────────┬──────────┐
    │        │        │          │
    ▼        ▼        ▼          ▼
┌────────┐ ┌────────┐ ┌──────┐ ┌────────────┐
│PostgreSQL│ │ Redis │ │ S3   │ │ Sendgrid   │
│   (BD)   │ │(Cache)│ │(Files)│ │(Email)     │
│ Tables  │ │       │ │      │ │            │
│ ├─users  │ │Sessions │      │ │ Transactional
│ ├─dossiers       │ │      │ │ & Marketing
│ ├─documents      │ │      │ │ emails
│ ├─messages       │ │      │ │
│ ├─posts          │ │      │ │
│ ├─events_live    │ │      │ │
│ └─...            │ │      │ │
│                  │ │      │ │
│ Backups (daily)  │ │      │ │
└────────┘ └────────┘ └──────┘ └────────────┘

Autres services:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Supabase     │ │   YouTube    │ │  Sentry      │
│ Realtime     │ │   (Live)     │ │  (Errors)    │
│ (Chat)       │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔄 Data Flow

### 1. Authentification (Login)
```
Frontend                Backend              Database
  │                        │                    │
  ├─ [Email/Pass] ────────►│                    │
  │                        ├─ Query user ─────►│
  │                        │◄─ User found ─────┤
  │                        │                    │
  │                        ├─ Verify password   │
  │                        ├─ Generate JWT      │
  │◄─ {token, user} ───────┤                    │
  │                        │                    │
  └─ Store in localStorage
```

### 2. Créer dossier (Candidat)
```
Frontend                Backend              Database
  │                        │                    │
  ├─ [Form] ──────────────►│                    │
  │ Bearer {token}         │                    │
  │                        ├─ Verify JWT ──┐   │
  │                        ├─ Validate input├─►│
  │                        │                │   │
  │                        ├─ Create dossier┤   │
  │                        │                └──►│
  │◄─ {dossier, id} ───────┤                    │
  │                        │                    │
  └─ Display success
```

### 3. Upload document
```
Frontend                Backend              S3
  │                        │                   │
  ├─ [File] ─────────────►│                   │
  │ Bearer {token}         │                   │
  │                        ├─ Validate file    │
  │                        │                   │
  │                        ├─ Upload to S3 ───►│
  │                        │◄─ URL returned ────┤
  │                        │                   │
  │                        ├─ Save in BD       │
  │◄─ {file, url} ─────────┤                   │
  │                        │                   │
  └─ Display in list
```

### 4. Créer post (Inside)
```
Frontend                Backend              Database      Realtime
  │                        │                    │             │
  ├─ [Post content] ──────►│                    │             │
  │ Bearer {token}         │                    │             │
  │                        ├─ Validate input    │             │
  │                        ├─ Create post ─────►│             │
  │                        │◄─ Post created ────┤             │
  │                        │                    │             │
  │                        ├─ Broadcast ─────────────────────►│
  │◄─ {post, id} ──────────┤                    │             │
  │                        │                    │             │
  └─ Update local state    │                    │             │
       (optimistic)        │                    │             │
                                                 │
                    Other connected clients◄────┤
                    receive new post (via WebSocket)
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────┐
│  User visits Home (public)                  │
└────────────────────┬────────────────────────┘
                     │
                     ▼
          [Login] or [Register]
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    [Login]                   [Register]
        │                         │
        ├─ Email + Password   ├─ Choose type:
        │                     │  ○ Candidat
        └─ Verify password    │  ○ Professionnel
           Generate JWT       │
           Return {token}     └─ Register
                  │               Verify email
                  │               Return {token}
                  │               │
                  └───────┬───────┘
                          │
                          ▼
              Store token in localStorage
                    Redirect to Dashboard
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Protected Routes              │
         │  - Dashboard                   │
         │  - Inside                      │
         │  - Live                        │
         │  - Mon dossier                 │
         │  - Profil                      │
         └────────────────────────────────┘
                          │
                    All requests include
              Authorization: Bearer {token}
                          │
                    Backend verifies JWT
                   (expiry, signature, etc)
                          │
           ┌──────────────┴──────────────┐
           │                             │
           ▼ Valid                       ▼ Invalid
        Allow access              Return 401 Unauthorized
        Process request           Redirect to login
                                  Frontend clears token
```

---

## 📊 Role-based Access

```
                  CANDIDAT          PROFESSIONNEL        ADMIN
                    │                    │                │
        ┌───────────┼────────────────────┼────────────────┼───────────────┐
        │           │                    │                │               │
        ▼           ▼                    ▼                ▼               ▼
    Dashboard   Dashboard            Dashboard         Dashboard      Dashboard Admin
    (progress)  (pipeline)           (overview)        (overview)     (stats, users)
        │           │                    │                │               │
        ├─ Inside   ├─ Inside           ├─ Inside       ├─ Inside       ├─ Moderation
        │ (read)    │ (read+write)       │ (read+write)   │ (read+write)  │ (delete posts)
        │           │                    │                │               │
        ├─ Live     ├─ Live              ├─ Live          ├─ Live         ├─ User Management
        │ (browse)  │ (attend)           │ (attend)       │ (attend)      │ (CRUD)
        │           │                    │                │               │
        ├─ Dossier  ├─ Dossier           ├─ Dossier       ├─ Dossier      ├─ Events
        │ (own)     │ (clients)          │ (clients)      │ (all)        │ (CRUD)
        │           │                    │                │               │
        ├─ Profil   ├─ Profil + Annuaire ├─ Profil        ├─ Profil       ├─ Validation (Pro)
        │ (edit)    │ (visible)          │ (visible)      │ (visible)     │ (verify badge)
        │           │                    │                │               │
        └─ Logout   └─ Logout            └─ Logout        └─ Logout       └─ Analytics
```

---

## 📈 Scaling Architecture (V2+)

```
                    Current (MVP)            Future (V2+)
                    ─────────────            ────────────

Client              Next.js + CDN      →     Next.js + CDN + Service Worker
                                            (offline support)

Server              Express (1)        →     Express (N) + Load Balancer
                                            API Gateway

Cache               Redis (1)          →     Redis Cluster
                                            Multi-region

Database            PostgreSQL (1)     →     PostgreSQL (read replicas)
                    no replicas             Connection pooling (PgBouncer)

File Storage        S3                 →     S3 + CloudFront (CDN)
                                            Multi-region

Queue               Async (simple)     →     Bull/RabbitMQ
                    (no queue)             Distributed job processing

Monitoring          Sentry             →     Sentry + DataDog + Custom metrics
                    (errors only)          (full observability)
```

---

## 🚀 Deployment

### Frontend (Vercel)
```
[GitHub] 
   │ push to main
   ▼
[Vercel CI]
   ├─ npm run build
   ├─ npm run lint
   └─ npm run type-check
   │ if all pass
   ▼
[Deploy to Production]
   ├─ Next.js optimized
   ├─ CDN edge caching
   └─ Auto-rollback on failure
```

### Backend (Railway/Heroku)
```
[GitHub]
   │ push to main
   ▼
[GitHub Actions CI]
   ├─ npm run lint
   ├─ npm run type-check
   ├─ npm run test
   └─ npm run build
   │ if all pass
   ▼
[Deploy to Production]
   ├─ npm run migrate (auto)
   ├─ Restart service
   ├─ Health check
   └─ Auto-rollback on failure
```

---

## 🔌 External Integrations

```
CAPITUNE Backend
       │
       ├─ Sendgrid (Email sending)
       │  └─ Welcome emails
       │  └─ Password reset
       │  └─ Notifications
       │
       ├─ AWS S3 (File storage)
       │  └─ Document uploads
       │  └─ Avatar images
       │
       ├─ Supabase Realtime (WebSocket)
       │  └─ Live chat (Inside posts)
       │  └─ Real-time notifications
       │
       ├─ YouTube/Zoom API (Future)
       │  └─ Embed live streams
       │  └─ Attendance tracking
       │
       ├─ Stripe (Payments - V2)
       │  └─ Document validation fees
       │  └─ Subscription billing
       │
       ├─ Sentry (Error tracking)
       │  └─ JavaScript errors
       │  └─ Backend errors
       │  └─ Performance monitoring
       │
       └─ Google Analytics
          └─ User behavior tracking
          └─ Conversion funnel
```

---

**Diagramme dernière mise à jour** : 02 février 2026
