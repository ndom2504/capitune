# 🌿 Guide d'installation et de démarrage — Capitune

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure) : https://nodejs.org/
- **MongoDB** (version 6 ou supérieure) : https://www.mongodb.com/try/download/community
  - Alternative : Utilisez MongoDB Atlas (cloud gratuit) : https://www.mongodb.com/cloud/atlas

## Installation

### 1. Installer les dépendances

Depuis la racine du projet, exécutez :

```bash
npm run install:all
```

Cette commande installera toutes les dépendances du projet (root, server, et client).

### 2. Configuration du serveur

1. Copiez le fichier `.env.example` vers `.env` dans le dossier `server/` :

```bash
cd server
copy .env.example .env
```

2. Modifiez le fichier `.env` avec vos paramètres :

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/capitune
JWT_SECRET=changez_ceci_par_une_chaine_secrete_aleatoire
NODE_ENV=development
```

**Notes importantes :**
- Si vous utilisez MongoDB Atlas, remplacez `MONGODB_URI` par votre connection string
- Générez un JWT_SECRET sécurisé (au moins 32 caractères aléatoires)

### 3. Démarrer MongoDB (si installation locale)

Sous Windows, MongoDB devrait démarrer automatiquement après l'installation.
Si ce n'est pas le cas :

```bash
# Démarrer le service MongoDB
net start MongoDB
```

Ou lancez manuellement MongoDB :

```bash
mongod --dbpath "C:\data\db"
```

## Lancement du projet

### Mode développement (recommandé)

Depuis la racine du projet :

```bash
npm run dev
```

Cette commande lance simultanément :
- Le serveur backend sur http://localhost:3000
- Le client frontend sur http://localhost:5173

### Lancement séparé

Si vous préférez lancer les services séparément :

**Terminal 1 - Serveur :**
```bash
cd server
npm run dev
```

**Terminal 2 - Client :**
```bash
cd client
npm run dev
```

## Accès à l'application

Une fois lancé, ouvrez votre navigateur :
- **Frontend** : http://localhost:5173
- **API Backend** : http://localhost:3000

## Premiers pas

1. Créez un compte via l'interface
2. Complétez votre profil
3. Créez votre première publication ✨
4. Explorez le fil d'actualité

## Structure du projet

```
capitune/
├── client/                 # Application React (Frontend)
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── context/       # Contextes React (Auth, etc.)
│   │   ├── pages/         # Pages de l'application
│   │   ├── utils/         # Utilitaires (API, etc.)
│   │   └── index.css      # Styles globaux
│   └── package.json
│
├── server/                # API Node.js (Backend)
│   ├── src/
│   │   ├── models/        # Modèles MongoDB (User, Post)
│   │   ├── routes/        # Routes API (auth, users, posts)
│   │   ├── middleware/    # Middlewares (auth)
│   │   └── server.js      # Point d'entrée du serveur
│   ├── uploads/           # Fichiers uploadés
│   └── package.json
│
└── package.json           # Scripts racine

```

## Résolution de problèmes

### Le serveur ne démarre pas

- Vérifiez que MongoDB est en cours d'exécution
- Vérifiez les paramètres dans le fichier `.env`
- Vérifiez que le port 3000 n'est pas déjà utilisé

### Le client ne se connecte pas au serveur

- Vérifiez que le backend tourne sur le port 3000
- Vérifiez la configuration du proxy dans `client/vite.config.js`

### Erreur de connexion MongoDB

- Vérifiez que MongoDB est démarré
- Vérifiez l'URI dans le fichier `.env`
- Si vous utilisez Atlas, vérifiez votre connexion internet et les paramètres de sécurité

## Build pour la production

### Build du client

```bash
cd client
npm run build
```

Les fichiers de production seront dans `client/dist/`

### Démarrage du serveur en production

```bash
cd server
NODE_ENV=production npm start
```

## Technologies utilisées

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool
- **React Router** - Routing
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Lucide React** - Icônes

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Base de données
- **Mongoose** - ODM MongoDB
- **JWT** - Authentification
- **Bcrypt** - Hashage des mots de passe
- **Multer** - Upload de fichiers

## Support

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur GitHub.

---

✨ Bienvenue sur Capitune — Un espace de présence, pas de performance.
