import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ShareModal from './ShareModal';
import PostQualityBadge from './PostQualityBadge';
import './PostCard.css';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:3000';
const resolveUrl = (url) => (url?.startsWith('/uploads') ? `${API_HOST}${url}` : url);
const displayName = (entity) => {
  if (!entity) return 'Utilisateur';
  const source = entity.user || entity.profile || entity;
  const name = source.fullName
    || source.name
    || source.displayName
    || source.profile?.fullName
    || source.settings?.fullName
    || source.profile?.displayName
    || source.settings?.displayName
    || source.username
    || source.handle
    || source.userName
    || source.email;
  return (name || 'Utilisateur').toString().trim();
};

function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
  const quickEmojis = ['😀', '🤔', '👏', '🔥', '❤️', '🙌', '🤝', '💡'];

  const handleLike = async () => {
    try {
      const response = await api.post(`/posts/${post._id}/like`);
      setIsLiked(response.data.liked);
      
      const updatedPost = {
        ...post,
        likes: response.data.liked 
          ? [...post.likes, user._id]
          : post.likes.filter(id => id !== user._id)
      };
      onUpdate(post._id, updatedPost);
    } catch (error) {
      console.error('Erreur like:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await api.post(`/posts/${post._id}/comment`, { content: comment });
      const updatedPost = {
        ...post,
        comments: [...post.comments, response.data.comment]
      };
      onUpdate(post._id, updatedPost);
      setComment('');
    } catch (error) {
      console.error('Erreur commentaire:', error);
    }
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) {
      return;
    }

    try {
      await api.delete(`/posts/${post._id}`);
      onDelete(post._id);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return 'à l\'instant';
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)}j`;
    
    return postDate.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <motion.article 
      className="post-card"
      layout
      transition={{ duration: 0.3 }}
    >
      <div className="post-header">
        <Link to={`/profile/${post.author._id}`} className="post-author">
          <div className="author-avatar">
            {post.author.avatar ? (
              <img src={resolveUrl(post.author.avatar)} alt={displayName(post.author)} />
            ) : (
              <div className="avatar-placeholder">
                {(displayName(post.author) || '?')[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="author-info">
            <span className="author-name">{displayName(post.author)}</span>
            {post.author.spiritualPath && (
              <span className="author-path">{post.author.spiritualPath}</span>
            )}
          </div>
        </Link>
        
        <div className="post-meta">
          <span className="post-date">{formatDate(post.createdAt)}</span>
          {post.author._id === user?._id && (
            <button onClick={handleDelete} className="btn-delete" title="Supprimer">
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      <div className="post-content">
        <PostQualityBadge post={post} />
        <p>{post.content}</p>
        
        {post.media?.url && (
          <div className="post-media">
            {post.type === 'image' ? (
              <img src={resolveUrl(post.media.url)} alt={post.media.caption || ''} />
            ) : post.type === 'video' ? (
              <video controls>
                <source src={resolveUrl(post.media.url)} type="video/mp4" />
              </video>
            ) : null}
            {post.media.caption && (
              <p className="media-caption">{post.media.caption}</p>
            )}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="post-actions">
        <button 
          onClick={handleLike} 
          className={`action-btn ${isLiked ? 'active' : ''}`}
          title="Marquer comme pertinent"
        >
          <Heart size={18} strokeWidth={1.5} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="action-label">{isLiked ? 'Pertinent' : 'Pertinence'}</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)} 
          className="action-btn"
          title="Engager une discussion"
        >
          <MessageCircle size={18} strokeWidth={1.5} />
          <span className="action-label">Discussion</span>
        </button>

        <button 
          onClick={handleShare} 
          className="action-btn"
          title="Partager avec votre réseau"
        >
          <Share2 size={18} strokeWidth={1.5} />
          <span className="action-label">Partager</span>
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div 
            className="post-comments"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleComment} className="comment-form">
              <div className="comment-input-row">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre réflexion..."
                  maxLength={500}
                />
                <button type="submit" disabled={!comment.trim()}>
                  Publier
                </button>
              </div>
              <div className="comment-emoji-bar" aria-label="Ajouter un emoji">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="emoji-btn"
                    onClick={() => setComment((prev) => `${(prev || '').slice(0, 480)}${emoji}`)}
                    title={`Ajouter ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </form>

            <div className="comments-list">
              {post.comments?.map((c, index) => (
                <div key={index} className="comment">
                  <Link to={`/profile/${c.author._id}`} className="comment-author">
                    {displayName(c.author)}
                  </Link>
                  <p>{c.content}</p>
                  <span className="comment-date">{formatDate(c.createdAt)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShare && (
          <ShareModal
            postId={post._id}
            postTitle={post.content.substring(0, 100)}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default PostCard;
