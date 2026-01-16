import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../config/firebase.js';

const router = express.Router();

const buildAuthProfile = (user) => ({
  ...user.toPublicProfile(),
  followingIds: user.following?.map((id) => id.toString()) || [],
  followersIds: user.followers?.map((id) => id.toString()) || []
});

// Inscription
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 30 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('category').optional().isIn(['À développer', 'Créatrice', 'Penseur', 'Visionnaire', 'Entrepreneur', 'Philosophe', 'Autre'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, category } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email ou nom d\'utilisateur est déjà utilisé' });
    }

    // Créer le nouvel utilisateur
    const user = new User({ 
      username, 
      email, 
      password,
      category: category || 'Autre'
    });
    await user.save();

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Bienvenue sur Capitune ✨',
      token,
      user: buildAuthProfile(user)
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

// Connexion
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie ✨',
      token,
      user: buildAuthProfile(user)
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// Connexion/Inscription avec Google
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Token Firebase requis' });
    }

    // Vérifier le token Firebase
    const decodedToken = await verifyFirebaseToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    // Chercher ou créer l'utilisateur
    let user = await User.findOne({ email });

    if (!user) {
      // Créer un nouveau compte
      const username = name?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
      
      // Vérifier si le username existe déjà
      let finalUsername = username;
      let counter = 1;
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      user = new User({
        username: finalUsername,
        email,
        password: uid, // Utiliser l'UID Firebase comme mot de passe (hashé automatiquement)
        avatar: picture || '',
        bio: ''
      });

      await user.save();
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie avec Google ✨',
      token,
      user: buildAuthProfile(user)
    });
  } catch (error) {
    console.error('Erreur authentification Google:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de l\'authentification Google' });
  }
});

// Connexion/Inscription avec Microsoft
router.post('/microsoft', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Token Microsoft requis' });
    }

    // Récupérer les infos utilisateur depuis Microsoft Graph
    const microsoftUserResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const microsoftUser = microsoftUserResponse.data;
    const { mail, userPrincipalName, displayName, id: microsoftId } = microsoftUser;
    const email = mail || userPrincipalName;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    // Chercher ou créer l'utilisateur
    let user = await User.findOne({ email });

    if (!user) {
      // Créer un nouveau compte seulement si aucun utilisateur avec cet email n'existe
      const username = displayName?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
      
      // Vérifier si le username existe déjà
      let finalUsername = username;
      let counter = 1;
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      user = new User({
        username: finalUsername,
        email,
        password: microsoftId, // Utiliser l'ID Microsoft comme mot de passe (hashé automatiquement)
        bio: '',
        followers: [],
        following: []
      });

      await user.save();
      console.log(`Nouveau compte Microsoft créé: ${user.username}`);
    } else {
      console.log(`Utilisateur existant trouvé: ${user.username}`);
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie avec Microsoft ✨',
      token,
      user: buildAuthProfile(user)
    });
  } catch (error) {
    console.error('Erreur authentification Microsoft:', error);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ message: 'Token Microsoft invalide ou expiré' });
    }
    
    res.status(500).json({ message: error.message || 'Erreur lors de l\'authentification Microsoft' });
  }
});

export default router;
