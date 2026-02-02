import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import api from '../utils/api';
import './BannerUpload.css';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:3000';
const resolveUrl = (url) => (url?.startsWith('/uploads') ? `${API_HOST}${url}` : url);

function BannerUpload({ banner, onBannerUpdate, isEditable = false }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Valider le fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5242880) { // 5MB
      alert('L\'image doit faire moins de 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('banner', file);
    setUploading(true);

    try {
      const response = await api.put('/users/me/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onBannerUpdate?.(response.data.user.banner);
    } catch (error) {
      console.error('Erreur upload bannière:', error);
      alert('Erreur lors de l\'upload de la bannière');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveBanner = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette bannière ?')) return;

    try {
      await api.put('/users/me/banner', { remove: true });
      onBannerUpdate?.(null);
    } catch (error) {
      console.error('Erreur suppression bannière:', error);
    }
  };

  return (
    <div className="banner-container">
      {banner ? (
        <div className="banner-display">
          <img src={resolveUrl(banner)} alt="Bannière de profil" />
          {isEditable && (
            <div className="banner-overlay">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-change-banner"
                title="Changer la bannière"
              >
                <Upload size={18} />
                Changer
              </button>
              <button
                onClick={handleRemoveBanner}
                className="btn-remove-banner"
                title="Supprimer la bannière"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      ) : isEditable ? (
        <div
          className={`banner-upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-content">
            <Upload size={32} />
            <h3>Ajouter une bannière</h3>
            <p>Glissez une image ou cliquez pour en sélectionner une</p>
            <span className="upload-hint">Max 5MB • JPEG, PNG, WebP</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading && <div className="upload-spinner" />}
        </div>
      ) : (
        <div className="banner-placeholder" />
      )}
    </div>
  );
}

export default BannerUpload;
