# 🎯 Roadmap CAPITUNE — MVP → V2 → V3

---

## 📅 Timeline global

```
FÉVRIER 2026 ────────► MVP (V1)
MARS-AVRIL 2026 ────► V2 (Fonctionnalités avancées)
MAI+ 2026 ──────────► V3 (Scaling & ML)
```

---

## 🚀 MVP (V1) — Février-Mars 2026

**Objectif** : Plateforme fonctionnelle et utilisable.

### 🎯 Scope MVP

#### 1. Authentication
- ✅ Inscription (candidat + professionnel)
- ✅ Connexion
- ✅ Mot de passe oublié
- ✅ Vérification email
- ✅ Rôles de base (candidat, pro, admin)

#### 2. Pages principales
- ✅ **Home** (publique)
  - Hero + CTA double
  - Fonctionnalités overview
  - "Comment ça marche"
  - Valeurs

- ✅ **Dashboard** (post-auth)
  - Progression
  - Prochaine action
  - Accès rapide aux modules
  - Notifications simples

- ✅ **Mon dossier**
  - Documents (upload + statut)
  - Checklist/Timeline
  - Chat candidat-agent
  - Vue candidat + vue pro

- ✅ **Inside** (Communauté)
  - Fil de posts simples
  - Commentaires + likes
  - Tags/Catégories
  - Modération basique (flag)

- ✅ **Live** (Webinaires)
  - Calendrier
  - Inscription
  - Lien diffusion (embed)
  - Reminders email

- ✅ **Profil**
  - Infos perso
  - Objectifs
  - Préférences notifications
  - Changement mot de passe

#### 3. Backend
- ✅ API REST (Node/Express ou similar)
- ✅ Auth JWT + refresh tokens
- ✅ CRUD basique (users, dossiers, messages, posts)
- ✅ Upload fichiers (AWS S3 ou Supabase Storage)
- ✅ Email (Sendgrid ou Mailgun)
- ✅ Validation données

#### 4. BD
- ✅ Tables (users, dossiers, documents, messages, posts, events)
- ✅ Migrations
- ✅ Seeds données test

#### 5. Déploiement
- ✅ Frontend (Vercel ou Netlify)
- ✅ Backend (Heroku ou Railway)
- ✅ BD (PostgreSQL sur cloud)
- ✅ CI/CD basique (GitHub Actions)

### 🚫 Hors MVP
- ❌ Paiements / Abonnements
- ❌ App mobile
- ❌ Vérification pro stricte
- ❌ Ratings / Reviews
- ❌ Réplays webinaires
- ❌ Analytics avancés
- ❌ Automatisations
- ❌ Recommandations ML

### 📊 Capacité MVP
- Utilisateurs : 100-1000
- Dossiers : 50-500
- Posts : 200-1000
- Webinaires : 4-8 par mois

---

## 🎨 V2 (Avril-Juin 2026) — Pro features

**Objectif** : Dépasser MVP avec features avancées.

### Nouvelles features

#### 1. Vérification Pro (V2)
- ✅ Admin: Dashboard de validation
- ✅ Vérifier docs + références
- ✅ Badge "Vérifié" ✓
- ✅ Suspension/Ban

#### 2. Ratings & Testimonials
- ✅ Pros reçoivent avis clients
- ✅ Score global visible
- ✅ Témoignages dans profil
- ✅ Annuaire filtrable

#### 3. Paiements (optionnel)
- ✅ Stripe/PayPal integration
- ✅ Paiement documents validation
- ✅ Abonnement pro (accès features)
- ✅ Invoices automatiques

#### 4. Notifications avancées
- ✅ SMS (via Twilio)
- ✅ Push notifications
- ✅ Slack integration (admin)
- ✅ Webhooks

#### 5. Webinaires avancés
- ✅ Replay/VOD
- ✅ Chat live durante webinaire
- ✅ Q&A session
- ✅ Recording + transcription

#### 6. Matching intelligent
- ✅ Recommandations pros pour candidats
- ✅ Recommandations dossiers pour pros
- ✅ Tags & filtres intelligents

#### 7. Analytics
- ✅ Admin: Dashboard stats complet
- ✅ Pros: Analytics clients (pipeline, revenue)
- ✅ Candidats: Progression tracker
- ✅ Exports (CSV, PDF)

#### 8. Admin features
- ✅ Audit logs complets
- ✅ Modération automatisée (keyword filter)
- ✅ User management avancé
- ✅ Batch operations

#### 9. Search & Discovery
- ✅ Recherche globale (posts, pros, ressources)
- ✅ Filtres avancés (Inside)
- ✅ Saved searches

#### 10. Sécurité V2
- ✅ 2FA (email/SMS/authenticator)
- ✅ Sessions management
- ✅ IP whitelist (pro)
- ✅ Encryption end-to-end chat (optionnel)

### 🎯 Capacity V2
- Utilisateurs : 5000-10000
- Dossiers : 500-2000
- Webinaires : 10-20 par mois
- Transactions : $10K+ /mois (si paiements)

---

## 🧠 V3 (Juillet+ 2026) — ML & Scale

**Objectif** : Scaling, ML, automatisations.

### ML & IA

#### 1. Recommandations ML
- Smart matching candidat ↔ pro
- Document validation automatique
- Dossier completion scorer

#### 2. Chatbot
- Support client 24/7
- FAQ intelligent
- Routing to admin

#### 3. Content moderation (AI)
- Flag posts automatiquement
- Detect spam/abuse
- Auto-archive low-quality

#### 4. Analytics avancés
- Predictive scoring (dossier success)
- Churn prediction
- Engagement forecasting

### Tech upgrades

#### 1. Performance
- Caching (Redis)
- CDN global (Cloudflare)
- DB optimization (sharding)
- Load testing

#### 2. Infra
- Kubernetes (scalability)
- Microservices (si besoin)
- Message queue (RabbitMQ/Kafka)
- Multi-region deployment

#### 3. Mobile
- Native iOS/Android app
- Push notifications
- Offline sync

### Business features

#### 1. Marketplace
- Pro can list services
- Package pricing
- Booking calendar
- Escrow payments

#### 2. Content Library
- Video courses
- E-books
- Certifications
- Partner content

#### 3. Integrations
- Zapier
- Google Workspace
- Slack
- Salesforce

#### 4. White label
- Custom domain
- Branding
- Multi-org support

### 🎯 Capacity V3
- Utilisateurs : 50K+
- Webinaires : 50+ par mois
- Revenue : $100K+ /mois
- SLA : 99.9% uptime

---

## 📈 Roadmap détaillée par sprint

### Sprint 1-2 (Semaine 1-2)
```
☐ Setup repo + dev env
☐ Auth implementation
☐ Home page
☐ BD setup
```

### Sprint 3-4 (Semaine 3-4)
```
☐ Dashboard
☐ Mon dossier (candidat)
☐ Upload documents
☐ Notifications
```

### Sprint 5-6 (Semaine 5-6)
```
☐ Inside (posts + comments)
☐ Admin moderation
☐ Profil utilisateur
☐ Testing
```

### Sprint 7-8 (Semaine 7-8)
```
☐ Live (webinaires)
☐ Event registration
☐ Email + SMS
☐ Integration tests
```

### Sprint 9-10 (Semaine 9-10)
```
☐ Polish & fixes
☐ Performance
☐ Documentation
☐ MVP Launch
```

---

## 🎯 Priorités & KPIs

### MVP Success Metrics
- User signups : 100+
- Dossiers créés : 30+
- Posts publiés : 50+
- Webinaire attendees : 200+
- Retention (7-day) : 40%+

### V2 Success Metrics
- Users : 5000+
- Dossiers complétés : 200+
- Verified pros : 50+
- Revenue : $5K+
- NPS : 40+

### V3 Success Metrics
- Users : 50K+
- ARR : $500K+
- Market share : Top 3 en Canada
- NPS : 60+

---

## 💰 Budget indicatif

### MVP (~8-10 sem)
```
Dev team        : 5-10 dev (40 user-weeks)
Infrastructure  : $1-2K
Tools/services  : $500-1K
Marketing       : $2-5K
────────────────────────
TOTAL MVP       : $100K-200K
```

### V2 (~6 sem)
```
Dev team        : 8-12 dev (30 user-weeks)
ML/Data         : 1-2 engr
Infrastructure  : $2-5K
Tools/services  : $2-3K
Marketing       : $5-10K
────────────────────────
TOTAL V2        : $150K-250K
```

### V3 (~ongoing)
```
Annual budget   : $300K-500K
(scaling ops)
```

---

## 🚀 Go-to-market (GTM)

### MVP (Soft launch)
- Beta avec 20-50 test users
- Feedback loop rapide
- Amélioration continue

### V2 (Public launch)
- PR / Médias
- Partnership avec orga pro
- Google Ads / Facebook Ads
- Community building

### V3 (Growth)
- Affiliate program
- Partnerships premium
- Enterprise sales

---

**Statut** : Roadmap finalisée ✓ | **Date** : 02 février 2026
