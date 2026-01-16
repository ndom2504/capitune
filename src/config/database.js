import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

export const connectDB = async () => {
  try {
    // Si on est en dev et qu'il n'y a pas de MONGODB_URI, utiliser mongodb-memory-server
    if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI) {
      console.log('🔧 Démarrage de MongoDB en mémoire pour développement...');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('✨ Connecté à MongoDB en mémoire');
    } else if (process.env.MONGODB_URI) {
      // Utiliser l'URI fournie
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✨ Connecté à MongoDB');
    } else {
      // Pas de MongoDB - mode dégradé (auth Firebase uniquement)
      console.log('⚠️ MONGODB_URI non configuré - démarrage sans base de données');
      console.log('✅ L\'authentification fonctionnera mais pas la sauvegarde des données');
    }
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    console.log('⚠️ Démarrage en mode dégradé sans base de données');
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Erreur déconnexion MongoDB:', error);
  }
};
