import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, TrendingUp, Star, Lock } from 'lucide-react';
import api from '../utils/api';
import './CommunitiesPage.css';

const CommunitiesPage = () => {
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All passions', icon: '🌐' },
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'food', label: 'Food', icon: '🍜' }
  ];

  const filters = [
    { id: 'all', label: 'All types' },
    { id: 'open', label: 'Open' },
    { id: 'creator', label: 'Creator' },
    { id: 'premium', label: 'Premium' }
  ];

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    filterCommunities();
  }, [communities, searchTerm, activeFilter, activeCategory]);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/communities?limit=50');
      setCommunities(response.data.communities || []);
    } catch (error) {
      console.error('Communities load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCommunities = () => {
    let filtered = [...communities];

    if (activeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === activeFilter);
    }

    if (activeCategory !== 'all') {
      filtered = filtered.filter(c => c.category === activeCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCommunities(filtered);
  };

  const getBadgeIcon = (badge) => {
    const icons = {
      trending: '🔥',
      growing: '📈',
      verified: '✓',
      official: '⭐',
      new: '🆕'
    };
    return icons[badge] || '';
  };

  const getTypeLabel = (type) => {
    const labels = {
      open: 'Open',
      creator: 'Creator',
      premium: 'Premium'
    };
    return labels[type] || type;
  };

  return (
    <div className="communities-page">
      <div className="communities-header">
        <div className="header-content">
          <h1>
            <Users size={32} strokeWidth={1.5} />
            Communities
          </h1>
          <p>Join by passion—Music, Travel, Food</p>
        </div>
        <Link to="/communities/create" className="btn-create">
          Create a community
        </Link>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="categories-filter">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="category-icon">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="type-filters">
        {filters.map(filter => (
          <button
            key={filter.id}
            className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Liste des communautés */}
      <div className="communities-grid">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading communities...</p>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="empty-state">
            <Users size={60} strokeWidth={1} />
            <h3>No communities found</h3>
            <p>Try different passions or start one</p>
          </div>
        ) : (
          filteredCommunities.map(community => (
            <Link
              key={community._id}
              to={`/communities/${community.slug}`}
              className="community-card"
            >
              <div className="card-header">
                {community.banner ? (
                  <img src={community.banner} alt="" className="card-banner" />
                ) : (
                  <div className="card-banner-placeholder"></div>
                )}
                {community.avatar && (
                  <img src={community.avatar} alt="" className="card-avatar" />
                )}
              </div>

              <div className="card-body">
                <div className="card-title-row">
                  <h3>{community.name}</h3>
                  {community.badges && community.badges.length > 0 && (
                    <div className="badges">
                      {community.badges.map((badge, idx) => (
                        <span key={idx} className="badge" title={badge}>
                          {getBadgeIcon(badge)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="card-description">{community.description}</p>

                <div className="card-meta">
                  <span className="type-badge">
                    {community.type === 'premium' && <Lock size={14} />}
                    {getTypeLabel(community.type)}
                  </span>
                  <span className="members-count">
                    <Users size={14} />
                    {community.stats?.memberCount || 0} members
                  </span>
                </div>

                {community.access?.isPremium && (
                  <div className="premium-price">
                    {community.access.price}€/month
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunitiesPage;
