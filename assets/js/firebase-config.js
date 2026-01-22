/**
 * Firebase Configuration for Who-Bible
 * Supports both modular SDK (v10+) and compat SDK (v9)
 * Used for: Authentication, Firestore, Realtime Database
 */

// Import Firebase modular SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase configuration
// IMPORTANT: These are your production credentials
// Get them from: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyB_3QdJKS4hbCq4I6PecRG8yI0RngMdd9c",
  authDomain: "who-bible.firebaseapp.com",
  databaseURL: "https://who-bible-default-rtdb.firebaseio.com",
  projectId: "who-bible",
  storageBucket: "who-bible.firebasestorage.app",
  messagingSenderId: "1034048891862",
  appId: "1:1034048891862:web:f2786d1cba8f3c0a8bd277"
};

// Initialize Firebase
let app;
let auth;
let db; // Firestore
let realtimeDb; // Realtime Database

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  realtimeDb = getDatabase(app);
  console.log('✓ Firebase initialized successfully (modular SDK)');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Export Firebase instances for modular SDK (used by auth.js, etc.)
export { auth, db, realtimeDb as database, app };

// Legacy support for compat SDK (used by remote-challenge.js)
// This ensures backward compatibility with existing code
if (typeof window !== 'undefined') {
  // Check if compat SDK is loaded
  if (typeof firebase !== 'undefined') {
    let compatInitialized = false;
    let compatDatabase = null;

    function initializeCompatFirebase() {
      if (compatInitialized) return true;

      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        compatDatabase = firebase.database();
        compatInitialized = true;
        console.log('✓ Firebase compat SDK initialized');
        return true;
      } catch (error) {
        console.error('Firebase compat initialization error:', error);
        return false;
      }
    }

    // Export compat interface for legacy code
    window.FirebaseConfig = {
      initialize: initializeCompatFirebase,
      isAvailable: () => compatInitialized || initializeCompatFirebase(),
      getDatabase: () => compatDatabase,
      config: firebaseConfig
    };
  }
}
