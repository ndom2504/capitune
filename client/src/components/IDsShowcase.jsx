import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './IDsShowcase.css';

const STORAGE_KEY = 'capitune_stories';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h

const fallbackStories = [
  {
    id: 'sample-1',
    userName: 'Capitune',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Capitune',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    text: 'Explorer les idées en confiance',
    createdAt: Date.now(),
    expiresAt: Date.now() + EXPIRY_MS,
    isSample: true,
    likes: 24,
    liked: false
  },
  {
    id: 'sample-2',
    userName: 'Mika',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mika',
    type: 'text',
    text: 'Une pensée par jour ✨',
    createdAt: Date.now(),
    expiresAt: Date.now() + EXPIRY_MS,
    isSample: true,
    likes: 12,
    liked: false
  },
  {
    id: 'sample-3',
    userName: 'Lina',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lina',
    type: 'video',
    mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    text: 'Micro-vidéo en boucle',
    createdAt: Date.now(),
    expiresAt: Date.now() + EXPIRY_MS,
    isSample: true,
    likes: 8,
    liked: false
  }
];

const cleanStories = (list) =>
  (list || []).filter((s) => !s.expiresAt || Date.now() < s.expiresAt);

const resolveUrl = (url, apiHost) => {
  if (!url) return '';
  // Si c'est déjà une URL absolue
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Si c'est un chemin relatif
  if (url.startsWith('/')) {
    return `${apiHost}${url}`;
  }
  // Sinon ajouter /uploads/
  return `${apiHost}/uploads/${url}`;
};

function IDsShowcase() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [text, setText] = useState('');
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const fileInputRef = useRef(null);
  const apiHost = import.meta.env.VITE_API_HOST || 'http://localhost:3000';

  useEffect(() => {
    loadStories();
  }, []);

  // Nettoyer les stories invalides (blob expirés, média manquant)
  const sanitizeStories = (list) => {
    return (list || []).filter((s) => {
      if (s.isSample) return true;
      // Rattacher l'ownership manquante aux stories de l'utilisateur courant
      if (!s.ownerId && user?._id && s.userName === user?.username) {
        s.ownerId = user._id;
      }
      if (['image', 'video'].includes(s.type)) {
        if (!s.mediaUrl) return false;
        if (s.mediaUrl.startsWith('blob:')) return false; // blobs expirent après refresh
      }
      return true;
    });
  };

  // Grouper les stories par utilisateur
  const groupStoriesByUser = (allStories) => {
    const grouped = {};
    allStories.forEach((story) => {
      const userName = story.userName || 'Inconnu';
      if (!grouped[userName]) {
        grouped[userName] = {
          userName,
          stories: []
        };
      }
      grouped[userName].stories.push(story);
    });
    return Object.values(grouped);
  };

  const loadStories = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored = sanitizeStories(cleanStories(raw ? JSON.parse(raw) : []));
      const merged = [...stored];

      // Ajouter des exemples s'il manque du contenu
      if (merged.length < 5) {
        fallbackStories.forEach((sample) => {
          if (!merged.find((s) => s.id === sample.id)) {
            merged.push(sample);
          }
        });
      }

      setStories(merged);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch (err) {
        console.warn('Quota localStorage atteint lors du load, persistance ignorée', err);
      }
    } catch (err) {
      console.error('Erreur chargement stories', err);
      setStories(fallbackStories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const openCreator = () => setCreatorOpen(true);
    const reload = () => loadStories();
    window.addEventListener('open-story-creator', openCreator);
    window.addEventListener('stories-updated', reload);
    return () => {
      window.removeEventListener('open-story-creator', openCreator);
      window.removeEventListener('stories-updated', reload);
    };
  }, []);

  const persistStories = (list) => {
    // Évite de saturer le localStorage avec des payloads vidéo volumineux
    const sanitized = list.map((s) => {
      if (s.type === 'video' && s.mediaUrl?.startsWith('data:')) {
        return { ...s, mediaUrl: '' };
      }
      return s;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (err) {
      console.warn('Quota localStorage atteint, réduction de la liste', err);
      try {
        const trimmed = sanitized
          .slice(0, 20)
          .map((s) => ({ ...s, mediaUrl: s.type === 'video' ? '' : s.mediaUrl }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch (err2) {
        console.warn('Impossible de persister les stories après réduction', err2);
        alert('Espace local plein. Les ID seront visibles seulement pour cette session.');
      }
    }

    window.dispatchEvent(new Event('stories-updated'));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Vérifier la taille (max 100MB pour vidéo/ID)
    if (file.size > 100 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 100MB)');
      return;
    }
    
    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    
    if (!isVideo && !isImage) {
      alert('Format non supporté. Utilisez une image (JPG, PNG, WebP, GIF) ou vidéo (MP4, WebM)');
      return;
    }
    
    if (isVideo) {
      // Pour les vidéos, utiliser un Object URL léger (évite le base64 énorme en localStorage)
      const objectUrl = URL.createObjectURL(file);
      setMediaPreview(objectUrl);
      setMediaType('video');
    } else if (isImage) {
      // Pour les images, redimensionner puis convertir en base64
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Limiter à 1080px de largeur max
        if (width > 1080) {
          height = (height * 1080) / width;
          width = 1080;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en base64
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setMediaPreview(base64);
        setMediaType('image');
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const toggleLike = (storyId) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? { ...s, liked: !s.liked, likes: s.liked ? s.likes - 1 : s.likes + 1 }
          : s
      )
    );
  };

  const canDeleteStory = (story) => {
    if (!story || story.isSample) return false;
    if (!story.ownerId || !user?._id) return false;
    return story.ownerId === user._id;
  };

  const deleteStory = (storyId) => {
    const target = stories.find((s) => s.id === storyId);
    if (!canDeleteStory(target)) return;
    setStories((prev) => {
      const updated = prev.filter((s) => s.id !== storyId);
      persistStories(updated);
      return updated;
    });
    closeViewer();
  };

  const handleCreateStory = (e) => {
    e.preventDefault();
    if (!text && !mediaPreview) {
      alert('Ajoute un média ou un texte pour créer ton ID');
      return;
    }

    const baseName = user?.username || 'Vous';
    const baseAvatar = resolveUrl(
      user?.avatar,
      apiHost
    ) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(baseName)}`;

    const newStory = {
      id: crypto.randomUUID ? crypto.randomUUID() : `story-${Date.now()}`,
      userName: baseName,
      avatar: baseAvatar,
      ownerId: user?._id || null,
      type: mediaPreview ? mediaType : 'text',
      mediaUrl: mediaPreview || '',
      text: text || '',
      createdAt: Date.now(),
      expiresAt: Date.now() + EXPIRY_MS,
      likes: 0,
      liked: false
    };

    const existing = cleanStories(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    const updated = [newStory, ...existing];
    persistStories(updated);
    setStories([newStory, ...stories.filter((s) => !s.isSample)]);
    setText('');
    setMediaPreview('');
    setMediaType('text');
    setCreatorOpen(false);
  };

  const openViewer = (userGroup) => {
    // Trouver l'index de la première story de ce groupe
    const firstStoryIndex = stories.findIndex(s => s.id === userGroup.stories[0].id);
    setViewerIndex(firstStoryIndex);
  };
  
  const closeViewer = () => setViewerIndex(null);
  const hasStories = stories.length > 0;
  const groupedStories = groupStoriesByUser(stories);

  const nextStory = () => {
    if (!hasStories) return;
    setViewerIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % stories.length;
    });
  };

  const prevStory = () => {
    if (!hasStories) return;
    setViewerIndex((prev) => {
      if (prev === null) return stories.length - 1;
      return (prev - 1 + stories.length) % stories.length;
    });
  };

  useEffect(() => {
    if (viewerIndex === null) return;
    const story = stories[viewerIndex];
    if (!story) return;
    const delay = story.type === 'video' ? 8000 : 6000;
    const timer = setTimeout(nextStory, delay);
    return () => clearTimeout(timer);
  }, [viewerIndex, stories]);

  return (
    <div className="stories-bar">
      {loading ? (
        <div className="stories-loading">Chargement des ID...</div>
      ) : (
        <div className="stories-scroll" aria-label="ID en une liste horizontale">
          <div className="story-card create" onClick={() => setCreatorOpen(true)}>
            <div className="story-avatar create-avatar">+</div>
            <span className="story-name">Créer une ID</span>
            <span className="story-meta">Instantané</span>
          </div>

          {groupedStories.map((userGroup) => {
            const firstStory = userGroup.stories[0];
            const hasMultiple = userGroup.stories.length > 1;
            return (
              <motion.div
                key={userGroup.userName}
                className={`story-card ${hasMultiple ? 'multiple-stories' : ''}`}
                whileHover={{ y: -2 }}
                onClick={() => openViewer(userGroup)}
              >
                <div className="story-card-preview">
                  {firstStory.type === 'video' && firstStory.mediaUrl ? (
                    <video src={firstStory.mediaUrl} muted />
                  ) : firstStory.type === 'image' && firstStory.mediaUrl ? (
                    <img src={firstStory.mediaUrl} alt={firstStory.userName} />
                  ) : (
                    <div className="story-card-text">{firstStory.text || 'ID'}</div>
                  )}
                </div>
                <div className="story-card-footer">
                  <div className="story-avatar-ring">
                    <div className="story-avatar">
                      <img src={firstStory.avatar} alt={firstStory.userName} />
                    </div>
                  </div>
                  <span className="story-name" title={firstStory.userName}>{firstStory.userName}</span>
                </div>
                {firstStory.likes > 0 && <span className="story-likes">{firstStory.likes}</span>}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {creatorOpen && (
          <motion.div
            className="story-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreatorOpen(false)}
          >
            <motion.div
              className="story-modal"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="story-modal-header">
                <div>
                  <p className="story-modal-title">Créer une ID</p>
                  <p className="story-modal-sub">Image, vidéo courte en boucle ou texte</p>
                </div>
                <button className="story-close" onClick={() => setCreatorOpen(false)} aria-label="Fermer">×</button>
              </header>

              <form className="story-form" onSubmit={handleCreateStory}>
                <label className="story-label">Texte (optionnel)</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Partage une idée en quelques mots..."
                  rows={3}
                />

                <label className="story-label">Média (image ou vidéo courte)</label>
                <div className="story-upload" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
                  {mediaPreview ? (
                    mediaType === 'video' ? (
                      <video src={mediaPreview} loop autoPlay muted playsInline />
                    ) : (
                      <img src={mediaPreview} alt="Prévisualisation" />
                    )
                  ) : (
                    <span>Importer depuis l'appareil</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <button type="submit" className="story-submit">Publier l'ID</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewerIndex !== null && stories[viewerIndex] && (
          <motion.div
            className="story-viewer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeViewer}
          >
            <motion.div
              className="story-viewer"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="story-viewer-header">
                <div className="story-viewer-user">
                  <img src={stories[viewerIndex].avatar} alt={stories[viewerIndex].userName} />
                  <div>
                    <p className="story-viewer-name">{stories[viewerIndex].userName}</p>
                    <p className="story-viewer-meta">ID</p>
                  </div>
                </div>
                <button className="story-close" onClick={closeViewer} aria-label="Fermer">×</button>
              </div>

              <div className="story-viewer-body">
                {stories[viewerIndex].type === 'video' && stories[viewerIndex].mediaUrl ? (
                  <video src={stories[viewerIndex].mediaUrl} loop autoPlay muted playsInline />
                ) : stories[viewerIndex].type === 'image' && stories[viewerIndex].mediaUrl ? (
                  <img src={stories[viewerIndex].mediaUrl} alt="Story" />
                ) : (
                  <div className="story-viewer-text">{stories[viewerIndex].text || 'ID'}</div>
                )}
              </div>

              {stories[viewerIndex].text && stories[viewerIndex].type !== 'text' && (
                <p className="story-viewer-caption">{stories[viewerIndex].text}</p>
              )}

              <div className="story-viewer-actions">
                <button onClick={prevStory} aria-label="Précédent">‹</button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(stories[viewerIndex].id);
                  }}
                  className={`story-like-btn ${stories[viewerIndex].liked ? 'liked' : ''}`}
                  title="J'aime"
                >
                  {stories[viewerIndex].liked ? '❤️' : '🤍'} {stories[viewerIndex].likes}
                </button>
                {canDeleteStory(stories[viewerIndex]) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStory(stories[viewerIndex].id);
                    }}
                    className="story-delete-btn"
                    title="Supprimer l'ID"
                  >
                    🗑️
                  </button>
                )}
                <button onClick={nextStory} aria-label="Suivant">›</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default IDsShowcase;
