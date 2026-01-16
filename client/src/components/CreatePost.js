import React, { useState } from 'react';
import { postService } from '../services/api';
import './CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    try {
      await postService.createPost({ content, category });
      setContent('');
      setCategory('general');
      onPostCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    }
  };

  return (
    <div className="create-post">
      <h3>Share Your Knowledge</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What would you like to share with the community? Share English tips, questions, or cultural insights..."
          rows="4"
        />
        <div className="create-post-footer">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="grammar">Grammar</option>
            <option value="vocabulary">Vocabulary</option>
            <option value="pronunciation">Pronunciation</option>
            <option value="culture">Culture</option>
          </select>
          <button type="submit" className="btn-post">Post</button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
