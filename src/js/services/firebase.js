/**
 * PizzaFlow — Firebase Integration Service
 * Configura e inicializa os módulos do Firebase (Auth, Firestore, Storage).
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const sanitizeConfigValue = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(/^["']|["']$/g, '').trim();
};

const firebaseConfig = {
  apiKey: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_APP_ID)
};

const hasConfig = !!firebaseConfig.apiKey;

let app = null;
let db = null;
let auth = null;
let storage = null;

if (hasConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.info('🔥 Firebase inicializado com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar o Firebase:', error);
  }
} else {
  console.warn('⚠️ Firebase não configurado. PizzaFlow rodando em modo Mock/Offline.');
}

export const isFirebaseActive = hasConfig && !!db;
export { db, auth, storage };

/**
 * Executa uma Promise com limite de tempo (timeout).
 * Útil para evitar que requisições ao Firebase fiquem travadas infinitamente
 * quando o banco de dados não está ativado ou está inacessível.
 */
export async function withTimeout(promise, ms = 2500) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Firebase connection timeout'));
    }, ms);
  });
  
  return Promise.race([
    promise.then(val => {
      clearTimeout(timeoutId);
      return val;
    }),
    timeoutPromise
  ]).catch(err => {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  });
}
