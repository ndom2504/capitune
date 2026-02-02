import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, Upload, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './InviteFriends.css';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:3000';
const resolveUrl = (url) => (url?.startsWith('/uploads') ? `${API_HOST}${url}` : url);

function InviteFriends() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contacts, setContacts] = useState([]);
  const [foundUsers, setFoundUsers] = useState([]);
  const [notFoundContacts, setNotFoundContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [phoneUpdateLoading, setPhoneUpdateLoading] = useState(false);

  // Mettre à jour le numéro de téléphone de l'utilisateur
  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setPhoneUpdateLoading(true);
    try {
      await api.put('/contacts/me/phone', { phoneNumber });
      alert('Numéro de téléphone mis à jour ✨');
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setPhoneUpdateLoading(false);
    }
  };

  // Parser un fichier VCF (vCard) simple
  const parseVCF = (text) => {
    const contacts = [];
    const vcards = text.split('END:VCARD');
    
    vcards.forEach(vcard => {
      if (!vcard.includes('BEGIN:VCARD')) return;
      
      let name = '';
      let phone = '';
      
      const lines = vcard.split('\n');
      lines.forEach(line => {
        if (line.startsWith('FN:')) {
          name = line.replace('FN:', '').trim();
        } else if (line.startsWith('TEL') || line.startsWith('tel')) {
          phone = line.split(':')[1]?.trim() || '';
        }
      });
      
      if (name && phone) {
        contacts.push({ name, phoneNumber: phone });
      }
    });
    
    return contacts;
  };

  // Upload d'un fichier de contacts
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      let parsedContacts = [];

      if (file.name.endsWith('.vcf')) {
        parsedContacts = parseVCF(text);
      } else if (file.name.endsWith('.csv')) {
        // Parser CSV simple (nom,numéro)
        const lines = text.split('\n').slice(1); // Skip header
        parsedContacts = lines
          .map(line => {
            const [name, phone] = line.split(',');
            return name && phone ? { name: name.trim(), phoneNumber: phone.trim() } : null;
          })
          .filter(Boolean);
      }

      setContacts(parsedContacts);
      alert(`${parsedContacts.length} contacts importés`);
    } catch (error) {
      alert('Erreur lors de la lecture du fichier');
    } finally {
      setLoading(false);
    }
  };

  // Synchroniser les contacts avec le serveur
  const handleSyncContacts = async () => {
    if (contacts.length === 0) {
      alert('Aucun contact à synchroniser');
      return;
    }

    setSyncing(true);
    try {
      const response = await api.post('/contacts/sync', { contacts });
      setFoundUsers(response.data.found);
      setNotFoundContacts(response.data.notFound);
    } catch (error) {
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  // Suivre un utilisateur trouvé
  const handleFollow = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setFoundUsers(prev => prev.filter(f => f.user._id !== userId));
    } catch (error) {
      console.error('Erreur suivi:', error);
    }
  };

  return (
    <div className="invite-friends-page">
      <div className="invite-container">
        <div className="invite-header">
          <Users size={32} strokeWidth={1.5} />
          <h1>Inviter des amis</h1>
          <p>Trouvez vos amis sur Capitune en synchronisant vos contacts</p>
        </div>

        {/* Section numéro de téléphone */}
        <motion.section 
          className="invite-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="section-header">
            <Phone size={20} strokeWidth={1.5} />
            <h2>Votre numéro de téléphone</h2>
          </div>
          <p className="section-desc">
            Ajoutez votre numéro pour que vos amis puissent vous trouver facilement
          </p>
          <form onSubmit={handleUpdatePhone} className="phone-form">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="phone-input"
            />
            <button 
              type="submit" 
              disabled={phoneUpdateLoading || !phoneNumber.trim()}
              className="btn-update-phone"
            >
              {phoneUpdateLoading ? 'Mise à jour...' : 'Enregistrer'}
            </button>
          </form>
        </motion.section>

        {/* Section import contacts */}
        <motion.section 
          className="invite-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="section-header">
            <Upload size={20} strokeWidth={1.5} />
            <h2>Importer vos contacts</h2>
          </div>
          <p className="section-desc">
            Téléchargez un fichier VCF ou CSV pour trouver qui de vos contacts utilise Capitune
          </p>
          <div className="upload-zone">
            <label className="btn-upload">
              <Upload size={18} strokeWidth={1.5} />
              Choisir un fichier (.vcf, .csv)
              <input
                type="file"
                accept=".vcf,.csv"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
            {contacts.length > 0 && (
              <div className="contacts-imported">
                <p>{contacts.length} contacts importés</p>
                <button 
                  onClick={handleSyncContacts}
                  disabled={syncing}
                  className="btn-sync"
                >
                  {syncing ? 'Synchronisation...' : 'Synchroniser'}
                </button>
              </div>
            )}
          </div>
        </motion.section>

        {/* Résultats : Utilisateurs trouvés */}
        {foundUsers.length > 0 && (
          <motion.section 
            className="invite-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="section-header">
              <UserPlus size={20} strokeWidth={1.5} />
              <h2>Sur Capitune ({foundUsers.length})</h2>
            </div>
            <div className="users-list">
              {foundUsers.map((found, idx) => (
                <div key={idx} className="user-card">
                  <div className="user-info">
                    <div className="user-avatar">
                      {found.user.avatar ? (
                        <img src={resolveUrl(found.user.avatar)} alt={found.user.username} />
                      ) : (
                        <div className="avatar-placeholder">{found.user.username[0].toUpperCase()}</div>
                      )}
                    </div>
                    <div>
                      <p className="user-name">{found.user.username}</p>
                      <p className="contact-name">{found.contactName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleFollow(found.user._id)}
                    className="btn-follow-small"
                  >
                    Suivre
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Résultats : Contacts non trouvés */}
        {notFoundContacts.length > 0 && (
          <motion.section 
            className="invite-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="section-header">
              <Users size={20} strokeWidth={1.5} />
              <h2>Pas encore sur Capitune ({notFoundContacts.length})</h2>
            </div>
            <p className="section-desc">
              Ces contacts n'utilisent pas encore Capitune. Vous pourrez les inviter prochainement.
            </p>
            <div className="not-found-list">
              {notFoundContacts.slice(0, 10).map((contact, idx) => (
                <div key={idx} className="contact-item">
                  <span>{contact.contactName}</span>
                </div>
              ))}
              {notFoundContacts.length > 10 && (
                <p className="more-contacts">... et {notFoundContacts.length - 10} autres</p>
              )}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}

export default InviteFriends;
