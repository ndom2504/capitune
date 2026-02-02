# 🗄️ Schéma Base de Données CAPITUNE

---

## Tables principales

### 1. `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Profil
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Type & Rôle
  role ENUM('candidate', 'professional', 'admin') DEFAULT 'candidate',
  
  -- Localisation (candidat)
  country VARCHAR(100),
  province VARCHAR(100),
  
  -- Professionnel
  organization VARCHAR(255),
  professional_role VARCHAR(100),  -- Agent, Consultant, Coach, etc.
  domain VARCHAR(100),              -- Immigration, Finance, Santé, IT, etc.
  is_verified BOOLEAN DEFAULT FALSE, -- Badge "Vérifié" (V2)
  
  -- Préférences
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_sms BOOLEAN DEFAULT FALSE,
  newsletter BOOLEAN DEFAULT TRUE,
  
  -- RGPD
  consent_data BOOLEAN DEFAULT FALSE,
  consent_communications BOOLEAN DEFAULT FALSE,
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMP  -- Soft delete
);

-- Indices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_domain ON users(domain);
```

---

### 2. `dossiers` (Dossiers clients)
```sql
CREATE TABLE dossiers (
  id UUID PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES users(id),
  
  -- Infos dossier
  title VARCHAR(255),
  description TEXT,
  type ENUM('studies', 'work', 'entrepreneurship', 'other'),
  status ENUM('draft', 'in_progress', 'completed', 'archived') DEFAULT 'draft',
  
  -- Professionnels assignés
  assigned_professional_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Étapes
  progress_percentage INT DEFAULT 0,
  current_stage VARCHAR(100),
  
  -- Budget
  estimated_cost DECIMAL(10,2),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indices
CREATE INDEX idx_dossiers_candidate ON dossiers(candidate_id);
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_professionals ON dossiers USING GIN(assigned_professional_ids);
```

---

### 3. `documents`
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  
  -- Document
  document_type VARCHAR(100),  -- passport, diploma, reference_letter, etc.
  title VARCHAR(255),
  file_url TEXT NOT NULL,
  file_size INT,  -- bytes
  mime_type VARCHAR(100),
  
  -- Statut
  status ENUM('required', 'pending', 'received', 'validated', 'rejected') DEFAULT 'required',
  validation_notes TEXT,
  
  -- Qui a uploadé/validé
  uploaded_by UUID REFERENCES users(id),
  validated_by UUID REFERENCES users(id),
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  validated_at TIMESTAMP
);

CREATE INDEX idx_documents_dossier ON documents(dossier_id);
CREATE INDEX idx_documents_status ON documents(status);
```

---

### 4. `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  
  -- Expéditeur/Destinataire
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  
  -- Contenu
  content TEXT NOT NULL,
  file_attachment_url TEXT,  -- Optionnel
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_messages_dossier ON messages(dossier_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

---

### 5. `internal_notes` (Notes internes = visibles pros uniquement)
```sql
CREATE TABLE internal_notes (
  id UUID PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  
  -- Auteur (pro uniquement)
  author_id UUID NOT NULL REFERENCES users(id),
  
  -- Contenu
  content TEXT NOT NULL,
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_internal_notes_dossier ON internal_notes(dossier_id);
CREATE INDEX idx_internal_notes_author ON internal_notes(author_id);
```

---

### 6. `dossier_checklists` (Étapes/checkpoints)
```sql
CREATE TABLE dossier_checklists (
  id UUID PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  
  -- Checkpoint
  title VARCHAR(255),
  description TEXT,
  order INT,
  
  -- Statut
  is_completed BOOLEAN DEFAULT FALSE,
  target_date DATE,
  completed_at TIMESTAMP,
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checklists_dossier ON dossier_checklists(dossier_id);
```

---

### 7. `posts` (Inside — communauté)
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id),
  
  -- Contenu
  title VARCHAR(255),
  content TEXT NOT NULL,
  category ENUM('studies', 'work', 'entrepreneurship', 'budget', 'documents', 'testimonials'),
  
  -- Modération
  status ENUM('draft', 'published', 'flagged', 'rejected') DEFAULT 'published',
  
  -- Engagement
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```

---

### 8. `comments` (Commentaires sur posts)
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  
  -- Parent comment (for nested replies) - V2
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  -- Contenu
  content TEXT NOT NULL,
  
  -- Engagement
  likes_count INT DEFAULT 0,
  
  -- Modération
  status ENUM('approved', 'flagged', 'rejected') DEFAULT 'approved',
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
```

---

### 9. `post_likes`
```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint : un user ne peut liker qu'une fois par post
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
```

---

### 10. `events_live` (Webinaires & événements)
```sql
CREATE TABLE events_live (
  id UUID PRIMARY KEY,
  
  -- Infos
  title VARCHAR(255) NOT NULL,
  description TEXT,
  speaker VARCHAR(255),  -- Nom intervenant
  speaker_id UUID REFERENCES users(id),  -- Pro/intervenant
  
  -- Timing
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  duration_minutes INT,  -- Ex: 90
  timezone VARCHAR(50) DEFAULT 'America/Toronto',
  
  -- Lien diffusion
  live_link VARCHAR(500),  -- URL YouTube/Zoom/Meet
  replay_url VARCHAR(500),  -- (V2)
  
  -- Metadata
  level ENUM('beginner', 'intermediate', 'advanced'),
  capacity INT,
  registered_count INT DEFAULT 0,
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_events_date ON events_live(event_date);
CREATE INDEX idx_events_active ON events_live(is_active);
```

---

### 11. `event_registrations` (Inscriptions aux webinaires)
```sql
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events_live(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Rappels
  reminder_email_sent BOOLEAN DEFAULT FALSE,
  reminder_sms_sent BOOLEAN DEFAULT FALSE,
  
  -- Engagement
  attended BOOLEAN DEFAULT FALSE,
  
  -- Système
  registered_at TIMESTAMP DEFAULT NOW(),
  attended_at TIMESTAMP,
  
  -- Unique : user inscrit une seule fois par événement
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);
```

---

### 12. `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Type
  type ENUM('message', 'document_validated', 'dossier_update', 'event_reminder', 'post_like', 'comment', 'system'),
  
  -- Contenu
  title VARCHAR(255),
  content TEXT,
  related_resource_id UUID,  -- dossier_id, post_id, etc.
  
  -- Statut
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Système
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

---

### 13. `tags` (Pour Inside — future utilisation)
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  
  PRIMARY KEY(post_id, tag_id)
);
```

---

### 14. `audit_logs` (V2 - Modération & sécurité)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100),
  target_resource_type VARCHAR(50),  -- 'dossier', 'document', 'post', etc.
  target_resource_id UUID,
  
  changes JSONB,  -- Avant/après
  ip_address VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
```

---

## 📊 Relations graphiques

```
┌─────────────────┐
│     USERS       │
│ (role: candidate│
│  professional   │
│  admin)         │
└────────┬────────┘
         │
         │ (1-to-many)
         │
         ▼
    ┌─────────────────┐
    │    DOSSIERS     │
    │(candidate_id,   │
    │assigned_prof_ids)
    └────────┬────────┘
             │
             │(1-to-many)
             │
    ┌────────▼──────────┐
    │   DOCUMENTS       │
    │   MESSAGES        │
    │   INTERNAL_NOTES  │
    │   CHECKLISTS      │
    └───────────────────┘


┌─────────────────┐
│     POSTS       │◄─────┐
│  (Inside posts) │      │ (1-to-many)
└────────┬────────┘      │
         │               │
         │(1-to-many)    │
         │               │
         ▼               │
    ┌────────────┐       │
    │ COMMENTS   ├───────┘
    └────────────┘


┌──────────────────┐
│  EVENTS_LIVE     │
│  (webinaires)    │
└────────┬─────────┘
         │
         │(1-to-many)
         │
         ▼
    ┌──────────────────┐
    │EVENT_REGISTRATIONS
    │  (inscriptions)  │
    └──────────────────┘
```

---

## 🗝️ Contraintes & validations

```
1. Un dossier = UN candidat (proprietaire)
2. Un dossier peut être assigné à 0..N professionnels
3. Un document nécessite un dossier
4. Un message nécessite sender + recipient + dossier
5. Un post nécessite un auteur
6. Un commentaire nécessite un post + auteur
7. Une inscription à event = user + event (unique)
```

---

## 📈 Données de test (MVP)

```sql
-- Candidats
INSERT INTO users (id, email, role, first_name, last_name, country)
VALUES 
  ('cand-1', 'jean@example.com', 'candidate', 'Jean', 'Dupont', 'Canada'),
  ('cand-2', 'marie@example.com', 'candidate', 'Marie', 'Martin', 'France');

-- Professionnels
INSERT INTO users (id, email, role, first_name, organization, domain, is_verified)
VALUES
  ('pro-1', 'anne@groupocean.com', 'professional', 'Anne', 'Groupe Ocean', 'Immigration', TRUE),
  ('pro-2', 'bruno@consult.ca', 'professional', 'Bruno', 'Consult Finance', 'Finance', FALSE);

-- Admin
INSERT INTO users (id, email, role, first_name)
VALUES
  ('admin-1', 'admin@capitune.com', 'admin', 'Admin');

-- Dossiers
INSERT INTO dossiers (id, candidate_id, title, type, status, assigned_professional_ids)
VALUES
  ('dos-1', 'cand-1', 'Immigration - Travail', 'work', 'in_progress', ARRAY['pro-1'::uuid]),
  ('dos-2', 'cand-2', 'Études Universitaires', 'studies', 'draft', ARRAY[]::uuid[]);
```

---

**Statut** : Schéma BD finalisé ✓ | **Date** : 02 février 2026
