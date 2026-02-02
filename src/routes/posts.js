import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { 
  calculatePostScore, 
  getFeedBlocks, 
  composeFeed, 
  recordPostExposure 
} from '../utils/feedAlgorithm.js';
import { getMediaUrl, ensureAbsoluteUrl } from '../utils/urlHelper.js';
import { updateUserBadges } from '../utils/badgeHelper.js';
import { isFeatureUnlocked } from '../utils/creatorPhaseHelper.js';
import { getNewCreatorsFeed, getNewCreatorProgress, getNewCreatorSuggestions } from '../utils/discoveryHelper.js';
import { detectAbnormalGrowth, getUserAnomalyStatus } from '../utils/antiBotHelper.js';
import { applySanctions, getSanctionDetails } from '../utils/sanctionHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configuration de Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// Créer une publication
router.post('/', authenticate, upload.single('media'), async (req, res) => {
  try {
    const { content, description, type, caption, tags, format, isExclusive, isPartnership, isLive, isAudio, isDraft } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    // Vérification: au moins du contenu OU un media
    if (!content?.trim() && !req.file) {
      return res.status(400).json({ message: 'Veuillez ajouter du texte ou un média' });
    }

    const followerCount = req.user.followers?.length || 0;
    const isPro = ['Professionnel', 'Partenaire'].includes(req.user.category);
    const isTestLive = req.user.username === 'test_live';
    const creatorPhase = typeof req.user.getCreatorPhase === 'function' ? req.user.getCreatorPhase() : 'regular';

    const resolvedFormat = format || type || 'text';

    // Vérifier les déblocages par phase créateur
    if ((resolvedFormat === 'live' || resolvedFormat === 'audio') && !isFeatureUnlocked(creatorPhase, 'liveEnabled') && !isTestLive) {
      return res.status(403).json({ message: 'Lives et Audio sont réservés aux créateurs Bronze (1k+ abonnés).' });
    }

    if (resolvedFormat === 'exclusive' && !isFeatureUnlocked(creatorPhase, 'exclusiveEnabled')) {
      return res.status(403).json({ message: 'Le contenu exclusif est réservé aux créateurs Argent (100k+ abonnés).' });
    }

    if (resolvedFormat === 'partnership' && !isFeatureUnlocked(creatorPhase, 'partnerships')) {
      return res.status(403).json({ message: 'Les partenariats sont réservés aux créateurs Argent (100k+ abonnés).' });
    }

    // ⚠️ Vérifier la monétisation (excl + partnership)
    if ((resolvedFormat === 'exclusive' || resolvedFormat === 'partnership') && !req.user.monetizationEligible) {
      return res.status(403).json({ 
        message: 'Accès à la monétisation bloqué. Votre compte a des anomalies de croissance en cours d\'investigation.',
        reason: 'suspended_monetization'
      });
    }

    const postData = {
      author: req.user._id,
      content: content || '',
      description: description || '',
      type: resolvedFormat,
      format: resolvedFormat,
      isExclusive: resolvedFormat === 'exclusive' || isExclusive === 'true',
      isPartnership: resolvedFormat === 'partnership' || isPartnership === 'true',
      isLive: resolvedFormat === 'live' || isLive === 'true',
      isAudio: resolvedFormat === 'audio' || isAudio === 'true',
      isDraft: isDraft === 'true' || isDraft === true
    };

    if (req.file) {
      postData.media = {
        url: getMediaUrl(req.file.filename),
        caption: caption || ''
      };
    }

    if (tags) {
      postData.tags = JSON.parse(tags);
    }

    const post = new Post(postData);
    await post.save();

    await post.populate('author', 'username avatar');

    // Mettre à jour les stats de l'utilisateur pour le calcul des badges
    let author = null;
    try {
      author = await User.findById(req.user._id);
    } catch (findErr) {
      console.error('Erreur findById author:', findErr);
    }
    if (author) {
      // Enregistrer le premier post
      if (!author.firstPostAt) {
        author.firstPostAt = new Date();
      }

      // Ajouter la date du post aux stats
      if (!author.stats) author.stats = {};
      if (!author.stats.lastPostDates) author.stats.lastPostDates = [];
      author.stats.lastPostDates.push(new Date());
      // Garder seulement les 30 derniers posts
      if (author.stats.lastPostDates.length > 30) {
        author.stats.lastPostDates = author.stats.lastPostDates.slice(-30);
      }
      author.stats.totalPosts = (author.stats.totalPosts || 0) + 1;
      
      try {
        await author.save();
      } catch (saveErr) {
        console.error('Erreur author.save():', saveErr);
      }
      
      // Recalculer les badges automatiques
      try {
        await updateUserBadges(author);
      } catch (badgeErr) {
        console.error('Erreur updateUserBadges:', badgeErr);
      }

      // Appliquer les sanctions si anomalies détectées
      if (author.suspiciousActivity) {
        try {
          await applySanctions(author._id);
        } catch (sanctErr) {
          console.error('Erreur applySanctions:', sanctErr);
        }
      }
    }

    // Normaliser les URLs pour retour immédiat
    try {
      if (post.media && post.media.url) {
        post.media.url = ensureAbsoluteUrl(post.media.url);
      }
      if (post.author && post.author.avatar) {
        post.author.avatar = ensureAbsoluteUrl(post.author.avatar);
      }
    } catch (normErr) {
      console.error('Erreur normalisation URLs (create post):', normErr);
    }

    res.status(201).json({ 
      message: 'Publication partagée ✨',
      post 
    });
  } catch (error) {
    console.error('Erreur création post:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Erreur lors de la création de la publication' });
  }
});

// ==== ROUTES SPÉCIFIQUES AVANT LES ROUTES PARAMÉTRÉES ====

// Liste des publications de l'utilisateur connecté
router.get('/me/list', authenticate, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .select('content description media type format isDraft isHidden createdAt updatedAt')
      .lean();

    const normalized = posts.map((p) => {
      const post = { ...p };
      try {
        if (post.media?.url) {
          post.media.url = ensureAbsoluteUrl(post.media.url);
        }
      } catch (err) {
        console.error('Erreur normalisation URL (me/list):', err);
      }
      return post;
    });

    res.json({ posts: normalized });
  } catch (error) {
    console.error('Erreur liste posts utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des publications' });
  }
});

// Obtenir le fil d'actualité avec algorithme Capitune
router.get('/feed', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Récupérer les 6 blocs du feed
    const blocks = await getFeedBlocks(req.user._id);

    if (!blocks) {
      return res.status(404).json({ message: 'Impossible de charger le feed' });
    }

    // Composer le feed final
    const feed = await composeFeed(req.user._id, blocks, limit);

    // Batch fetch posts to éviter N requêtes (gains latence)
    const feedIds = feed.map(p => p._id).filter(Boolean);
    const fullPosts = await Post.find({ _id: { $in: feedIds } })
      .populate('author', 'username fullName displayName avatar category followers spiritualPath')
      .populate('comments.author', 'username fullName displayName avatar')
      .lean();

    const fullMap = new Map(fullPosts.map(p => [p._id.toString(), p]));

    // Enrichir avec les scores et raisons, avec deduplication + ordre d'origine
    const enrichedFeed = [];
    const seenIds = new Set();

    for (const post of feed) {
      if (!post || !post._id) continue;
      const idStr = post._id.toString();
      if (seenIds.has(idStr)) continue;
      seenIds.add(idStr);

      const fullPost = fullMap.get(idStr);
      if (!fullPost || fullPost.isDraft || fullPost.isHidden) continue;

      // Calculer le score
      fullPost.score = await calculatePostScore(fullPost, req.user._id);

      // Ajouter les métadonnées pour l'UI
      fullPost._reason = post._reason;
      fullPost._sponsor = post._sponsor;

      // Normaliser les URLs médias/avatars
      try {
        if (fullPost.media && fullPost.media.url) {
          fullPost.media.url = ensureAbsoluteUrl(fullPost.media.url);
        }
        if (fullPost.author && fullPost.author.avatar) {
          fullPost.author.avatar = ensureAbsoluteUrl(fullPost.author.avatar);
        }
        if (Array.isArray(fullPost.comments)) {
          fullPost.comments = fullPost.comments.map(c => {
            if (c && c.author && c.author.avatar) {
              c.author.avatar = ensureAbsoluteUrl(c.author.avatar);
            }
            return c;
          });
        }
      } catch (normErr) {
        console.error('Erreur normalisation URLs:', normErr);
      }

      // Enregistrer l'exposition
      try {
        await recordPostExposure(fullPost._id, req.user._id, post._reason);
      } catch (err) {
        console.error('Erreur recording exposure:', err);
      }

      enrichedFeed.push(fullPost);
    }

    res.json({
      posts: enrichedFeed,
      page,
      total: enrichedFeed.length,
      algorithm: 'Capitune Feed v1.0'
    });
  } catch (error) {
    console.error('Erreur feed complète:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du fil', error: error.message });
  }
});

// Feed "Nouveaux créateurs" 🌱
router.get('/feed/new-creators', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Récupérer le feed des nouveaux créateurs
    const feed = await getNewCreatorsFeed(req.user._id, limit);

    // Enrichir avec les scores
    const enrichedFeed = [];
    for (const post of feed) {
      try {
        const fullPost = await Post.findById(post._id)
          .populate('author', 'username avatar category followers spiritualPath')
          .populate('comments.author', 'username avatar')
          .lean();

        if (fullPost && !fullPost.isDraft && !fullPost.isHidden) {
          // Calculer le score
          fullPost.score = await calculatePostScore(fullPost, req.user._id);

          // Normaliser les URLs
          try {
            if (fullPost.media && fullPost.media.url) {
              fullPost.media.url = ensureAbsoluteUrl(fullPost.media.url);
            }
            if (fullPost.author && fullPost.author.avatar) {
              fullPost.author.avatar = ensureAbsoluteUrl(fullPost.author.avatar);
            }
            if (Array.isArray(fullPost.comments)) {
              fullPost.comments = fullPost.comments.map(c => {
                if (c && c.author && c.author.avatar) {
                  c.author.avatar = ensureAbsoluteUrl(c.author.avatar);
                }
                return c;
              });
            }
          } catch (normErr) {
            console.error('Erreur normalisation URLs:', normErr);
          }

          enrichedFeed.push({
            ...fullPost,
            _reason: 'new_creators',
            _badge: '🌱 Nouveau créateur'
          });
        }
      } catch (err) {
        console.error('Erreur enrichissement post new-creators:', err);
      }
    }

    res.json({
      posts: enrichedFeed,
      total: enrichedFeed.length,
      feed_type: 'new_creators',
      description: 'Découvre les nouveaux créateurs! 🌱'
    });
  } catch (error) {
    console.error('Erreur feed nouveaux créateurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du feed', error: error.message });
  }
});

// Progression créateur nouveau
router.get('/:userId/creator-progress', authenticate, async (req, res) => {
  try {
    const progress = await getNewCreatorProgress(req.params.userId);
    
    if (!progress) {
      return res.status(404).json({ message: 'Cet utilisateur n\'est pas en phase nouveau' });
    }

    res.json({
      progress,
      tips: await getNewCreatorSuggestions(req.params.userId)
    });
  } catch (error) {
    console.error('Erreur creator-progress:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la progression' });
  }
});


// Obtenir une publication par ID
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'username avatar spiritualPath')
      .populate('comments.author', 'username avatar')
      .populate('originalPost');

    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    // Normaliser les URLs avant réponse
    try {
      if (post.media && post.media.url) {
        post.media.url = ensureAbsoluteUrl(post.media.url);
      }
      if (post.author && post.author.avatar) {
        post.author.avatar = ensureAbsoluteUrl(post.author.avatar);
      }
      if (Array.isArray(post.comments)) {
        post.comments = post.comments.map(c => {
          if (c && c.author && c.author.avatar) {
            c.author.avatar = ensureAbsoluteUrl(c.author.avatar);
          }
          return c;
        });
      }
    } catch (normErr) {
      console.error('Erreur normalisation URLs (postId):', normErr);
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la publication' });
  }
});

// Liker une publication (discret)
router.post('/:postId/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      // Retirer le like
      post.likes.splice(likeIndex, 1);
      await post.save();
      
      // Mettre à jour les stats d'engagement de l'auteur du post
      const author = await User.findById(post.author);
      if (author) {
        if (!author.stats) author.stats = {};
        author.stats.totalLikes = Math.max(0, (author.stats.totalLikes || 0) - 1);
        await author.save();
        await updateUserBadges(author);
      }
      
      res.json({ message: 'Like retiré', liked: false });
    } else {
      // Ajouter le like
      post.likes.push(req.user._id);
      await post.save();
      
      // Mettre à jour les stats d'engagement de l'auteur du post
      const author = await User.findById(post.author);
      if (author) {
        if (!author.stats) author.stats = {};
        author.stats.totalLikes = (author.stats.totalLikes || 0) + 1;
        await author.save();
        await updateUserBadges(author);
      }
      
      res.json({ message: 'Résonance 🤍', liked: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du like' });
  }
});

// Commenter une publication
router.post('/:postId/comment', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    post.comments.push({
      author: req.user._id,
      content: content.trim()
    });

    await post.save();
    await post.populate('comments.author', 'username avatar');

    // Mettre à jour les stats d'engagement de l'auteur du post
    const author = await User.findById(post.author);
    if (author) {
      if (!author.stats) author.stats = {};
      author.stats.totalComments = (author.stats.totalComments || 0) + 1;
      await author.save();
      await updateUserBadges(author);
    }

    res.status(201).json({ 
      message: 'Commentaire ajouté 💬',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire' });
  }
});

// Récupérer les commentaires d'une publication
router.get('/:postId/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('comments.author', 'username avatar')
      .select('comments');
    
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    res.json(post.comments || []);
  } catch (error) {
    console.error('Erreur récupération commentaires:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commentaires' });
  }
});

// Partager une publication
router.post('/:postId/share', authenticate, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.postId);
    if (!originalPost) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    // Vérifier si déjà partagé
    const alreadyShared = originalPost.shares.some(
      share => share.user.equals(req.user._id)
    );

    if (!alreadyShared) {
      originalPost.shares.push({ user: req.user._id });
      await originalPost.save();
    }

    res.json({ 
      message: alreadyShared ? 'Déjà partagé' : 'Publication partagée 🔁',
      shares: originalPost.shares.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du partage' });
  }
});

// Terminer un Live
router.put('/:postId/end-live', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    post.isLive = false;
    post.isDraft = true;
    post.endedAt = new Date();
    await post.save();
    
    res.json({ message: 'Live terminé', post });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la fin du Live' });
  }
});

// Publier un Live après montage
router.put('/:postId/publish', authenticate, async (req, res) => {
  try {
    const { content, description, tags } = req.body;
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    post.content = content;
    post.description = description;
    post.tags = tags;
    post.isDraft = false;
    await post.save();
    
    res.json({ message: 'Live publié', post });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la publication' });
  }
});

// Mettre à jour une publication (brouillon ou finale)
router.put('/:postId', authenticate, upload.single('media'), async (req, res) => {
  try {
    const { content, description, tags, format, type, caption, isDraft, isExclusive, isPartnership, isLive, isAudio } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const resolvedFormat = format || type || post.format || post.type || 'text';

    if (content) post.content = content;
    if (description !== undefined) post.description = description;
    post.type = resolvedFormat;
    post.format = resolvedFormat;
    post.isExclusive = resolvedFormat === 'exclusive' || isExclusive === 'true' || post.isExclusive;
    post.isPartnership = resolvedFormat === 'partnership' || isPartnership === 'true' || post.isPartnership;
    post.isLive = resolvedFormat === 'live' || isLive === 'true' || post.isLive;
    post.isAudio = resolvedFormat === 'audio' || isAudio === 'true' || post.isAudio;

    if (isDraft !== undefined) {
      post.isDraft = isDraft === 'true' || isDraft === true;
    }

    if (tags) {
      try {
        post.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (parseErr) {
        console.error('Erreur parsing tags (update post):', parseErr);
      }
    }

    if (req.file) {
      post.media = {
        url: getMediaUrl(req.file.filename),
        caption: caption || post.media?.caption || ''
      };
    }

    await post.save();
    await post.populate('author', 'username avatar');

    res.json({ message: 'Publication mise à jour', post });
  } catch (error) {
    console.error('Erreur mise à jour post:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la publication' });
  }
});

// Masquer / afficher une publication (soft hide)
router.post('/:postId/hide', authenticate, async (req, res) => {
  try {
    const { hidden = true } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    post.isHidden = hidden === true || hidden === 'true';
    await post.save();

    res.json({ message: hidden ? 'Publication masquée' : 'Publication réaffichée', post });
  } catch (error) {
    console.error('Erreur hide/unhide post:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la visibilité' });
  }
});

// Supprimer une publication
router.delete('/:postId', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await post.deleteOne();
    res.json({ message: 'Publication supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});

// Obtenir les détails des sanctions et restrictions
router.get('/sanctions/status', authenticate, async (req, res) => {
  try {
    const sanctionDetails = await getSanctionDetails(req.user._id);
    
    if (!sanctionDetails) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Détails des restrictions',
      sanctions: sanctionDetails
    });
  } catch (error) {
    console.error('Erreur consultation sanctions:', error);
    res.status(500).json({ message: 'Erreur lors de la consultation des sanctions' });
  }
});

export default router;
