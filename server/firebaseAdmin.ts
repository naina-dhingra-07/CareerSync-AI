import admin from 'firebase-admin';
import firebaseConfig from '../firebase-applet-config.json' assert { type: 'json' };

if (!admin.apps.length) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  console.log('Initializing Firebase Admin...');
  console.log('- Project ID:', projectId);
  console.log('- FIREBASE_CLIENT_EMAIL present:', !!clientEmail);
  console.log('- FIREBASE_PRIVATE_KEY present:', !!privateKey);
  
  if (clientEmail && privateKey) {
    console.log('- Using Service Account:', clientEmail);
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      })
    });
  } else {
    console.log('- Service account credentials missing, falling back to applicationDefault()');
    admin.initializeApp({
      projectId,
      credential: admin.credential.applicationDefault()
    });
  }
}

export default admin;
