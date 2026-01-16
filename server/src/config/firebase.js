import admin from 'firebase-admin';

// Configuration Firebase Admin
// Note: Pour la production, utilisez un service account key JSON
// Pour le développement, on utilise les credentials par défaut
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'capiatune'
});

export const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Erreur vérification token Firebase:', error);
    throw new Error('Token Firebase invalide');
  }
};

export default admin;
