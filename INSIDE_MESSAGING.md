# Inside — Messagerie Intentionnelle Capitune

## 🎯 Philosophie

Inside n'est pas un WhatsApp bis. C'est un espace de contact **intentionnel**:
- ✅ Discuter, collaborer, proposer
- ❌ Pas draguer, spammer ou harceler
- 🛡️ Permission avant intrusion
- 💬 Progressivité selon le niveau

---

## 📋 Architecture Système

### Modèles Mongoose

**1. ContactRequest**
- Demande initiale avec intention obligatoire
- Peut être acceptée → crée MessageThread
- Peut être refusée ou l'utilisateur bloquerait
- Auto-expire après 30 jours

**2. MessageThread**
- Conversation 1v1 entre 2 participants
- Stocke dernier message, nombre de messages
- Settings individuels par utilisateur (mute, archive, block, pin)
- Supporte opportunités business et partenariats

**3. DirectMessage**
- Message individuel dans une conversation
- Supporte texte, images, audio, fichiers
- Reactions (emoji), édition, suppression douce
- Marqué comme système (user_joined, request_accepted)

**4. User (champs ajoutés)**
```javascript
insideSettings: {
  allowDirectMessages: boolean,      // Accepter les DMs
  allowPartnershipOnly: boolean,     // Seulement partenariats
  allowedIntentions: string[],       // Quelles intentions accepter
  paidMessagesEnabled: boolean,      // Messages payants activés
  paidMessagePrice: number,          // Prix en crédits/euros
  blockedUsers: ObjectId[],          // Utilisateurs bloqués
  allowedUsers: ObjectId[]           // Whitelist (si vide = ouvert)
}
```

---

## 🔐 Règles de Permissions par Niveau

| Niveau | Peut Envoyer | Limite/Semaine | Notes |
|--------|-------------|----------------|-------|
| **Nouveau** | ❌ | 0 | Peut seulement répondre |
| **Bronze** | ✅ | 5 | Minimum 1000 abonnés |
| **Argent** | ✅ | 20 | Minimum 100k abonnés |
| **Or** | ✅ | 100 | Minimum 1M abonnés |
| **Platinium** | ✅ | ∞ | Prioritaire |

### Détection de Spam
- **5+ demandes/1h** = spam flagué
- **Même message 3+ fois** = copié-collé détecté
- Résultat : 429 Too Many Requests

---

## 📥 Intentions Obligatoires

Chaque demande nécessite une intention :

```
💬 discussion    → Juste discuter, échanger
🤝 collaboration → Projet ensemble
💼 partnership   → Partenariat commercial
❓ question      → Poser une question
```

Sans intention → message refusé.

---

## 🛡️ Protections Créateurs

### Niveau Argent+ peuvent :
- **Fermer les DMs** (allowDirectMessages = false)
- **Partenariats uniquement** (allowPartnershipOnly = true)
- **Messages payants** (paidMessagesEnabled = true)
- **Whitelist** (allowedUsers = [userId1, userId2...])

Exemple :
```json
{
  "allowDirectMessages": false,
  "allowPartnershipOnly": true,
  "paidMessagesEnabled": true,
  "paidMessagePrice": 4.99
}
```

---

## 📊 Flux de Messaging

### 1️⃣ Demande de Contact
```
Utilisateur A → Envoie demande avec intention
       ↓
Vérifier :
  - A peut envoyer ? (niveau, quota)
  - B accepte DMs ? (allowDirectMessages)
  - B accepte cette intention ? (allowedIntentions)
  - Spam detected ? (pattern check)
       ↓
ContactRequest.create(pending)
       ↓
Notification à B
```

### 2️⃣ Accepter Demande
```
Utilisateur B → Accept
       ↓
MessageThread.create(participants: [A, B])
       ↓
DirectMessage.create(system: "request_accepted")
       ↓
ContactRequest.status = "accepted"
ContactRequest.threadId = threadId
       ↓
Notification à A
```

### 3️⃣ Refuser Demande
```
Utilisateur B → Decline (optionnel: raison)
       ↓
ContactRequest.status = "declined"
ContactRequest.declinedAt = now
       ↓
Notification à A
```

### 4️⃣ Bloquer Utilisateur
```
Utilisateur B → Block
       ↓
ContactRequest.status = "blocked"
User.insideSettings.blockedUsers.push(A)
       ↓
Aucun message futur de A ne passe
```

### 5️⃣ Envoyer Message
```
Utilisateur A → Envoie dans thread
       ↓
Vérifier :
  - A et B toujours participants ?
  - B n'a pas bloqué A ?
  - Pas trop long (5000 chars) ?
       ↓
DirectMessage.create()
       ↓
MessageThread update :
  - lastMessage
  - lastMessageAt
  - messageCount++
  - lastActivityAt
       ↓
Marquer B comme non-lu
```

---

## 📡 Endpoints API

### Demandes de Contact

**Envoyer une demande**
```
POST /api/inside/requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "toUserId": "userId",
  "intention": "collaboration|partnership|discussion|question",
  "message": "Courte description (280 chars max)"
}

Response 201:
{
  "message": "Demande envoyée",
  "request": {
    "_id": "...",
    "intention": "collaboration",
    "status": "pending",
    "senderLevel": "Bronze",
    "expiresAt": "2025-01-27T..."
  }
}
```

**Obtenir mes demandes reçues**
```
GET /api/inside/requests?status=pending&page=1&limit=20
Authorization: Bearer {token}

Response 200:
{
  "message": "Demandes de contact (pending)",
  "requests": [
    {
      "_id": "...",
      "from": {userId},
      "intention": "partnership",
      "message": "...",
      "status": "pending",
      "senderProfile": {
        "username": "alice",
        "followers": 5420,
        "level": "Bronze",
        "badges": [...]
      },
      "createdAt": "...",
      "expiresAt": "..."
    }
  ],
  "pagination": { "page": 1, "total": 5, "pages": 1 }
}
```

**Accepter une demande**
```
POST /api/inside/requests/{requestId}/accept
Authorization: Bearer {token}

Response 200:
{
  "message": "Demande acceptée",
  "thread": {
    "_id": "threadId",
    "participants": [...],
    "type": "direct|partnership"
  }
}
```

**Refuser une demande**
```
POST /api/inside/requests/{requestId}/decline
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Pas intéressé (optionnel)"
}

Response 200:
{
  "message": "Demande refusée"
}
```

**Bloquer un utilisateur**
```
POST /api/inside/requests/{requestId}/block
Authorization: Bearer {token}

Response 200:
{
  "message": "Utilisateur bloqué"
}
```

### Conversations & Messages

**Obtenir mes conversations**
```
GET /api/inside/conversations?page=1&limit=20
Authorization: Bearer {token}

Response 200:
{
  "conversations": [
    {
      "_id": "threadId",
      "participants": [
        { "_id": "...", "username": "alice", "avatar": "..." }
      ],
      "lastMessage": "Oui, ça marche pour jeudi!",
      "lastMessageAt": "2025-01-28T14:32:00Z",
      "unread": true,
      "type": "direct",
      "messageCount": 12
    }
  ],
  "pagination": {...}
}
```

**Obtenir les messages d'une conversation**
```
GET /api/inside/conversations/{threadId}/messages?page=1&limit=30
Authorization: Bearer {token}

Response 200:
{
  "messages": [
    {
      "_id": "msgId",
      "content": "Salut! Intéressé par une collaboration?",
      "sender": {
        "_id": "...",
        "username": "alice",
        "avatar": "..."
      },
      "type": "text",
      "createdAt": "2025-01-28T14:00:00Z",
      "readBy": [
        { "userId": "...", "readAt": "2025-01-28T14:05:00Z" }
      ]
    }
  ],
  "pagination": {...}
}
```

**Envoyer un message**
```
POST /api/inside/conversations/{threadId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Message texte (max 5000 chars)"
}

Response 201:
{
  "message": "Message envoyé",
  "message": {
    "_id": "msgId",
    "content": "...",
    "sender": "alice",
    "createdAt": "..."
  }
}
```

### Paramètres Inside

**Obtenir mes paramètres**
```
GET /api/inside/settings
Authorization: Bearer {token}

Response 200:
{
  "settings": {
    "level": "Bronze",
    "limits": {
      "canSendRequests": true,
      "requestsPerWeek": 5
    },
    "settings": {
      "allowDirectMessages": true,
      "allowPartnershipOnly": false,
      "allowedIntentions": ["discussion", "collaboration", "partnership", "question"],
      "paidMessagesEnabled": false,
      "blockedUsersCount": 0
    }
  }
}
```

**Mettre à jour mes paramètres**
```
PUT /api/inside/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "allowDirectMessages": true,
  "allowPartnershipOnly": false,
  "allowedIntentions": ["partnership"],
  "paidMessagesEnabled": false,
  "paidMessagePrice": 0
}

Response 200:
{
  "message": "Paramètres mis à jour",
  "settings": {...}
}
```

### Statistiques

**Obtenir mes stats Inside**
```
GET /api/inside/stats
Authorization: Bearer {token}

Response 200:
{
  "stats": {
    "pendingRequests": 3,
    "acceptedChats": 7,
    "totalMessagesReceived": 52,
    "blockedUsersCount": 1
  }
}
```

---

## 🚫 Modération & Sanctions

### Détection Automatique

**Comportements flagués :**
- Spam (5+ demandes/1h)
- Copié-collé massif (même message 3+ fois)
- Messages agressifs (keywords détectés)
- Harcèlement (multiple demandes après blocage)

### Actions de Modération

| Action | Effet |
|--------|-------|
| **Shadow mute** | Messages non délivrés, utilisateur ne sait pas |
| **Blocage envoi** | Impossible d'envoyer demandes (7j-30j) |
| **Suspension messagerie** | Inside complètement désactivé |
| **Suspension compte** | Cas graves (harcèlement, menaces) |

---

## 🔔 Notifications Inside

**Types de notifications :**
- 🔔 Nouvelle demande de contact
- ✅ Demande acceptée
- ⭐ Message prioritaire
- 💼 Opportunité business
- 📌 Message épinglé

**Règles :**
- Jamais de push inutile
- Respecter les préférences utilisateur
- Grouper les notifications (5 min)

---

## 💡 Cas d'Usage

### Cas 1 : Nouveau créateur cherche collaboration
```
Alice (Bronze) → Envoie demande à Bob (Argent)
Intention: "collaboration"
Message: "J'ai trouvé ta dernière vidéo excellente! Intéressé pour collaborer?"

Limite: 5/semaine (Bob en est la 2e)
Pas de spam détecté
Bob n'a pas bloqué Alice
Bob accepte collaborations ✅

→ Bob reçoit la demande dans "Demandes"
→ Bob peut accepter → crée MessageThread
```

### Cas 2 : Créateur Argent ferme DMs sauf partenaires
```
Chloé (Argent) met à jour ses paramètres:
{
  "allowDirectMessages": false,
  "allowPartnershipOnly": true
}

David (Bronze) essaie d'envoyer une demande "discussion"
→ 403 Forbidden
→ Message: "Cet utilisateur n'accepte que les partenariats"
```

### Cas 3 : Bloquer un spammeur
```
Ève reçoit 10 demandes similaires de Frank en 30 minutes
→ Ève clique "Bloquer" sur la demande
→ Frank ajouté à blockedUsers
→ Frank ne peut plus envoyer demandes ni messages à Ève
```

---

## 🔐 Sécurité & Trust

### Signaux d'Intention
- ✅ Demande acceptée = trust signal
- ✅ Messages réguliers = relation établie
- ✅ Pas de spam détecté = compte sain

### Impact sur Autres Systèmes
- **Partenaires fiables** : Accès prioritaire aux opportunités
- **Hauts trust** : Moins limités par quotas
- **Spammeurs détectés** : Bloqués silencieusement

---

## 📊 Métriques Admin

```sql
-- Demandes par jour
SELECT DATE(createdAt), COUNT(*) 
FROM ContactRequest 
GROUP BY DATE(createdAt)

-- Taux d'acceptation
SELECT 
  COUNT(CASE WHEN status='accepted' THEN 1 END) * 100.0 / COUNT(*) as acceptance_rate
FROM ContactRequest

-- Utilisateurs bloqués
SELECT COUNT(*) as total_blocks
FROM User 
WHERE insideSettings.blockedUsers.length > 0

-- Conversations actives
SELECT COUNT(*) as active_threads
FROM MessageThread
WHERE lastActivityAt > NOW() - INTERVAL 7 DAY
```

---

## 🎯 Phrase Clé Produit

> **Inside : parle aux bonnes personnes, au bon moment.**

Pas d'intrusion. Pas de chaos. Pas de pression.  
Des échanges qui ont du sens.

