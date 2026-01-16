import React from 'react';
import '../styles/PostContentRenderer.css';

export function PostContentRenderer({ post }) {
  if (!post) return null;

  // Essayer de parser les metadata (blocks avec styling)
  let blocks = [];
  let title = '';
  let titleAlt = '';
  try {
    if (post.description) {
      const meta = JSON.parse(post.description);
      blocks = meta.blocks || [];
      title = meta.title || '';
      titleAlt = meta.titleAlt || '';
    }
  } catch (err) {
    // Description n'est pas du JSON, utiliser le contenu brut
  }

  // Si on a des blocks (CreatorStudio post), afficher avec styling
  if (blocks.length > 0) {
    return (
      <div className="post-content-renderer">
        {title && <h2 className="post-title">{title}</h2>}
        {titleAlt && <p className="post-title-alt">{titleAlt}</p>}
        
        <div className="post-blocks">
          {blocks.map((block, idx) => (
            <div key={idx} className="rendered-block">
              {block.preview || block.title ? (
                <div 
                  className="block-text"
                  style={{
                    fontFamily: block.fontFamily === 'serif' ? 'Georgia, serif' : block.fontFamily === 'mono' ? '"SFMono-Regular", Consolas, monospace' : block.fontFamily === 'display' ? '"Poppins", "Inter", sans-serif' : '"Inter", system-ui, sans-serif',
                    fontWeight: block.fontWeight || 600,
                    fontSize: `${block.fontSize || 16}px`,
                    color: block.fontColor || '#111827',
                    lineHeight: 1.5
                  }}
                >
                  {block.preview || block.title}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sinon, afficher le contenu brut
  return (
    <p className="post-content-plain">
      {post.content}
    </p>
  );
}
