# Système de Notifications — Capitune

## 🔔 Vue d'ensemble

Le système de notifications regroupe tous les événements importants dans un centre de notifications :

- **Messagerie Inside** : Nouvelles demandes, messages, acceptations
- **Engagement** : Likes, commentaires, followers
- **Partenariats** : Propositions, acceptations
- **Jalons** : Badges gagnés, followers atteints
- **Système** : Annonces, mises à jour

---

## 📊 Architecture

### Modèle Notification

```javascript
{
  recipient: ObjectId,           // Qui reçoit
  actor: ObjectId,               // Qui déclenche
  type: enum,                    // contact_request, new_message, post_liked, etc.
  category: enum,                // messaging, engagement, partnership, milestones, system
  title: string,                 // "Alice t'a envoyé une demande"
  description: string,           // Texte supplémentaire
  data: {
    threadId, messageId, postId, opportunityId, actionUrl, thumbnail
  },
  read: boolean,                 // Lue?
  readAt: Date,
  groupKey: string,              // "likes_post_123" pour grouper
  groupCount: number,            // Nombre d'événements groupés
  priority: enum,                // low, normal, high, urgent
  actions: [{ label, action, url }],
  sendPush: boolean,
  sendEmail: boolean,
  dismissed: boolean,
  createdAt, expiresAt
}
```

---

## 🎯 Types de Notifications

### Messagerie (messaging)
```
contact_request         ← Nouvelle demande de contact
contact_accepted        ← Demande acceptée
contact_declined        ← Demande refusée
new_message            ← Nouveau message dans thread
message_pinned         ← Message épinglé par quelqu'un
```

### Engagement (engagement)
```
new_follower           ← Nouveau suivi
post_liked             ← Like sur ton post
post_commented         ← Commentaire sur ton post
post_shared            ← Post partagé
mentioned              ← Mentionné dans commentaire
```

### Partenariat (partnership)
```
partnership_proposal   ← Proposition de partenariat
partnership_accepted   ← Partenariat accepté
```

### Jalons (milestones)
```
badge_earned          ← Badge obtenu (🔥🎯⏱️🤝⭐🛡️🏆)
milestone_reached     ← Jalon atteint (1k, 10k, 100k followers)
creator_tips          ← Conseil de créateur personalisé
```

### Système (system)
```
system                ← Annonces, mises à jour, maintenance
opportunity           ← Opportunité business
```

---

## 🔀 Groupage des Notifications

Certaines notifications se groupent pour éviter le spam :

### Exemples de Groupage
```
5 personnes aiment ton post
→ 1 notification "Alice et 4 autres ont aimé ton post" 
→ groupCount = 5

10 messages reçus d'Alice en 1h
→ 1 notification "Alice: 10 messages reçus"
→ groupKey = "message_alice_id"
```

### Règles de Groupage
- **Même groupKey** ?
- **Moins de 60 minutes** depuis création ?
- **Pas encore lue** ?
→ Incrémenter `groupCount` au lieu de créer nouvelle notif

---

## 🛤️ Flux de Notification

### Exemple 1 : Demande de contact
```
Alice envoie demande à Bob
        ↓
createNotification({
  recipientId: bobId,
  type: 'contact_request',
  actor: aliceId,
  title: 'Alice t\'a envoyé une demande'
})
        ↓
Bob reçoit notification dans Dashboard
        ↓
Bob accepte → contactAccepted notification créée pour Alice
        ↓
Alice voit "Bob a accepté ta demande!"
```

### Exemple 2 : Groupage de messages
```
Alice envoie 3 messages à Bob en 5 minutes
        ↓
Message 1 → Crée notification
  groupKey: "message_alice_id"
        ↓
Message 2 → Même groupKey trouvé
  groupCount: 2
  title: "Alice: message... +2"
        ↓
Message 3 → Même groupKey
  groupCount: 3
  title: "Alice: message... +3"
        ↓
Bob voit 1 notification groupée, pas 3
```

---

## 📡 Endpoints API

### Obtenir Toutes les Notifications
```
GET /api/notifications?page=1&limit=20&type=message&unreadOnly=false
Authorization: Bearer {token}

Query params:
  page: int
  limit: int (default 20)
  type: string (contact_request, post_liked, etc.)
  category: string (messaging, engagement, partnership, etc.)
  unreadOnly: boolean

Response 200:
{
  "message": "Notifications",
  "notifications": [
    {
      "_id": "notifId",
      "type": "new_message",
      "title": "Alice: Salut!",
      "read": false,
      "actor": {
        "username": "alice",
        "avatar": "..."
      },
      "createdAt": "2025-01-28T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 15,
    "pages": 1
  }
}
```

### Obtenir Notifications Non Lues
```
GET /api/notifications/unread
Authorization: Bearer {token}

Response 200:
{
  "message": "Notifications non lues",
  "unreadCount": 7,
  "notifications": [...]
}
```

### Compter Non Lues (Pour Badge)
```
GET /api/notifications/count/unread
Authorization: Bearer {token}

Response 200:
{
  "message": "Nombre de notifications non lues",
  "unreadCount": 7
}
```

### Obtenir Statistiques
```
GET /api/notifications/stats
Authorization: Bearer {token}

Response 200:
{
  "stats": {
    "unreadCount": 7,
    "byType": {
      "new_message": 3,
      "post_liked": 2,
      "new_follower": 2
    },
    "byCategory": {
      "messaging": 3,
      "engagement": 4
    }
  }
}
```

### Marquer une Notification Comme Lue
```
PUT /api/notifications/{notificationId}/read
Authorization: Bearer {token}

Response 200:
{
  "message": "Notification marquée comme lue",
  "notification": {...}
}
```

### Marquer Toutes Comme Lues
```
PUT /api/notifications/read/all
Authorization: Bearer {token}

Response 200:
{
  "message": "Toutes les notifications marquées comme lues",
  "updatedCount": 5
}
```

### Marquer Comme Ignorée (Dismiss)
```
PUT /api/notifications/{notificationId}/dismiss
Authorization: Bearer {token}

Response 200:
{
  "message": "Notification ignorée"
}
```

### Supprimer une Notification
```
DELETE /api/notifications/{notificationId}
Authorization: Bearer {token}

Response 200:
{
  "message": "Notification supprimée"
}
```

### Obtenir Notification Spécifique
```
GET /api/notifications/{notificationId}
Authorization: Bearer {token}

Response 200:
{
  "notification": {
    "_id": "...",
    "type": "new_message",
    "actor": {...},
    "data": {
      "threadId": "...",
      "actionUrl": "/inside/conversations/..."
    }
  }
}
```

---

## 🎨 Presets (Raccourcis)

### Usage
```javascript
import { createNotification, NotificationPresets } from './notificationHelper.js';

// Créer une notification de contact
await createNotification(
  NotificationPresets.contactRequest(
    bobId,      // Destinataire
    aliceId,    // Qui fait l'action
    'alice'     // Username
  )
);

// Créer une notification de nouveau follower
await createNotification(
  NotificationPresets.newFollower(
    bobId,
    aliceId,
    'alice'
  )
);

// Créer une notification de jalon
await createNotification(
  NotificationPresets.milestoneReached(
    bobId,
    'followers',
    10000
  )
);
```

### Presets Disponibles
```javascript
NotificationPresets = {
  contactRequest(recipientId, actorId, username),
  contactAccepted(recipientId, actorId, username),
  newMessage(recipientId, actorId, username, preview),
  newFollower(recipientId, actorId, username),
  postLiked(recipientId, actorId, username, postId),
  postCommented(recipientId, actorId, username, postId, preview),
  milestoneReached(recipientId, milestone, count),
  badgeEarned(recipientId, badgeName, icon),
  partnershipProposal(recipientId, actorId, username, title),
  systemMessage(recipientId, title, description, priority)
}
```

---

## 🔌 Intégrations

### Inside (Messagerie)
```javascript
// Quand demande de contact envoyée
await createNotification({
  ...NotificationPresets.contactRequest(toUserId, fromUserId, fromUsername),
  notificationData: { requestId }
});

// Quand demande acceptée
await createNotification({
  ...NotificationPresets.contactAccepted(toUserId, fromUserId, fromUsername),
  notificationData: { threadId }
});

// Quand message envoyé
await createNotification({
  ...NotificationPresets.newMessage(toUserId, fromUserId, fromUsername, content),
  notificationData: { threadId, messageId }
});
```

### Posts (Likes, commentaires)
```javascript
// À implémenter dans posts.js
// Quand quelqu'un like un post
await createNotification(
  NotificationPresets.postLiked(authorId, likerId, likerUsername, postId)
);

// Quand commentaire ajouté
await createNotification(
  NotificationPresets.postCommented(
    authorId, 
    commenterId, 
    commenterUsername, 
    postId, 
    commentText
  )
);
```

### Users (Followers, badges)
```javascript
// À implémenter dans users.js
// Quand quelqu'un suit
await createNotification(
  NotificationPresets.newFollower(userId, followerId, followerUsername)
);

// Quand badge gagné
await createNotification(
  NotificationPresets.badgeEarned(userId, 'Créateur en montée', '🔥')
);

// Quand jalon
if (followerCount === 1000 || followerCount === 10000 || followerCount === 100000) {
  await createNotification(
    NotificationPresets.milestoneReached(userId, 'followers', followerCount)
  );
}
```

---

## 🎯 Priorités et Envois

### Priorité
```
low     → Post liké                 (pas de push)
normal  → Nouveau message            (push optionnel)
high    → Demande contact            (push)
urgent  → Jalon/badge, suspension    (push + email)
```

### Channels
```
sendPush: boolean   → Notification dans l'app
sendEmail: boolean  → Email envoyé

Defaults:
- contact_request: push + email = true
- new_message: push = true, email = false
- post_liked: push = false, email = false
- milestone: push + email = true
```

---

## 🧹 Nettoyage Auto

### TTL Index
```javascript
// Les notifications expirent après 30 jours
expiresAt: Date (default: now + 30 days)

// Index TTL supprime auto
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);
```

### Job Cron (À ajouter)
```javascript
import { cleanupOldNotifications } from './notificationHelper.js';

// Chaque jour à 2h du matin
setInterval(() => {
  cleanupOldNotifications(90) // Supprimer >90j et lues
    .then(count => console.log(`Supprimé ${count} anciennes notifications`));
}, 24 * 60 * 60 * 1000);
```

---

## 📊 Cas d'Usage Complets

### Flux : Demande de Contact → Acceptation → Message
```
1️⃣ Alice envoie demande à Bob
   POST /api/inside/requests
   → createNotification(contactRequest)
   → Bob reçoit notification

2️⃣ Bob accepte
   POST /api/inside/requests/:id/accept
   → createNotification(contactAccepted)
   → Alice reçoit notification

3️⃣ Bob envoie message
   POST /api/inside/conversations/:id/messages
   → createNotification(newMessage)
   → Alice reçoit notification

4️⃣ Alice ouvre message
   GET /api/notifications/123
   → Notification marquée lue
   → Badge "unread" diminue sur dashboard
```

### Frontend Integration
```javascript
// React Hook
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  // Récupérer le badge
  fetch('/api/notifications/count/unread')
    .then(r => r.json())
    .then(d => setUnreadCount(d.unreadCount));

  // Rafraîchir chaque minute
  const interval = setInterval(() => { ... }, 60000);

  return () => clearInterval(interval);
}, []);

// Afficher badge
<Bell>
  {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
</Bell>

// Cliquer sur notification → marquer lue
const handleNotificationClick = async (id) => {
  await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
  setUnreadCount(prev => prev - 1);
};
```

---

## 🔐 Permissions

- ✅ Utilisateur ne peut voir que ses notifications
- ✅ Marquer comme lu seulement sa propre notif
- ✅ Admin peut voir stats globales (optionnel)

---

## 📈 Performance

### Indexes Clés
```javascript
recipient, createdAt
recipient, read, createdAt
recipient, type, createdAt
recipient, category, read
groupKey, recipient
expiresAt (TTL)
```

### Requête Optimisée
```javascript
// Récupérer 20 notifications non lues les plus récentes
Notification.find({
  recipient: userId,
  read: false,
  dismissed: false
})
.sort({ createdAt: -1 })
.limit(20)
// Utilise index (recipient, read, createdAt)
```

---

## 🎯 Phrase Clé

> **Les notifications informent, n'envahissent pas.**

- Groupage pour éviter le spam
- Priorités pour l'important
- Expiration auto des anciennes
- Respect des préférences utilisateur

