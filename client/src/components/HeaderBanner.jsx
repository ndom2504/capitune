import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User as UserIcon, Radio } from 'lucide-react';
import CreateIDModal from './CreateIDModal';
import { useNavigate } from 'react-router-dom';
import './HeaderBanner.css';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:3000';
const resolveUrl = (url) => (url?.startsWith('/uploads') ? `${API_HOST}${url}` : url);
const getDisplayName = (u) => u?.fullName?.trim() || u?.username || 'User';

function HeaderBanner() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(user?.banner || null);
  const [hovering, setHovering] = useState(false);
  const [isIDModalOpen, setIsIDModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const fileInputRef = useRef(null);

  const followersCount = user?.followersCount || 0;
  const isBronze = followersCount >= 1000 || user?.username === 'test_live';

  useEffect(() => {
    if (user?.banner) {
      setBanner(user.banner);
    }
  }, [user?.banner]);

  useEffect(() => {
    // Reset avatar error when the user avatar changes
    setAvatarError(false);
  }, [user?.avatar]);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Valider le fichier
    if (!file.type.startsWith('image/')) {
      alert('Please select an image');
      return;
    }

    if (file.size > 5242880) { // 5MB
      alert('Image must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('banner', file);

    try {
      console.log('📤 Uploading banner...');
      const response = await api.put('/users/me/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('✅ Server response:', response.data);
      const newBanner = response.data.user.banner;
      console.log('🎨 New banner:', newBanner);
      setBanner(newBanner);
      console.log('Banner updated ✨');
      
      // Forcer le rechargement de l'image
      setTimeout(() => {
        setBanner(null);
        setTimeout(() => setBanner(newBanner), 50);
      }, 100);
    } catch (error) {
      console.error('❌ Banner upload error:', error);
      console.error('Details:', error.response?.data);
      alert('Error uploading banner');
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setHovering(true);
  };

  const handleDragLeave = () => {
    setHovering(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setHovering(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  if (!user) return null;

  const handleIDUpdate = (updatedUser) => {
    updateUser(updatedUser);
  };

  return (
    <div
      className={`header-banner ${hovering ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {banner ? (
        <div className="banner-image-wrapper">
          <img src={resolveUrl(banner)} alt="Bannière personnelle" />
          <div className="banner-overlay">
            <button
              className="banner-edit-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Change banner"
            >
              ✏️ Change
            </button>
          </div>
        </div>
      ) : (
        <div
          className="banner-placeholder"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          title="Click to add a banner"
        >
          <div className="placeholder-text">📸 Add your banner</div>
        </div>
      )}

      <div className="banner-profile-card">
        <div className="profile-avatar-block">
          <div
            className="profile-avatar-container"
            onClick={() => setIsIDModalOpen(true)}
            title="Edit my profile"
          >
            {user.avatar && !avatarError ? (
              <img
                src={resolveUrl(user.avatar)}
                alt=""
                className="profile-avatar"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="profile-avatar-placeholder" />
            )}
            {isBronze && <span className="level-badge" title="Bronze">🥉</span>}
          </div>
          <div className="profile-name" title={getDisplayName(user)}>
            {getDisplayName(user)}
          </div>
        </div>

        <div className="profile-stats-container">
          <div className="stat-item">
            <span className="stat-number">{followersCount}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{user.followingCount || 0}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>

        <div className="profile-actions">
          {isBronze && (
            <button
              className="live-btn"
              onClick={() => navigate('/live/broadcast')}
              title="Live"
            >
              <Radio size={18} />
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      <CreateIDModal
        isOpen={isIDModalOpen}
        onClose={() => setIsIDModalOpen(false)}
        onSuccess={handleIDUpdate}
      />
    </div>
  );
}

export default HeaderBanner;
