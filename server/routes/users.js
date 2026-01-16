const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { authenticate } = require('../middleware/auth');

// Get all users
router.get('/', (req, res) => {
  try {
    const users = User.getAll().map(user => user.toJSON());
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's posts
router.get('/:id/posts', (req, res) => {
  try {
    const posts = Post.getByUserId(req.params.id);
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, (req, res) => {
  try {
    const { bio, level } = req.body;
    const updates = {};
    
    if (bio !== undefined) updates.bio = bio;
    if (level !== undefined) updates.level = level;

    const updatedUser = User.update(req.user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow a user
router.post('/:id/follow', authenticate, (req, res) => {
  try {
    const targetUser = User.findById(req.params.id);
    const currentUser = User.findById(req.user.id);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Add to following list
    if (!currentUser.following.includes(req.params.id)) {
      currentUser.following.push(req.params.id);
    }

    // Add to followers list
    if (!targetUser.followers.includes(req.user.id)) {
      targetUser.followers.push(req.user.id);
    }

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unfollow a user
router.delete('/:id/follow', authenticate, (req, res) => {
  try {
    const targetUser = User.findById(req.params.id);
    const currentUser = User.findById(req.user.id);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    // Remove from following list
    currentUser.following = currentUser.following.filter(id => id !== req.params.id);

    // Remove from followers list
    targetUser.followers = targetUser.followers.filter(id => id !== req.user.id);

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
