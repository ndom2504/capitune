import React, { useState, useEffect } from 'react';
import { postService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      const response = await postService.getAllPosts();
      let filteredPosts = response.data;
      
      if (filter !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === filter);
      }
      
      setPosts(filteredPosts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostDeleted = () => {
    fetchPosts();
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>English Learning Community</h1>
        <p>Share knowledge, learn together, and improve your English skills</p>
      </div>

      {isAuthenticated && <CreatePost onPostCreated={handlePostCreated} />}

      <div className="filter-section">
        <h3>Filter by Category:</h3>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All Posts
          </button>
          <button 
            className={filter === 'grammar' ? 'active' : ''}
            onClick={() => setFilter('grammar')}
          >
            Grammar
          </button>
          <button 
            className={filter === 'vocabulary' ? 'active' : ''}
            onClick={() => setFilter('vocabulary')}
          >
            Vocabulary
          </button>
          <button 
            className={filter === 'pronunciation' ? 'active' : ''}
            onClick={() => setFilter('pronunciation')}
          >
            Pronunciation
          </button>
          <button 
            className={filter === 'culture' ? 'active' : ''}
            onClick={() => setFilter('culture')}
          >
            Culture
          </button>
          <button 
            className={filter === 'general' ? 'active' : ''}
            onClick={() => setFilter('general')}
          >
            General
          </button>
        </div>
      </div>

      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onPostDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
