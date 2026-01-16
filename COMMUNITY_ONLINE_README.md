# 🌐 Système de Communauté et Statut En Ligne

## Vue d'ensemble

Deux nouvelles fonctionnalités majeures ont été implémentées pour renforcer l'aspect social de Capitune :

1. **Sidebar En Ligne** - Affichage latéral vertical en temps réel des amis/abonnés/partenaires en ligne
2. **Onglet Communauté** - Affichage des followers, following et partenaires sur le profil

---

## 1️⃣ Système de Statut En Ligne

### Backend

#### Modèle User (`server/src/models/User.js`)

Nouveaux champs :
```javascript
isOnline: {
  type: Boolean,
  default: false,
  index: true  // Indexé pour requêtes rapides
},
lastSeen: {
  type: Date,
  default: Date.now
},
partners: [{           // NOUVEAU
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}]
```

#### Routes de Statut (`server/src/routes/users.js`)

**POST /users/status/online**
- Marque l'utilisateur comme en ligne
- Actualise `lastSeen`
- Appelé au login et toutes les 2 minutes

**POST /users/status/offline**
- Marque l'utilisateur comme hors ligne
- Appelé avant la fermeture/logout

**GET /users/online/friends**
- Retourne les utilisateurs qu'on suit et qui sont en ligne
- Trié par `lastSeen` (plus récent en haut)
- Données : `_id, username, avatar, isOnline, lastSeen, category`

**GET /users/online/followers**
- Retourne les abonnés en ligne
- Même tri et données que `/friends`

**GET /users/online/partners**
- Retourne les partenaires en ligne
- Même tri et données que `/followers`

### Frontend

#### OnlineSidebar (`client/src/components/OnlineSidebar.jsx`)

Composant sidebar latéral sticky affichant :

**Features :**
- 3 onglets : Amis, Abonnés, Partenaires
- Affichage avec icônes colorées
- Indicateur vert pulsant "en ligne"
- Format temps intelligent (`à l'instant`, `5m`, `2h`, `3j`)
- Bouton message pour chaque utilisateur
- Rafraîchissement auto toutes les 30 secondes
- Collapsible (se réduit en colonne d'icônes)

**États :**
```javascript
- activeTab: 'friends' | 'followers' | 'partners'
- collapsed: true | false
- onlineUsers: User[]
- loading: boolean
```

**Styles :**
- Width: 280px (70px collapsed)
- Sticky top
- Scrollable avec z-index 100
- Avatar 40px avec bordure primaire
- Animation pulse sur indicateur en ligne

**Responsive :**
- Masqué sur écrans < 768px (mobile)
- Icônes seules sur < 1200px

#### Intégration dans Layout (`client/src/components/Layout.jsx`)

**Gestion du statut :**
```javascript
useEffect(() => {
  // Au montage : POST /users/status/online
  // Rafraîchir toutes les 120s (2 min)
  // Au départ : POST /users/status/offline
  // Dépendance : user
});
```

Structure HTML :
```html
<div class="layout-wrapper">
  <main class="main-content">...</main>
  <OnlineSidebar />
</div>
```

---

## 2️⃣ Onglet Communauté

### ProfilePage (`client/src/pages/ProfilePage.jsx`)

#### Nouveau Rendu

Deux onglets :
1. **À propos** - Biographie, infos, publications
2. **Communauté** - Listes d'utilisateurs

#### États Additionnels

```javascript
- activeTab: 'about' | 'community'
- followers: User[]
- following: User[]
- partners: User[]
- tabLoading: boolean
```

#### Fonction `loadCommunityData()`

Appelée lors du switch vers l'onglet "Communauté".

Charge via GET `/users/{userId}` :
- `user.followersData`: Array d'objets followers
- `user.followingData`: Array d'objets following
- `user.partnersData`: Array d'objets partners

**Données par utilisateur :**
```javascript
{
  _id: string,
  username: string,
  avatar: string (URL),
  category: string,
  isOnline: boolean,
  lastSeen: ISO Date
}
```

#### Sections Affichées

**1. Abonnés** (toujours)
- Titre avec icône Heart
- Compte : "Abonnés (X)"
- Grid de cartes utilisateur
- Message vide si count = 0

**2. Abonnements** (toujours)
- Titre avec icône UserCheck
- Compte : "Abonnements (X)"
- Grid identique

**3. Partenaires** (conditionnel)
- Affichage seulement si count > 0
- Titre avec icône Users

#### Carte Utilisateur (Community)

Structure :
```
┌─────────────────┐
│   [Avatar]      │ <- 80×80px avec bordure primaire
│  Nom Utilisateur │ <- username (ellipsis)
│  Catégorie      │ <- category (petit texte)
│ [Voir profil]   │ <- bouton primaire
└─────────────────┘
```

Features :
- Hover : fond clair + bordure primaire + shadow
- Bouton "Voir le profil" cliquable
- Grid responsif : 150px min, 1rem gap

### Styles CSS (`client/src/pages/ProfilePage.css`)

```css
.profile-tabs-container {
  padding: 0 var(--space-xl);
  border-bottom: 1px solid var(--color-border);
  margin-top: var(--space-lg);
}

.tab-button {
  /* Flex + gap 0.5rem */
  /* Padding 1rem var(--space-md) */
  /* Border-bottom 3px transparent → primary on hover/active */
  /* Color primaire on active */
}

.community-user-card {
  /* Background #f8f9fa */
  /* Hover: background #f0f4f8 + border primaire + shadow + translateY(-2px) */
}

.users-grid {
  /* Grid auto-fill minmax(150px, 1fr) */
  /* Gap 1rem */
  /* Responsive: 120px sur mobile */
}
```

---

## 🔄 Flux de Synchronisation

### Au Login
1. ✅ User se connecte via AuthContext
2. ✅ Layout monte
3. ✅ useEffect détecte `user` exist
4. ✅ POST /users/status/online appelé
5. ✅ isOnline = true, lastSeen = now()
6. ✅ OnlineSidebar affiche amis/abonnés/partenaires en ligne

### En Session Active
- **Toutes les 30s** : GET /users/online/{tab} ← mise à jour liste
- **Toutes les 120s** : POST /users/status/online ← rafraîchit lastSeen
- **Chaque onglet** : Affichage actualisé avec users "en ligne"

### Au Logout/Départ
1. Window.beforeunload déclenche
2. POST /users/status/offline appelé
3. isOnline = false, lastSeen = departure time
4. Sidebar et autres utilisateurs reflètent le changement à la prochaine sync

---

## 📊 Indicateurs Visuels

### Statut En Ligne (Sidebar)

| État | Indicateur | Couleur | Animation |
|------|-----------|--------|-----------|
| En ligne | Cercle plein | #10b981 | Pulse 2s |
| Hors ligne | Gris | #ccc | Aucune |
| Récemment vu | Text "5m" | #aaa | Aucune |

### Onglets

```
À propos  │  🟦 Communauté
──────────┴──────────────────
Contenu actif...
```

Border-bottom change de couleur au switch.

### Cartes Utilisateur

Hover effect :
- Background change
- Border devient primaire
- Shadow apparaît
- Légère translation vers le haut (-2px)

---

## 🛠️ Configuration Requise

### Backend
1. **User.js** : Champs `isOnline`, `lastSeen`, `partners` ✅
2. **users.js routes** : 5 nouveaux endpoints ✅
3. **server.js** : Aucune modification (routes existantes)

### Frontend
1. **App.jsx** : Aucune modification
2. **Layout.jsx** : Statut en ligne + OnlineSidebar ✅
3. **ProfilePage.jsx** : Onglets + section Communauté ✅
4. **OnlineSidebar.jsx** : Nouveau composant ✅
5. **CSS** : Styles pour sidebar et communauté ✅

---

## 📱 Responsive Design

### Desktop (> 1200px)
- Sidebar 280px pleine largeur
- Onglets avec label + icône
- Grid 150px minimum

### Tablet (768px - 1200px)
- Sidebar 240px
- Onglets icônes seuls
- Grid 120px minimum

### Mobile (< 768px)
- Sidebar **masquée**
- Onglets visibles en full-width
- Grid mono-colonne ou 2 colonnes

---

## 🔒 Sécurité & Performance

### Statut En Ligne
- ✅ Authentifié (middleware `authenticate`)
- ✅ Index sur `isOnline` pour requêtes rapides
- ✅ Index sur `lastSeen` pour tri
- ✅ Pas d'exposition de données sensibles

### Requêtes Réseau
- GET /online/{tab} : Toutes les 30s (contrôlable)
- POST /status/online : Toutes les 2 min
- POST /status/offline : Une seule fois au départ
- ✅ Nombre d'appels minimisé

### Cache Local
- OnlineSidebar réutilise état `onlineUsers`
- ProfilePage charge communauté au switch (lazy loading)

---

## 🎯 Cas d'Utilisation

### 1. Trouver un ami en ligne
1. Ouvrir app
2. Sidebar affiche amis en ligne
3. Cliquer l'icône message → futur système de chat

### 2. Découvrir la communauté d'un utilisateur
1. Visiter profil
2. Cliquer onglet "Communauté"
3. Explorer followers, following, partenaires
4. Cliquer "Voir le profil" pour découvrir

### 3. Gérer son réseau
- Voir qui est abonné (followers)
- Voir qui on suit (following)
- Voir les partenaires identifiés
- Actions rapides sur les profils

---

## 🚀 Améliorations Futures

- [ ] Notifications en temps réel (WebSocket)
- [ ] Chat direct (Inside)
- [ ] Requête d'amitié/partenariat
- [ ] Filtrage par catégorie dans Communauté
- [ ] Recherche dans listes
- [ ] Badges/médailles pour partenaires
- [ ] Historique d'activité
- [ ] Statistiques d'engagement

---

## Fichiers Créés/Modifiés

### Créés
- ✅ `server/src/routes/contacts.js` (précédent)
- ✅ `client/src/components/OnlineSidebar.jsx` (NOUVEAU)
- ✅ `client/src/components/OnlineSidebar.css` (NOUVEAU)
- ✅ `CONTACT_SYNC_README.md` (précédent)

### Modifiés
- ✅ `server/src/models/User.js` (+3 champs)
- ✅ `server/src/routes/users.js` (+5 endpoints)
- ✅ `client/src/components/Layout.jsx` (+statut, +sidebar)
- ✅ `client/src/components/Layout.css` (+layout-wrapper)
- ✅ `client/src/pages/ProfilePage.jsx` (+onglets, +communauté)
- ✅ `client/src/pages/ProfilePage.css` (+onglets, +cards)

### Non modifiés (structure complète)
- `server/src/server.js`
- `client/src/App.jsx`
