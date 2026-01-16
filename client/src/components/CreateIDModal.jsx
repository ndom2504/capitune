import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../utils/api';
import './CreateIDModal.css';

function CreateIDModal({ isOpen, onClose, onSuccess }) {
  const [category, setCategory] = useState('Régulier');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Régulier',
    'Créateur',
    'Professionnel'
  ];

  const interests_list = [
    'Technologie',
    'Arts',
    'Business',
    'Santé',
    'Éducation',
    'Sport',
    'Musique',
    'Littérature',
    'Voyages',
    'Cuisine',
    'Mode',
    'Design'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.put('/users/me', {
        category,
        bio,
        spiritualPath: interests
      });

      if (onSuccess) {
        onSuccess(response.data.user);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="create-id-modal"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Compléter votre profil</h2>
            <button onClick={onClose} className="modal-close" title="Fermer">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="id-form">
            {error && <div className="id-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="category">Quel est ton type de profil ?</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Régulier' && '👤 Régulier - Pour explorer et échanger'}
                    {cat === 'Créateur' && '🎨 Créateur - Pour partager vos créations'}
                    {cat === 'Professionnel' && '💼 Professionnel - Pour développer votre impact'}
                  </option>
                ))}
              </select>
              <small>Choisis le type qui te correspond le mieux</small>
            </div>

            <div className="form-group">
              <label htmlFor="bio">À propos de toi (optionnel)</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Quelques mots sur toi..."
                maxLength={300}
                rows={4}
              />
              <small>{bio.length}/300 caractères</small>
            </div>

            <div className="form-group">
              <label htmlFor="interests">Tes domaines d'intérêt (optionnel)</label>
              <select
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              >
                <option value="">Sélectionne un domaine...</option>
                {interests_list.map((interest) => (
                  <option key={interest} value={interest}>
                    {interest}
                  </option>
                ))}
              </select>
              <small>Tes domaines ou passions principales</small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-cancel"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-publish-id"
                disabled={loading}
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le profil ✨'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CreateIDModal;
