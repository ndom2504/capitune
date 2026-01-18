import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { msalInstance, loginRequest } from '../config/microsoft';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.warn('⚠️ Cannot set persistence, continue anyway:', err?.message);
      }
      await handleMicrosoftRedirect();
      const handledGoogle = await handleGoogleRedirect();
      if (!handledGoogle) {
        await checkAuth();
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleMicrosoftRedirect = async () => {
    try {
      await msalInstance.initialize();
      const response = await msalInstance.handleRedirectPromise();

      if (response && response.account) {
        if (localStorage.getItem('token')) {
          return;
        }

        const accessTokenRequest = {
          ...loginRequest,
          account: response.account
        };

        const tokenResponse = await msalInstance.acquireTokenSilent(accessTokenRequest);

        const backendResponse = await api.post('/auth/microsoft', {
          accessToken: tokenResponse.accessToken
        });

        localStorage.setItem('token', backendResponse.data.token);
        setToken(backendResponse.data.token);
        setUser(backendResponse.data.user);
        try { window.location.assign('/feed'); } catch (_) {}
      }
    } catch (error) {
      console.error('Erreur traitement redirect Microsoft:', error);
    }
  };

  const handleGoogleRedirect = async () => {
    try {
      console.log('🔍 Checking Google redirect result...');
      const result = await getRedirectResult(auth);
      console.log('🔍 Google redirect result:', result);
      if (result?.user) {
        console.log('✅ Google user found:', result.user.email);
        if (localStorage.getItem('token')) {
          console.log('⏭️ Token already exists, skipping');
          return true;
        }
        const idToken = await result.user.getIdToken();
        console.log('📤 Posting idToken to /auth/google...');
        const response = await api.post('/auth/google', { idToken });
        console.log('✅ Auth response:', response.data);
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
        try { window.location.assign('/feed'); } catch (_) {}
        return true;
      } else {
        console.log('❌ No Google user in redirect result');
      }
    } catch (error) {
      console.error('❌ Erreur traitement redirect Google:', error);
    }
    return false;
  };

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    console.log('🔐 checkAuth - storedToken:', storedToken ? '✅ Found' : '❌ Not found');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Making request to /users/me with baseURL:', api.defaults.baseURL);
      const response = await api.get('/users/me');
      console.log('✅ /users/me response:', response.data);
      setUser(response.data.user);
      setToken(storedToken);
    } catch (error) {
      console.error('❌ /users/me failed:', error.response?.status, error.message);
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    try { window.location.assign('/feed'); } catch (_) {}
    return response.data;
  };

  const register = async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    try { window.location.assign('/feed'); } catch (_) {}
    return response.data;
  };

  const loginWithGoogle = async () => {
    // Utilise directement le mode redirect pour éviter les bloqueurs / fermetures de popups
    console.log('🔵 Google auth via redirect...');
    await signInWithRedirect(auth, googleProvider);
    // Le résultat sera traité dans handleGoogleRedirect()
  };

  const loginWithMicrosoft = async () => {
    try {
      await msalInstance.initialize();
      await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Erreur connexion Microsoft:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Erreur déconnexion Firebase:', error);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      loginWithGoogle,
      loginWithMicrosoft,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
