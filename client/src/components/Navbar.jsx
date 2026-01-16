// Ancienne barre de recherche supprimée (utiliser la grande en dessous)
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, PenLine, User, LogOut, Search, MessageCircle, UserPlus, BarChart3, LineChart, PieChart, ShoppingBag, Settings, Users, Calendar } from 'lucide-react';
import NotificationBell from './NotificationBell';
import api from '../utils/api';
import './Navbar.css';

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

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingInsideCount, setPendingInsideCount] = useState(0);

  const followersCount = user?.followersCount || 0;
  const isCreator = followersCount >= 1000 || user?.username === 'test_live';
  const canSeeMarketplace = isCreator; // ouvrir la marketplace à tous les créateurs Bronze+
  const isAdvertiser = user?.category === 'Partenaire' || user?.category === 'Professionnel';
  const showOnboarding = user && !isCreator; // simple heuristique pour relancer onboarding

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Recherche déplacée dans la grande barre sous la navbar

  useEffect(() => {
    let isMounted = true;

    const loadPending = async () => {
      try {
        const response = await api.get('/inside/requests?status=pending');
        if (!isMounted) return;
        const count = response.data?.requests?.length || 0;
        setPendingInsideCount(count);
      } catch (error) {
        console.error('Erreur chargement demandes Inside:', error);
      }
    };

    loadPending();
    const interval = setInterval(loadPending, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/feed" className="navbar-brand">
          <span className="navbar-logo-text">Capitune</span>
        </Link>

        <div className="navbar-links">
          <Link to="/feed" className="navbar-link" title="World Square">
            <Home size={20} strokeWidth={1.5} />
          </Link>
          
          {showOnboarding && (
            <Link to="/onboarding" className="navbar-link" title="Creator onboarding">
              <User size={20} strokeWidth={1.5} />
            </Link>
          )}
          
          <Link to="/invite" className="navbar-link" title="Invite friends">
            <UserPlus size={20} strokeWidth={1.5} />
          </Link>
          
          <Link to="/communities" className="navbar-link" title="Communities">
            <Users size={20} strokeWidth={1.5} />
          </Link>
          
          <Link to="/events" className="navbar-link" title="Events & Lives">
            <Calendar size={20} strokeWidth={1.5} />
          </Link>
          
          {isCreator && (
            <Link to="/creator-dashboard" className="navbar-link navbar-creator" title="Creator Dashboard">
              <LineChart size={20} strokeWidth={1.5} />
            </Link>
          )}

          {canSeeMarketplace && (
            <Link to="/marketplace" className="navbar-link" title="Advertiser Marketplace">
              <ShoppingBag size={20} strokeWidth={1.5} />
            </Link>
          )}

          {isAdvertiser && (
            <Link to="/advertiser-dashboard" className="navbar-link" title="Advertiser Dashboard">
              <PieChart size={20} strokeWidth={1.5} />
            </Link>
          )}
          
          <Link to="/inside" className="navbar-link navbar-inside" title="Inside - Conversations">
            <MessageCircle size={20} strokeWidth={1.5} />
            {pendingInsideCount > 0 && (
              <span className="navbar-inside-badge">{pendingInsideCount}</span>
            )}
          </Link>
          
          <NotificationBell />
          
          <div className="navbar-avatar-wrapper">
            <Link to="/profile" className="navbar-avatar" title="My profile">
              {user?.avatar ? (
                <img 
                  src={resolveUrl(user.avatar)} 
                  alt={user.fullName || user.username}
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className="avatar-placeholder" style={{ display: user?.avatar ? 'none' : 'flex' }}>
                <User size={18} strokeWidth={1.5} />
              </div>
            </Link>
            <Link to="/settings" className="navbar-settings-chip" title="Settings" aria-label="Settings">
              <Settings size={14} strokeWidth={1.5} />
            </Link>
          </div>
          
          <button onClick={handleLogout} className="navbar-link navbar-logout" title="Sign out">
            <LogOut size={20} strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
