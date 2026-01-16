import React, { useState } from 'react';
import './AvatarPicker.css';

const AvatarPicker = ({ username = 'user', onSelect, currentAvatar = '' }) => {
  const [selectedStyle, setSelectedStyle] = useState('avataaars');

  const avatarStyles = [
    { id: 'avataaars', label: 'Avataaars' },
    { id: 'lorelei', label: 'Lorelei' },
    { id: 'notionistai', label: 'Notion' },
    { id: 'pixel-art', label: 'Pixel Art' },
    { id: 'personas', label: 'Personas' },
    { id: 'bottts', label: 'Bottts' },
  ];

  const seeds = [
    'Felix', 'Molly', 'Rene', 'Wilma', 'Aneka', 'Aria',
    'Bella', 'Carlos', 'Diego', 'Elena', 'Franco', 'Gina'
  ];

  const handleAvatarSelect = (seed, style) => {
    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
    setSelectedStyle(style);
    onSelect?.(avatarUrl);
  };

  return (
    <div className="avatar-picker">
      <h3 className="avatar-picker-title">Choisissez votre avatar</h3>
      
      <div className="avatar-styles">
        {avatarStyles.map(style => (
          <button
            key={style.id}
            className={`avatar-style-btn ${selectedStyle === style.id ? 'active' : ''}`}
            onClick={() => setSelectedStyle(style.id)}
            title={style.label}
          >
            {style.label}
          </button>
        ))}
      </div>

      <div className="avatar-grid">
        {seeds.map(seed => (
          <div
            key={`${selectedStyle}-${seed}`}
            className="avatar-option"
            onClick={() => handleAvatarSelect(seed, selectedStyle)}
            title={`Avatar ${seed}`}
          >
            <img
              src={`https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}`}
              alt={`Avatar ${seed}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvatarPicker;
