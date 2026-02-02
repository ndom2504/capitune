# ✅ CAPITUNE Launch Checklist

## Phase 1 : Préparation (Semaine 1)

### Documentation
- [ ] Lire [docs/SPECIFICATION.md](../docs/SPECIFICATION.md)
- [ ] Lire [docs/ROLES_PERMISSIONS.md](../docs/ROLES_PERMISSIONS.md)
- [ ] Lire [architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md)
- [ ] Partager documentation avec l'équipe
- [ ] Setup GitHub wiki/docs

### Infrastructure
- [ ] Créer repos GitHub (frontend, backend, ou mono-repo)
- [ ] Setup secrets GitHub (API keys, DB credentials)
- [ ] Configurer branches (main, develop, staging)
- [ ] Setup CI/CD (GitHub Actions)
- [ ] PostgreSQL cloud (AWS RDS, Railway, Supabase)
- [ ] Redis setup (Redis Cloud, Railway)
- [ ] AWS S3 bucket (ou Supabase Storage)
- [ ] Sendgrid API key
- [ ] Domain name (si production)

### Team setup
- [ ] Assigner responsabilités (frontend, backend, devops)
- [ ] Setup Slack/Discord channel
- [ ] Weekly sync meeting
- [ ] Setup project management (GitHub Projects, Jira)

---

## Phase 2 : Fondations (Semaine 2-3)

### Frontend Foundation
- [ ] Initialize Next.js project
- [ ] Setup TypeScript
- [ ] Setup Tailwind CSS
- [ ] Setup Zustand (state management)
- [ ] Setup file structure (src/app, src/components, etc.)
- [ ] Create layout wrapper (Sidebar + Header)
- [ ] Setup authentication store
- [ ] Create API client (fetch/axios wrapper)
- [ ] Setup error boundary
- [ ] Environment variables (.env.local)

### Backend Foundation
- [ ] Initialize Express server
- [ ] Setup TypeScript
- [ ] Setup Prisma ORM
- [ ] Database schema (prisma/schema.prisma)
- [ ] Create migrations
- [ ] Seed test data
- [ ] Setup auth middleware (JWT)
- [ ] Setup validation middleware (Zod)
- [ ] Setup error handling
- [ ] Setup logging (Winston)
- [ ] Setup CORS
- [ ] Setup rate limiting

### Design System
- [ ] Define colors in Tailwind config
- [ ] Create button component
- [ ] Create input component
- [ ] Create card component
- [ ] Create modal component
- [ ] Create notification/toast component
- [ ] Create loading spinner
- [ ] Create avatar component
- [ ] Setup responsive breakpoints

---

## Phase 3 : Core Features (Semaine 4-6)

### Authentication
- [ ] Frontend: Login page UI
- [ ] Frontend: Register page (candidat/pro choice)
- [ ] Frontend: Forgot password page
- [ ] Frontend: Email verification page
- [ ] Frontend: Protected route wrapper
- [ ] Backend: POST /api/auth/register
- [ ] Backend: POST /api/auth/login
- [ ] Backend: POST /api/auth/logout
- [ ] Backend: POST /api/auth/forgot-password
- [ ] Backend: Email sending (Sendgrid)
- [ ] Backend: JWT token generation/validation
- [ ] Integration testing auth flow

### Dashboard
- [ ] Frontend: Dashboard page layout
- [ ] Frontend: Progression bar component
- [ ] Frontend: "Prochaine action" card
- [ ] Frontend: Notification center
- [ ] Frontend: Quick access cards (Inside, Live, Dossier, Profil)
- [ ] Backend: GET /api/dashboard (overview data)
- [ ] Backend: GET /api/notifications

### Mon dossier - Candidat
- [ ] Frontend: List dossiers page
- [ ] Frontend: Create dossier form
- [ ] Frontend: Dossier detail page
- [ ] Frontend: Documents tab (upload + list)
- [ ] Frontend: Checklist/Timeline tab
- [ ] Frontend: Messages tab (chat UI)
- [ ] Frontend: Budget section
- [ ] Backend: GET /api/dossiers
- [ ] Backend: POST /api/dossiers
- [ ] Backend: GET /api/dossiers/:id
- [ ] Backend: PUT /api/dossiers/:id
- [ ] Backend: POST /api/documents (upload)
- [ ] Backend: GET /api/documents
- [ ] Backend: PUT /api/documents/:id/status
- [ ] Backend: POST /api/messages
- [ ] Backend: GET /api/messages
- [ ] S3 integration (file upload)

### Mon dossier - Pro
- [ ] Frontend: Client list page (pro view)
- [ ] Frontend: Client detail page (pro view)
- [ ] Frontend: Internal notes section
- [ ] Frontend: Assign professional form
- [ ] Backend: GET /api/dossiers (filtered by pro)
- [ ] Backend: PUT /api/dossiers/:id/assign
- [ ] Backend: POST /api/internal_notes

---

## Phase 4 : Community & Events (Semaine 7)

### Inside (Communauté)
- [ ] Frontend: Inside feed page
- [ ] Frontend: Create post form
- [ ] Frontend: Post card component
- [ ] Frontend: Comments thread UI
- [ ] Frontend: Like button
- [ ] Frontend: Category/tag filter
- [ ] Backend: GET /api/posts
- [ ] Backend: POST /api/posts
- [ ] Backend: POST /api/posts/:id/comments
- [ ] Backend: POST /api/posts/:id/like
- [ ] Backend: PUT /api/posts/:id (edit)
- [ ] Backend: DELETE /api/posts/:id
- [ ] Backend: Admin moderation endpoints

### Live (Webinaires)
- [ ] Frontend: Events calendar page
- [ ] Frontend: Event detail page
- [ ] Frontend: Registration form
- [ ] Backend: GET /api/events
- [ ] Backend: GET /api/events/:id
- [ ] Backend: POST /api/events/:id/register
- [ ] Backend: DELETE /api/events/:id/register
- [ ] Backend: Admin POST /api/events (create)
- [ ] Email reminders (optional MVP v1)

---

## Phase 5 : Additional Features (Semaine 8)

### Profil
- [ ] Frontend: Profile page (edit form)
- [ ] Frontend: Notification preferences
- [ ] Frontend: Password change
- [ ] Backend: GET /api/users/me
- [ ] Backend: PUT /api/users/me
- [ ] Backend: PUT /api/users/me/avatar

### Admin Panel (basic)
- [ ] Frontend: Admin dashboard
- [ ] Frontend: Post moderation queue
- [ ] Backend: GET /api/admin/posts (flagged)
- [ ] Backend: PUT /api/admin/posts/:id/status
- [ ] Backend: GET /api/admin/users
- [ ] Backend: PUT /api/admin/users/:id/suspend

---

## Phase 6 : Testing & Polish (Semaine 9)

### Testing
- [ ] Frontend unit tests (30+ tests)
- [ ] Backend unit tests (40+ tests)
- [ ] Integration tests (auth, dossier flow)
- [ ] E2E tests (key user journeys)
- [ ] Coverage report (>60% target)

### Code Quality
- [ ] ESLint pass (frontend + backend)
- [ ] TypeScript strict mode pass
- [ ] Prettier formatting
- [ ] Code review process
- [ ] Dependency audit

### Performance
- [ ] Frontend build size < 500KB (gzipped)
- [ ] First Contentful Paint < 2s
- [ ] Database query optimization
- [ ] Add Redis caching (optional)
- [ ] Image optimization (next/image)

### Bug fixes & Polish
- [ ] Fix all critical bugs
- [ ] Mobile responsiveness check
- [ ] Cross-browser testing
- [ ] Accessibility audit (WCAG 2.1)
- [ ] Security audit

---

## Phase 7 : Deployment (Semaine 10)

### Pre-deployment
- [ ] Database backups
- [ ] .env variables configured (production)
- [ ] SSL certificates
- [ ] CDN setup (optional)
- [ ] Monitoring setup (Sentry)

### Staging deployment
- [ ] Deploy frontend to Vercel staging
- [ ] Deploy backend to Railway staging
- [ ] Database migration (staging)
- [ ] Smoke tests
- [ ] Admin user creation (staging)
- [ ] User acceptance testing (10-20 beta users)
- [ ] Fix feedback issues

### Production deployment
- [ ] Create backup of production DB
- [ ] Deploy frontend (Vercel prod)
- [ ] Deploy backend (Railway prod)
- [ ] Run migrations
- [ ] Health check endpoints
- [ ] Smoke tests production
- [ ] Monitor error logs (Sentry)
- [ ] Announce launch

### Post-launch
- [ ] Monitor uptime
- [ ] Track error rates
- [ ] User feedback collection
- [ ] Weekly sync with team
- [ ] Feature request tracking

---

## 🚀 MVP Launch Criteria

### Must Have
- ✅ All 6 pages functional
- ✅ Auth working (login, register, logout)
- ✅ Document upload working
- ✅ Chat between candidat/pro working
- ✅ Inside posts + comments working
- ✅ Live event registration working
- ✅ Mobile responsive
- ✅ No critical bugs
- ✅ Deployed to production
- ✅ 100+ beta users onboarded

### Nice to Have
- ✅ Email reminders
- ✅ User profiles complete
- ✅ Admin moderation working
- ✅ Analytics tracking

### Not in MVP
- ❌ Paiements
- ❌ App mobile native
- ❌ Webinaire replays
- ❌ Vérification pro stricte
- ❌ 2FA
- ❌ Notifications SMS

---

## 📊 Success Metrics (30 days post-launch)

### User Metrics
- [ ] 100+ signups
- [ ] 50+ dossiers created
- [ ] 40% 7-day retention
- [ ] 20% 30-day retention
- [ ] 5+ webinaire attendees average

### Technical Metrics
- [ ] 99% uptime
- [ ] < 100 errors/day
- [ ] < 2s page load time
- [ ] < 1% bug rate (critical)

### Engagement Metrics
- [ ] 50+ Inside posts
- [ ] 20+ comment threads
- [ ] 2+ webinaires hosted
- [ ] 30+ NPS score

---

## 🔄 Post-launch Tasks (V1.1)

### Week 1-2
- [ ] Fix critical bugs from user feedback
- [ ] Optimize slowest pages
- [ ] Improve onboarding UX
- [ ] Add FAQ

### Week 3-4
- [ ] Plan V2 features
- [ ] User interviews (10+ users)
- [ ] Feedback loop
- [ ] Start V2 development

---

## 📋 Daily Standup Template

```
Date: YYYY-MM-DD
Attendees: [List]

Frontend Lead:
  ✅ Completed: [feature]
  🔄 In progress: [feature]
  🚫 Blocked: [issue] → action?

Backend Lead:
  ✅ Completed: [endpoint]
  🔄 In progress: [feature]
  🚫 Blocked: [issue] → action?

DevOps:
  ✅ Completed: [infra]
  🔄 In progress: [setup]
  🚫 Blocked: [issue] → action?

Blockers:
  1. [Issue] → Owner: [Name]
  2. [Issue] → Owner: [Name]

Next 24h priorities:
  1. [Task]
  2. [Task]
  3. [Task]
```

---

## 🎯 Decision Log

| Date | Decision | Owner | Rationale |
|------|----------|-------|-----------|
| 2026-02-02 | Use Next.js for frontend | Frontend lead | SSR + built-in optimization |
| 2026-02-02 | Use Express + Prisma | Backend lead | Simple, proven, type-safe |
| 2026-02-02 | PostgreSQL for DB | DevOps | Reliable, open-source, scalable |
| ... | ... | ... | ... |

---

## 📞 Escalation Path

**Bug/Issue** → **Slack #capitune-dev**
  ↓
**If critical** → **On-call engineer**
  ↓
**If urgent** → **Team lead**
  ↓
**If blocking** → **VP Engineering**

---

## 🎉 Launch Day Checklist (Final)

- [ ] Team fully notified + online
- [ ] Monitoring (Sentry, LogRocket) active
- [ ] Support team ready
- [ ] Slack channel live
- [ ] Product hunt / social media posts scheduled
- [ ] Email to beta users sent
- [ ] Rollback plan documented
- [ ] Database backup recent
- [ ] Health checks passing
- [ ] 🚀 **LAUNCH!**

---

**Version** : 1.0 | **Last updated** : 02 février 2026
