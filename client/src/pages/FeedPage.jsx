import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PostContentRenderer } from '../components/PostContentRenderer';
import './FeedPage.css';

function FeedPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [legendOpen, setLegendOpen] = useState(new Set());
  const [commentInputs, setCommentInputs] = useState({});
  const [visiblePosts, setVisiblePosts] = useState(new Set());
  const [composeText, setComposeText] = useState('');
  const [composeMedia, setComposeMedia] = useState(null);
  const [composePreview, setComposePreview] = useState('');
  const [composeError, setComposeError] = useState('');
  const [posting, setPosting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const FALLBACK_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="%23e5e7eb"/><circle cx="32" cy="24" r="12" fill="%23cbd5e1"/><path d="M12 54c0-11 9-18 20-18s20 7 20 18" fill="%23cbd5e1"/></svg>';
  const FEED_PAGE_SIZE = 10;
  const API_HOST = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const { user } = useAuth();
  const isCreator = (user?.followers?.length || user?.followersCount || 0) >= 1000 || user?.username === 'test_live';

  const postRefs = useRef({});
  const fileInputRef = useRef(null);
  
    const buildMediaUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (url.startsWith('/uploads')) return `${API_HOST}${url}`;
      if (url.startsWith('/')) return `${API_HOST}${url}`;
      return `${API_HOST}/uploads/${url}`;
    };

  // Raisons traduitesh pour l'UI
  const reasonLabels = {
    discovery: '🔍 Discovery',
    subscriptions: '📱 From your follows',
    trends: '🔥 Trending now',
    rising: '🚀 Emerging creator',
    partnership: '🤝 Partnership',
    surprise: '🎲 Surprise mix'
  };

  const reasonIcons = {
    discovery: '🔍',
    subscriptions: '📱',
    trends: '🔥',
    rising: '🚀',
    partnership: '🤝',
    surprise: '🎲'
  };

  const placeholderStyles = {
    width: '100%',
    paddingTop: '56%',
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderRadius: '12px'
  };

  const worldTags = ['#WorldSquare', '#FoodCulture', '#CityLife', '#Music', '#Travel', '#LearnEnglish', '#Traditions', '#DailyLife', '#StreetFood'];

  const getDisplayName = (entity) => {
    if (!entity) return 'User';
    const source = entity.user || entity; // certains endpoints renvoient { user: {...} }
    const name = source.fullName
      || source.name
      || source.displayName
      || source.profile?.fullName
      || source.settings?.fullName
      || source.profile?.displayName
      || source.settings?.displayName
      || source.username
      || source.handle
      || source.email;
    return (name || 'Utilisateur').toString().trim();
  };

  // Charger le feed
  const mergePosts = (current, incoming) => {
    const seen = new Set(current.map(p => p._id));
    const merged = [...current];
    incoming.forEach(p => {
      if (!seen.has(p._id)) {
        merged.push(p);
        seen.add(p._id);
      }
    });
    return merged;
  };

  const fetchFeed = useCallback(async (pageToLoad = 1, append = false) => {
    const isFirstPage = pageToLoad === 1 && !append;
    if (isFirstPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await api.get(`/posts/feed?page=${pageToLoad}&limit=${FEED_PAGE_SIZE}`);
      const fetched = response.data.posts || [];

      setHasMore(fetched.length === FEED_PAGE_SIZE);
      setPage(pageToLoad);
      setPosts(prev => append ? mergePosts(prev, fetched) : fetched);
    } catch (err) {
      setError(err.response?.data?.message || 'Feed failed to load');
    } finally {
      if (isFirstPage) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore) return;
      if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 600)) {
        fetchFeed(page + 1, true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchFeed, page, loading, loadingMore, hasMore]);

  // Intersection Observer pour tracker la visibilité + watch time
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const postId = entry.target.getAttribute('data-post-id');
        if (entry.isIntersecting) {
          // Post visible : enregistrer la vue
          recordView(postId);
          setVisiblePosts(prev => {
            if (prev.has(postId)) return prev;
            const next = new Set(prev);
            next.add(postId);
            return next;
          });
        }
      });
    }, { threshold: 0.5 });

    Object.values(postRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [posts]);

  // Enregistrer une vue avec dwell time
  const recordView = async (postId) => {
    const start = Date.now();
    
    // Utiliser Intersection Observer pour le dwell time
    const timer = setTimeout(async () => {
      const dwellTime = Date.now() - start;
      try {
        await api.post(`/analytics/${postId}/view`, { 
          dwellTime,
          completed: false 
        });
      } catch (err) {
        console.error('View tracking error:', err);
      }
    }, 1000); // Enregistrer après 1s

    return () => clearTimeout(timer);
  };

  // Like (optimistic update)
  const handleLike = async (postId) => {
    const wasLiked = likedPosts.has(postId);

    // 1) Mise à jour optimiste immédiate
    const nextLiked = new Set(likedPosts);
    if (wasLiked) {
      nextLiked.delete(postId);
    } else {
      nextLiked.add(postId);
    }
    setLikedPosts(nextLiked);

    // Mettre à jour le compteur localement pour réactivité
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const currentLikes = Array.isArray(p.likes) ? p.likes : [];
      const userId = user?._id;
      if (!userId) return { ...p, likes: currentLikes }; // Pas d'utilisateur connecté
      return {
        ...p,
        likes: wasLiked
          ? currentLikes.filter(id => id !== userId)
          : [...currentLikes, userId]
      };
    }));

    // 2) Requête réseau en arrière-plan + rollback si erreur
    try {
      await api.post(`/posts/${postId}/like`);
    } catch (err) {
      console.error('Like error:', err);
      // Revenir à l'état initial si l'appel échoue
      setLikedPosts(prev => {
        const reverted = new Set(prev);
        if (wasLiked) {
          reverted.add(postId);
        } else {
          reverted.delete(postId);
        }
        return reverted;
      });
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        const currentLikes = Array.isArray(p.likes) ? p.likes : [];
        const userId = user?._id;
        if (!userId) return { ...p, likes: currentLikes };
        return {
          ...p,
          likes: wasLiked
            ? [...currentLikes, userId]
            : currentLikes.filter(id => id !== userId)
        };
      }));
    }
  };

  // Save
  const handleSave = async (postId) => {
    try {
      const isSaved = savedPosts.has(postId);
      await api.post(`/analytics/${postId}/engagement`, { type: 'save' });
      
      const newSaved = new Set(savedPosts);
      if (isSaved) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }
      setSavedPosts(newSaved);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  // Share
  const handleShare = async (postId) => {
    try {
      await api.post(`/posts/${postId}/share`);
      await api.post(`/analytics/${postId}/engagement`, { type: 'repost' });
      // Mettez à jour l'UI localement
      setPosts(prev => prev.map(p => p._id === postId ? {
        ...p,
        shares: Array.isArray(p.shares) ? [...p.shares, { user: user?._id }] : [{ user: user?._id }]
      } : p));
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleShareClick = async (post) => {
    const postId = post._id;
    const link = `${window.location.origin}/posts/${postId}`;
    const shareData = {
      title: getDisplayName(post?.author) || 'Post',
      text: post?.content?.slice(0, 140) || 'Check out this post',
      url: link
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        await handleShare(postId);
        return;
      } catch (err) {
        // Si l'utilisateur annule, on ignore; sinon on bascule en fallback
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: partage interne + copie du lien
    await handleShare(postId);
    navigator.clipboard?.writeText(link).catch(() => {});
  };

  // Commentaire inline (type Facebook)
  const handleCommentSubmit = async (postId) => {
    const content = (commentInputs[postId] || '').trim();
    if (!content) return;
    try {
      const res = await api.post(`/posts/${postId}/comment`, { content });
      const newComment = res.data?.comment;
      setPosts(prev => prev.map(p => p._id === postId ? {
        ...p,
        comments: Array.isArray(p.comments) ? [...p.comments, newComment] : [newComment]
      } : p));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleVideoEngagement = (postId, type) => {
    api.post(`/analytics/${postId}/engagement`, { type })
      .catch(err => console.error('Engagement tracking error:', err));
  };

  const handleCreatorClick = () => {
    if (!isCreator) {
      setComposeError('Reserved for creators (>= 1,000 followers).');
      return;
    }
    navigate('/creator-studio/new');
  };

  const togglePostMenu = (postId) => {
    setMenuOpenId(prev => prev === postId ? null : postId);
  };

  const handleEditPost = (postId) => {
    navigate(`/creator-studio/new?edit=${postId}`);
  };

  const handleHidePost = async (postId, hidden = true) => {
    try {
      await api.post(`/posts/${postId}/hide`, { hidden });
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, isHidden: hidden } : p));
      if (hidden) {
        setPosts(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      console.error('Post hide error:', err);
    } finally {
      setMenuOpenId(null);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      console.error('Post delete error:', err);
    } finally {
      setMenuOpenId(null);
    }
  };

  const handleMediaPick = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setComposeMedia(null);
      setComposePreview('');
      return;
    }
    setComposeMedia(file);
    setComposePreview(URL.createObjectURL(file));
  };

  const submitPost = async () => {
    const content = composeText.trim();
    if (!content && !composeMedia) {
      setComposeError('Add text or media');
      return;
    }
    setComposeError('');
    setPosting(true);
    const formData = new FormData();
    formData.append('content', content);
    if (composeMedia) {
      formData.append('media', composeMedia);
      const mediaKind = composeMedia.type?.startsWith('video') ? 'video' : 'image';
      formData.append('type', mediaKind);
      formData.append('format', mediaKind);
    } else {
      formData.append('type', 'text');
      formData.append('format', 'text');
    }

    try {
      const res = await api.post('/posts', formData);
      const newPost = res.data?.post;
      if (newPost) {
        setPosts(prev => [newPost, ...prev]);
      } else {
        await fetchFeed(1, false);
      }
      setComposeText('');
      setComposeMedia(null);
      setComposePreview('');
    } catch (err) {
      setComposeError(err.response?.data?.message || 'Post failed to publish');
    } finally {
      setPosting(false);
    }
  };

  if (error) {
    return <div className="feed-error">{error}</div>;
  }

  return (
    <div className="feed-page">
      <div className="feed-container">
        <div className="world-square-hero">
          <div className="world-square-heading">
            <h1>World Square</h1>
            <p>Share your culture in English — food, music, city life, traditions, daily moments.</p>
          </div>
          <div className="world-square-tags">
            {worldTags.map(tag => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
        </div>

        <div className="composer-card">
          <div className="composer-top">
            <img
              src={user?.avatar || FALLBACK_AVATAR}
              alt={getDisplayName(user)}
              className="composer-avatar"
              onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
            />
            <textarea
              placeholder="Share a slice of your culture..."
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              maxLength={500}
            />
          </div>
          {composePreview && (
            <div className="composer-preview">
              {composeMedia?.type?.startsWith('video') ? (
                <video
                  src={composePreview}
                  controls
                  preload="metadata"
                  className="composer-preview-media"
                />
              ) : (
                <img
                  src={composePreview}
                  alt="Preview"
                  className="composer-preview-media"
                />
              )}
              <button onClick={() => { setComposeMedia(null); setComposePreview(''); }}>
                Remove
              </button>
            </div>
          )}
          {composeError && <div className="composer-error">{composeError}</div>}
          <div className="composer-actions">
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleMediaPick}
            />
            <button
              type="button"
              className={`creator-btn ${!isCreator ? 'creator-btn-disabled' : ''}`}
              onClick={handleCreatorClick}
              disabled={!isCreator}
              title={isCreator ? 'Create a creator post' : 'Reach 1,000 followers to unlock'}
            >
              ✨ Creator
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              📸 Photo / Video
            </button>
            <div className="composer-spacer" />
            <button
              type="button"
              className="composer-submit"
              onClick={submitPost}
              disabled={posting}
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {posts.length > 0 ? (
            <div className="feed-list">
              {posts.map((post, idx) => (
                <motion.div
                  key={post._id}
                  ref={el => postRefs.current[post._id] = el}
                  data-post-id={post._id}
                  className="feed-post"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  {/* Raison & Sponsor */}
                  <div className="post-reason">
                    <span className="reason-badge">
                      {reasonIcons[post._reason]} {reasonLabels[post._reason]}
                    </span>
                    {post._sponsor && (
                      <span className="sponsor-badge">🤝 Partnership</span>
                    )}
                  </div>

                  {/* Header */}
                  <div className="post-header">
                    <img src={post.author.avatar || FALLBACK_AVATAR} alt={getDisplayName(post.author)} className="author-avatar" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }} />
                    <div className="author-info">
                      <h3>{getDisplayName(post.author)}</h3>
                      <p>{post.author.category || 'Membre'}</p>
                    </div>
                    <div className="post-score" title="Score Capitune">
                      <div className="score-circle">
                        {post.score?.global || 0}
                      </div>
                    </div>
                    <div className="post-menu">
                      <button className="post-menu-btn" onClick={() => togglePostMenu(post._id)}>⋯</button>
                      {menuOpenId === post._id && (
                        <div className="post-menu-dropdown">
                          <button onClick={() => handleEditPost(post._id)}>Edit</button>
                          <button onClick={() => handleHidePost(post._id, true)}>Hide</button>
                          <button onClick={() => handleDeletePost(post._id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="post-content">
                    {/* Si c'est un Live, afficher un bandeau cliquable */}
                    {post.format === 'live' && post.isLive && (
                      <div className="live-preview" onClick={() => window.location.href = `/live/${post._id}`}>
                        <div className="live-preview-overlay">
                          <div className="live-badge-big">
                            <span className="live-pulse" />
                            LIVE
                          </div>
                          <div className="live-preview-title">{post.content}</div>
                          <button className="watch-live-btn">Watch live</button>
                        </div>
                      </div>
                    )}
                    
                    {/* Contenu normal pour les autres posts */}
                    {(!post.format || post.format !== 'live' || !post.isLive) && (
                      <>
                        <PostContentRenderer post={post} />

                        {/* Médias */}
                        {post.media?.url && (
                          <div className="post-media">
                            {visiblePosts.has(post._id) ? (
                              post.type === 'video' || post.type === 'short' ? (
                                <video
                                  preload="metadata"
                                  playsInline
                                  controls
                                  onPlay={() => handleVideoEngagement(post._id, 'play')}
                                  onEnded={() => api.post(`/analytics/${post._id}/completion`, { completionPercent: 100 })}
                                  onClick={() => handleVideoEngagement(post._id, 'skip')}
                                  src={buildMediaUrl(post.media.url)}
                                >
                                  <source src={buildMediaUrl(post.media.url)} />
                                </video>
                              ) : (
                                <img 
                                  src={buildMediaUrl(post.media.url)} 
                                  alt="Post" 
                                  loading="lazy"
                                  decoding="async"
                                  fetchpriority="low"
                                  onLoad={() => handleVideoEngagement(post._id, 'zoom')}
                                  style={{ width: '100%', height: 'auto' }}
                                />
                              )
                            ) : (
                              <div className="media-placeholder" aria-label="Loading media" style={placeholderStyles} />
                            )}
                            {post.media.caption && (
                              <p className="media-caption">{post.media.caption}</p>
                            )}
                          </div>
                        )}

                        {/* Format badge gated */}
                        {(['live', 'audio', 'exclusive', 'partnership'].includes(post.format)) && (
                          <div className="format-badge">
                            {post.isLive && <span>🔴 Live</span>}
                            {post.isAudio && <span>🎙️ Audio Room</span>}
                            {post.isExclusive && (
                              <span>
                                <Lock size={14} /> Exclusive
                              </span>
                            )}
                            {post.isPartnership && <span>🤝 Partnership</span>}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Engagement */}
                    <div className="post-engagement">
                    <div className="engagement-stats">
                      <span>{post.likes?.length || 0} likes</span>
                      <span>{post.comments?.length || 0} comments</span>
                      <span>{post.shares?.length || 0} shares</span>
                    </div>

                    {/* Actions */}
                    <div className="post-actions">
                      <button
                        className={`action-btn ${likedPosts.has(post._id) ? 'liked' : ''}`}
                        onClick={() => handleLike(post._id)}
                        title="Like"
                      >
                        <Heart 
                          size={20} 
                          fill={likedPosts.has(post._id) ? 'currentColor' : 'none'}
                        />
                      </button>
                      <button className="action-btn" title="Comment" onClick={() => {
                        const inputEl = document.getElementById(`comment-input-${post._id}`);
                        if (inputEl) inputEl.focus();
                      }}>
                        <MessageCircle size={20} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleShareClick(post)}
                        title="Share"
                      >
                        <Share2 size={20} />
                      </button>
                      <button
                        className={`action-btn ${savedPosts.has(post._id) ? 'saved' : ''}`}
                        onClick={() => handleSave(post._id)}
                        title="Save"
                      >
                        <Bookmark 
                          size={20}
                          fill={savedPosts.has(post._id) ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="comments-block">
                    {Array.isArray(post.comments) && post.comments.length > 0 && (
                      <div className="comments-list">
                        {post.comments.slice(-3).map((c, idx) => (
                          <div key={idx} className="comment-item">
                            <span className="comment-author">{getDisplayName(c?.author) || '—'}</span>
                            <span className="comment-text">{c?.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="comment-input-row">
                      <input
                        id={`comment-input-${post._id}`}
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInputs[post._id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCommentSubmit(post._id);
                          }
                        }}
                      />
                      <button className="comment-send" onClick={() => handleCommentSubmit(post._id)}>Send</button>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="post-score-breakdown">
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="legend-btn"
                        title="Show legend"
                        onClick={() => {
                          const next = new Set(legendOpen);
                          next.has(post._id) ? next.delete(post._id) : next.add(post._id);
                          setLegendOpen(next);
                        }}
                      >
                        i
                      </button>
                    </div>

                    {legendOpen.has(post._id) && (
                      <div className="legend-popover" onClick={() => {
                        const next = new Set(legendOpen);
                        next.delete(post._id);
                        setLegendOpen(next);
                      }}>
                        <div className="legend-content" onClick={(e) => e.stopPropagation()}>
                          <h4>How the score works</h4>
                          <ul>
                            <li><strong>Quality</strong>: readability, format, alignment to the theme</li>
                            <li><strong>Engagement</strong>: likes, comments, shares, saves</li>
                            <li><strong>Recency</strong>: freshness of the post</li>
                          </ul>
                          <div className="score-bar">
                            <span>Quality</span>
                            <div className="bar" style={{ '--fill': (post.score?.quality * 100 || 0) + '%' }}></div>
                            <span>{Math.round(post.score?.quality * 100 || 0)}%</span>
                          </div>
                          <div className="score-bar">
                            <span>Engagement</span>
                            <div className="bar" style={{ '--fill': (post.score?.engagement * 100 || 0) + '%' }}></div>
                            <span>{Math.round(post.score?.engagement * 100 || 0)}%</span>
                          </div>
                          <div className="score-bar">
                            <span>Recency</span>
                            <div className="bar" style={{ '--fill': (post.score?.recency * 100 || 0) + '%' }}></div>
                            <span>{Math.round(post.score?.recency * 100 || 0)}%</span>
                          </div>
                          <button className="legend-close" onClick={() => {
                            const next = new Set(legendOpen);
                            next.delete(post._id);
                            setLegendOpen(next);
                          }}>Close</button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : loading ? (
            <div className="feed-list">
              {[0,1,2].map((i) => (
                <div key={i} className="feed-skeleton">
                  <div className="skeleton-header" />
                  <div className="skeleton-text" />
                  <div className="skeleton-media" />
                </div>
              ))}
            </div>
          ) : (
            <div className="feed-empty">No posts yet — share the first story from your world.</div>
          )}
        </AnimatePresence>
        {loadingMore && (
          <div className="feed-loading-more">Loading...</div>
        )}
      </div>
    </div>
  );
}

export default FeedPage;
