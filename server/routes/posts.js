const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authenticate } = require('../middleware/auth');

// Get all posts
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    let posts = category ? Post.getByCategory(category) : Post.getAll();
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get post by ID
router.get('/:id', (req, res) => {
  try {
    const post = Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create post (requires authentication)
router.post('/', authenticate, (req, res) => {
  try {
    const { content, category, language } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = Post.create({
      userId: req.user.id,
      username: req.user.username,
      content,
      category: category || 'general',
      language: language || 'english'
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like a post
router.post('/:id/like', authenticate, (req, res) => {
  try {
    const post = Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ error: 'Post already liked' });
    }

    const updatedPost = Post.addLike(req.params.id, req.user.id);
    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unlike a post
router.delete('/:id/like', authenticate, (req, res) => {
  try {
    const post = Post.removeLike(req.params.id, req.user.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to post
router.post('/:id/comments', authenticate, (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const post = Post.addComment(req.params.id, {
      userId: req.user.id,
      username: req.user.username,
      content
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
router.delete('/:id', authenticate, (req, res) => {
  try {
    const post = Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only the post author can delete it
    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    Post.delete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
