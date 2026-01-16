import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './OnlineSidebar.css';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:3000';
const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="%23e5e7eb"/><circle cx="32" cy="24" r="12" fill="%23cbd5e1"/><path d="M12 54c0-11 9-18 20-18s20 7 20 18" fill="%23cbd5e1"/></svg>';
const resolveUrl = (url) => {
  if (!url) return DEFAULT_AVATAR;
  // Si c'est déjà une URL absolue, la retourner telle quelle
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Si c'est un chemin relatif, ajouter le host
  if (url.startsWith('/')) {
    return `${API_HOST}${url}`;
  }
  // Sinon, ajouter /uploads/
  return `${API_HOST}/uploads/${url}`;
};

const TABS = [
  { id: 'all', label: 'Contacts', icon: Activity },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'followers', label: 'Followers', icon: Heart },
  { id: 'partners', label: 'Partners', icon: Zap }
];

function OnlineSidebar() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [contactTarget, setContactTarget] = useState(null);
  const [contactMessage, setContactMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Format pour afficher l'heure
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return 'Offline';
  };

  // Charger les utilisateurs en ligne
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/users/online/${activeTab}`);
        setOnlineUsers(response.data || []);
      } catch (error) {
        console.error('Error loading online users:', error);
        setOnlineUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Compter les utilisateurs en ligne par tab
  const counts = useMemo(() => ({
    friends: onlineUsers.length,
    followers: onlineUsers.length,
    partners: onlineUsers.length
  }), [onlineUsers]);

  if (!user) return null;

  const CurrentIcon = TABS.find(t => t.id === activeTab)?.icon || Users;

  const sendContact = async () => {
    if (!contactTarget?._id || sending) return;
    try {
      setSending(true);
      await api.post('/inside/requests', {
        toUserId: contactTarget._id,
        intention: 'discussion',
        message: contactMessage.trim() || 'I would love to connect with you.'
      });
      setContactMessage('');
      setContactTarget(null);
      alert('Contact request sent. The user will get an Inside notification.');
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      console.error('Error sending contact request:', err);
      alert(apiMessage || 'Unable to send the request. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className={`online-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
        {!collapsed && <h3>Contacts</h3>}
      </div>

      {!collapsed && (
        <>
          <div className="sidebar-tabs">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="tab-label">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="sidebar-content">
            {loading ? (
              <div className="loading-skeleton">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton-item" />
                ))}
              </div>
            ) : onlineUsers.length === 0 ? (
              <div className="empty-state">
                <CurrentIcon size={32} strokeWidth={1.5} />
                <p>No one online</p>
              </div>
            ) : (
              <div className="users-list">
                <AnimatePresence mode="popLayout">
                  {onlineUsers.map((onlineUser, idx) => {
                    const source = onlineUser.user || onlineUser;
                    const displayName = (
                      source.fullName
                      || source.name
                      || source.displayName
                      || source.profile?.fullName
                      || source.settings?.fullName
                      || source.profile?.displayName
                      || source.settings?.displayName
                      || source.username
                      || source.handle
                      || source.email
                      || 'User'
                    ).toString().trim();
                    return (
                    <motion.div
                      key={onlineUser._id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.03 }}
                      className="user-item"
                      onClick={() => setContactTarget(onlineUser)}
                    >
                      <div className="user-avatar-wrapper">
                        {onlineUser.avatar ? (
                          <img 
                            src={resolveUrl(onlineUser.avatar)}
                            alt={displayName}
                            className="user-avatar"
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                          />
                        ) : (
                          <div className="user-avatar" style={{ background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                        )}
                        <div className="online-indicator" />
                      </div>
                      
                      <div className="user-info">
                                              <p className="user-name">{displayName}</p>
                        <span className="user-category">{onlineUser.category}</span>
                        <span className="last-seen">{formatTime(onlineUser.lastSeen)}</span>
                      </div>

                      <button className="user-action" title="Send a message">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </motion.div>
                  );})}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <small>{onlineUsers.length} en ligne</small>
          </div>
        </>
      )}

      {collapsed && (
        <div className="collapsed-view">
          <div className="collapsed-tabs">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`collapsed-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCollapsed(false);
                  }}
                  title={tab.label}
                >
                  <Icon size={20} strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {contactTarget && !collapsed && (
        <div className="contact-modal-backdrop" onClick={() => setContactTarget(null)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <h4>Contacter {contactTarget.fullName || contactTarget.displayName || contactTarget.username}</h4>
              <button className="close-btn" onClick={() => setContactTarget(null)}>×</button>
            </div>
            <div className="contact-modal-body">
              <label>Message (optionnel)</label>
              <textarea
                rows={3}
                placeholder="Présente ton intention en quelques mots…"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                maxLength={280}
              />
              <small>{contactMessage.length}/280</small>
            </div>
            <div className="contact-modal-actions">
              <button className="btn-secondary" onClick={() => setContactTarget(null)}>Annuler</button>
              <button className="btn-primary" onClick={sendContact} disabled={sending}>
                {sending ? 'Envoi…' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default OnlineSidebar;
