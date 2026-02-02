# 🚀 CAPITUNE — Platform Orientation Canada

**Plateforme d'orientation, de gestion de dossiers et de communauté pour candidats à l'immigration et professionnels au Canada.**

---

## 📋 Vue d'ensemble du projet

CAPITUNE est une **plateforme web B2C/B2B** qui connecte :
- **Candidats** : accès communauté, ressources, gestion dossier, webinaires
- **Professionnels** : gestion clients, Inside, publications, webinaires
- **Admin** : modération, validation, gestion événements

### 🎯 Objectif MVP
Lancer une version fonctionnelle en **8–10 semaines** avec :
- ✅ Auth (inscription/connexion)
- ✅ Dashboard personnalisé
- ✅ Mon dossier (documents + checklist + chat)
- ✅ Inside (communauté)
- ✅ Live (webinaires)
- ✅ Profil

---

## 📁 Structure du projet

```
capitune/
├── docs/                          # Documentation
│   ├── SPECIFICATION.md          # Spec complète (6 pages)
│   ├── ROLES_PERMISSIONS.md      # Rôles et permissions
│   ├── PARCOURS_UTILISATEUR.md   # User journeys
│   └── ROADMAP.md                # Phases (MVP → V2)
├── design/                        # Design & Wireframes
│   ├── WIREFRAMES.md             # Maquettes (Excalidraw/Figma)
│   ├── NAVIGATION.md             # Menu + layout
│   └── COLORS.md                 # Palette (couleurs logo)
├── architecture/                  # Architecture système
│   ├── ARCHITECTURE.md           # Vue d'ensemble
│   ├── DATABASE_SCHEMA.md        # Tables/collections
│   └── API_ROUTES.md             # Endpoints
├── frontend/                      # Code frontend
│   ├── src/
│   │   ├── pages/               # Les 6 pages
│   │   ├── components/          # Composants réutilisables
│   │   ├── layouts/             # Layouts (sidebar, etc.)
│   │   └── hooks/               # Hooks custom
│   └── package.json
├── backend/                       # Code backend
│   ├── routes/                  # Endpoints API
│   ├── models/                  # Modèles de données
│   ├── middleware/              # Auth, validation
│   └── app.js
├── database/                      # Migrations & seeds
│   ├── migrations/
│   └── seeds/
└── .env.example
```

---

## 🎨 Identité visuelle

**Palette couleur (inspirée du logo CAPITUNE)** :
- Bleu marine : `#001F3F`
- Bleu cyan/turquoise : `#00BCD4`
- Blanc : `#FFFFFF`
- Gris clair : `#F5F5F5`
- Accent : `#FF6B35` (optionnel, pour CTAs)

---

## 👥 Rôles & Permissions

| Rôle | Dossier | Inside | Live | Admin |
|------|---------|--------|------|-------|
| **Candidat** | Voir le sien | Oui | Oui | Non |
| **Pro** | Gérer ses clients | Oui + Publier | Oui | Non |
| **Admin** | Tous | Modération | Gestion | Oui |

---

## 📍 6 Pages principales

1. **Home** — Présentation + CTAs (Candidat/Pro)
2. **Authentification** — Inscription/Connexion/Reset
3. **Dashboard** — Vue d'ensemble post-auth
4. **Inside** — Communauté + ressources
5. **Live** — Webinaires + événements
6. **Mon dossier** — Gestion documents + suivi + chat
7. **Profil** — Données personnelles + préférences

---

## 🚀 Prochaines étapes

1. ✅ **Structure du projet** (EN COURS)
2. 📋 **Documentation détaillée** (pages, rôles, parcours, spec)
3. 🎨 **Wireframes** (dashboard, mon dossier, inside)
4. 🗄️ **Schema BD** (tables détaillées)
5. 🛠️ **Setup frontend** (React/Next.js)
6. 🔧 **Setup backend** (Node/Express ou similar)

---

## 📞 Contact

- **Projet** : CAPITUNE
- **Date démarrage** : 02 février 2026
- **Team** : [À compléter]

---

**Statut** : 🔵 En configuration | **MVP cible** : Mars 2026
