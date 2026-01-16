import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Copy,
  Mail,
  MessageCircle,
  Share2,
  Facebook,
  Twitter,
  Send,
  Zap,
  Share,
} from 'lucide-react';
import './ShareModal.css';

function ShareModal({ postId, postTitle, onClose }) {
  const [copied, setCopied] = useState(false);
  const [useNativeShare, setUseNativeShare] = useState(false);
  
  useEffect(() => {
    // Vérifier si l'API Web Share est disponible
    if (navigator.share) {
      setUseNativeShare(true);
    }
  }, []);
  
  const shareLink = `${window.location.origin}/post/${postId}`;
  const encodedLink = encodeURIComponent(shareLink);
  const encodedText = encodeURIComponent(`${postTitle || 'Découvrez cette publication'} - Capitune`);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Capitune',
          text: `${postTitle || 'Découvrez cette publication'} - Capitune`,
          url: shareLink
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.log('Erreur partage:', error);
      }
    }
  };

  const shareOptions = [
    {
      id: 'copy',
      label: 'Copier le lien',
      icon: Copy,
      action: handleCopyLink,
      color: '#6B7280',
      category: 'direct'
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      action: () => window.open(`mailto:?subject=${encodedText}&body=${encodedLink}`),
      color: '#EA4335',
      category: 'messaging'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      action: () => {
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = `whatsapp://send?text=${encodedText}%20${encodedLink}`;
        } else {
          window.open(`https://wa.me/?text=${encodedText}%20${encodedLink}`);
        }
      },
      color: '#25D366',
      category: 'messaging'
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: Send,
      action: () => {
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = `tg://msg?text=${encodedText}%20${encodedLink}`;
        } else {
          window.open(`https://t.me/share/url?url=${encodedLink}&text=${encodedText}`);
        }
      },
      color: '#0088cc',
      category: 'messaging'
    },
    {
      id: 'teams',
      label: 'Microsoft Teams',
      icon: Zap,
      action: () => window.open(`https://teams.microsoft.com/share?url=${encodedLink}`),
      color: '#6264A7',
      category: 'messaging'
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`),
      color: '#1877F2',
      category: 'social'
    },
    {
      id: 'twitter',
      label: 'Twitter / X',
      icon: Twitter,
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`),
      color: '#1DA1F2',
      category: 'social'
    },
  ];

  return (
    <motion.div
      className="share-modal-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="share-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="share-modal-header">
          <h2>Partager cette publication</h2>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="share-link-section">
          <label>Lien de partage</label>
          <div className="share-link-input">
            <input type="text" value={shareLink} readOnly />
            <button onClick={handleCopyLink} className={`btn-copy ${copied ? 'copied' : ''}`}>
              <Copy size={16} />
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        </div>

        {useNativeShare && (
          <div className="native-share-section">
            <button onClick={handleNativeShare} className="btn-native-share">
              <Share size={18} />
              Partager intelligemment (selon vos apps)
            </button>
          </div>
        )}

        <div className="share-options">
          <h3>Ou choisir un canal</h3>
          <div className="options-grid">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  className="share-option-btn"
                  onClick={option.action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={option.label}
                  style={{ '--option-color': option.color }}
                >
                  <div className="option-icon">
                    <Icon size={20} />
                  </div>
                  <span>{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="share-modal-footer">
          <p className="share-hint">💡 Partagez pour amplifier les vibrations positives ✨</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ShareModal;
