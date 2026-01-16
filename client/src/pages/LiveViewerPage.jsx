import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, Share2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './LiveViewerPage.css';

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

function LiveViewerPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    loadPost();
    const interval = setInterval(loadComments, 2000);
    return () => clearInterval(interval);
  }, [postId]);

  const loadPost = async () => {
    try {
      const res = await api.get(`/posts/${postId}`);
      setPost(res.data);
      setHasLiked(res.data.likes?.some(l => l.userId === user?._id));
      setViewerCount(Math.floor(Math.random() * 50) + 10);
    } catch (err) {
      console.error('Erreur chargement Live:', err);
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Erreur chargement commentaires:', err);
    }
  };

  const emojis = ['❤️', '🔥', '👏', '😂', '😮', '👍', '🎉', '💯'];

  const addEmoji = (emoji) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const sendComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post(`/posts/${postId}/comment`, { content: newComment });
      setNewComment('');
      setShowEmojiPicker(false);
      loadComments();
    } catch (err) {
      console.error('Erreur envoi commentaire:', err);
    }
  };

  const toggleLike = async () => {
    try {
      await api.post(`/posts/${postId}/like`);
      setHasLiked(!hasLiked);
      loadPost();
    } catch (err) {
      console.error('Erreur like:', err);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/live/${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.content || 'Live sur Capitune',
          url
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          alert('Lien copié !');
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Lien copié !');
    }
  };

  if (!post) return null;

  return (
    <div className="live-viewer-page">
      <button className="close-live-btn" onClick={() => navigate('/feed')}>
        <X size={24} />
      </button>

      <div className="viewer-container">
        <div className="viewer-main">
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="live-video"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231a1a1a'/%3E%3C/svg%3E"
            />
            <div className="live-badge">
              <span className="live-pulse" />
              EN DIRECT
            </div>
            <div className="viewer-stats">
              <span>{viewerCount} spectateurs</span>
            </div>
            <div className="live-info">
              <div className="author-info">
                <div className="author-avatar">
                  {(displayName(post.author) || 'U')[0]?.toUpperCase()}
                </div>
                <div className="author-details">
                  <div className="author-name">{displayName(post.author)}</div>
                  <div className="live-title">{post.content}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="viewer-actions">
            <button
              className={`action-btn ${hasLiked ? 'liked' : ''}`}
              onClick={toggleLike}
            >
              <Heart size={20} fill={hasLiked ? '#e74c3c' : 'none'} />
              <span>{post.likes?.length || 0}</span>
            </button>
            <button className="action-btn">
              <MessageCircle size={20} />
              <span>{comments.length}</span>
            </button>
            <button className="action-btn" onClick={handleShare}>
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="viewer-chat">
          <div className="chat-messages">
            {comments.map((c) => (
              <div key={c._id} className="chat-msg">
                <span className="msg-author">{displayName(c.author)}</span>
                <span className="msg-text">{c.content}</span>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="chat-empty">Soyez le premier à commenter</div>
            )}
          </div>
          {post.isLive && (
            <div className="chat-composer-container">
              {showEmojiPicker && (
                <div className="emoji-picker-viewer">
                  {emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      className="emoji-btn"
                      onClick={() => addEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <div className="chat-composer">
                <button
                  className="emoji-toggle-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Emojis"
                >
                  😊
                </button>
                <input
                  type="text"
                  placeholder="Ajouter un commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendComment();
                    }
                  }}
                />
                <button onClick={sendComment}>Envoyer</button>
              </div>
            </div>
          )}
          {!post.isLive && (
            <div className="live-ended">Ce Live est terminé</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveViewerPage;
