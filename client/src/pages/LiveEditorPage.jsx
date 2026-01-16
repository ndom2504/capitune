import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Upload, Edit3, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './LiveEditorPage.css';

function LiveEditorPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const res = await api.get(`/posts/${postId}`);
      setPost(res.data);
      setTitle(res.data.content || '');
      setDescription(res.data.description || '');
      setTags(res.data.tags?.join(', ') || '');
      
      // Calculer les statistiques
      const startedAt = new Date(res.data.createdAt);
      const endedAt = res.data.endedAt ? new Date(res.data.endedAt) : new Date();
      const duration = Math.floor((endedAt - startedAt) / 1000); // en secondes
      
      setStats({
        peakViewers: res.data.metrics?.peakViewers || 0,
        totalViews: res.data.metrics?.views || 0,
        comments: res.data.comments?.length || 0,
        likes: res.data.likes?.length || 0,
        shares: res.data.shares?.length || 0,
        duration: duration,
        startedAt: startedAt,
        endedAt: endedAt
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur chargement Live:', err);
      navigate('/feed');
    }
  };

  const publishLive = async () => {
    if (!title.trim()) {
      alert('Donnez un titre à votre Live');
      return;
    }

    setPublishing(true);
    try {
      await api.put(`/posts/${postId}/publish`, {
        content: title,
        description: description,
        tags: tags.split(',').map(t => t.trim()).filter(t => t)
      });
      navigate('/feed');
    } catch (err) {
      console.error('Erreur publication:', err);
      alert('Impossible de publier le Live');
      setPublishing(false);
    }
  };

  const deleteLive = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce Live ?')) {
      return;
    }

    try {
      await api.delete(`/posts/${postId}`);
      navigate('/feed');
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Impossible de supprimer le Live');
    }
  };

  if (loading) {
    return (
      <div className="live-editor-loading">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="live-editor-page">
      <div className="editor-container">
        <div className="editor-header">
          <h1>Montage de votre Live</h1>
          <p>Personnalisez votre Live avant de le publier dans le fil</p>
        </div>

        <div className="editor-content">
          <div className="editor-preview">
            {stats && (
              <div className="live-stats">
                <h3>📊 Performances du Live</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <div className="stat-value">{stats.peakViewers}</div>
                      <div className="stat-label">Pic de spectateurs</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">👁️</div>
                    <div className="stat-info">
                      <div className="stat-value">{stats.totalViews}</div>
                      <div className="stat-label">Vues totales</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">💬</div>
                    <div className="stat-info">
                      <div className="stat-value">{stats.comments}</div>
                      <div className="stat-label">Commentaires</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-info">
                      <div className="stat-value">{stats.likes}</div>
                      <div className="stat-label">Résonances</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-info">
                      <div className="stat-value">{stats.shares}</div>
                      <div className="stat-label">Partages</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-info">
                      <div className="stat-value">{Math.floor(stats.duration / 60)}:{(stats.duration % 60).toString().padStart(2, '0')}</div>
                      <div className="stat-label">Durée</div>
                    </div>
                  </div>
                </div>
                <div className="live-timeline">
                  <div className="timeline-item">
                    <span>🟢 Démarré</span>
                    <span>{stats.startedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="timeline-item">
                    <span>🔴 Terminé</span>
                    <span>{stats.endedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="editor-preview">
            <div className="preview-box">
              <div className="preview-badge">Aperçu</div>
              <div className="preview-info">
                <div className="preview-author">
                  <div className="author-avatar">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="author-name">{user?.username}</div>
                </div>
                <div className="preview-title">{title || 'Sans titre'}</div>
                {description && (
                  <div className="preview-description">{description}</div>
                )}
                <div className="preview-stats">
                  <span>🔴 Live terminé</span>
                  <span>• {new Date(post?.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="editor-form">
            <div className="form-group">
              <label>
                <Edit3 size={16} />
                Titre du Live
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Donnez un titre accrocheur..."
                maxLength={100}
              />
              <span className="char-count">{title.length}/100</span>
            </div>

            <div className="form-group">
              <label>
                <Edit3 size={16} />
                Description (optionnelle)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre Live en quelques mots..."
                rows={4}
                maxLength={500}
              />
              <span className="char-count">{description.length}/500</span>
            </div>

            <div className="form-group">
              <label>
                <Tag size={16} />
                Tags (optionnels)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tech, gaming, musique (séparés par des virgules)"
              />
              <span className="hint">Les tags aident à la découverte de votre contenu</span>
            </div>

            <div className="editor-actions">
              <button 
                className="btn-publish"
                onClick={publishLive}
                disabled={publishing || !title.trim()}
              >
                <Upload size={18} />
                {publishing ? 'Publication...' : 'Publier le Live'}
              </button>
              <button 
                className="btn-delete"
                onClick={deleteLive}
                disabled={publishing}
              >
                <Trash2 size={18} />
                Supprimer
              </button>
            </div>

            <div className="editor-note">
              <p>💡 <strong>Astuce :</strong> Un bon titre et une description claire augmentent l'engagement de votre Live.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveEditorPage;
