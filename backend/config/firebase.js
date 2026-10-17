import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let db;

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log('Firebase initialized via FIREBASE_SERVICE_ACCOUNT_JSON');
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'bixa-product-finder',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      console.log('Firebase initialized via environment credentials');
    } else {
      // Default initialization (works with GOOGLE_APPLICATION_CREDENTIALS or Firebase Emulator)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'bixa-product-finder'
      });
      console.log(`Firebase initialized with Project ID: ${process.env.FIREBASE_PROJECT_ID || 'bixa-product-finder'}`);
    }
  }
  db = admin.firestore();
} catch (error) {
  console.warn('Firebase admin initialization warning:', error.message);
  db = null;
}

export { admin, db };
