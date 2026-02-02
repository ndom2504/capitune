import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

export const connectDB = async () => {
  try {
    // Si pas de MONGODB_URI, on bascule automatiquement en Mongo en mémoire
    if (!process.env.MONGODB_URI) {
      console.log('🔧 MONGODB_URI absent - démarrage de MongoDB en mémoire');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('✨ Connecté à MongoDB en mémoire');
    } else {
      // Utiliser l'URI fournie
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✨ Connecté à MongoDB');
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
