# Système de Sanctions Progressives - Capitune

## Vue d'ensemble

Le système de sanctions progressives détecte et pénalise les comptes avec une croissance anormale, tout en préservant les créateurs légitimes.

## Architecture

### 1. **Détection** (antiBotHelper.js)
Analyse 6 critères comportementaux :
- **spike_followers** : +100 abonnés/24h ou +50%/7j
- **inconsistent_engagement** : Hauts followers mais faible engagement (<50%)
- **inactive_with_followers** : 5k+ followers, aucun post récent
- **rapid_follow_unfollow** : 3+ cycles en 5 jours
- **fake_interaction_network** : Ratio engagement anormal (<0.5 pour nouveaux créateurs)
- **engagement_ratio_mismatch** : Likes disproportionnés vs commentaires/shares

Classification :
- **0 flags** = normal
- **1-2 flags** = abnormal
- **3+ flags** = suspicious

### 2. **Sanctions Progressives** (sanctionHelper.js)

#### Niveau 1 : Warning (1 flag)
- Durée : 7 jours
- Pénalité de portée : -0% (aucune)
- Monétisation : ✅ Autorisée
- Badges : ✅ Maintenus
- Effet : Surveillance discrète

#### Niveau 2 : Moderate (2 flags)
- Durée : 14 jours
- Pénalité de portée : **-30%** (reachPenalty = 0.7)
- Monétisation : ✅ Autorisée
- Badges : ❌ Badges auto supprimés
- Effet : Réduction visible de reach dans l'algorithme

#### Niveau 3 : Severe (3+ flags)
- Durée : 30 jours
- Pénalité de portée : **-60%** (reachPenalty = 0.4)
- Monétisation : ❌ Bloquée
- Badges : ❌ Badges auto supprimés
- Effet : Pénalité importante + blocage monétisation

### 3. **Application des Pénalités**

#### Score de Post
```
globalScore = baseScore × boostMultiplier × reachPenalty

Exemple :
- Post normal : score 60
- Avec penalité -30% : 60 × 0.7 = 42
- Avec penalité -60% : 60 × 0.4 = 24
```

Le score influencé la position dans le feed :
- <20 : Très peu visible
- 20-40 : Portée réduite
- >40 : Visible normalement

#### Monétisation Bloquée
Si `monetizationEligible = false`, les endpoints POST créent un contenu exclusif ou partenariat :
```json
{
  "status": 403,
  "message": "Accès à la monétisation bloqué",
  "reason": "suspended_monetization"
}
```

#### Badges Automatiques Supprimés
Lors de l'application d'une sanction moderate/severe :
- ❌ rising (🔥)
- ❌ engagement (🎯)
- ❌ regular (⏱️)
- ❌ partner (🤝)

Les badges manuels (⭐, 🛡️, 🏆) sont préservés.

### 4. **Expiration Automatique**

#### Nettoyage Quotidien
Un job cron peut être configuré pour appeler `batchCleanExpiredSanctions()` :
```javascript
// À ajouter dans server startup ou cronjob
import { batchCleanExpiredSanctions } from './utils/sanctionHelper.js';

// Quotidien à minuit
setInterval(() => {
  batchCleanExpiredSanctions()
    .then(result => console.log('Sanctions nettoyées:', result.processed));
}, 24 * 60 * 60 * 1000);
```

#### Processus d'Expiration
1. Sanctions avec `expiresAt` dans le passé sont ignorées
2. Badges supprimés restituées si plus aucune sanction active
3. `monetizationEligible` rétabli si pas de blocage monétisation actif
4. `reducedReach` levé si plus de pénalité de portée active

## Endpoints API

### Pour les Créateurs

**Consulter ses restrictions**
```
GET /api/posts/sanctions/status
Authorization: Bearer {token}
```

Réponse :
```json
{
  "message": "Détails des restrictions",
  "sanctions": {
    "userId": "user123",
    "currentSanctions": [
      {
        "type": "reach_reduction",
        "level": "moderate",
        "reason": "2 anomalies détectées: spike_followers, inconsistent_engagement",
        "appliedAt": "2024-01-15T10:00:00Z",
        "expiresIn": "168 heures"
      }
    ],
    "isRestricted": true,
    "reachPenalty": 0.7,
    "canMonetize": true,
    "anomalies": {
      "growthPattern": "abnormal",
      "flags": ["spike_followers", "inconsistent_engagement"]
    }
  }
}
```

### Pour les Admins

**Consulter les sanctions d'un utilisateur**
```
GET /api/users/:userId/sanctions
Authorization: Bearer {adminToken}
```

**Appliquer une sanction manuelle**
```
POST /api/users/:userId/apply-sanction
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "sanctionType": "reach_reduction|monetization_block",
  "level": "warning|moderate|severe",
  "durationDays": 14
}
```

**Lever une sanction**
```
POST /api/users/:userId/lift-sanction
Content-Type: application/json
Authorization: Bearer {adminToken}

{
  "sanctionType": "reach_reduction|monetization_block"
}
```

**Nettoyer les sanctions expirées d'un utilisateur**
```
POST /api/users/:userId/cleanup-sanctions
Authorization: Bearer {adminToken}
```

## Intégration avec le Feed Algorithm

### Calcul du Score
```javascript
// Dans feedAlgorithm.js - calculatePostScore()

// Score de base calculé
let globalScore = (Q×0.35 + E×0.30 + R×0.15 + C×0.10 + N×0.10) × 100

// Appliquer le boost (nouveaux créateurs)
globalScore = globalScore × boostMultiplier

// ⚠️ APPLIQUER LA PÉNALITÉ DE PORTÉE
if (author.reducedReach && author.reachPenalty) {
  globalScore = globalScore × author.reachPenalty
  // sanctionApplied = true (pour logs)
}

// Cap à 100
return {
  global: Math.min(100, globalScore),
  reachPenalty: author.reachPenalty,
  sanctionApplied: author.reducedReach
}
```

### Résultat dans le Feed
Posts de comptes sanctionnés :
- Score réduit → Position plus basse
- Moins de visibilité dans "Découverte"
- Visible pour followers existants (feed abonnements)
- **PAS de suppression** (éthique de rédemption)

## Scénarios d'Utilisation

### Scénario 1 : Nouveau compte avec croissance anormale
```
Jour 1 : +200 followers (spike_followers = 1 flag)
       → Anomaly status = "abnormal"
       → Sanction = WARNING (aucune pénalité)

Jour 2 : +300 followers + ratio engagement anormal (2 flags total)
       → Anomaly status = "suspicious"
       → Sanction = MODERATE
       → reachPenalty = 0.7 (-30%)
       → Badges 🔥🎯⏱️🤝 supprimés
       → Peut monétiser = ✅

Jour 8 : Pas de nouvelles anomalies détectées
       → Sanction WARNING expire
       → Status revient à "abnormal"

Jour 15 : Patterns redeviennent normaux
        → Sanction MODERATE expire
        → Status = NORMAL
        → Badges rétablis (via updateUserBadges)
        → reachPenalty redevient 1.0
```

### Scénario 2 : Croissance agressive via services
```
Jour 0 : +500 followers/jour pendant 3 jours
       → spike_followers (1 flag) + inconsistent_engagement (2 flags)
       → SEVERE sanction immédiate
       → reachPenalty = 0.4 (-60%)
       → monetizationEligible = false 🔒
       → Tentative post exclusive = 403 Forbidden

Jour 30 : Sanction expire
        → Peut monétiser à nouveau
        → Portée redevient normale
```

### Scénario 3 : Cas de faux positif (créateur passionné)
```
Jour 0 : +150 followers (legitimate viral post) + engagement normal
       → 1 flag spike_followers (peut être temporaire)
       → WARNING (survie silencieuse 7j)

Jour 7 : Croissance se stabilise + engagement excellent
       → Flagz diminuent
       → Sanction retire automatiquement
       → Aucun impact visible pour le créateur
```

## Considérations d'Éthique

✅ **Fair Process**
- Créateurs informés via l'endpoint `/api/posts/sanctions/status`
- Pénalités temporaires (opportunité de rédemption)
- Transparence sur les raisons exactes

❌ **Pas d'Interdiction**
- Comptes toujours actifs et visibles
- Seule la portée est réduite
- Followers existants continuent de voir le contenu

✅ **Progressivité**
- Warning → Moderate → Severe
- Donne chance de corriger avant blocage monétisation
- Job de nettoyage auto-remet les créateurs légitimes

## Maintenance & Monitoring

### Métriques à Surveiller
```sql
-- Comptes actifs avec sanctions
SELECT COUNT(*), level FROM sanctions GROUP BY level

-- Taux d'expiration vs réappélés
SELECT 
  COUNT(CASE WHEN expiresAt < NOW() THEN 1 END) as expired,
  COUNT(*) as total
FROM sanctions

-- Impacte sur reach
SELECT AVG(reachPenalty) FROM users WHERE reducedReach = true
```

### Logs Recommandés
```javascript
// Dans antiBotHelper.js
console.log(`[ANOMALY] User ${userId}: ${anomalyFlags.join(',')} = ${pattern}`)

// Dans sanctionHelper.js
console.log(`[SANCTION] User ${userId}: ${sanctionLevel} (${durationDays}j, pénalité ${reachPenalty})`)
```

## Roadmap Future

- [ ] UI Dashboard pour admins (voir sanctionspar catégorie)
- [ ] Alertes temps-réel pour modération
- [ ] Appeals system (créateurs peuvent contester)
- [ ] Machine learning pour affinage des 6 critères
- [ ] Sanctions par domaine (reach_reduction, monetization_block, comment_limit)
- [ ] Sanctions temporaires + "strike system" (3 strikes = permanent)
