import { useMemo, useState } from 'react';
import './EmojiPicker.css';

const DEFAULT_EMOJIS = {
  smileys: ['😀','😃','😄','😁','😆','🥹','😊','🙂','😉','😍','😘','😗','😙','😚','😋','😛','😜','🤪','😝','🫠','🤗','🤭','🤫','🤔','🫡','🤐','😐','😑','😶','🙄','😮','😯','😲','🥱','😴','🤤','😪','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮‍💨','😢','😭','😤','😠','😡','🤬','🤥','🤒','🤕','🤢','🤮','🤧','🥶','🥵','🥸'],
  gestures: ['👍','👎','👌','✌️','🤞','🤟','🤘','🖖','👏','🙌','🫶','🤝','🙏','💪','👊','✊','🫵','👈','👉','👆','👇','☝️'],
  hearts: ['❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💖','💗','💓','💞','💕','💘','💝','💟','💔'],
  symbols: ['⭐','🌟','✨','🔥','⚡','💥','💫','🎯','✅','☑️','❌','❗','❓','⚠️','🚨','💡','🔔','🎵','🎶','🔗','📌'],
  nature: ['🌱','🌿','🍃','🌸','🌼','🌻','🌞','🌙','⭐','☁️','🌈','🔥','💧','🌊','🏔️','🌋','🌪️']
};

export default function EmojiPicker({ onSelect, recent = [], compact = false }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('smileys');

  const all = useMemo(() => {
    const flat = Object.values(DEFAULT_EMOJIS).flat();
    return flat.filter(e => e);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return DEFAULT_EMOJIS[active] || [];
    return all.filter(e => e.includes(query));
  }, [query, active, all]);

  const handlePick = (emoji) => {
    if (!emoji) return;
    onSelect?.(emoji);
  };

  const TAB_ICONS = {
    smileys: '😊',
    gestures: '👏',
    hearts: '❤️',
    symbols: '✨',
    nature: '🌿'
  };

  return (
    <div className={compact ? 'emoji-picker compact' : 'emoji-picker'} role="dialog" aria-label="Sélecteur d’emojis">
      <div className="emoji-toolbar">
        <input
          className="emoji-search"
          placeholder="Rechercher…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="emoji-tabs">
          {Object.keys(DEFAULT_EMOJIS).map(key => (
            <button
              key={key}
              className={key === active ? 'emoji-tab active' : 'emoji-tab'}
              onClick={() => { setActive(key); setQuery(''); }}
              title={key}
            >
              {TAB_ICONS[key]} {key}
            </button>
          ))}
        </div>
      </div>

      <div className="emoji-grid">
        {filtered.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            className="emoji-btn"
            onClick={() => handlePick(emoji)}
            aria-label={`Insérer ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
