# 🏘️ Système de Communautés & Événements - Capitune

> **"Capitune transforme les audiences en communautés, et les communautés en opportunités"**

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Communautés](#communautés)
3. [Événements & Lives](#événements--lives)
4. [Architecture technique](#architecture-technique)
5. [API Reference](#api-reference)
6. [Workflows](#workflows)

---

## 🎯 Vue d'ensemble

### Philosophie

**Feed** = Découverte  
**Profil** = Identité  
**Communautés** = Rétention  
**Lives** = Proximité

### Boucle d'engagement

```
Utilisateur découvre → Rejoint communauté → Participe aux lives → 
Devient membre actif → Crée ses propres événements → Monétise
```

---

## 👥 Communautés

### Types de communautés

#### 🟢 1. Communautés ouvertes
- **Pour**: FUN • DISCUSSION • DÉCOUVERTE
- **Accès**: Libre
- **Exemples**: Gaming, Création, Musique, Business, Humour, Apprentissage

**Fonction**:
- Publier librement
- Commenter
- Découvrir de nouveaux créateurs

#### 🔵 2. Communautés de créateurs
- **Pour**: CRÉATION • CROISSANCE
- **Accès**: Sur demande ou invitation
- **Exemples**: Créateurs vidéo débutants, Lifestyle, Business

**Fonction**:
- Échanges entre pairs
- Conseils
- Collaborations

#### 🟣 3. Communautés premium (payantes)
- **Pour**: MONÉTISATION • FIDÉLISATION
- **Accès**: Abonnement
- **Créées par**: Créateurs Argent+ (100k+ followers)

**Fonction**:
- Contenus exclusifs
- Lives privés
- Accès direct au créateur

### Structure d'une communauté

```javascript
{
  name: "Créateurs Gaming",
  slug: "createurs-gaming",
  description: "Communauté pour les créateurs gaming",
  type: "creator", // open, creator, premium
  category: "gaming",
  creator: ObjectId,
  
  members: [{
    user: ObjectId,
    role: "member", // member, moderator, animator, creator
    joinedAt: Date
  }],
  
  stats: {
    memberCount: 1547,
    postCount: 3284,
    activeMembers: 423,
    averageLevel: "Bronze"
  },
  
  access: {
    isPublic: true,
    requireApproval: false,
    isPremium: false,
    price: 0
  },
  
  rules: [
    { title: "Respect", description: "Soyez respectueux" },
    { title: "Contenu", description: "Pas de spam" }
  ],
  
  badges: ["trending", "growing"]
}
```

### Rôles dans une communauté

| Rôle | Droits |
|------|--------|
| 👤 **Membre** | Publier, commenter |
| 🛠️ **Modérateur** | Supprimer, signaler |
| ⭐ **Animateur** | Lancer events |
| 👑 **Créateur** | Gérer communauté |

### Découverte & croissance

- **Suggestions automatiques** basées sur intérêts
- **Mise en avant** des communautés actives
- **Badges**: "Communauté en croissance", "Tendance", "Vérifiée"

---

## 🎤 Événements & Lives

### Types de lives

#### 🔴 1. Live libre
- **Accès**: Bronze+ (1k followers)
- **Usage**: Fun, discussion, Q&A
- **Features**: Chat public, réactions, invités

#### 🎟️ 2. Live premium (payant)
- **Accès**: Argent+ (100k followers)
- **Usage**: Formation, coaching, show
- **Features**: Billets, replay réservé, revenus partagés

#### 🤝 3. Live sponsorisé
- **Accès**: Argent+ (100k followers)
- **Usage**: Partenariat marque
- **Features**: Mention sponsor obligatoire, CTA intégré, reporting annonceur

#### 👥 4. Live communautaire
- **Accès**: Membres de la communauté
- **Usage**: Débat, rencontre, animation

### Structure d'un événement

```javascript
{
  title: "Live Q&A Gaming",
  description: "Session questions/réponses sur le gaming",
  type: "live", // live, challenge, launch, meetup, workshop
  liveType: "free", // free, premium, sponsored, community
  
  creator: ObjectId,
  coHosts: [ObjectId],
  community: ObjectId,
  
  scheduledAt: "2025-12-30T19:00:00Z",
  duration: 60, // minutes
  
  access: {
    isFree: true,
    price: 0,
    requiresSubscription: false
  },
  
  sponsor: {
    isSponsored: false,
    sponsorName: null,
    sponsorLogo: null,
    sponsorCTA: { text: "", url: "" }
  },
  
  status: "scheduled", // scheduled, live, ended, cancelled
  
  streamData: {
    viewerCount: 0,
    peakViewers: 0,
    startedAt: null,
    endedAt: null
  },
  
  registrations: [{
    user: ObjectId,
    registeredAt: Date,
    hasPaid: false,
    attended: false
  }],
  
  moderation: {
    chatEnabled: true,
    slowMode: false,
    slowModeDelay: 5,
    moderators: [ObjectId]
  }
}
```

### Monétisation des événements

1. **Billets** - Prix d'entrée pour événements premium
2. **Abonnements** - Accès via abonnement communauté
3. **Sponsoring** - Partenariats marques
4. **Dons live** - Pourboires en direct (à implémenter)

**Commission Capitune**: 15% sur les revenus

### UX Live (anti-chaos)

- **Chat modéré** avec filtres automatiques
- **Questions mises en avant** par votes
- **Messages épinglés** par modérateurs
- **Mode lent** (délai entre messages)
- **Délai live** (anti-dérapage)
- **Fin immédiate** si violation grave

### Découverte & mise en avant

- **Onglet "Lives"** dédié dans l'app
- **Recommandations personnalisées** basées sur intérêts
- **Notifications ciblées** (pas spam)
- **Badge "Live"** sur les profils actifs

---

## 🏗️ Architecture technique

### Modèles de données

#### Community
- Gestion des membres et rôles
- Stats en temps réel
- Système d'accès (public/privé/premium)
- Badges et mise en avant

#### Event
- Planification et statuts
- Monétisation intégrée
- Streaming data
- Modération avancée

#### CommunityPost
- Posts dans les communautés
- Médias multiples
- Sondages intégrés
- Système d'engagement

### Routes API

#### Communautés
```
GET    /api/communities              - Liste des communautés
GET    /api/communities/recommended  - Recommandations
GET    /api/communities/:slug        - Détails communauté
POST   /api/communities              - Créer communauté
PUT    /api/communities/:slug        - Modifier
POST   /api/communities/:slug/join   - Rejoindre
POST   /api/communities/:slug/leave  - Quitter
PUT    /api/communities/:slug/members/:userId/role - Changer rôle
GET    /api/communities/:slug/posts  - Posts de la communauté
POST   /api/communities/:slug/posts  - Créer post
```

#### Événements
```
GET    /api/events                   - Liste des événements
GET    /api/events/live              - Lives en cours
GET    /api/events/:eventId          - Détails événement
POST   /api/events                   - Créer événement
PUT    /api/events/:eventId          - Modifier
POST   /api/events/:eventId/cancel   - Annuler
POST   /api/events/:eventId/register - S'inscrire
POST   /api/events/:eventId/unregister - Se désinscrire
POST   /api/events/:eventId/start    - Démarrer live
POST   /api/events/:eventId/end      - Terminer live
POST   /api/events/:eventId/viewers  - Maj viewers
```

### Permissions & Niveaux

| Action | Niveau requis |
|--------|---------------|
| Rejoindre communauté ouverte | Tous |
| Créer communauté ouverte | Tous |
| Créer communauté créateur | Bronze+ (1k) |
| Créer communauté premium | Argent+ (100k) |
| Live libre | Bronze+ (1k) |
| Live premium | Argent+ (100k) |
| Live sponsorisé | Argent+ (100k) |

---

## 🔄 Workflows

### Workflow 1: Création de communauté

```
1. Utilisateur clique "Créer une communauté"
2. Choisit type (open/creator/premium)
3. Remplit infos (nom, description, catégorie)
4. Définit règles
5. Configure accès (public/privé/payant)
6. Système vérifie niveau si premium
7. Communauté créée → utilisateur devient créateur
8. Suggestions de membres potentiels
```

### Workflow 2: Organisation d'un live

```
1. Créateur planifie un événement
2. Choisit type de live (free/premium/sponsored)
3. Configure date, durée, accès
4. Lie à une communauté (optionnel)
5. Ajoute modérateurs
6. Système vérifie niveau créateur
7. Événement créé → notifications envoyées
8. Jour J: Créateur démarre le live
9. Viewers rejoignent via lien
10. Chat modéré en temps réel
11. Fin du live → replay généré si premium
```

### Workflow 3: Membre découvre et rejoint

```
1. Utilisateur navigue onglet "Communautés"
2. Voit suggestions basées sur intérêts
3. Clique sur communauté "Gaming"
4. Lit description + règles
5. Clique "Rejoindre"
6. Système ajoute à members[]
7. Accès au feed communautaire
8. Peut publier et commenter
9. Reçoit notifs des lives de la communauté
```

---

## 🔑 Résumé stratégique

| Élément | Rôle |
|---------|------|
| **Communautés** | Appartenance |
| **Lives** | Proximité |
| **Événements** | Fidélité |
| **Premium** | Revenus |

### Métriques clés

**Engagement communauté**:
- Nombre de posts/jour
- Taux de participation aux lives
- Croissance membres actifs

**Performance lives**:
- Viewers moyens
- Durée moyenne de visionnage
- Taux de conversion (gratuit → payant)

**Monétisation**:
- Revenus communautés premium
- Revenus billets événements
- Revenus sponsoring

---

## 🚀 Prochaines étapes

### Phase 1: MVP (Complété ✅)
- ✅ Modèles de données
- ✅ Routes API
- ✅ Système de permissions

### Phase 2: Frontend
- [ ] Pages communautés
- [ ] Interface événements
- [ ] Player live
- [ ] Chat en temps réel

### Phase 3: Monétisation
- [ ] Intégration paiements (Stripe)
- [ ] Système de billets
- [ ] Abonnements communautés
- [ ] Split revenus créateurs

### Phase 4: Fonctionnalités avancées
- [ ] Streaming WebRTC
- [ ] Replay automatique
- [ ] Analytics détaillées
- [ ] Gamification (badges participation)
- [ ] Challenges communautaires

---

## 💡 Exemples d'usage

### Cas 1: Créateur Gaming
1. Crée communauté "Créateurs Gaming FR"
2. Organise live hebdomadaire Q&A (gratuit)
3. 500 viewers en moyenne
4. Atteint 100k followers
5. Lance lives premium "Formation streaming" à 10€
6. Génère 5000€/mois

### Cas 2: Expert Business
1. Rejoint communauté "Entrepreneurs"
2. Participe aux discussions
3. Propose workshop sponsorisé par marque SaaS
4. 200 participants payants (20€)
5. Revenus: 3400€ (après commission)
6. Construit audience → crée sa communauté premium

### Cas 3: Communauté Musique
1. Communauté ouverte "Producteurs débutants"
2. 2000 membres actifs
3. Lives mensuels avec producteurs confirmés
4. Challenges "Beat of the Month"
5. Partenariats avec marques d'équipement
6. Lives sponsorisés à 1000€

---

## 🎨 Design Principles

1. **Clarté**: Structure simple, rôles évidents
2. **Scalabilité**: De 10 à 100k membres
3. **Engagement**: Boucles de rétention naturelles
4. **Monétisation**: Opportunités à chaque niveau
5. **Sécurité**: Modération robuste, anti-spam
6. **Proximité**: Lives = moments forts

---

**Capitune** - *Un espace de présence, pas de performance* 🌙
