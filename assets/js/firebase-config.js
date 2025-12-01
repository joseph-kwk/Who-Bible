// Firebase Configuration for Who-Bible
// Remote Challenge & Community Features

// Firebase configuration
// IMPORTANT: Replace these with your own Firebase project credentials
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

// Firebase initialization status
let firebaseInitialized = false;
let database = null;

// Initialize Firebase
function initializeFirebase() {
  if (firebaseInitialized) return true;
  
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded. Remote features disabled.');
    return false;
  }
  
  // Check if config is set
  if (firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
    console.warn('Firebase not configured. Remote features disabled.');
    return false;
  }
  
  try {
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    // Get database reference
    database = firebase.database();
    firebaseInitialized = true;
    console.log('✓ Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

// Check if Firebase is available and configured
function isFirebaseAvailable() {
  if (!firebaseInitialized) {
    return initializeFirebase();
  }
  return true;
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.FirebaseConfig = {
    initialize: initializeFirebase,
    isAvailable: isFirebaseAvailable,
    getDatabase: () => database,
    config: firebaseConfig
  };
}
