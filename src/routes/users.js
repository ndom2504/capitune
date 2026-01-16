import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getMediaUrl, ensureAbsoluteUrl } from '../utils/urlHelper.js';
import { awardManualBadge, removeBadge } from '../utils/badgeHelper.js';
import { detectAbnormalGrowth, getUserAnomalyStatus } from '../utils/antiBotHelper.js';
import { updateUserBadges } from '../utils/badgeHelper.js';
import { applySanctions, cleanExpiredSanctions, getSanctionDetails, liftSanction, applySanctionManual } from '../utils/sanctionHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

const router = express.Router();

// Liste des utilisateurs (light public data)
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('username avatar category createdAt')
      .sort({ createdAt: -1 })
      .limit(12);

    res.json(users.map(u => u.toPublicProfile()));
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Rechercher un utilisateur par son username (insensible à la casse)
// Important: cette route doit être définie AVANT la route générique '/:userId'
router.get('/by-username/:username', authenticate, async (req, res) => {
  try {
    const raw = (req.params.username || '').trim();
    if (!raw) {
      return res.status(400).json({ message: 'Username requis' });
    }

    // Recherche exacte insensible à la casse
    const regex = new RegExp(`^${raw}$`, 'i');
    const user = await User.findOne({ username: regex }).select('username avatar _id');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Retourner un profil public minimal
    return res.json({
      user: {
        _id: user._id,
        username: user.username,
        avatar: ensureAbsoluteUrl(user.avatar)
      }
    });
  } catch (error) {
    console.error('Erreur recherche username:', error);
    res.status(500).json({ message: 'Erreur lors de la recherche' });
  }
});

// Helpers de profils
const getDefaultVisibility = (user) => user.visibility || { profile: 'public' };

const buildSelfProfile = (user) => ({
  ...user.toPublicProfile(),
  fullName: user.fullName || '',
  email: user.email,
  phoneNumber: user.phoneNumber || '',
  birthDate: user.birthDate || null,
  links: user.links || [],
  badgesVisibility: {
    showLevel: user.badgesVisibility?.showLevel ?? true
  },
  visibility: getDefaultVisibility(user),
  interests: user.interests || [],
  feedPrefs: {
    contentTypes: {
      video: user.feedPrefs?.contentTypes?.video ?? true,
      image: user.feedPrefs?.contentTypes?.image ?? true,
      text: user.feedPrefs?.contentTypes?.text ?? true
    },
    mood: {
      fun: user.feedPrefs?.mood?.fun ?? true,
      pro: user.feedPrefs?.mood?.pro ?? true
    },
    blockedKeywords: user.feedPrefs?.blockedKeywords || [],
    blockedAccounts: user.feedPrefs?.blockedAccounts?.map((id) => id.toString()) || [],
    resetAt: user.feedPrefs?.resetAt || null
  },
  notifications: {
    inApp: {
      likes: user.notifications?.inApp?.likes ?? true,
      comments: user.notifications?.inApp?.comments ?? true,
      follows: user.notifications?.inApp?.follows ?? true,
      mentions: user.notifications?.inApp?.mentions ?? true,
      lives: user.notifications?.inApp?.lives ?? true
    },
    push: {
      likes: user.notifications?.push?.likes ?? false,
      comments: user.notifications?.push?.comments ?? false,
      follows: user.notifications?.push?.follows ?? false,
      mentions: user.notifications?.push?.mentions ?? false,
      lives: user.notifications?.push?.lives ?? false
    },
    quietHours: {
      start: user.notifications?.quietHours?.start || '',
      end: user.notifications?.quietHours?.end || ''
    }
  },
  appPrefs: {
    theme: user.appPrefs?.theme || 'system',
    textSize: user.appPrefs?.textSize || 'md',
    language: user.appPrefs?.language || 'fr',
    autoDownloadVideos: user.appPrefs?.autoDownloadVideos ?? false,
    dataSaver: user.appPrefs?.dataSaver ?? false
  },
  monetization: {
    revenueBalance: user.monetization?.revenueBalance ?? 0,
    currency: user.monetization?.currency || 'USD',
    payout: {
      method: user.monetization?.payout?.method || 'none',
      iban: user.monetization?.payout?.iban || '',
      paypalEmail: user.monetization?.payout?.paypalEmail || '',
      threshold: user.monetization?.payout?.threshold ?? 20,
      frequency: user.monetization?.payout?.frequency || 'monthly'
    },
    toggles: {
      adsEnabled: user.monetization?.toggles?.adsEnabled ?? false,
      paidSubs: user.monetization?.toggles?.paidSubs ?? false,
      tipsEnabled: user.monetization?.toggles?.tipsEnabled ?? true
    }
  },
  partnerships: {
    creator: {
      acceptPartnerships: user.partnerships?.creator?.acceptPartnerships ?? false,
      allowedCategories: user.partnerships?.creator?.allowedCategories || [],
      rateCardHint: user.partnerships?.creator?.rateCardHint || ''
    },
    advertiser: {
      monthlyBudgetMax: user.partnerships?.advertiser?.monthlyBudgetMax ?? 0,
      targetCategories: user.partnerships?.advertiser?.targetCategories || [],
      adFrequency: user.partnerships?.advertiser?.adFrequency || ''
    }
  },
  onboardingStatus: {
    step: user.onboardingStatus?.step ?? 1,
    completed: user.onboardingStatus?.completed ?? false,
    lastUpdated: user.onboardingStatus?.lastUpdated || user.updatedAt
  },
  twoFAEnabled: user.twoFAEnabled ?? false,
  commentsWho: user.commentsWho || 'all',
  messagesWho: user.messagesWho || 'all',
  mentionsWho: user.mentionsWho || 'all',
  blockedAccounts: user.blockedAccounts?.map((id) => id.toString()) || [],
  badges: user.badges || [],
  creatorPhase: user.getCreatorPhase(),
  firstPostAt: user.firstPostAt || null,
  followingIds: user.following?.map((id) => id.toString()) || [],
  followersIds: user.followers?.map((id) => id.toString()) || []
});

router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: buildSelfProfile(req.user) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
});

// Obtenir le profil d'un utilisateur par son ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ user: user.toPublicProfile() });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
});

// Mettre à jour son profil
router.put('/me', authenticate, async (req, res) => {
  try {
    const {
      bio,
      spiritualPath,
      avatar,
      banner,
      category,
      fullName,
      phoneNumber,
      birthDate,
      links,
      badgesVisibility,
      visibility,
      interests
    } = req.body;

    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (spiritualPath !== undefined) updates.spiritualPath = spiritualPath;
    if (avatar !== undefined) updates.avatar = ensureAbsoluteUrl(avatar);
    if (banner !== undefined) updates.banner = ensureAbsoluteUrl(banner);
    if (fullName !== undefined) updates.fullName = fullName;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (birthDate !== undefined) updates.birthDate = birthDate ? new Date(birthDate) : null;
    if (Array.isArray(links)) updates.links = links.slice(0, 5);
    if (badgesVisibility?.showLevel !== undefined) {
      updates['badgesVisibility.showLevel'] = !!badgesVisibility.showLevel;
    }
    if (visibility?.profile !== undefined) {
      const validVisibility = ['public', 'private', 'limited'];
      if (validVisibility.includes(visibility.profile)) {
        updates['visibility.profile'] = visibility.profile;
      }
    }
    if (Array.isArray(interests)) {
      updates.interests = interests.slice(0, 15);
    }
    if (category !== undefined) {
      const validCategories = ['Régulier', 'Créateur', 'Professionnel', 'À développer', 'Créatrice', 'Penseur', 'Visionnaire', 'Entrepreneur', 'Philosophe', 'Autre', 'Créateur de contenu', 'Partenaire'];
      if (validCategories.includes(category)) {
        updates.category = category;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ 
      message: 'Profil mis à jour ✨',
      user: buildSelfProfile(user)
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
});

// Préférences (feed, notifications, app)
router.put('/me/preferences', authenticate, async (req, res) => {
  try {
    const { feedPrefs, notifications, appPrefs } = req.body;
    const updates = {};

    if (feedPrefs) {
      if (feedPrefs.contentTypes) {
        const ct = feedPrefs.contentTypes;
        updates['feedPrefs.contentTypes.video'] = ct.video ?? true;
        updates['feedPrefs.contentTypes.image'] = ct.image ?? true;
        updates['feedPrefs.contentTypes.text'] = ct.text ?? true;
      }
      if (feedPrefs.mood) {
        updates['feedPrefs.mood.fun'] = feedPrefs.mood.fun ?? true;
        updates['feedPrefs.mood.pro'] = feedPrefs.mood.pro ?? true;
      }
      if (Array.isArray(feedPrefs.blockedKeywords)) {
        updates['feedPrefs.blockedKeywords'] = feedPrefs.blockedKeywords.slice(0, 50);
      }
      if (Array.isArray(feedPrefs.blockedAccounts)) {
        updates['feedPrefs.blockedAccounts'] = feedPrefs.blockedAccounts;
      }
      if (feedPrefs.resetAt !== undefined) {
        updates['feedPrefs.resetAt'] = feedPrefs.resetAt ? new Date(feedPrefs.resetAt) : new Date();
      }
    }

    if (notifications) {
      if (notifications.inApp) {
        updates['notifications.inApp.likes'] = notifications.inApp.likes ?? true;
        updates['notifications.inApp.comments'] = notifications.inApp.comments ?? true;
        updates['notifications.inApp.follows'] = notifications.inApp.follows ?? true;
        updates['notifications.inApp.mentions'] = notifications.inApp.mentions ?? true;
        updates['notifications.inApp.lives'] = notifications.inApp.lives ?? true;
      }
      if (notifications.push) {
        updates['notifications.push.likes'] = notifications.push.likes ?? false;
        updates['notifications.push.comments'] = notifications.push.comments ?? false;
        updates['notifications.push.follows'] = notifications.push.follows ?? false;
        updates['notifications.push.mentions'] = notifications.push.mentions ?? false;
        updates['notifications.push.lives'] = notifications.push.lives ?? false;
      }
      if (notifications.quietHours) {
        updates['notifications.quietHours.start'] = notifications.quietHours.start || '';
        updates['notifications.quietHours.end'] = notifications.quietHours.end || '';
      }
    }

    if (appPrefs) {
      if (appPrefs.theme) updates['appPrefs.theme'] = appPrefs.theme;
      if (appPrefs.textSize) updates['appPrefs.textSize'] = appPrefs.textSize;
      if (appPrefs.language) updates['appPrefs.language'] = appPrefs.language;
      if (appPrefs.autoDownloadVideos !== undefined) updates['appPrefs.autoDownloadVideos'] = appPrefs.autoDownloadVideos;
      if (appPrefs.dataSaver !== undefined) updates['appPrefs.dataSaver'] = appPrefs.dataSaver;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Préférences mises à jour',
      user: buildSelfProfile(user)
    });
  } catch (error) {
    console.error('Erreur préférences:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des préférences' });
  }
});

// Monétisation
router.put('/me/monetization', authenticate, async (req, res) => {
  try {
    const { payout, toggles } = req.body;
    const updates = {};

    if (payout) {
      if (payout.method) updates['monetization.payout.method'] = payout.method;
      if (payout.iban !== undefined) updates['monetization.payout.iban'] = payout.iban;
      if (payout.paypalEmail !== undefined) updates['monetization.payout.paypalEmail'] = payout.paypalEmail;
      if (payout.threshold !== undefined) updates['monetization.payout.threshold'] = payout.threshold;
      if (payout.frequency) updates['monetization.payout.frequency'] = payout.frequency;
    }

    if (toggles) {
      if (toggles.adsEnabled !== undefined) updates['monetization.toggles.adsEnabled'] = toggles.adsEnabled;
      if (toggles.paidSubs !== undefined) updates['monetization.toggles.paidSubs'] = toggles.paidSubs;
      if (toggles.tipsEnabled !== undefined) updates['monetization.toggles.tipsEnabled'] = toggles.tipsEnabled;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Monétisation mise à jour',
      user: buildSelfProfile(user)
    });
  } catch (error) {
    console.error('Erreur monétisation:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la monétisation' });
  }
});

// Partenariats & publicité
router.put('/me/partnerships', authenticate, async (req, res) => {
  try {
    const { creator, advertiser } = req.body;
    const updates = {};

    if (creator) {
      if (creator.acceptPartnerships !== undefined) updates['partnerships.creator.acceptPartnerships'] = creator.acceptPartnerships;
      if (Array.isArray(creator.allowedCategories)) updates['partnerships.creator.allowedCategories'] = creator.allowedCategories.slice(0, 20);
      if (creator.rateCardHint !== undefined) updates['partnerships.creator.rateCardHint'] = creator.rateCardHint;
    }

    if (advertiser) {
      if (advertiser.monthlyBudgetMax !== undefined) updates['partnerships.advertiser.monthlyBudgetMax'] = advertiser.monthlyBudgetMax;
      if (Array.isArray(advertiser.targetCategories)) updates['partnerships.advertiser.targetCategories'] = advertiser.targetCategories.slice(0, 20);
      if (advertiser.adFrequency !== undefined) updates['partnerships.advertiser.adFrequency'] = advertiser.adFrequency;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Partenariats mis à jour',
      user: buildSelfProfile(user)
    });
  } catch (error) {
    console.error('Erreur partenariats:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des partenariats' });
  }
});

// Sécurité & confidentialité
router.put('/me/security', authenticate, async (req, res) => {
  try {
    const { twoFAEnabled, commentsWho, messagesWho, mentionsWho, blockedAccounts } = req.body;
    const updates = {};

    if (twoFAEnabled !== undefined) updates.twoFAEnabled = !!twoFAEnabled;
    const audienceEnum = ['all', 'followers', 'none'];
    if (commentsWho && audienceEnum.includes(commentsWho)) updates.commentsWho = commentsWho;
    if (messagesWho && audienceEnum.includes(messagesWho)) updates.messagesWho = messagesWho;
    if (mentionsWho && audienceEnum.includes(mentionsWho)) updates.mentionsWho = mentionsWho;
    if (Array.isArray(blockedAccounts)) updates.blockedAccounts = blockedAccounts;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Sécurité mise à jour',
      user: buildSelfProfile(user)
    });
  } catch (error) {
    console.error('Erreur sécurité:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la sécurité' });
  }
});

// Mettre à jour l'avatar avec upload de fichier
router.put('/me/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const avatarPath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Avatar mis à jour',
      user: buildSelfProfile(user)
    });
  } catch (error) {
    console.error('Erreur mise à jour avatar:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'avatar' });
  }
});

// Mettre à jour la bannière avec upload de fichier
router.put('/me/banner', authenticate, upload.single('banner'), async (req, res) => {
  try {
    if (req.body.remove) {
      // Supprimer la bannière
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { banner: '' },
        { new: true, runValidators: true }
      ).select('-password');

      return res.json({
        message: 'Bannière supprimée',
        user: user.toPublicProfile()
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const bannerUrl = getMediaUrl(req.file.filename);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { banner: bannerUrl },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Bannière mise à jour ✨',
      user: buildSelfProfile(user)
    });
  } catch (error) {
    console.error('Erreur mise à jour bannière:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la bannière' });
  }
});
router.post('/:userId/follow', authenticate, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (req.user._id.equals(userToFollow._id)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous suivre vous-même' });
    }

    // Vérifier si déjà suivi
    if (req.user.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: 'Vous suivez déjà cet utilisateur' });
    }

    // Ajouter aux listes
    req.user.following.push(userToFollow._id);
    userToFollow.followers.push(req.user._id);

    await req.user.save();
    await userToFollow.save();

    // Tracker la croissance d'abonnés pour le badge rising
    if (!userToFollow.stats) userToFollow.stats = {};
    if (!userToFollow.stats.followerGrowth) userToFollow.stats.followerGrowth = [];
    userToFollow.stats.followerGrowth.push({
      date: new Date(),
      count: userToFollow.followers.length
    });
    // Garder seulement les 30 derniers jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    userToFollow.stats.followerGrowth = userToFollow.stats.followerGrowth.filter(
      entry => entry.date >= thirtyDaysAgo
    );
    await userToFollow.save();
    
    // Vérifier les anomalies (anti-bot)
    await detectAbnormalGrowth(userToFollow._id);
    
    // Recalculer les badges automatiques
    await updateUserBadges(userToFollow);

    res.json({ 
      message: 'Vous suivez maintenant cet utilisateur 🤍',
      me: buildSelfProfile(req.user),
      target: userToFollow.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du suivi' });
  }
});

// Ne plus suivre un utilisateur
router.delete('/:userId/follow', authenticate, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    req.user.following = req.user.following.filter(id => !id.equals(userToUnfollow._id));
    userToUnfollow.followers = userToUnfollow.followers.filter(id => !id.equals(req.user._id));

    await req.user.save();
    await userToUnfollow.save();

    // Tracker la perte d'abonné pour le badge rising
    if (!userToUnfollow.stats) userToUnfollow.stats = {};
    if (!userToUnfollow.stats.followerGrowth) userToUnfollow.stats.followerGrowth = [];
    userToUnfollow.stats.followerGrowth.push({
      date: new Date(),
      count: userToUnfollow.followers.length
    });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    userToUnfollow.stats.followerGrowth = userToUnfollow.stats.followerGrowth.filter(
      entry => entry.date >= thirtyDaysAgo
    );
    await userToUnfollow.save();
    
    // Recalculer les badges automatiques
    await updateUserBadges(userToUnfollow);

    res.json({ 
      message: 'Vous ne suivez plus cet utilisateur',
      me: buildSelfProfile(req.user),
      target: userToUnfollow.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du désabonnement' });
  }
});

// Mettre à jour le statut en ligne
router.post('/status/online', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline: true, lastSeen: new Date() },
      { new: true }
    ).select('-password');

    res.json({ 
      message: 'Statut mis à jour',
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
});

// Mettre à jour le statut hors ligne
router.post('/status/offline', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline: false, lastSeen: new Date() },
      { new: true }
    ).select('-password');

    res.json({ 
      message: 'Statut mis à jour',
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
});

// Récupérer les amis en ligne (following qui sont online)
router.get('/online/all', authenticate, async (req, res) => {
  try {
    const allOnlineUsers = await User.find({
      isOnline: true,
      _id: { $ne: req.user._id } // Exclure soi-même
    })
      .select('username fullName displayName avatar isOnline lastSeen category badges')
      .sort({ lastSeen: -1 })
      .limit(50);

    res.json(allOnlineUsers.map(u => ({
      _id: u._id,
      username: u.username,
      fullName: u.fullName,
      displayName: u.displayName,
      avatar: ensureAbsoluteUrl(u.avatar),
      isOnline: u.isOnline,
      lastSeen: u.lastSeen,
      category: u.category,
      badges: u.badges
    })));
  } catch (error) {
    console.error('Erreur récupération utilisateurs en ligne:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

// Récupérer les amis en ligne (following qui sont online)
router.get('/online/friends', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('following', 'username fullName displayName avatar isOnline lastSeen category');
    
    const onlineFriends = (user.following || [])
      .filter(f => f && f.isOnline)
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

    res.json(onlineFriends.map(f => ({
      _id: f._id,
      username: f.username,
      fullName: f.fullName,
      displayName: f.displayName,
      avatar: ensureAbsoluteUrl(f.avatar),
      isOnline: f.isOnline,
      lastSeen: f.lastSeen,
      category: f.category
    })));
  } catch (error) {
    console.error('Erreur récupération amis en ligne:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

// Récupérer les abonnés en ligne (followers qui sont online)
router.get('/online/followers', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username fullName displayName avatar isOnline lastSeen category');
    
    const onlineFollowers = (user.followers || [])
      .filter(f => f && f.isOnline)
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

    res.json(onlineFollowers.map(f => ({
      _id: f._id,
      username: f.username,
      fullName: f.fullName,
      displayName: f.displayName,
      avatar: ensureAbsoluteUrl(f.avatar),
      isOnline: f.isOnline,
      lastSeen: f.lastSeen,
      category: f.category
    })));
  } catch (error) {
    console.error('Erreur récupération abonnés en ligne:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

// Récupérer les partenaires en ligne
router.get('/online/partners', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('partners', 'username fullName displayName avatar isOnline lastSeen category');
    
    const onlinePartners = (user.partners || [])
      .filter(p => p && p.isOnline)
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

    res.json(onlinePartners.map(p => ({
      _id: p._id,
      username: p.username,
      fullName: p.fullName,
      displayName: p.displayName,
      avatar: ensureAbsoluteUrl(p.avatar),
      isOnline: p.isOnline,
      lastSeen: p.lastSeen,
      category: p.category
    })));
  } catch (error) {
    console.error('Erreur récupération partenaires en ligne:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

// Attribuer un badge manuel (admin/moderator uniquement)
router.post('/:userId/badge', authenticate, async (req, res) => {
  try {
    // TODO: vérifier que req.user est admin (roles.includes('admin'))
    const { type, label, icon } = req.body;
    
    if (!type || !label || !icon) {
      return res.status(400).json({ message: 'Type, label et icon requis' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await awardManualBadge(targetUser, type, label, icon);

    res.json({
      message: 'Badge attribué',
      badges: targetUser.badges
    });
  } catch (error) {
    console.error('Erreur attribution badge:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de l\'attribution du badge' });
  }
});

// Retirer un badge (admin uniquement)
router.delete('/:userId/badge/:badgeType', authenticate, async (req, res) => {
  try {
    // TODO: vérifier que req.user est admin
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await removeBadge(targetUser, req.params.badgeType);

    res.json({
      message: 'Badge retiré',
      badges: targetUser.badges
    });
  } catch (error) {
    console.error('Erreur retrait badge:', error);
    res.status(500).json({ message: error.message || 'Erreur lors du retrait du badge' });
  }
});

// Vérifier l'activité suspecte d'un utilisateur (admin only)
router.get('/:userId/anomaly-status', authenticate, async (req, res) => {
  try {
    // TODO: vérifier que req.user est admin
    const anomalyStatus = await getUserAnomalyStatus(req.params.userId);
    
    if (!anomalyStatus) {
      return res.json({
        userId: req.params.userId,
        suspicious: false,
        message: 'Aucune activité suspecte détectée'
      });
    }

    res.json(anomalyStatus);
  } catch (error) {
    console.error('Erreur vérification anomalie:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification' });
  }
});

// Déclencher une analyse d'anomalie (admin only)
router.post('/:userId/check-anomaly', authenticate, async (req, res) => {
  try {
    // TODO: vérifier que req.user est admin
    const result = await detectAbnormalGrowth(req.params.userId);
    
    if (!result) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      analysis: result,
      action_recommended: result.suspicious ? 'monitor' : 'none'
    });
  } catch (error) {
    console.error('Erreur analyse anomalie:', error);
    res.status(500).json({ message: 'Erreur lors de l\'analyse' });
  }
});

// Obtenir les détails des sanctions d'un utilisateur
router.get('/:userId/sanctions', authenticate, async (req, res) => {
  try {
    // Admin ou self only
    if (req.user._id.toString() !== req.params.userId && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const sanctionDetails = await getSanctionDetails(req.params.userId);
    
    if (!sanctionDetails) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Détails des sanctions',
      sanctions: sanctionDetails
    });
  } catch (error) {
    console.error('Erreur consultation sanctions:', error);
    res.status(500).json({ message: 'Erreur lors de la consultation' });
  }
});

// Appliquer une sanction manuelle (admin only)
router.post('/:userId/apply-sanction', authenticate, async (req, res) => {
  try {
    // Vérifier que c'est un admin
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Seuls les admins peuvent appliquer des sanctions' });
    }

    const { sanctionType, level = 'moderate', durationDays = 14 } = req.body;

    if (!['reach_reduction', 'monetization_block', 'badge_removal'].includes(sanctionType)) {
      return res.status(400).json({ message: 'Type de sanction invalide' });
    }

    if (!['warning', 'moderate', 'severe'].includes(level)) {
      return res.status(400).json({ message: 'Niveau de sanction invalide' });
    }

    const result = await applySanctionManual(req.params.userId, sanctionType, level, durationDays);

    if (!result) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Sanction appliquée',
      sanction: result
    });
  } catch (error) {
    console.error('Erreur application sanction:', error);
    res.status(500).json({ message: 'Erreur lors de l\'application de la sanction' });
  }
});

// Lever une sanction (admin only)
router.post('/:userId/lift-sanction', authenticate, async (req, res) => {
  try {
    // Vérifier que c'est un admin
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Seuls les admins peuvent lever des sanctions' });
    }

    const { sanctionType } = req.body;

    if (!['reach_reduction', 'monetization_block', 'badge_removal'].includes(sanctionType)) {
      return res.status(400).json({ message: 'Type de sanction invalide' });
    }

    const result = await liftSanction(req.params.userId, sanctionType);

    if (!result) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Sanction levée',
      result
    });
  } catch (error) {
    console.error('Erreur levée sanction:', error);
    res.status(500).json({ message: 'Erreur lors de la levée de sanction' });
  }
});

// Nettoyer les sanctions expirées pour un utilisateur
router.post('/:userId/cleanup-sanctions', authenticate, async (req, res) => {
  try {
    // Admin only
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Seuls les admins peuvent nettoyer les sanctions' });
    }

    const result = await cleanExpiredSanctions(req.params.userId);

    if (!result) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Sanctions nettoyées',
      result
    });
  } catch (error) {
    console.error('Erreur nettoyage sanctions:', error);
    res.status(500).json({ message: 'Erreur lors du nettoyage' });
  }
});

export default router;
