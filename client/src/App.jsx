import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import InviteFriends from './pages/InviteFriends';
import LiveBroadcastPage from './pages/LiveBroadcastPage';
import LiveViewerPage from './pages/LiveViewerPage';
import LiveEditorPage from './pages/LiveEditorPage';
import MonetizationPage from './pages/MonetizationPage';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorStudioNew from './pages/CreatorStudioNew';
import MarketplacePage from './pages/MarketplacePage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import AdvertiserDashboard from './pages/AdvertiserDashboard';
import CreatorOnboarding from './pages/CreatorOnboarding';
import SettingsPage from './pages/SettingsPage';
import InsidePage from './pages/InsidePage';
import CommunitiesPage from './pages/CommunitiesPage';
import EventsPage from './pages/EventsPage';

// Layout
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    );
  }
  
  return user ? <Navigate to="/feed" /> : children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          
          <Route element={<Layout />}>
            <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
            <Route path="/profile/:userId?" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/create" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />
            <Route path="/invite" element={<PrivateRoute><InviteFriends /></PrivateRoute>} />
            <Route path="/monetization" element={<PrivateRoute><MonetizationPage /></PrivateRoute>} />
            <Route path="/creator-dashboard" element={<PrivateRoute><CreatorDashboard /></PrivateRoute>} />
            <Route path="/creator-studio/new" element={<PrivateRoute><CreatorStudioNew /></PrivateRoute>} />
            <Route path="/creator-studio/:id/edit" element={<PrivateRoute><CreatorStudioNew /></PrivateRoute>} />
            <Route path="/marketplace" element={<PrivateRoute><MarketplacePage /></PrivateRoute>} />
            <Route path="/opportunities" element={<PrivateRoute><OpportunitiesPage /></PrivateRoute>} />
            <Route path="/advertiser-dashboard" element={<PrivateRoute><AdvertiserDashboard /></PrivateRoute>} />
            <Route path="/onboarding" element={<PrivateRoute><CreatorOnboarding /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="/inside" element={<PrivateRoute><InsidePage /></PrivateRoute>} />
            <Route path="/communities" element={<PrivateRoute><CommunitiesPage /></PrivateRoute>} />
            <Route path="/events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
          </Route>
          
          <Route path="/live/broadcast" element={<PrivateRoute><LiveBroadcastPage /></PrivateRoute>} />
          <Route path="/live/:postId" element={<PrivateRoute><LiveViewerPage /></PrivateRoute>} />
          <Route path="/live/editor/:postId" element={<PrivateRoute><LiveEditorPage /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
