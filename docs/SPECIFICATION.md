# 📖 Spécification complète CAPITUNE — 6 pages

---

## 🏠 Page 1 : Home (Publique)

### But
Présenter CAPITUNE, convertir vers inscription/connexion, segmenter candidat/professionnel.

### Sections

#### 1. Hero
```
Titre : "Orientation stratégique vers le Canada
         + outils + communauté"

Sous-titre : "Accédez à des ressources, une communauté 
et des professionnels pour réussir votre 
intégration professionnelle au Canada"

CTA Double :
  [Je suis candidat] [Je suis professionnel]
```

#### 2. Comment ça marche (3–4 étapes)
```
Étape 1 : S'inscrire
         (Créer compte candidat ou professionnel)

Étape 2 : Compléter le profil
         (Objectifs, documents, secteurs)

Étape 3 : Accéder à la communauté & ressources
         (Inside, Live, annuaire)

Étape 4 : Gérer votre dossier
         (Suivi, documents, chat avec pros)
```

#### 3. Valeurs
```
✓ Transparence
✓ Conformité
✓ Responsabilisation
✓ Communauté
```

#### 4. Aperçu Fonctionnalités (Cards)
```
🗂️ Mon dossier         | 👥 Communauté        | 🎥 Webinaires
📋 Gestion documents  | 💬 Messaging         | 📚 Ressources
```

#### 5. Témoignages / Partenaires (Option MVP)
```
Ajouté en V2
```

#### 6. CTAs Finales
```
[Créer mon compte]  [Je suis un professionnel]
```

---

## 🔐 Page 2 : Authentification

### But
Sécuriser + segmenter type d'utilisateur dès l'inscription.

### Écrans

#### 2.1. Connexion
```
Email / Login
Mot de passe
[Connexion]
[Mot de passe oublié?]
[Pas encore inscrit?]
```

#### 2.2. Inscription (Choix: Candidat / Pro)
```
[Sélection type compte]
  ○ Je suis candidat
  ○ Je suis professionnel

Formulaire Candidat :
  - Nom complet
  - Email
  - Mot de passe
  - Pays de résidence
  - ☐ J'accepte les conditions
  - ☐ J'accepte les communications

Formulaire Professionnel :
  - Nom / Prénom
  - Email
  - Organisation / Entreprise
  - Rôle (Agent, Consultant, Coach, Organisme, Autre)
  - Domaine (Immigration, Finance, Santé, IT, etc.)
  - Mot de passe
  - Preuve/validation (V2)
  - Consentements
```

#### 2.3. Mot de passe oublié
```
Entrez email
[Envoyer lien de réinitialisation]
→ Message : "Vérifiez votre email"
```

#### 2.4. Vérification Email
```
Code 6 chiffres (reçu par email)
[Vérifier]
[Renvoyer code]
```

---

## 📊 Page 3 : Dashboard (Post-Auth)

### But
Vue d'ensemble du parcours + accès rapide aux modules.

### Widgets & Sections

#### 3.1. Bienvenue
```
"Bienvenue, [Prénom]!"
"Vous êtes connecté en tant que [Candidat/Pro]"
```

#### 3.2. Progression du parcours
```
Barre de progression visuelle :
  ✓ Profil complété (60%)
  → Étape suivante : Uploader documents (40%)
```

#### 3.3. Prochaine action
```
Card "Action recommandée"
 Ex: "Compléter votre profil"
 Ex: "Uploader document requis"
 Ex: "Réserver votre session"
 [Commencer]
```

#### 3.4. Dernières notifications
```
- Vous avez reçu un message (pro)
- Votre document est validé
- Nouveau live programmé : "Fiscalité au Canada"
```

#### 3.5. Accès rapide (Cards)
```
📁 Mon dossier
  → Voir documents, messages

👥 Inside
  → Communauté et ressources

🎥 Live
  → Prochains webinaires

👤 Mon profil
  → Édition infos
```

#### 3.6. Stats (futur V2)
```
- Dossiers actifs (pro)
- Points progression (candidat)
- Notifications non lues
```

---

## 💬 Page 4 : Inside — Communauté & Ressources

### But
Communauté centralisée, mise en relation, contenu éducatif.

### 4.1. Fil de publications
```
[Barre de création]
 Écrivez un post / posez une question...

Posts listés :
  Auteur | Avatar | Date
  "Titre du post"
  "Extrait du contenu..."
  ❤️ 24 | 💬 8 commentaires | ⚠️ Signaler
```

### 4.2. Catégories / Tags
```
🎓 Études
💼 Travail
🚀 Entrepreneur
💰 Budget
📄 Documents
🎤 Témoignages
```

### 4.3. Annuaire des professionnels
```
Recherche / Filtres :
  - Domaine
  - Pays d'expérience
  - Badge "Vérifié" (V2)

Card pro :
  Nom | Avatar | Domaine
  "Description courte"
  ⭐ Notation (V2)
  [Voir profil] [Contacter]
```

### 4.4. Ressources
```
📚 Guides :
   - "Checklist immigration Canada"
   - "Équivalence de diplômes"

📹 Mini-formations (texte + vidéo)
   - "Fiscalité au Canada"

📋 Checklists téléchargeables
```

### 4.5. Fonctions sociales (MVP)
```
✓ Publier / Commenter / Liker
✓ Suivre un thème (tags)
✓ Signaler contenu (modération)
```

---

## 🎥 Page 5 : Live — Événements & Webinaires

### But
Éducation + engagement + conversion.

### 5.1. Calendrier des prochains lives
```
📅 [Février 2026]

[16 fév] 19h00 | Fiscalité 2026 au Canada
         Intervenant: Anne Martin (CPA)
         👥 234 inscrits

[18 fév] 14h00 | Équivalence de diplômes
         Intervenant: Ministère Éducation QC
         👥 567 inscrits
```

### 5.2. Page détail live
```
📺 Vignette (image cover)

Titre        : "Fiscalité 2026 au Canada"
Intervenant  : "Anne Martin, CPA certifiée"
Niveau       : "Débutant"
Durée        : "1h30"
Date & Heure : "16 février 2026, 19h00 (EST)"

Description  :
  "Découvrez les règles de fiscalité canadiennes
   pour les nouveaux arrivants. Calcul d'impôts,
   déductions, RRSP..."

[S'inscrire] [Vous êtes inscrit ✓]

Rappels    : ☐ Email (24h avant)
             ☐ SMS (1h avant) — V2

Lien Live   : [Rejoindre le webinaire]
              (YouTube Live / Zoom / Google Meet)
```

### 5.3. Replay & Bibliothèque (V2)
```
📹 Replays disponibles :
   - "Immigration 101" (15 fév, regardée 1200x)
   - "Trouver du travail" (12 fév, regardée 890x)
```

### 5.4. MVP
```
✓ Calendrier listing
✓ Inscription + email de confirmation
✓ Lien diffusion (YouTube/Zoom intégré)
✓ (Pas de replay en MVP)
```

---

## 📁 Page 6 : Mon dossier — Gestion documents & suivi

### But
Centraliser documents, suivi, messagerie, tâches.

### 6.1. Vue CANDIDAT (son dossier unique)
```
📑 En-tête :
  Statut global : "En cours" / "Validé" / "Archivé"
  Créé le : 15 janvier 2026
  Dernier modifié : 28 janvier 2026
```

#### 6.1.1. Onglet Documents
```
Tableau :
  Type          | Fichier              | Statut        | Action
  ─────────────────────────────────────────────────────────────
  Passport      | passport_scan.pdf    | ✓ Reçu        | -
  Diplôme       | (vide)               | ⚠️ À fournir  | 📤 Uploader
  Lettre ref    | recomm_letter.pdf    | ⏳ En révision | -
  Extrait acte  | birth_cert.pdf       | ✓ Validé      | ✓

  [+ Ajouter document]
```

#### 6.1.2. Onglet Étapes / Checklist
```
Timeline :
  ✓ 15 jan   | Dossier créé
  ✓ 18 jan   | Profil complété
  ⏳ 25 jan   | Documents en révision
  → 05 fév   | Étape suivante TBD
  ○ 15 fév   | Visite consultante (à planifier)
```

#### 6.1.3. Onglet Messagerie
```
Chat simple candidat ↔ agent :

Agents assignés : 
  - Anne Martin (Agent immigration, Groupe Ocean)
  - Bruno Lachance (Consultant finance)

Messages :
  [Anne] 28 jan 15:30
  "J'ai examiné vos documents. Il manque 
   une preuve d'emploi. Pouvez-vous l'envoyer?"
  
  [Vous] 28 jan 16:00
  "Bien sûr, je l'envoie dans 24h."

  [Barre input message]
```

#### 6.1.4. Notes (agents uniquement)
```
Visibles uniquement par les pro assignés :
  "Candidat très sérieux, documents clairs.
   À accélérer."
```

#### 6.1.5. Budget & Estimations
```
💰 Coûts estimés :
  Frais de traitement : $500 CAD
  Frais de consultation : $1200 CAD
  Total estimé : $1700 CAD
  ───────────────
  Payé : $500 CAD
  Restant : $1200 CAD

  [Voir devis détaillé]
```

---

### 6.2. Vue PROFESSIONNEL (ses clients)
```
Liste de tous les dossiers clients :

Recherche/Filtres :
  [Chercher par nom]
  Statut : Tous | En cours | Validés | Archivés

Tableau :
  Nom Client        | Statut      | Actions    | Dernière maj
  ────────────────────────────────────────────────────────
  Jean Marchand     | En cours    | 👁️ 📨 ⋮   | 28 jan
  Sophie Leclerc    | Validé      | 👁️ 📨 ⋮   | 25 jan
  Marco Rossi       | À démarrer  | 👁️ 📨 ⋮   | 15 jan

  [Créer nouveau dossier]
```

#### 6.2.1. Détail dossier client (pro)
```
(Vue similaire à candidat, mais enrichie)

En-têtes additionnels :
  - Tags / Catégories (Finance, Études, Travail, etc.)
  - Assigné à : [Vous] + autres pros
  - Pipeline stage : Prospect | Intéressé | Actif | 
                    Validé | Archivé

Boutons action :
  [Ajouter professionnel]
  [Changer statut]
  [Archiver]
```

---

## 👤 Page 7 : Profil — Données & Préférences

### But
Gestion données personnelles, objectifs, préférences, sécurité.

### 7.1. Informations personnelles
```
Nom complet        : [Jean Dupont]
Email              : [jean@example.com]
Téléphone (opt)    : [+1 438 999 1234]
Photo profil       : [Avatar] [Changer]
Pays résidence     : [Canada 🇨🇦]
Provence/État (opt): [Québec]
```

### 7.2. Objectifs (candidat)
```
☐ Études
☐ Travail
☐ Entrepreneuriat
☐ Budget/Finance
Secteur d'intérêt : [IT / Santé / Finance / Autre]
```

### 7.3. Préférences de notifications
```
Emails :
  ☑ Nouveaux messages
  ☑ Événements & webinaires
  ☑ Mises à jour dossier
  ☐ Newsletter hebdomadaire

SMS (V2) :
  ☑ Rappels webinaires
```

### 7.4. Sécurité
```
Mot de passe       : [●●●●●●●●]  [Changer]

Sessions actives (V2) :
  - Windows (Chrome) — Dernière utilisation : 28 jan
  - iPhone — Dernière utilisation : 26 jan

2FA (V2)           : Désactivé  [Activer]
```

### 7.5. Données & Consentements
```
☑ J'accepte la politique de confidentialité
☑ J'accepte les conditions d'utilisation

[Télécharger mes données] (RGPD)
[Supprimer mon compte]
```

---

## 📋 Résumé : 6 pages MVP

| Page | Contenu | Publique | Auth requis |
|------|---------|----------|-------------|
| **Home** | Présentation + CTAs | ✓ | ✗ |
| **Auth** | Inscription/Connexion | ✓ | ✗ |
| **Dashboard** | Vue d'ensemble | ✗ | ✓ |
| **Inside** | Communauté + ressources | ✗ | ✓ |
| **Live** | Webinaires | ✗ | ✓ |
| **Mon dossier** | Documents + suivi + chat | ✗ | ✓ |
| **Profil** | Gestion compte | ✗ | ✓ |

---

**Statut** : Spécification complète ✓ | **Date** : 02 février 2026
