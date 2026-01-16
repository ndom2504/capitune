import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, X, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './LiveBroadcastPage.css';

function LiveBroadcastPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [stream, setStream] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liveId, setLiveId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mutedUsers, setMutedUsers] = useState(new Set());
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startPreview();
    return () => {
      stopStream();
    };
  }, []);

  const startPreview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Erreur accès caméra/micro:', err);
      alert('Impossible d\'accéder à la caméra/micro. Vérifiez les permissions.');
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const startLive = async () => {
    if (!title.trim()) {
      alert('Donnez un titre à votre Live');
      return;
    }

    try {
      const res = await api.post('/posts', {
        content: title,
        type: 'live',
        format: 'live',
        isLive: true
      });
      setLiveId(res.data.post._id);
      setIsLive(true);
    } catch (err) {
      console.error('Erreur démarrage Live:', err);
      alert('Impossible de démarrer le Live');
    }
  };

  const endLive = async () => {
    if (!liveId) {
      alert('Aucun Live actif');
      return;
    }

    try {
      await api.put(`/posts/${liveId}/end-live`);
      stopStream();
      navigate(`/live/editor/${liveId}`);
    } catch (err) {
      console.error('Erreur fin Live:', err);
      alert('Erreur lors de la fin du Live');
    }
  };

  const emojis = ['❤️', '🔥', '👏', '😂', '😮', '👍', '🎉', '💯'];

  const addEmoji = (emoji) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const sendComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      author: user?.username || 'Vous',
      content: newComment,
      timestamp: Date.now(),
      userId: 'broadcaster'
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const muteUser = (userId) => {
    setMutedUsers(prev => new Set([...prev, userId]));
  };

  const unmuteUser = (userId) => {
    setMutedUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const blockUser = async (userId) => {
    if (!confirm('Bloquer définitivement cet utilisateur ?')) return;
    setBlockedUsers(prev => new Set([...prev, userId]));
    setComments(prev => prev.filter(c => c.userId !== userId));
  };

  const reportUser = async (userId) => {
    if (!confirm('Signaler ce commentaire ?')) return;
    alert('Utilisateur signalé');
  };

  return (
    <div className="live-broadcast-page">
      <div className="broadcast-container">
        <div className="broadcast-main">
          <div className="video-preview">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="preview-video"
            />
            {!isLive && (
              <div className="preview-overlay">
                <h2>Prêt à passer en Live ?</h2>
                <input
                  type="text"
                  placeholder="Titre de votre Live..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="live-title-input"
                  maxLength={100}
                />
              </div>
            )}
            {isLive && (
              <div className="live-indicator">
                <span className="live-dot" />
                EN DIRECT
              </div>
            )}
            <div className="viewer-count">
              <Users size={16} />
              <span>{viewerCount}</span>
            </div>
          </div>

          <div className="broadcast-controls">
            <button
              className={`control-btn ${!videoEnabled ? 'disabled' : ''}`}
              onClick={toggleVideo}
              title={videoEnabled ? 'Désactiver caméra' : 'Activer caméra'}
            >
              {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button
              className={`control-btn ${!audioEnabled ? 'disabled' : ''}`}
              onClick={toggleAudio}
              title={audioEnabled ? 'Couper micro' : 'Activer micro'}
            >
              {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            {!isLive ? (
              <button className="start-live-btn" onClick={startLive}>
                Démarrer le Live
              </button>
            ) : (
              <button className="end-live-btn" onClick={endLive}>
                <X size={18} />
                Terminer
              </button>
            )}
          </div>
        </div>

        <div className="live-chat">
          <div className="chat-header">
            <h3>Chat en direct</h3>
          </div>
          <div className="chat-messages">
            {comments.filter(c => !blockedUsers.has(c.userId)).map((c, idx) => (
              <div key={idx} className="chat-message">
                <div className="message-header">
                  <span className="chat-author">{c.author}</span>
                  {c.userId !== 'broadcaster' && (
                    <div className="message-controls">
                      {mutedUsers.has(c.userId) ? (
                        <button onClick={() => unmuteUser(c.userId)} title="Réactiver">
                          🔊
                        </button>
                      ) : (
                        <button onClick={() => muteUser(c.userId)} title="Rendre muet">
                          🔇
                        </button>
                      )}
                      <button onClick={() => blockUser(c.userId)} title="Bloquer">
                        🚫
                      </button>
                      <button onClick={() => reportUser(c.userId)} title="Signaler">
                        ⚠️
                      </button>
                    </div>
                  )}
                </div>
                <span className="chat-content">{c.content}</span>
                {mutedUsers.has(c.userId) && (
                  <span className="muted-badge">🔇 Muet</span>
                )}
              </div>
            ))}
            {comments.length === 0 && (
              <div className="chat-empty">Les commentaires apparaîtront ici</div>
            )}
          </div>
          {isLive && (
            <div className="chat-input-container">
              {showEmojiPicker && (
                <div className="emoji-picker">
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
              <div className="chat-input">
                <button
                  className="emoji-toggle"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Emojis"
                >
                  😊
                </button>
                <input
                  type="text"
                  placeholder="Répondre aux spectateurs..."
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
        </div>
      </div>
    </div>
  );
}

export default LiveBroadcastPage;
