import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInWithCustomToken } from 'firebase/auth';


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // optional
};

// Basic runtime validation to help diagnose missing env vars
function validateFirebaseConfig(cfg) {
  const required = ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'];
  const missing = required.filter(k => !cfg[k] || String(cfg[k]).trim() === '' || String(cfg[k]).includes('YOUR_')); // catch placeholders
  if (missing.length) {
    console.error('[Firebase] Missing/placeholder config keys:', missing);
  }
  // Simple pattern check for API key (usually contains a dash and is ~39 chars)
  if (cfg.apiKey && cfg.apiKey.length < 20) {
    console.warn('[Firebase] apiKey seems too short – verify .env values loaded.');
  }
}
validateFirebaseConfig(firebaseConfig);

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const ts = serverTimestamp;

// Removed anonymous auth fallback: we now require backend custom token.
// If auth is required elsewhere, implement appropriate provider flows explicitly.

// Obtain custom token from backend session and sign in (preferred when anonymous disabled)
export async function signInWithBackendSession() {
  const endpoint = (import.meta.env.VITE_API_BASE_URL || '') + '/backend/src/routes/GetFirebaseCustomToken.php';
  try {
    const res = await fetch(endpoint, { credentials: 'include' });
    let data;
    try { data = await res.json(); } catch (_) { data = null; }
    if (!res.ok) {
      console.error('[Firebase] Custom token HTTP error:', res.status, data?.error || data);
      return { user: null, error: data?.error || 'http_error', detail: data };
    }
    if (!data || !data.success) {
      console.warn('[Firebase] Backend custom token fetch failed:', data?.error);
      return { user: null, error: data?.error || 'token_fetch_failed', detail: data };
    }
    const userCred = await signInWithCustomToken(auth, data.token);
    return { user: userCred.user, claims: data.claims || {}, error: null };
  } catch (e) {
    console.error('[Firebase] signInWithBackendSession exception:', e);
    return { user: null, error: 'network_error', detail: String(e) };
  }
}
