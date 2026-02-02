# 👥 Rôles & Permissions CAPITUNE

---

## 🔑 3 Rôles fondamentaux

### 1️⃣ Candidat (User type: `candidate`)

#### Accès / Modules
- ✅ Dashboard personnel
- ✅ **Mon dossier** (voir le sien)
- ✅ **Inside** (lire + publier)
- ✅ **Live** (s'inscrire + participer)
- ✅ Profil (édition)
- ❌ Admin

#### Actions possibles
```
• Créer/éditer son dossier
• Uploader documents
• Recevoir messages d'agents
• Publier dans Inside (posts, commentaires)
• S'inscrire aux webinaires
• Voir annuaire pros
```

#### Permissions données
```json
{
  "dossiers": ["read_own", "create", "update_own"],
  "documents": ["create", "read_own", "delete_own"],
  "messages": ["read_own", "create", "send"],
  "inside": ["create_post", "comment", "like", "read"],
  "live": ["read", "register", "attend"],
  "profil": ["read_own", "update_own"],
  "admin": []
}
```

---

### 2️⃣ Professionnel (User type: `professional`)

#### Types de professionnels
```
• Agent d'immigration
• Consultant finance / fiscal
• Coach professionnel
• Organisme de formation
• Consultant indépendant
```

#### Accès / Modules
- ✅ Dashboard personnel (vue "clients")
- ✅ **Mon dossier** (gérer ses clients, pipeline)
- ✅ **Inside** (lire + publier = visibilité)
- ✅ **Live** (participer + créer — V2)
- ✅ Profil (édition + portfolio)
- ❌ Admin

#### Actions possibles
```
• Créer/gérer dossiers clients
• Assigner dossiers à d'autres pros
• Uploader documents dans dossiers clients
• Envoyer messages aux candidats
• Publier dans Inside (posts, annonces)
• Voir annuaire (vérification V2)
• Analyser pipeline clients (V2)
```

#### Permissions données
```json
{
  "dossiers": ["read_assigned", "create", "update_assigned", "delete_assigned"],
  "dossiers_clients": ["read", "create", "list"],
  "documents": ["create", "read_assigned", "validate"],
  "messages": ["read_assigned", "create", "send"],
  "notes_internes": ["create", "read_own", "update_own"],
  "inside": ["create_post", "comment", "like", "read"],
  "live": ["read", "attend"],
  "profil": ["read_own", "update_own", "portfolio"],
  "admin": []
}
```

---

### 3️⃣ Admin (User type: `admin`)

#### Accès complet
- ✅ Dashboard admin (stats, modération, gestion)
- ✅ **Tous les dossiers** (read/write)
- ✅ **Modération Inside** (supprimer posts/commentaires)
- ✅ **Gestion Live** (créer, éditer, valider)
- ✅ **Validation pros** (badge, suspension)
- ✅ Gestion users
- ✅ Analytics + reports

#### Actions possibles
```
• Modérer contenu (Inside)
• Valider/suspendre professionnels
• Créer & gérer webinaires/événements
• Gérer utilisateurs (création, suspension, suppression)
• Voir analytics complètes
• Générer rapports
• Gérer notifications système
```

#### Permissions données
```json
{
  "dossiers": ["read", "create", "update", "delete"],
  "documents": ["read", "validate", "delete"],
  "messages": ["read", "moderate"],
  "inside": ["read", "create_post", "comment", "moderate", "delete"],
  "live": ["read", "create", "update", "delete"],
  "users": ["read", "create", "update", "delete", "suspend"],
  "validation": ["verify_pro", "suspend_pro"],
  "analytics": ["full_access"],
  "admin": ["full_access"]
}
```

---

## 📊 Matrice permissions par module

```
MODULE          │ CANDIDAT │ PRO    │ ADMIN
────────────────┼──────────┼────────┼──────
Dashboard       │ Perso    │ Clients│ Global
Mon dossier     │ Le sien  │ Clients│ Tous
Inside          │ Lire+Pub │ Lire+Pub│ Modérer
Live            │ S'inscr  │ Attendre│ Gérer
Profil          │ Éditer   │ Éditer │ Tous
Admin panel     │ ✗        │ ✗      │ ✓
Validation pro  │ ✗        │ Voir   │ Valider
Modération      │ ✗        │ ✗      │ ✓
Analytics       │ ✗        │ Ses clts│ Tous
```

---

## 🔗 Règles de Relation (Dossiers)

### Modèle de propriété

```
┌─────────────┐
│  Candidat   │
│ (user_id)   │
└──────┬──────┘
       │
       │ owns (1-to-1)
       │
       ▼
┌──────────────────┐
│    Dossier       │
│ (candidate_id)   │
└──────┬───────────┘
       │
       │ assigned_to (0..n)
       │
       ▼
┌──────────────────────┐
│   Professionnel(s)   │
│ (professional_ids[]) │
└──────────────────────┘
```

### Règles
```
1. Un dossier = un candidat (propriétaire)
2. Un dossier peut être assigné à 0 ou n professionnels
3. Un professionnel peut gérer plusieurs dossiers
4. Seul l'admin peut créer/modifier assignations

Cas d'usage :
  • Candidat seul → dossier non assigné
  • Candidat + agent immigration → assigné à 1 pro
  • Candidat + agent + consultant finance → assigné à 2 pros
```

---

## 🚀 Parcours de validation (Professionnels)

### MVP (V1)
```
1. Pro s'inscrit
   ├─ Nom + email
   ├─ Organisation
   ├─ Rôle
   └─ Domaine

2. Compte validé (auto, pas de vérification)
   └─ Accès immédiat
```

### V2 (Validation stricte)
```
1. Pro s'inscrit (même que MVP)

2. Attente validation admin
   ├─ Admin reçoit notification
   ├─ Admin vérifie (documents, références)
   └─ Admin approuve ou rejette

3. Si approuvé
   ├─ Badge "Vérifié" 👑
   ├─ Annuaire + rating
   └─ Accès complet

4. Si rejeté
   └─ Email expliquant raison
```

---

## 🔐 Sécurité & Audit

### What can access what?

```
NIVEAU         │ CANDIDAT          │ PRO               │ ADMIN
───────────────┼───────────────────┼───────────────────┼──────────
Messages       │ Ses propres       │ Ses clients       │ Tous
Documents      │ Les siens         │ De ses clients    │ Tous
Posts/Commts   │ Ses propres       │ Ses propres       │ Tous
Profil autre   │ Lecture (publique)│ Lecture (public) │ Lecture
Admin panel    │ ✗                 │ ✗                 │ ✓
Logs           │ ✗                 │ ✗                 │ ✓
```

### Audit & Logs (V2)
```
Enregistrement :
- Qui (user_id, role)
- Quoi (action: create, update, delete, view)
- Où (module: dossier, document, post)
- Quand (timestamp)
- Changements (avant/après si update)

Ex:
  [2026-02-02 14:23]
  user: prof_123 (Anne Martin)
  action: update
  target: dossier_456 (Jean Dupont)
  change: document_passport → status: "validated"
```

---

## 📋 Cas d'usage typiques

### Candidat
```
1. S'inscrire
   → Voir dashboard vide
   → Compléter profil
   → Créer dossier

2. Chercher pro
   → Aller dans Inside/Annuaire
   → Lire posts de pros
   → Contacter pro

3. Recevoir messages
   → Voir dossier assigné à agent
   → Échange messages
   → Uploader documents
```

### Professionnel
```
1. S'inscrire
   → Accès immédiat (MVP)
   → Profil visible dans Inside

2. Recevoir candidats
   → Candidats découvrent via Inside
   → Demande assignation (candidat/admin)
   → Pro accepte → dossier assigné

3. Gérer pipeline
   → Dashboard : liste clients
   → Trier par statut
   → Envoyer messages
   → Valider documents
```

### Admin
```
1. Modérer
   → Supprimer post inapproprié
   → Avertir utilisateur

2. Valider pro (V2)
   → Recevoir demandes
   → Vérifier documents
   → Approuver → Badge

3. Créer webinaire
   → Dashboard admin
   → Créer événement
   → Assigner intervenant (pro ou externe)
```

---

## 🎯 MVP vs V2

### MVP (Février-Mars 2026)
```
✓ Rôles basiques (candidat, pro, admin)
✓ Permissions simples (read_own, read_assigned, full)
✓ Pas de vérification pro
✓ Pas d'audit détaillé
```

### V2 (Avril+ 2026)
```
✓ Vérification pro complexe
✓ Badges et ratings
✓ Audit & logs complets
✓ Rôles granulaires (co-agents, superviseurs, etc.)
✓ Permissions par domaine (finance, santé, IT, etc.)
```

---

**Statut** : Rôles & permissions finalisés ✓ | **Date** : 02 février 2026
