import React, { useState, useEffect } from 'react';
import { communityService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Communities.css';

const Communities = () => {
  const [communities, setCommunities] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'all'
  });
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await communityService.getAllCommunities();
      setCommunities(response.data);
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await communityService.createCommunity(formData);
      setFormData({ name: '', description: '', level: 'all' });
      setShowCreateForm(false);
      fetchCommunities();
    } catch (error) {
      console.error('Error creating community:', error);
    }
  };

  const handleJoin = async (communityId) => {
    try {
      await communityService.joinCommunity(communityId);
      fetchCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  const handleLeave = async (communityId) => {
    try {
      await communityService.leaveCommunity(communityId);
      fetchCommunities();
    } catch (error) {
      console.error('Error leaving community:', error);
    }
  };

  return (
    <div className="communities-container">
      <div className="communities-header">
        <h1>Learning Communities</h1>
        <p>Join communities to connect with learners at your level</p>
        {isAuthenticated && (
          <button 
            className="btn-create-community"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Community'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="create-community-form">
          <h3>Create a New Community</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Community Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Advanced Grammar Club"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe what this community is about..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Target Level</label>
              <select name="level" value={formData.level} onChange={handleChange}>
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">Create Community</button>
          </form>
        </div>
      )}

      <div className="communities-grid">
        {communities.map(community => (
          <div key={community.id} className="community-card">
            <div className="community-header">
              <h3>{community.name}</h3>
              <span className={`level-badge level-${community.level}`}>
                {community.level}
              </span>
            </div>
            <p className="community-description">{community.description}</p>
            <div className="community-stats">
              <span>👥 {community.members.length} members</span>
              <span>📝 {community.posts.length} posts</span>
            </div>
            {isAuthenticated && (
              <div className="community-actions">
                {community.members.includes(user.id) ? (
                  <button 
                    className="btn-leave"
                    onClick={() => handleLeave(community.id)}
                  >
                    Leave Community
                  </button>
                ) : (
                  <button 
                    className="btn-join"
                    onClick={() => handleJoin(community.id)}
                  >
                    Join Community
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {communities.length === 0 && (
        <div className="no-communities">
          <p>No communities yet. Create the first one!</p>
        </div>
      )}
    </div>
  );
};

export default Communities;
