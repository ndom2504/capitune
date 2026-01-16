import express from 'express';
import Campaign from '../models/Campaign.js';
import Opportunity from '../models/Opportunity.js';
import Contract from '../models/Contract.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helpers
const levelToMinFollowers = {
  bronze: 1000,
  argent: 100000,
  or: 1000000,
  platinium: 10000000,
};

// GET /api/marketplace/overview (annonceur)
router.get('/overview', authenticate, async (req, res) => {
  try {
    const advertiserId = req.user._id;

    const [activeCampaigns, proposalsSent, collaborations, budget] = await Promise.all([
      Campaign.countDocuments({ advertiser: advertiserId, status: 'active' }),
      Opportunity.countDocuments({}).where('campaign').in(
        await Campaign.find({ advertiser: advertiserId }).distinct('_id')
      ),
      Contract.countDocuments({ advertiser: advertiserId, status: { $in: ['signed', 'delivered', 'approved'] } }),
      Campaign.aggregate([
        { $match: { advertiser: advertiserId, status: { $in: ['draft', 'active'] } } },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ])
    ]);

    res.json({
      activeCampaigns,
      proposalsSent,
      collaborations,
      budgetRemaining: budget?.[0]?.total || 0
    });
  } catch (error) {
    console.error('Marketplace overview error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/marketplace/metrics (KPIs annonceur)
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const advertiserId = req.user._id;
    const period = String(req.query.period || '30d');

    const campaigns = await Campaign.find({ advertiser: advertiserId }).lean();

    const totals = campaigns.reduce((acc, c) => {
      const p = c.perfSnapshot || {};
      acc.budget += c.budget || 0;
      acc.reach += p.reach || 0;
      acc.engagement += p.engagement || 0;
      acc.clicks += p.clicks || 0;
      acc.conversions += p.conversions || 0;
      return acc;
    }, { budget: 0, reach: 0, engagement: 0, clicks: 0, conversions: 0 });

    const impressions = totals.reach;
    const engagement = totals.engagement;
    const clicks = totals.clicks;
    const conversions = totals.conversions;
    const budgetTotalCents = totals.budget;

    const denominator = conversions || clicks || engagement || impressions || 1;
    const costPerResultCents = Math.round(budgetTotalCents / denominator);

    const engagementRate = impressions > 0 ? (engagement / impressions) * 100 : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const convRate = impressions > 0 ? (conversions / impressions) * 100 : 0;
    let sqa = (engagementRate * 0.5) + (ctr * 0.3) + (convRate * 0.2);
    sqa = Math.max(0, Math.min(100, Math.round(sqa)));

    const roiIndex = budgetTotalCents > 0 ? Number(((conversions * 100 - (budgetTotalCents / 100)) / (budgetTotalCents / 100)).toFixed(2)) : 0;

    res.json({
      period,
      impressions,
      engagement,
      clicks,
      conversions,
      costPerResultCents,
      roiIndex,
      sqa,
      budgetTotalCents,
    });
  } catch (error) {
    console.error('Marketplace metrics error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/marketplace/campaigns
router.get('/campaigns', authenticate, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ advertiser: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(campaigns);
  } catch (error) {
    console.error('Marketplace campaigns list error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/marketplace/campaigns
router.post('/campaigns', authenticate, async (req, res) => {
  try {
    const payload = req.body || {};
    const campaign = await Campaign.create({
      advertiser: req.user._id,
      title: payload.title || 'Campagne sponsorisée',
      objective: payload.objective || 'branding',
      budget: payload.budget || 0,
      currency: payload.currency || 'USD',
      formats: payload.formats || [],
      themes: payload.themes || [],
      country: payload.country || '',
      language: payload.language || '',
      brief: payload.brief || '',
      deliverables: payload.deliverables || [],
      deadline: payload.deadline,
      requirements: payload.requirements || '',
      status: payload.status || 'draft'
    });
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Marketplace campaign create error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/marketplace/campaigns/:id
router.put('/campaigns/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, advertiser: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campagne introuvable' });
    res.json(campaign);
  } catch (error) {
    console.error('Marketplace campaign update error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/marketplace/campaigns/:id/proposals (inviter des créateurs)
router.post('/campaigns/:id/proposals', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { creatorIds = [], offerAmount = 0, currency = 'USD', message = '', deadline } = req.body;

    const campaign = await Campaign.findOne({ _id: id, advertiser: req.user._id });
    if (!campaign) return res.status(404).json({ message: 'Campagne introuvable' });

    const ops = creatorIds.map((creatorId) => ({
      campaign: campaign._id,
      creator: creatorId,
      offerAmount,
      currency,
      message,
      deadline,
      status: 'invited'
    }));

    const created = await Opportunity.insertMany(ops);
    res.status(201).json({ created: created.length });
  } catch (error) {
    console.error('Marketplace proposals error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/marketplace/creators (recherche simple)
router.get('/creators', authenticate, async (req, res) => {
  try {
    const { level, q } = req.query;
    const minFollowers = level ? levelToMinFollowers[level.toLowerCase()] || 0 : 0;

    // Récupérer un set raisonnable puis filtrer côté serveur
    const users = await User.find({}).select('username bio avatar followers category').limit(200).lean();

    const creators = users
      .map((u) => ({
        ...u,
        followersCount: u.followers?.length || 0,
      }))
      .filter((u) => u.followersCount >= minFollowers)
      .filter((u) => {
        if (!q) return true;
        return u.username.toLowerCase().includes(q.toLowerCase()) || (u.bio || '').toLowerCase().includes(q.toLowerCase());
      })
      .slice(0, 50);

    res.json(creators);
  } catch (error) {
    console.error('Marketplace creators search error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/marketplace/opportunities (côté créateur)
router.get('/opportunities', authenticate, async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'campaign', select: 'title objective budget currency advertiser deadline' })
      .lean();
    res.json(opportunities);
  } catch (error) {
    console.error('Marketplace opportunities error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH /api/marketplace/opportunities/:id/status
router.patch('/opportunities/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, negotiationNotes } = req.body;
    const opportunity = await Opportunity.findOneAndUpdate(
      { _id: id, creator: req.user._id },
      { $set: { status, negotiationNotes } },
      { new: true }
    );
    if (!opportunity) return res.status(404).json({ message: 'Opportunité introuvable' });

    // Auto-créer un contrat quand accepté
    if (status === 'accepted') {
      await Contract.create({
        campaign: opportunity.campaign,
        opportunity: opportunity._id,
        advertiser: (await Campaign.findById(opportunity.campaign)).advertiser,
        creator: opportunity.creator,
        amount: opportunity.offerAmount,
        currency: opportunity.currency,
        status: 'signed',
        signedByCreator: true,
        signedByAdvertiser: true,
        signedAt: new Date()
      });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('Marketplace opportunity status error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/marketplace/contracts (créateur)
router.get('/contracts', authenticate, async (req, res) => {
  try {
    const contracts = await Contract.find({ creator: req.user._id })
      .populate({ path: 'campaign', select: 'title objective' })
      .lean();
    res.json(contracts);
  } catch (error) {
    console.error('Marketplace contracts error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
