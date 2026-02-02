import express from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Fonction pour hasher un numéro de téléphone (normaliser d'abord)
const hashPhone = (phoneNumber) => {
  if (!phoneNumber) return null;
  // Normaliser le numéro (retirer espaces, tirets, etc.)
  const normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

// Synchroniser les contacts et trouver les utilisateurs existants
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { contacts } = req.body; // Array de { name, phoneNumber }
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ message: 'Liste de contacts requise' });
    }

    // Limiter à 500 contacts max par requête
    const limitedContacts = contacts.slice(0, 500);

    // Hasher tous les numéros
    const phoneHashes = limitedContacts
      .map(c => hashPhone(c.phoneNumber))
      .filter(Boolean);

    // Trouver les utilisateurs correspondants
    const existingUsers = await User.find({
      phoneHash: { $in: phoneHashes },
      _id: { $ne: req.user._id } // Exclure l'utilisateur courant
    }).select('username avatar phoneHash');

    // Mapper les résultats
    const found = [];
    const notFound = [];

    limitedContacts.forEach(contact => {
      const hash = hashPhone(contact.phoneNumber);
      const matchedUser = existingUsers.find(u => u.phoneHash === hash);
      
      if (matchedUser) {
        found.push({
          contactName: contact.name,
          phoneNumber: contact.phoneNumber,
          user: {
            _id: matchedUser._id,
            username: matchedUser.username,
            avatar: matchedUser.avatar
          }
        });
      } else {
        notFound.push({
          contactName: contact.name,
          phoneNumber: contact.phoneNumber
        });
      }
    });

    res.json({
      found,
      notFound,
      summary: {
        total: limitedContacts.length,
        onPlatform: found.length,
        notOnPlatform: notFound.length
      }
    });
  } catch (error) {
    console.error('Erreur synchronisation contacts:', error);
    res.status(500).json({ message: 'Erreur lors de la synchronisation des contacts' });
  }
});

// Mettre à jour le numéro de téléphone de l'utilisateur
router.put('/me/phone', authenticate, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({ message: 'Numéro de téléphone requis' });
    }

    // Vérifier si le numéro existe déjà
    const phoneHash = hashPhone(phoneNumber);
    const existing = await User.findOne({ phoneHash, _id: { $ne: req.user._id } });
    
    if (existing) {
      return res.status(400).json({ message: 'Ce numéro est déjà utilisé' });
    }

    // Mettre à jour
    req.user.phoneNumber = phoneNumber;
    req.user.phoneHash = phoneHash;
    await req.user.save();

    res.json({ 
      message: 'Numéro de téléphone mis à jour ✨',
      phoneNumber: phoneNumber
    });
  } catch (error) {
    console.error('Erreur mise à jour numéro:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du numéro' });
  }
});

// Supprimer le numéro de téléphone
router.delete('/me/phone', authenticate, async (req, res) => {
  try {
    req.user.phoneNumber = null;
    req.user.phoneHash = null;
    await req.user.save();

    res.json({ message: 'Numéro de téléphone supprimé' });
  } catch (error) {
    console.error('Erreur suppression numéro:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du numéro' });
  }
});

export default router;
