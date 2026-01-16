import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Video, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './CreatePostPage.css';
 

function CreatePostPage() {
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [format, setFormat] = useState('image');
 
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const followerCount = useMemo(() => user?.followers?.length || user?.followersCount || 0, [user]);
  const category = user?.category || '';
  const isTestLive = user?.username === 'test_live';

  const canLive = followerCount >= 1000 || isTestLive;
  const canAudio = followerCount >= 1000 || isTestLive;
  const canExclusive = followerCount >= 100000;
  const canPartnership = followerCount >= 100000 || ['Professionnel', 'Partenaire'].includes(category);

  // Lire format depuis l'URL (?format=live) au chargement
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qFormat = params.get('format');
    if (qFormat && ['image','short','text','live','audio','exclusive','partnership'].includes(qFormat)) {
      if (qFormat === 'live' && !canLive) return; // ne force pas si verrouillé
      handleFormatChange(qFormat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, canLive]);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limite de taille côté client pour éviter les 500 (100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('Fichier trop volumineux (max 100MB)');
        setMedia(null);
        setMediaPreview('');
        return;
      }
      setMedia(file);
      setType(file.type.startsWith('image/') ? 'image' : 'video');
      setFormat(file.type.startsWith('image/') ? 'image' : 'short');
      try {
        const url = URL.createObjectURL(file);
        setMediaPreview(url);
      } catch (err) {
        console.warn('Preview video/image impossible', err);
        setMediaPreview('');
      }
    }
  };

  useEffect(() => () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
  }, [mediaPreview]);

  const handleFormatChange = (value) => {
    setFormat(value);
    if (value === 'image') setType('image');
    if (value === 'short') setType('video');
    if (value === 'text') setType('text');
    if (value === 'exclusive') setType('text');
    if (value === 'partnership') setType('text');
    if (value === 'live') setType('text');
    if (value === 'audio') setType('text');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Le contenu ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('type', type);
      formData.append('format', format);
      formData.append('isExclusive', format === 'exclusive');
      formData.append('isPartnership', format === 'partnership');
      formData.append('isLive', format === 'live');
      formData.append('isAudio', format === 'audio');

      if (media) {
        formData.append('media', media);
        formData.append('caption', caption);
      }

      if (tags) {
        const tagsArray = tags.split(',').map((t) => t.trim()).filter((t) => t);
        formData.append('tags', JSON.stringify(tagsArray));
      }

      await api.post('/posts', formData);

      navigate('/feed');
    } catch (err) {
      const apiMessage = err.response?.data?.message || err.response?.data?.error;
      const status = err.response?.status;
      if (apiMessage?.toLowerCase().includes('large') || status === 413) {
        setError('Fichier trop volumineux côté serveur. Essayez < 100MB.');
      } else {
        setError(apiMessage ? `Erreur serveur (${status || '500'}): ${apiMessage}` : 'Erreur lors de la publication');
      }
      console.error('Publication échouée', err.response || err);
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <div className="create-post-page">
      <motion.div
        className="create-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <header className="create-header">
          <h1>Nouvelle publication</h1>
          <p>Fun / Création / Opportunités / Partenariats</p>
        </header>

        <div className="format-selector">
          <label>Format</label>
          <div className="format-grid">
            <button
              type="button"
              className={format === 'image' ? 'format-card active' : 'format-card'}
              onClick={() => handleFormatChange('image')}
            >
              <Image size={18} />
              <div>
                <p>Post visuel</p>
                <small>Image ou carrousel</small>
              </div>
            </button>
            <button
              type="button"
              className={format === 'short' ? 'format-card active' : 'format-card'}
              onClick={() => handleFormatChange('short')}
            >
              <Video size={18} />
              <div>
                <p>Vidéo courte</p>
                <small>5-90s, 9:16</small>
              </div>
            </button>
            <button
              type="button"
              className={format === 'text' ? 'format-card active' : 'format-card'}
              onClick={() => handleFormatChange('text')}
            >
              <div className="format-icon">📝</div>
              <div>
                <p>Post texte</p>
                <small>Idée / opinion</small>
              </div>
            </button>
            <button
              type="button"
              className={format === 'live' ? 'format-card active' : 'format-card'}
              onClick={() => canLive && handleFormatChange('live')}
              disabled={!canLive}
              title={canLive ? 'Live' : 'Réservé Bronze+'}
            >
              {!canLive && <Lock size={16} />}
              <div>
                <p>Live</p>
                <small>{canLive ? 'Interaction temps réel' : 'Bronze+ requis (1k+)'}</small>
              </div>
            </button>
            <button
              type="button"
              className={format === 'audio' ? 'format-card active' : 'format-card'}
              onClick={() => canAudio && handleFormatChange('audio')}
              disabled={!canAudio}
              title={canAudio ? 'Audio Room' : 'Réservé Bronze+'}
            >
              {!canAudio && <Lock size={16} />}
              <div>
                <p>Audio Room</p>
                <small>{canAudio ? 'Salon audio' : 'Bronze+ requis (1k+)'}</small>
              </div>
            </button>
            <button
              type="button"
              className={format === 'exclusive' ? 'format-card active' : 'format-card'}
              onClick={() => canExclusive && handleFormatChange('exclusive')}
              disabled={!canExclusive}
              title={canExclusive ? 'Exclusif' : 'Réservé Argent+'}
            >
              {!canExclusive && <Lock size={16} />}
              <div>
                <p>Contenu exclusif</p>
                <small>{canExclusive ? 'Accès abonnés' : 'Argent+ requis (100k+)'}</small>
              </div>
            </button>
            <button
              type="button"
              className={format === 'partnership' ? 'format-card active' : 'format-card'}
              onClick={() => canPartnership && handleFormatChange('partnership')}
              disabled={!canPartnership}
              title={canPartnership ? 'Partenariat' : 'Réservé Pro / Argent+'}
            >
              {!canPartnership && <Lock size={16} />}
              <div>
                <p>Partenariat</p>
                <small>{canPartnership ? 'Collab & sponsoring' : 'Pro ou 100k+ requis'}</small>
              </div>
            </button>
          </div>
        </div>

        <div className="create-guidelines">
          <div className="guideline-title">Cheat sheet publication (desktop)</div>
          <ul>
            <li>Zone texte visible : ~500-560 px de large</li>
            <li>Voir plus vers ~125 caractères affichés</li>
            <li>Image paysage : 1200 x 630 (ratio 1.91:1)</li>
            <li>Image carrée / carrousel : 1080 x 1080</li>
            <li>Vidéo carrée : 1080 x 1080 ; Vidéo paysage : 1280 x 720</li>
            <li>Astuce : design pour 500 px de large même en haute résolution</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          {error && <div className="create-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="content">Votre message</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="« Aujourd'hui, j'ai accepté de ne pas comprendre. Et ça m'a apaisé. »"
              maxLength={2000}
              rows={8}
              required
            />
            <small>{content.length}/2000 caractères</small>
          </div>

          <div className="form-group">
            <label>Médias (optionnel)</label>
            <div className="media-upload">
              <input
                type="file"
                id="media"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={handleMediaChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="media" className="media-upload-btn">
                <Image size={18} strokeWidth={1.5} />
                <Video size={18} strokeWidth={1.5} />
                {media ? media.name : 'Ajouter une image ou vidéo'}
              </label>
              {media && (
                <button
                  type="button"
                  onClick={() => { setMedia(null); setMediaPreview(''); setError(''); }}
                  className="btn-remove-media"
                >
                  Retirer
                </button>
              )}
            </div>
          </div>

          {media && (
            <>
              <div className="form-group">
                <label>Prévisualisation</label>
                {type === 'video' ? (
                  <video
                    style={{ width: '100%', maxHeight: 260, borderRadius: 12, background: '#0b1224' }}
                    src={mediaPreview}
                    controls
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    alt="Prévisualisation"
                    src={mediaPreview}
                    style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 12, background: '#f8f9fb' }}
                  />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="caption">Légende du média</label>
                <input
                  type="text"
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Une courte description..."
                  maxLength={200}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="tags">Tags (optionnel)</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="méditation, silence, gratitude (séparés par des virgules)"
            />
            <small>Ajoutez des mots-clés pour faciliter la découverte</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="btn-cancel"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-publish"
              disabled={loading || !content.trim()}
            >
              {loading ? 'Publication...' : 'Publier '}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default CreatePostPage;
