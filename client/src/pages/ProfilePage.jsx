import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Edit2, Users, Heart, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import CognitiveIndicators from '../components/CognitiveIndicators';
import ThemeExplorer from '../components/ThemeExplorer';
import './ProfilePage.css';
const API_HOST = import.meta.env.VITE_API_HOST || 'https://capitune-production.up.railway.app';
const resolveUrl = (url) => (url?.startsWith('/uploads') ? `${API_HOST}${url}` : url);

function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [spiritualPath, setSpiritualPath] = useState('');
  const [category, setCategory] = useState('Autre');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about'); // 'about', 'community'
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [partners, setPartners] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  const categories = ['Régulier', 'Créateur', 'Professionnel'];

  // Fonction pour calculer le badge basé sur le nombre d'abonnés
  const getBadge = (count) => {
    if (count >= 100000000) return { level: 'Platinium', icon: '💎', color: '#E5E4E2' };
    if (count >= 1000000) return { level: 'Or', icon: '🥇', color: '#FFD700' };
    if (count >= 100000) return { level: 'Argent', icon: '🥈', color: '#C0C0C0' };
    if (count >= 1000) return { level: 'Bronze', icon: '🥉', color: '#CD7F32' };
    return { level: 'Nouveau', icon: '⭐', color: '#9CA3AF' };
  };

  const badge = getBadge(followersCount);

  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const endpoint = isOwnProfile ? '/users/me' : `/users/${userId}`;
      const response = await api.get(endpoint);
      setProfile(response.data.user);
      setFollowersCount(response.data.user.followersCount || 0);
      setBio(response.data.user.bio || '');
      setSpiritualPath(response.data.user.spiritualPath || '');
      setCategory(response.data.user.category || 'Autre');
      setAvatarPreview(response.data.user.avatar ? resolveUrl(response.data.user.avatar) : '');
      // Déterminer si on suit déjà
      if (!isOwnProfile && currentUser?.followingIds) {
        setIsFollowing(currentUser.followingIds.includes(response.data.user._id));
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwnProfile && profile && currentUser?.followingIds) {
      setIsFollowing(currentUser.followingIds.includes(profile._id));
    }
  }, [currentUser, profile, isOwnProfile]);

  const loadCommunityData = async () => {
    if (!profile) return;
    setTabLoading(true);
    try {
      // Charger les abonnés et abonnements
      const profileId = isOwnProfile ? currentUser._id : profile._id;
      const response = await api.get(`/users/${profileId}`);
      
      if (response.data.user) {
        const user = response.data.user;
        setFollowers(user.followersData || []);
        setFollowing(user.followingData || []);
        setPartners(user.partnersData || []);
      }
    } catch (error) {
      console.error('Erreur chargement communauté:', error);
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'community') {
      loadCommunityData();
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || isOwnProfile || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await api.delete(`/users/${profile._id}/follow`);
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
        if (res.data?.me) {
          updateUser(res.data.me);
        }
      } else {
        const res = await api.post(`/users/${profile._id}/follow`);
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        if (res.data?.me) {
          updateUser(res.data.me);
        }
      }
    } catch (error) {
      console.error('Erreur suivi utilisateur:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      // Pour l'instant, nous n'avons pas de route spécifique pour les posts d'un utilisateur
      // On pourrait l'ajouter plus tard
    } catch (error) {
      console.error('Erreur chargement posts:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/users/me', { bio, spiritualPath, category });
      setProfile(response.data.user);
      updateUser(response.data.user);
      setEditing(false);
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);

    // Use FileReader so preview works even if blob URLs are blocked
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result || '');
    };
    reader.onerror = () => setAvatarPreview('');
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const response = await api.put('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(response.data.user);
      updateUser(response.data.user);
      setAvatarPreview(response.data.user.avatar ? resolveUrl(response.data.user.avatar) : '');
      setAvatarFile(null);
    } catch (error) {
      console.error('Erreur upload avatar:', error);
    }
  };

  if (loading) {
    return <div className="profile-loading">Chargement...</div>;
  }

  if (!profile) {
    return <div className="profile-error">Profil non trouvé</div>;
  }

  return (
    <div className="profile-page">
      <motion.div
        className="profile-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* En-tête principal */}
        <div className="profile-header">
          <div className="profile-main-info">
            <div className="profile-avatar-large">
              {avatarPreview || profile.avatar ? (
                <img src={avatarPreview || resolveUrl(profile.avatar)} alt={profile.fullName || profile.username} />
              ) : (
                <div className="avatar-placeholder-large">
                  <UserIcon size={48} strokeWidth={1.5} />
                </div>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-name-badge">
                <h1>{isOwnProfile ? (currentUser?.fullName || currentUser?.username) : (profile.fullName || profile.username)}</h1>
                <div className="profile-badge" style={{ backgroundColor: badge.color }} title={`Niveau ${badge.level}`}>
                  <span className="badge-icon">{badge.icon}</span>
                </div>
              </div>
              {profile.category && !editing && (
                <p className="profile-category">
                  {profile.category === 'Régulier' && '👤 Régulier'}
                  {profile.category === 'Créateur' && '🎨 Créateur'}
                  {profile.category === 'Professionnel' && '💼 Professionnel'}
                  {profile.category === 'Créateur de contenu' && '🎨 Créateur'}
                  {profile.category === 'Partenaire' && '💼 Professionnel'}
                </p>
              )}
              {profile.spiritualPath && !editing && (
                <p className="profile-path">{profile.spiritualPath}</p>
              )}
              <div className="profile-stats">
                <span><strong>{followersCount}</strong> abonnés</span>
                <span><strong>{profile.followingCount || 0}</strong> abonnements</span>
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <button 
              onClick={() => setEditing(!editing)}
              className="btn-edit-profile"
              title={editing ? "Annuler" : "Modifier le profil"}
              type="button"
            >
              <Edit2 size={18} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              className={`btn-follow ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {isFollowing ? 'Abonné' : 'S’abonner'}
            </button>
          )}
        </div>

        {/* Section Avatar */}
        {isOwnProfile && (
          <div className="profile-section profile-avatar-section">
            <h3 className="section-title">Photo de profil</h3>
            <div className="avatar-controls">
              <label className="btn-upload-avatar">
                Changer la photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>
              {avatarFile && (
                <button type="button" className="btn-save-avatar" onClick={handleAvatarUpload}>
                  Enregistrer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section Informations */}
        <div className="profile-section">
          <h3 className="section-title">Informations</h3>
          
          {editing ? (
            <motion.form 
              onSubmit={handleUpdateProfile}
              className="edit-profile-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="form-group">
                <label htmlFor="category">Type de compte</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'Régulier' && '👤 Compte Régulier (Fun)'}
                      {cat === 'Créateur de contenu' && '🎨 Créateur de contenu (Monétiseur)'}
                      {cat === 'Partenaire' && '💼 Partenaire (Professionnel)'}
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  • Régulier : Usage personnel et divertissement<br/>
                  • Créateur : Monétisation et création de contenu<br/>
                  • Partenaire : Collaborations professionnelles
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="spiritualPath">Chemin spirituel</label>
                <input
                  type="text"
                  id="spiritualPath"
                  value={spiritualPath}
                  onChange={(e) => setSpiritualPath(e.target.value)}
                  placeholder="Ex: Méditation zen, Yoga, Pleine conscience..."
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Biographie</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Partagez quelques mots sur votre parcours..."
                  maxLength={300}
                  rows={4}
                />
                <small>{bio.length}/300 caractères</small>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setEditing(false)} className="btn-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-save">
                  Enregistrer
                </button>
              </div>
            </motion.form>
          ) : (
            <div className="profile-info-display">
              {profile.category && (
                <div className="info-item">
                  <span className="info-label">Type de compte</span>
                  <p className="info-content">
                    {profile.category === 'Régulier' && '👤 Compte Régulier (Fun)'}
                    {profile.category === 'Créateur de contenu' && '🎨 Créateur de contenu (Monétiseur)'}
                    {profile.category === 'Partenaire' && '💼 Partenaire (Professionnel)'}
                  </p>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Niveau de compte</span>
                <div className="badge-progression">
                  <div className="badge-current" style={{ backgroundColor: badge.color }}>
                    <span className="badge-icon-large">{badge.icon}</span>
                    <div>
                      <p className="badge-name">{badge.level}</p>
                      <small className="badge-count">{followersCount.toLocaleString()} abonnés</small>
                    </div>
                  </div>
                  <div className="badge-levels">
                    <div className="level-item">⭐</div>
                    <div className="level-item">🥉</div>
                    <div className="level-item">🥈</div>
                    <div className="level-item">🥇</div>
                    <div className="level-item">💎</div>
                  </div>
                </div>
              </div>
              {profile.spiritualPath && (
                <div className="info-item">
                  <span className="info-label">Chemin spirituel</span>
                  <p className="info-content">{profile.spiritualPath}</p>
                </div>
              )}
              {profile.bio && (
                <div className="info-item">
                  <span className="info-label">Biographie</span>
                  <p className="info-content">{profile.bio}</p>
                </div>
              )}
              {!profile.bio && !profile.spiritualPath && isOwnProfile && (
                <p className="info-empty">Ajoutez une biographie et votre chemin spirituel pour personnaliser votre profil.</p>
              )}
            </div>
          )}
        </div>

        {/* Section Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="profile-section profile-badges-section">
            <h3 className="section-title">Badges</h3>
            <div className="badges-grid">
              {profile.badges.map((badge, idx) => (
                <div key={idx} className="badge-item" title={`${badge.label} - Obtenu le ${new Date(badge.earnedAt).toLocaleDateString('fr-FR')}`}>
                  <span className="badge-item-icon">{badge.icon}</span>
                  <span className="badge-item-label">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Croissance cognitive */}
        <CognitiveIndicators profile={profile} />

        {/* Section Explorations thématiques */}
        <ThemeExplorer profile={profile} />

        {/* Onglets */}
        <div className="profile-tabs-container">
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => handleTabChange('about')}
            >
              À propos
            </button>
            <button
              className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => handleTabChange('community')}
            >
              <Users size={18} strokeWidth={1.5} />
              Communauté
            </button>
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'about' && (
          <>
            {posts.length > 0 && (
              <div className="profile-posts">
                <h2>Publications</h2>
                <div className="posts-list">
                  {posts.map(post => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'community' && (
          <div className="community-section">
            {tabLoading ? (
              <div className="loading">Chargement...</div>
            ) : (
              <>
                {/* Abonnés */}
                <div className="community-subsection">
                  <h3 className="community-title">
                    <Heart size={20} strokeWidth={1.5} />
                    Abonnés ({followers.length})
                  </h3>
                  {followers.length === 0 ? (
                    <p className="empty-list">Aucun abonné pour le moment</p>
                  ) : (
                    <div className="users-grid">
                      {followers.map(user => (
                        <div key={user._id} className="community-user-card">
                          <div className="community-user-avatar">
                            {user.avatar ? (
                              <img src={resolveUrl(user.avatar)} alt={user.fullName || user.username} />
                            ) : (
                              <div className="avatar-placeholder">
                                <UserIcon size={24} strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <p className="community-user-name">{user.fullName || user.username}</p>
                          <span className="community-user-category">{user.category}</span>
                          <button className="community-action-btn">Voir le profil</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Abonnements */}
                <div className="community-subsection">
                  <h3 className="community-title">
                    <UserCheck size={20} strokeWidth={1.5} />
                    Abonnements ({following.length})
                  </h3>
                  {following.length === 0 ? (
                    <p className="empty-list">Aucun abonnement pour le moment</p>
                  ) : (
                    <div className="users-grid">
                      {following.map(user => (
                        <div key={user._id} className="community-user-card">
                          <div className="community-user-avatar">
                            {user.avatar ? (
                              <img src={resolveUrl(user.avatar)} alt={user.fullName || user.username} />
                            ) : (
                              <div className="avatar-placeholder">
                                <UserIcon size={24} strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <p className="community-user-name">{user.fullName || user.username}</p>
                          <span className="community-user-category">{user.category}</span>
                          <button className="community-action-btn">Voir le profil</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Partenaires */}
                {partners.length > 0 && (
                  <div className="community-subsection">
                    <h3 className="community-title">
                      <Users size={20} strokeWidth={1.5} />
                      Partenaires ({partners.length})
                    </h3>
                    <div className="users-grid">
                      {partners.map(user => (
                        <div key={user._id} className="community-user-card">
                          <div className="community-user-avatar">
                            {user.avatar ? (
                              <img src={resolveUrl(user.avatar)} alt={user.fullName || user.username} />
                            ) : (
                              <div className="avatar-placeholder">
                                <UserIcon size={24} strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <p className="community-user-name">{user.fullName || user.username}</p>
                          <span className="community-user-category">{user.category}</span>
                          <button className="community-action-btn">Voir le profil</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default ProfilePage;
