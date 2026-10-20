import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const uid = process.env.ADMIN_UID;
if (!serviceAccountJson || !uid) throw new Error('Defina FIREBASE_SERVICE_ACCOUNT_JSON e ADMIN_UID.');
const serviceAccount = JSON.parse(serviceAccountJson);
const app = initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id }, 'grant-campobr-admin');
await getAuth(app).setCustomUserClaims(uid, { admin: true });
console.log(`Custom claim admin=true atribuído ao UID ${uid}. Faça logout/login para renovar o token.`);
