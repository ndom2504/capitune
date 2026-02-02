import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Save, Send, Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import './CreatorStudio.css';
import api from '../utils/api';


const defaultBlocks = [
  { id: 'b1', type: 'text', title: 'Texte', preview: 'Ajoutez votre intro...', order: 1 }
];

const blockTypeOptionsFull = [
  { value: 'text', label: 'Texte' },
  { value: 'image', label: 'Image' },
  { value: 'gallery', label: 'Galerie' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'before-after', label: 'Avant/Apres' },
  { value: 'video', label: 'Video' },
  { value: 'quote', label: 'Citation' },
  { value: 'poll', label: 'Sondage' },
  { value: 'quiz', label: 'Quiz' }
];

const blockTypeOptionsEssential = [
  { value: 'text', label: 'Texte' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'poll', label: 'Sondage' },
  { value: 'quote', label: 'Citation' }
];

function StudioTopBar({ title, onBack, onDraft, onPreview, onPublish, isBusy, onTogglePro }) {
  return (
    <div className="studio-topbar">
      <div className="studio-topbar-left">
        <button className="ghost" onClick={onBack}><ArrowLeft size={18} /> Retour</button>
        <span className="studio-topbar-title">{title}</span>
      </div>
      <div className="studio-topbar-actions">
        {onTogglePro && <button className="ghost" onClick={onTogglePro}>Options avancees</button>}
        <button className="ghost" onClick={onDraft} disabled={isBusy}><Save size={16} /> Brouillon</button>
        <button className="ghost" onClick={onPreview} disabled={isBusy}><Eye size={16} /> Apercu</button>
        <button className="primary" onClick={onPublish} disabled={isBusy}><Send size={16} /> Publier</button>
      </div>
    </div>
  );
}

function BlockCard({ block, onEdit, onUp, onDown, onDelete, onChange, selected, onSelect, blockTypeOptions }) {
  return (
    <div className={`block-card ${selected ? 'block-card-selected' : ''}`} onClick={onSelect}>
      <div className="block-card-row">
        <div className="block-meta">
          <div className="block-icon">
            {block.type === 'text' && '📝'}
            {block.type === 'image' && '🖼️'}
            {block.type === 'gallery' && '🖼️'}
            {block.type === 'carousel' && '🌀'}
            {block.type === 'before-after' && '↔️'}
            {block.type === 'video' && '🎬'}
            {block.type === 'poll' && '📊'}
            {block.type === 'quiz' && '❓'}
            {block.type === 'quote' && '❝'}
          </div>
          <div className="block-meta-text">
            <div className="block-title">{block.title || block.type}</div>
            <div className="block-preview">{block.preview || 'Apercu rapide'}</div>
          </div>
        </div>
        <div className="block-actions">
          <select
            value={block.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="block-type-select"
            onClick={(e) => e.stopPropagation()}
          >
            {blockTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button title="Monter" onClick={(e) => { e.stopPropagation(); onUp(); }}><ArrowUp size={16} /></button>
          <button title="Descendre" onClick={(e) => { e.stopPropagation(); onDown(); }}><ArrowDown size={16} /></button>
          <button title="Editer" onClick={(e) => { e.stopPropagation(); onEdit(); }}><Edit2 size={16} /></button>
          <button title="Supprimer" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 size={16} /></button>
        </div>
      </div>
      <textarea
        className="block-inline-editor"
        value={block.preview || ''}
        placeholder="Texte ou resume du bloc"
        onChange={(e) => onChange({ preview: e.target.value })}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function EmptyState({ onAdd }) {
  const suggestions = [
    'Intro + Image + Question',
    'Mini tuto en 3 etapes',
    'Avant/Apres + sondage'
  ];
  return (
    <div className="empty-state">
      <div className="empty-illus">📦</div>
      <h3>Cree ta capsule en ajoutant des blocs</h3>
      <button className="primary" onClick={onAdd}>+ Ajouter un bloc</button>
      <div className="chips">
        {suggestions.map((s, i) => (
          <span key={i} className="chip">{s}</span>
        ))}
      </div>
    </div>
  );
}

function PreviewBlock({ block }) {
  if (!block) return null;

  const mediaStyle = {
    borderRadius: block.radius ?? 10,
    filter: block.blur ? `blur(${block.blur}px)` : 'none',
    boxShadow: block.shadow === 'none' ? 'none' : block.shadow === 'deep' ? '0 16px 40px rgba(0,0,0,0.18)' : '0 8px 20px rgba(0,0,0,0.12)'
  };

  const aspectHeight = (() => {
    if (block.aspect === '1:1') return 200;
    if (block.aspect === '4:5') return 220;
    if (block.aspect === '16:9') return 140;
    return undefined;
  })();

  const textStyle = {
    fontFamily: block.fontFamily === 'serif' ? 'Georgia, serif' : block.fontFamily === 'mono' ? '"SFMono-Regular", Consolas, monospace' : block.fontFamily === 'display' ? '"Poppins", "Inter", sans-serif' : '"Inter", system-ui, sans-serif',
    fontWeight: block.fontWeight || 600,
    fontSize: block.fontSize || 16,
    color: block.fontColor || '#111827'
  };

  const hasOverlay = Boolean(block.overlayUrl || block.overlayTint);
  const overlayNode = hasOverlay ? (
    <div
      className="media-overlay"
      style={{
        backgroundImage: block.overlayUrl ? `url(${block.overlayUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        mixBlendMode: block.overlayBlend || 'multiply',
        backgroundColor: block.overlayTint || '#000',
        opacity: block.overlayOpacity ?? 0.35
      }}
    />
  ) : null;

  if (block.type === 'carousel') {
    return (
      <div className="phone-block carousel">
        <div className="phone-block-type">Carousel</div>
        <div className="phone-carousel">
          <div className="phone-slide" style={mediaStyle}>{overlayNode}</div>
          <div className="phone-slide" style={mediaStyle}>{overlayNode}</div>
          <div className="phone-slide" style={mediaStyle}>{overlayNode}</div>
        </div>
        <div className="phone-block-text" style={textStyle}>{block.preview || 'Faites defiler vos visuels'}</div>
      </div>
    );
  }
  if (block.type === 'gallery') {
    return (
      <div className="phone-block gallery">
        <div className="phone-block-type">Galerie</div>
        <div className="phone-gallery">
          {[1,2,3,4].map(i => (
            <div key={i} className="phone-thumb" style={mediaStyle}>{overlayNode}</div>
          ))}
        </div>
        <div className="phone-block-text" style={textStyle}>{block.preview || 'Grille visuelle'}</div>
      </div>
    );
  }
  if (block.type === 'before-after') {
    return (
      <div className="phone-block before-after">
        <div className="phone-block-type">Avant/Apres</div>
        <div className="phone-before-after">
          <div className="ba-left" style={mediaStyle}>{overlayNode}Avant</div>
          <div className="ba-right" style={mediaStyle}>{overlayNode}Apres</div>
          <div className="ba-handle" />
        </div>
        <div className="phone-block-text" style={textStyle}>{block.preview || 'Compare en glissant'}</div>
      </div>
    );
  }
  if (block.type === 'image') {
    return (
      <div className="phone-block image">
        <div className="phone-block-type">Image</div>
        <div className="phone-media media-frame" aria-label="apercu image" style={{ ...mediaStyle, height: aspectHeight || 140 }}>
          {overlayNode}
        </div>
        <div className="phone-block-text" style={textStyle}>{block.preview || 'Visuel descriptif'}</div>
      </div>
    );
  }
  if (block.type === 'video') {
    return (
      <div className="phone-block video">
        <div className="phone-block-type">Video</div>
        <div className="phone-media video media-frame" aria-label="apercu video" style={{ ...mediaStyle, height: aspectHeight || 160 }}>
          <div className="phone-video-overlay">
            <div className="phone-play">▶</div>
            <div className="phone-video-hint">Apercu video</div>
          </div>
          {overlayNode}
        </div>
        <div className="phone-block-text" style={textStyle}>{block.preview || 'Pitch de la video'}</div>
      </div>
    );
  }
  if (block.type === 'poll') {
    return (
      <div className="phone-block poll">
        <div className="phone-block-type">Sondage</div>
        <div className="phone-poll">
          <div className="phone-poll-row" style={textStyle}><span>Option A</span><span>62%</span></div>
          <div className="phone-poll-row" style={textStyle}><span>Option B</span><span>38%</span></div>
        </div>
        <div className="phone-block-text" style={textStyle}>{block.preview || 'Question rapide'}</div>
      </div>
    );
  }
  if (block.type === 'quote') {
    return (
      <div className="phone-block quote">
        <div className="phone-block-type">Citation</div>
        <div className="phone-quote" style={textStyle}>"{block.preview || 'Inspire ton audience'}"</div>
      </div>
    );
  }
  return (
    <div className="phone-block">
      <div className="phone-block-type">Texte</div>
      <div className="phone-block-text" style={textStyle}>{block.preview || 'Redige ton texte'}</div>
    </div>
  );
}

function PhonePreview({ blocks, coverPreview, coverIsVideo, modeLecture, audience, commentsEnabled, showResults }) {
  return (
    <div className="phone-frame">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="phone-header-row">
          <span className="phone-chip">{modeLecture === 'tap' ? 'Tap' : 'Scroll'}</span>
          <span className="phone-chip secondary">{audience === 'public' ? 'Public' : audience === 'followers' ? 'Abonnes' : 'Communaute'}</span>
        </div>
        {coverPreview && !coverIsVideo && (
          <div className="phone-cover" style={{ backgroundImage: `url(${coverPreview})` }} />
        )}
        {coverPreview && coverIsVideo && (
          <div className="phone-cover phone-cover-video">
            <video
              className="phone-video"
              src={coverPreview}
              controls
              muted
              playsInline
              preload="metadata"
            />
          </div>
        )}
        {blocks.length === 0 ? (
          <div className="phone-empty">Apercu live</div>
        ) : (
          blocks.map(b => (
            <PreviewBlock key={b.id} block={b} />
          ))
        )}
        <div className="phone-footer">
          <span>{commentsEnabled ? 'Commentaires ouverts' : 'Commentaires off'}</span>
          <span>{showResults ? 'Resultats visibles' : 'Resultats caches'}</span>
        </div>
      </div>
    </div>
  );
}

function FeedPreview({ title, titleAlt, coverPreview, coverAlt, blocks }) {
  const first = blocks[0];
  const summary = first?.preview || first?.title || 'Decouvre la capsule';
  return (
    <div className="feed-preview">
      <div
        className="feed-cover"
        style={coverPreview
          ? { backgroundImage: `url(${coverPreview})` }
          : { backgroundImage: 'linear-gradient(135deg,#111827,#1f2937)' }}
      />
      <div className="feed-body">
        <div className="feed-title">{title || 'Capsule createur'}</div>
        <div className="feed-summary">{summary}</div>
        <div className="feed-tags">#creator #capsule</div>
      </div>
      {(coverAlt || titleAlt) && (
        <div className="feed-variant">
          <div className="feed-title">Variante B</div>
          <div className="feed-summary">{titleAlt || title || 'Capsule createur'}</div>
          {coverAlt && <div className="feed-cover alt" style={{ backgroundImage: `url(${coverAlt})` }} />}
        </div>
      )}
    </div>
  );
}

function ProToolsPanel({ block, onChange }) {
  if (!block) return <div className="pro-empty">Selectionne un bloc pour voir ses options avancees.</div>;

  const updateOption = (idx, value) => {
    const next = [...(block.options || ['Option A', 'Option B'])];
    next[idx] = value;
    onChange({ options: next });
  };

  const updateAnswer = (idx, value) => {
    const next = [...(block.answers || ['Reponse A', 'Reponse B'])];
    next[idx] = value;
    onChange({ answers: next });
  };

  return (
    <div className="pro-panel">
      <div className="pro-row">
        <label>Titre</label>
        <input value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })} placeholder="Titre du bloc" />
      </div>

      {(block.type === 'text' || block.type === 'quote' || block.type === 'poll' || block.type === 'quiz') && (
        <>
          <div className="pro-row-inline">
            <div className="pro-row" style={{ flex: 1 }}>
              <label>Police</label>
              <select value={block.fontFamily || 'sans'} onChange={(e) => onChange({ fontFamily: e.target.value })}>
                <option value="sans">Sans</option>
                <option value="serif">Serif</option>
                <option value="mono">Mono</option>
                <option value="display">Display</option>
              </select>
            </div>
            <div className="pro-row" style={{ width: 110 }}>
              <label>Poids</label>
              <select value={block.fontWeight || 600} onChange={(e) => onChange({ fontWeight: Number(e.target.value) })}>
                <option value={400}>Regular</option>
                <option value={600}>Semibold</option>
                <option value={700}>Bold</option>
              </select>
            </div>
            <div className="pro-row" style={{ width: 110 }}>
              <label>Taille</label>
              <input type="number" min={12} max={32} value={block.fontSize || 16} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} />
            </div>
          </div>
          <div className="pro-row">
            <label>Couleur</label>
            <input type="color" value={block.fontColor || '#111827'} onChange={(e) => onChange({ fontColor: e.target.value })} />
          </div>
        </>
      )}

      {block.type === 'poll' && (
        <>
          {(block.options || ['Option A','Option B']).map((opt, idx) => (
            <div className="pro-row" key={idx}>
              <label>Option {idx + 1}</label>
              <div className="pro-row-inline">
                <input value={opt} onChange={(e) => updateOption(idx, e.target.value)} />
                {idx >= 2 && <button type="button" className="chip-btn" onClick={() => onChange({ options: (block.options || ['Option A','Option B']).filter((_, i) => i !== idx) })}>Suppr</button>}
              </div>
            </div>
          ))}
          <div className="pro-row-inline">
            <button type="button" className="chip-btn" onClick={() => onChange({ options: [...(block.options || ['Option A','Option B']), `Option ${ (block.options?.length || 2) + 1}`] })}>+ Option</button>
          </div>
          <div className="pro-row">
            <label>Duree (min)</label>
            <input type="number" min={1} max={1440} value={block.duration || 5} onChange={(e) => onChange({ duration: Number(e.target.value) })} />
          </div>
        </>
      )}

      {block.type === 'quiz' && (
        <>
          {(block.answers || ['Reponse A','Reponse B']).map((ans, idx) => (
            <div className="pro-row" key={idx}>
              <label>Reponse {idx + 1}</label>
              <div className="pro-row-inline">
                <input value={ans} onChange={(e) => updateAnswer(idx, e.target.value)} />
                {idx >= 2 && <button type="button" className="chip-btn" onClick={() => onChange({ answers: (block.answers || ['Reponse A','Reponse B']).filter((_, i) => i !== idx) })}>Suppr</button>}
              </div>
            </div>
          ))}
          <div className="pro-row-inline">
            <button type="button" className="chip-btn" onClick={() => onChange({ answers: [...(block.answers || ['Reponse A','Reponse B']), `Reponse ${ (block.answers?.length || 2) + 1}`] })}>+ Reponse</button>
          </div>
          <div className="pro-row">
            <label>Bonne reponse</label>
            <select value={block.correctAnswer ?? 0} onChange={(e) => onChange({ correctAnswer: Number(e.target.value) })}>
              {(block.answers || ['Reponse A','Reponse B']).map((_, idx) => (
                <option key={idx} value={idx}>{idx + 1}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {block.type === 'video' && (
        <>
          <div className="pro-row">
            <label>Start (s)</label>
            <input type="number" min={0} value={block.startAt || 0} onChange={(e) => onChange({ startAt: Number(e.target.value) })} />
          </div>
          <div className="pro-row">
            <label>End (s)</label>
            <input type="number" min={0} value={block.endAt || 0} onChange={(e) => onChange({ endAt: Number(e.target.value) })} />
          </div>
        </>
      )}

      {(block.type === 'image' || block.type === 'video' || block.type === 'gallery' || block.type === 'carousel' || block.type === 'before-after') && (
        <>
          <div className="pro-row">
            <label>Overlay (URL)</label>
            <input value={block.overlayUrl || ''} onChange={(e) => onChange({ overlayUrl: e.target.value })} placeholder="https://image... (optionnel)" />
          </div>
          <div className="pro-row-inline">
            <div className="pro-row" style={{ flex: 1 }}>
              <label>Opacite overlay</label>
              <input type="number" min={0} max={1} step={0.05} value={block.overlayOpacity ?? 0.35} onChange={(e) => onChange({ overlayOpacity: Number(e.target.value) })} />
            </div>
            <div className="pro-row" style={{ width: 140 }}>
              <label>Teinte</label>
              <input type="color" value={block.overlayTint || '#000000'} onChange={(e) => onChange({ overlayTint: e.target.value })} />
            </div>
            <div className="pro-row" style={{ width: 140 }}>
              <label>Blend</label>
              <select value={block.overlayBlend || 'multiply'} onChange={(e) => onChange({ overlayBlend: e.target.value })}>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft light</option>
              </select>
            </div>
          </div>
          <div className="pro-row-inline">
            <div className="pro-row" style={{ width: 120 }}>
              <label>Arrondi</label>
              <input type="number" min={0} max={30} value={block.radius ?? 12} onChange={(e) => onChange({ radius: Number(e.target.value) })} />
            </div>
            <div className="pro-row" style={{ width: 140 }}>
              <label>Ombre</label>
              <select value={block.shadow || 'soft'} onChange={(e) => onChange({ shadow: e.target.value })}>
                <option value="none">Aucune</option>
                <option value="soft">Douce</option>
                <option value="deep">Marquee</option>
              </select>
            </div>
            <div className="pro-row" style={{ width: 120 }}>
              <label>Blur</label>
              <input type="number" min={0} max={10} value={block.blur ?? 0} onChange={(e) => onChange({ blur: Number(e.target.value) })} />
            </div>
            <div className="pro-row" style={{ width: 160 }}>
              <label>Ratio</label>
              <select value={block.aspect || 'auto'} onChange={(e) => onChange({ aspect: e.target.value })}>
                <option value="auto">Auto</option>
                <option value="1:1">1:1</option>
                <option value="4:5">4:5</option>
                <option value="16:9">16:9</option>
              </select>
            </div>
          </div>
        </>
      )}

      {(block.type === 'gallery' || block.type === 'carousel') && (
        <div className="pro-row">
          <label>Nombre d'items</label>
          <input type="number" min={2} max={10} value={block.itemCount || 4} onChange={(e) => onChange({ itemCount: Number(e.target.value) })} />
        </div>
      )}

      {block.type === 'before-after' && (
        <>
          <div className="pro-row">
            <label>Label Avant</label>
            <input value={block.beforeLabel || 'Avant'} onChange={(e) => onChange({ beforeLabel: e.target.value })} />
          </div>
          <div className="pro-row">
            <label>Label Apres</label>
            <input value={block.afterLabel || 'Apres'} onChange={(e) => onChange({ afterLabel: e.target.value })} />
          </div>
        </>
      )}
    </div>
  );
}

export default function CreatorStudioNew() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('Nouvelle capsule');
  const [titleAlt, setTitleAlt] = useState('');
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [coverIsVideo, setCoverIsVideo] = useState(false);
  const [coverAlt, setCoverAlt] = useState('');
  const [coverAltPreview, setCoverAltPreview] = useState('');
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [modeLecture, setModeLecture] = useState('scroll');
  const [audience, setAudience] = useState('public');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [showResults, setShowResults] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState(defaultBlocks[0]?.id || null);
  const [modeLevel, setModeLevel] = useState('pro');
  const [proOpen, setProOpen] = useState(true);
  const [selectedTags, setSelectedTags] = useState(['Createurs']);

  const handleAddBlock = () => {
    const newBlock = { id: `b-${Date.now()}`, type: 'text', title: 'Bloc texte', preview: 'Nouveau bloc', order: blocks.length + 1 };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id, patch) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  };

  const move = (id, dir) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[swapIdx];
      next[swapIdx] = tmp;
      return next;
    });
  };

  const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const applyTemplate = (key) => {
    if (key === 'story') {
      const tpl = [
        { id: 'tpl1', type: 'text', title: 'Intro', preview: 'Bienvenue dans ma story' },
        { id: 'tpl2', type: 'image', title: 'Visuel', preview: 'Coup d\'oeil visuel' },
        { id: 'tpl3', type: 'poll', title: 'Avis', preview: 'Tu choisis quoi ?', options: ['A', 'B'], duration: 10 }
      ];
      setBlocks(tpl);
      setSelectedBlockId('tpl1');
      setModeLecture('tap');
      setModeLevel('pro');
      return;
    }
    if (key === 'tuto') {
      const tpl = [
        { id: 'tpl1', type: 'text', title: 'Etape 1', preview: 'Prepare le materiel' },
        { id: 'tpl2', type: 'video', title: 'Demo', preview: 'Regarde la manip', startAt: 0, endAt: 30 },
        { id: 'tpl3', type: 'quiz', title: 'As-tu compris ?', preview: 'Test rapide', answers: ['Oui', 'Pas sur'], correctAnswer: 0 }
      ];
      setBlocks(tpl);
      setSelectedBlockId('tpl1');
      setModeLecture('scroll');
      setModeLevel('pro');
      return;
    }
    if (key === 'offre') {
      const tpl = [
        { id: 'tpl1', type: 'quote', title: 'Accroche', preview: '"Voici ton offre exclusive"' },
        { id: 'tpl2', type: 'before-after', title: 'Resultat', preview: 'Avant / Apres' },
        { id: 'tpl3', type: 'text', title: 'CTA', preview: 'Reserve ta place' }
      ];
      setBlocks(tpl);
      setSelectedBlockId('tpl1');
      setAudience('public');
      setModeLevel('pro');
      return;
    }
  };

  const assembleContent = () => {
    const blocksText = blocks.map((b, idx) => `${idx + 1}. ${b.preview || b.title || ''}`).join('\n');
    let contentStr = title;
    if (titleAlt) contentStr += `\n${titleAlt}`;
    if (blocksText) contentStr += `\n\n${blocksText}`;
    return contentStr;
  };

  const assembleMeta = () => JSON.stringify({
    title,
    titleAlt,
    coverPreview,
    coverAlt,
    blocks,
    modeLecture,
    audience,
    commentsEnabled,
    showResults
  });

  const hydrateFromPost = (post) => {
    if (!post) return;
    try {
      const parsed = post.description ? JSON.parse(post.description) : {};
      setTitle(parsed.title || post.content?.split('\n')[0] || 'Capsule createur');
      setTitleAlt(parsed.titleAlt || '');
      setBlocks(Array.isArray(parsed.blocks) && parsed.blocks.length ? parsed.blocks : defaultBlocks);
      setModeLecture(parsed.modeLecture || 'scroll');
      setAudience(parsed.audience || 'public');
      setCommentsEnabled(parsed.commentsEnabled ?? true);
      setShowResults(parsed.showResults ?? true);
      if (parsed.coverPreview) setCoverPreview(parsed.coverPreview);
      if (parsed.coverAlt) { setCoverAlt(parsed.coverAlt); setCoverAltPreview(parsed.coverAlt); }
      if (post.media?.url) setCoverPreview(post.media.url);
    } catch (err) {
      setStatus('Lecture du brouillon impossible, chargement par defaut');
    }
  };

  useEffect(() => {
    const loadExisting = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/posts/${id}`);
        hydrateFromPost(data);
      } catch (err) {
        setStatus('Impossible de charger le brouillon');
      } finally {
        setLoading(false);
      }
    };
    loadExisting();
  }, [id]);

  const submitStudio = async (draft = true) => {
    if (!title || blocks.length === 0) {
      setStatus('Titre et au moins un bloc requis');
      return;
    }
    try {
      setStatus('Sauvegarde en cours...');
      setSaving(true);
      
      const formData = new FormData();
      formData.append('content', assembleContent());
      formData.append('description', assembleMeta());
      formData.append('format', 'text');
      formData.append('type', 'text');
      formData.append('isDraft', draft);
      formData.append('tags', JSON.stringify(selectedTags));
      
      if (cover && cover instanceof File) {
        formData.append('media', cover);
      }
      
      if (id) {
        await api.put(`/posts/${id}`, formData);
      } else {
        await api.post('/posts', formData);
      }
      setStatus(draft ? 'Brouillon enregistre' : 'Capsule publiee');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const handleDraft = () => submitStudio(true);
  const handlePreview = () => setStatus('Apercu interactif a venir');
  const handlePublish = () => submitStudio(false);

  const typeOptions = modeLevel === 'essential' ? blockTypeOptionsEssential : blockTypeOptionsFull;

  useEffect(() => {
    if (modeLevel === 'essential') {
      setProOpen(false);
    }
  }, [modeLevel]);

  const builderContent = blocks.length === 0 ? (
    <EmptyState onAdd={handleAddBlock} />
  ) : (
    <div className="block-list">
      {blocks.map((b) => (
        <BlockCard
          key={b.id}
          block={b}
          onEdit={() => alert('Edition avancee a venir')}
          onUp={() => move(b.id, 'up')}
          onDown={() => move(b.id, 'down')}
          onDelete={() => deleteBlock(b.id)}
          onChange={(patch) => updateBlock(b.id, patch)}
          selected={selectedBlockId === b.id}
          onSelect={() => setSelectedBlockId(b.id)}
          blockTypeOptions={typeOptions}
        />
      ))}
      <button className="secondary full" onClick={handleAddBlock}>+ Ajouter un bloc</button>
    </div>
  );

  const coverLabel = useMemo(() => cover?.name || 'Aucune couverture', [cover]);

  return (
    <div className="studio-page">
      <StudioTopBar
        title={id ? 'Capsule Createur' : 'Nouvelle capsule'}
        onBack={() => navigate(-1)}
        onDraft={handleDraft}
        onPreview={handlePreview}
        onPublish={handlePublish}
        isBusy={saving || publishing}
        onTogglePro={() => { setModeLevel('pro'); setProOpen(true); }}
      />

      {(status || loading) && (
        <div className={`studio-status ${status.toLowerCase().includes('erreur') ? 'error' : ''}`}>
          {loading ? 'Chargement du brouillon...' : status}
        </div>
      )}

      <div className="studio-two-column">
        <div className="studio-preview-col">
          <div className="card sticky">
            <div className="card-title">Apercu live</div>
            <PhonePreview
              blocks={blocks}
              coverPreview={coverPreview}
              coverIsVideo={coverIsVideo}
              modeLecture={modeLecture}
              audience={audience}
              commentsEnabled={commentsEnabled}
              showResults={showResults}
            />
            <FeedPreview title={title} titleAlt={titleAlt} coverPreview={coverPreview} coverAlt={coverAlt} blocks={blocks} />
          </div>
        </div>

        <div className="studio-editor-col">
          <div className="card">
            <div className="card-title">Infos capsule</div>
            <div className="form-group">
              <label>Titre principal</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la capsule" />
            </div>
            <div className="form-group">
              <label>Titre (Variante B)</label>
              <input value={titleAlt} onChange={(e) => setTitleAlt(e.target.value)} placeholder="Titre alternatif (A/B)" />
            </div>

            <div className="form-group">
              <label>Mode de publication</label>
              <select className="publication-mode">
                <option value="capsule">Capsule standard</option>
                <option value="article">Article de presse</option>
                <option value="product">Promotion produits</option>
                <option value="event">Evenement</option>
                <option value="announcement">Annonce</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Medias</div>
            <div className="form-group">
              <label>Couverture principale (4:5)</label>
              <div className="media-controls">
                <button className="secondary" onClick={() => document.getElementById('cover-input').click()}>Importer image</button>
                <button className="secondary" onClick={() => alert('Parametres image a venir')}>Param</button>
                <span className="media-label">{coverLabel}</span>
              </div>
              {coverPreview && !coverIsVideo && <img className="cover-preview" src={coverPreview} alt="Couverture" />}
              {coverPreview && coverIsVideo && (
                <div className="cover-preview cover-preview-video">
                  <div className="cover-video-play">▶</div>
                  <span>Video</span>
                </div>
              )}
              <input
                id="cover-input"
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setCover(file);
                  if (file) {
                    setCoverIsVideo(file.type.startsWith('video'));
                    setCoverPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label>Couverture B (Video)</label>
              <div className="media-controls">
                <button className="secondary" onClick={() => document.getElementById('cover-alt-input').click()}>Importer video</button>
                <button className="secondary" onClick={() => alert('Parametres video a venir')}>Param</button>
              </div>
              {coverAltPreview && <img className="cover-preview" src={coverAltPreview} alt="Couverture B" />}
              <input
                id="cover-alt-input"
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setCoverAlt(ev.target?.result || '');
                    setCoverAltPreview(ev.target?.result || '');
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <input value={coverAlt} onChange={(e) => { setCoverAlt(e.target.value); setCoverAltPreview(e.target.value); }} placeholder="https://... (URL)" />
            </div>
          </div>

          <div className="card">
            <div className="card-title builder-header">
              <span>Contenu</span>
              <div className="template-row">
                <button className="chip-btn" onClick={() => applyTemplate('story')}>Story</button>
                <button className="chip-btn" onClick={() => applyTemplate('tuto')}>Tuto</button>
                <button className="chip-btn" onClick={() => applyTemplate('offre')}>Offre</button>
              </div>
            </div>
            {builderContent}
          </div>

          <div className="card">
            <div className="card-title">Tags</div>
            <div className="form-group">
              <div className="chips">
                {['Createurs', 'Tendance', 'Decouverte'].map((t) => (
                  <span 
                    key={t} 
                    className={`chip ${selectedTags.includes(t) ? 'chip-selected' : ''}`}
                    onClick={() => setSelectedTags(prev => 
                      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                    )}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Options</div>
            <div className="form-group">
              <label>Mode lecture</label>
              <div className="radio-row">
                <label><input type="radio" name="mode" value="scroll" checked={modeLecture==='scroll'} onChange={() => setModeLecture('scroll')} /> Scroll</label>
                <label><input type="radio" name="mode" value="tap" checked={modeLecture==='tap'} onChange={() => setModeLecture('tap')} /> Tap</label>
              </div>
            </div>
            <div className="form-group">
              <label>Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="public">Public</option>
                <option value="followers">Abonnes</option>
                <option value="community">Communaute</option>
              </select>
            </div>
            <div className="form-group toggle-row">
              <label>Commentaires</label>
              <input type="checkbox" checked={commentsEnabled} onChange={(e) => setCommentsEnabled(e.target.checked)} />
            </div>
            <div className="form-group toggle-row">
              <label>Resultats sondage</label>
              <input type="checkbox" checked={showResults} onChange={(e) => setShowResults(e.target.checked)} />
            </div>
          </div>

          <div className="card">
            <div className="card-title pro-header">
              <span>Pro (bloc selectionne)</span>
              <div className="pro-actions">
                <button className="chip-btn" onClick={() => setProOpen(v => !v)}>{proOpen ? 'Replier' : 'Ouvrir'}</button>
                <div className="mode-toggle">
                  <span className={modeLevel === 'essential' ? 'active' : ''} onClick={() => setModeLevel('essential')}>Essential</span>
                  <span className={modeLevel === 'pro' ? 'active' : ''} onClick={() => setModeLevel('pro')}>Pro</span>
                </div>
              </div>
            </div>
            {modeLevel === 'essential' ? (
              <div className="pro-empty">Passe en mode Pro pour les reglages avances.</div>
            ) : proOpen ? (
              <ProToolsPanel
                block={blocks.find(b => b.id === selectedBlockId)}
                onChange={(patch) => selectedBlockId && updateBlock(selectedBlockId, patch)}
              />
            ) : (
              <div className="pro-empty">Pro Tools replie.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
