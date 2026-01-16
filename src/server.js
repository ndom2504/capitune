import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB } from './config/database.js';

// Import routes  
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import contactRoutes from './routes/contacts.js';
import analyticsRoutes from './routes/analytics.js';
import monetizationRoutes from './routes/monetization.js';
import creatorRoutes from './routes/creator.js';
import marketplaceRoutes from './routes/marketplace.js';
import insideRoutes from './routes/inside.js';
import notificationRoutes from './routes/notifications.js';
import communitiesRoutes from './routes/communities.js';
import eventsRoutes from './routes/events.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

// Middleware
const defaultAllowed = [
  'https://www.capitune.com',
  'https://capiatune.web.app',
  'https://capitune.web.app'
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .concat(defaultAllowed);

const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser requêtes sans origin (ex: outils CLI) et les origines whitelistees
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/inside', insideRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/events', eventsRoutes);

// Health check endpoint (pour Docker, Railway, etc.)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route de base
app.get('/', (req, res) => {
  res.json({ 
    message: '🌿 Bienvenue sur l\'API Capitune',
    version: '1.0.0',
    philosophy: 'Un espace de présence, pas de performance'
  });
});

// Connexion à MongoDB
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🌙 Serveur Capitune lancé sur le port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  });

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Une erreur est survenue',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
