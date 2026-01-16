import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Community from '../models/Community.js';
import CommunityPost from '../models/CommunityPost.js';
import User from '../models/User.js';

const router = express.Router();

// ==================== DÉCOUVERTE & LISTING ====================

/**
 * Obtenir toutes les communautés (avec filtres)
 * GET /api/communities
 */
router.get('/', async (req, res) => {
  try {
    const { type, category, featured, limit = 20, page = 1 } = req.query;
    
    const query = { isActive: true };
    if (type) query.type = type;
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [communities, total] = await Promise.all([
      Community.find(query)
        .populate('creator', 'username avatar badges')
        .sort({ 'stats.memberCount': -1, lastActivityAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Community.countDocuments(query)
    ]);
    
    res.json({
      message: 'Communautés',
      communities: communities.map(c => c.toPublicProfile()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération communautés:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Obtenir les communautés recommandées
 * GET /api/communities/recommended
 */
router.get('/recommended', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const userInterests = user.interests || [];
    
    // Communautés suggérées basées sur intérêts
    const recommended = await Community.find({
      isActive: true,
      category: { $in: userInterests },
      'members.user': { $ne: req.user._id }
    })
      .populate('creator', 'username avatar')
      .limit(10)
      .sort({ 'stats.memberCount': -1 });
    
    res.json({
      message: 'Recommandations',
      communities: recommended.map(c => c.toPublicProfile())
    });
  } catch (error) {
    console.error('Erreur recommandations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Obtenir une communauté par slug
 * GET /api/communities/:slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug })
      .populate('creator', 'username avatar badges followers')
      .populate('members.user', 'username avatar badges');
    
    if (!community) {
      return res.status(404).json({ message: 'Communauté non trouvée' });
    }
    
    res.json({
      message: 'Communauté',
      community: community.toPublicProfile(),
      members: community.members.slice(0, 20) // Premiers membres
    });
  } catch (error) {
    console.error('Erreur récupération communauté:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== CRÉATION & GESTION ====================

/**
 * Créer une communauté
 * POST /api/communities
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, type, category, rules, access } = req.body;
    
    // Validation
    if (!name || !description || !type) {
      return res.status(400).json({
        message: 'Champs requis: name, description, type'
      });
    }
    
    // Vérifier niveau pour premium
    const user = await User.findById(req.user._id);
    const followersCount = user.followers?.length || 0;
    
    if (type === 'premium' && followersCount < 100000) {
      return res.status(403).json({
        message: 'Niveau Argent+ requis pour créer une communauté premium'
      });
    }
    
    // Générer slug unique
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    while (await Community.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Créer communauté
    const community = new Community({
      name,
      slug,
      description,
      type,
      category: category || 'other',
      creator: req.user._id,
      rules: rules || [],
      access: access || {},
      members: [{
        user: req.user._id,
        role: 'creator',
        joinedAt: new Date()
      }],
      stats: {
        memberCount: 1
      }
    });
    
    await community.save();
    
    res.status(201).json({
      message: 'Communauté créée',
      community: community.toPublicProfile()
    });
  } catch (error) {
    console.error('Erreur création communauté:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Mettre à jour une communauté
 * PUT /api/communities/:slug
 */
router.put('/:slug', authenticate, async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    
    if (!community) {
      return res.status(404).json({ message: 'Communauté non trouvée' });
    }
    
    // Vérifier permissions
    if (!community.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    const { description, rules, access, avatar, banner } = req.body;
    
    if (description) community.description = description;
    if (rules) community.rules = rules;
    if (access) community.access = { ...community.access, ...access };
    if (avatar) community.avatar = avatar;
    if (banner) community.banner = banner;
    
    await community.save();
    
    res.json({
      message: 'Communauté mise à jour',
      community: community.toPublicProfile()
    });
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== MEMBRES ====================

/**
 * Rejoindre une communauté
 * POST /api/communities/:slug/join
 */
router.post('/:slug/join', authenticate, async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    
    if (!community) {
      return res.status(404).json({ message: 'Communauté non trouvée' });
    }
    
    // Vérifier si déjà membre
    if (community.isMember(req.user._id)) {
      return res.status(400).json({ message: 'Déjà membre' });
    }
    
    // Vérifier accès
    if (!community.access.isPublic && community.access.requireApproval) {
      return res.status(400).json({
        message: 'Cette communauté nécessite une approbation'
      });
    }
    
    // Ajouter membre
    community.members.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date()
    });
    
    community.stats.memberCount = community.members.length;
    await community.save();
    
    res.json({
      message: 'Vous avez rejoint la communauté',
      community: community.toPublicProfile()
    });
  } catch (error) {
    console.error('Erreur rejoindre communauté:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Quitter une communauté
 * POST /api/communities/:slug/leave
 */
router.post('/:slug/leave', authenticate, async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    
    if (!community) {
      return res.status(404).json({ message: 'Communauté non trouvée' });
    }
    
    // Ne peut pas quitter si créateur
    if (community.creator.equals(req.user._id)) {
      return res.status(400).json({
        message: 'Le créateur ne peut pas quitter sa communauté'
      });
    }
    
    // Retirer membre
    community.members = community.members.filter(
      m => !m.user.equals(req.user._id)
    );
    
    community.stats.memberCount = community.members.length;
    await community.save();
    
    res.json({
      message: 'Vous avez quitté la communauté'
    });
  } catch (error) {
    console.error('Erreur quitter communauté:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Changer le rôle d'un membre
 * PUT /api/communities/:slug/members/:userId/role
 */
router.put('/:slug/members/:userId/role', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['member', 'moderator', 'animator'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }
    
    const community = await Community.findOne({ slug: req.params.slug });
    
    if (!community) {
      return res.status(404).json({ message: 'Communauté non trouvée' });
    }
    
    // Vérifier permissions
    if (!community.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    // Trouver membre
    const member = community.members.find(
      m => m.user.toString() === req.params.userId
    );
    
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    
    member.role = role;
    await community.save();
    
    res.json({
      message: 'Rôle mis à jour',
      member: {
        user: member.user,
        role: member.role
      }
    });
  } catch (error) {
    console.error('Erreur changement rôle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== POSTS ====================

/**
 * Obtenir les posts d'une communauté
 * GET /api/communities/:slug/posts
 */
router.get('/:slug/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const community = await Community.findOne({ slug: req.params.slug });
    
    if (!community) {
      return res.status(404).json({ message: 'Communauté non trouvée' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [posts, total] = await Promise.all([
      CommunityPost.find({ community: community._id, isActive: true })
        .populate('author', 'username avatar badges')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CommunityPost.countDocuments({ community: community._id, isActive: true })
    ]);
    
    res.json({
      message: 'Posts de la communauté',
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération posts:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Créer un post dans une communauté
 * POST /api/communities/:slug/posts
 */
router.post('/:slug/posts', authenticate, async (req, res) => {
  try {
    const { content, media, type, poll } = req.body;
    
    const community = await Community.findOne({ slug: req.params.slug });
    
    if (!community) {
      return res.status(404).json({ message: 'Communauté non trouvée' });
    }
    
    // Vérifier membre
    if (!community.canPost(req.user._id)) {
      return res.status(403).json({
        message: 'Vous devez être membre pour publier'
      });
    }
    
    const post = new CommunityPost({
      community: community._id,
      author: req.user._id,
      content,
      media: media || [],
      type: type || 'discussion',
      poll: poll || null
    });
    
    await post.save();
    
    // Mettre à jour stats communauté
    community.stats.postCount += 1;
    community.lastActivityAt = new Date();
    await community.save();
    
    await post.populate('author', 'username avatar badges');
    
    res.status(201).json({
      message: 'Post créé',
      post
    });
  } catch (error) {
    console.error('Erreur création post:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
