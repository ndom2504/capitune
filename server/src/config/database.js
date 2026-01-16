import mongoose from 'mongoose';

let mongoServer;

export const connectDB = async () => {
  try {
    // Si on est en dev et qu'il n'y a pas de MONGODB_URI, utiliser mongodb-memory-server
    if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI) {
      console.log('🔧 Démarrage de MongoDB en mémoire pour développement...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('✨ Connecté à MongoDB en mémoire');
    } else {
      // En production, MONGODB_URI doit être défini
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is required in production');
      }
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✨ Connecté à MongoDB');
    }
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    throw error;
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
