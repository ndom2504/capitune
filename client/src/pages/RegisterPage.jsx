import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './AuthPages.css';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('Régulier');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const navigate = useNavigate();

  const categories = ['Régulier', 'Créateur', 'Professionnel'];
  
  // Avatars prédéfinis (DiceBear)
  const avatarOptions = [
    'avataaars',
    'lorelei',
    'notionistai',
    'pixel-art',
    'personas',
    'bottts'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        username,
        email,
        password,
        category
      };
      await register(username, email, password, registrationData);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Google sign-in error');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignup = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithMicrosoft();
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Microsoft sign-in error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div 
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-header">
          <h1>Join <span className="auth-brand">Capitune</span></h1>
          <p>Connect with the world in English</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              placeholder="your_name"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Account Type</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="register-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'Régulier' && '👤 Explorer - Discover cultures & make friends'}
                  {cat === 'Créateur' && '🎨 Creator - Share your culture & creativity'}
                  {cat === 'Professionnel' && '💼 Global Professional - Build international connections'}
                </option>
              ))}
            </select>
            <small style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginTop: '0.5rem' }}>
              You can change this later in your profile
            </small>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-social-buttons">
          <button 
            onClick={handleGoogleSignup} 
            className="btn-social btn-google"
            disabled={loading}
            type="button"
            title="S'inscrire avec Google"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
          </button>

          <button 
            onClick={handleMicrosoftSignup} 
            className="btn-social btn-microsoft"
            disabled={loading}
            type="button"
            title="S'inscrire avec Microsoft"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="6" height="6" fill="#F25022"/>
              <rect x="10" y="2" width="6" height="6" fill="#7FBA00"/>
              <rect x="2" y="10" width="6" height="6" fill="#00A4EF"/>
              <rect x="10" y="10" width="6" height="6" fill="#FFB900"/>
            </svg>
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Already a member?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
