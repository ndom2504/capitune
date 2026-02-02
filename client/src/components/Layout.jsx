import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import HeaderBanner from './HeaderBanner';
import IDsShowcase from './IDsShowcase';
import OnlineSidebar from './OnlineSidebar';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Layout.css';

function Layout() {
  const { user } = useAuth();

  // Gérer le statut en ligne
  useEffect(() => {
    if (!user) return;

    // Mettre à jour au statut "en ligne"
    const markOnline = async () => {
      try {
        await api.post('/users/status/online');
      } catch (error) {
        console.error('Erreur mise à jour statut en ligne:', error);
      }
    };

    // Mettre à jour au statut "hors ligne" (avant départ)
    const markOffline = async () => {
      try {
        await api.post('/users/status/offline');
      } catch (error) {
        console.error('Erreur mise à jour statut hors ligne:', error);
      }
    };

    // Au montage : marquer en ligne
    markOnline();

    // Rafraîchir le statut en ligne toutes les 2 minutes
    const onlineInterval = setInterval(markOnline, 120000);

    // Au démontage ou avant départ : marquer hors ligne
    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(onlineInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  return (
    <div className="layout">
      <Navbar />
      <SearchBar />
      <HeaderBanner />
      <IDsShowcase />
      <div className="layout-wrapper">
        <main className="main-content">
          <Outlet />
        </main>
        <OnlineSidebar />
      </div>
    </div>
  );
}

export default Layout;
