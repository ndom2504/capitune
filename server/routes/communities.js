const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const { authenticate } = require('../middleware/auth');

// Get all communities
router.get('/', (req, res) => {
  try {
    const communities = Community.getAll();
    res.json(communities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get community by ID
router.get('/:id', (req, res) => {
  try {
    const community = Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.json(community);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create community
router.post('/', authenticate, (req, res) => {
  try {
    const { name, description, level } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const community = Community.create({
      name,
      description,
      level: level || 'all',
      creatorId: req.user.id
    });

    res.status(201).json(community);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join community
router.post('/:id/join', authenticate, (req, res) => {
  try {
    const community = Community.addMember(req.params.id, req.user.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found or already a member' });
    }
    res.json(community);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave community
router.delete('/:id/join', authenticate, (req, res) => {
  try {
    const community = Community.removeMember(req.params.id, req.user.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.json(community);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
