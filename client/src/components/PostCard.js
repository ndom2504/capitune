import React, { useState } from 'react';
import { postService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PostCard.css';

const PostCard = ({ post, onPostDeleted }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [localPost, setLocalPost] = useState(post);
  const { user, isAuthenticated } = useAuth();

  const handleLike = async () => {
    try {
      if (localPost.likes.includes(user?.id)) {
        const response = await postService.unlikePost(localPost.id);
        setLocalPost(response.data);
      } else {
        const response = await postService.likePost(localPost.id);
        setLocalPost(response.data);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      const response = await postService.addComment(localPost.id, { content: commentContent });
      setLocalPost(response.data);
      setCommentContent('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postService.deletePost(localPost.id);
        onPostDeleted();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const isLiked = user && localPost.likes.includes(user.id);
  const canDelete = user && localPost.userId === user.id;

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">{localPost.username[0].toUpperCase()}</div>
          <div>
            <div className="author-name">{localPost.username}</div>
            <div className="post-date">
              {new Date(localPost.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="post-category">
          <span className={`category-badge category-${localPost.category}`}>
            {localPost.category}
          </span>
        </div>
      </div>

      <div className="post-content">
        {localPost.content}
      </div>

      <div className="post-actions">
        {isAuthenticated && (
          <button 
            className={`action-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            ❤️ {localPost.likes.length}
          </button>
        )}
        {!isAuthenticated && (
          <span className="action-info">❤️ {localPost.likes.length}</span>
        )}
        <button 
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {localPost.comments.length}
        </button>
        {canDelete && (
          <button 
            className="action-btn delete-btn"
            onClick={handleDelete}
          >
            🗑️ Delete
          </button>
        )}
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {localPost.comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first!</p>
            ) : (
              localPost.comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-author">{comment.username}</div>
                  <div className="comment-content">{comment.content}</div>
                  <div className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
          {isAuthenticated && (
            <form onSubmit={handleComment} className="comment-form">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Add a comment..."
              />
              <button type="submit">Post</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
