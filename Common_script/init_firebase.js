// THIS SCRIPT INITIALISES CONNECTION TO FIREBASE CONSOLE
// MUST RUN THIS FILE FIRST

// ======== CONFIGS ==========
// Unrestricted key for Auth (refresh must not be blocked)
const firebaseAuthConfig = {
  apiKey: "AIzaSyA1ihDzBAQ31SchaK3FbaR4QtJZzQqK0s4",
  authDomain: "travel-328e8.firebaseapp.com",
  projectId: "travel-328e8",
};

// Restricted key for Firestore/Storage (domain/API restrictions applied)
const firebaseDataConfig = {
  apiKey: "AIzaSyCyugbx_pPHi9pv3e9ljG2i6wziYnmTrvE",
  authDomain: "travel-328e8.firebaseapp.com",
  projectId: "travel-328e8",
  storageBucket: "travel-328e8.firebasestorage.app",
  messagingSenderId: "210082383366",
  appId: "1:210082383366:web:2628625b06780dec642587",
  measurementId: "G-9YWYBETLM3"
};

// ======== INITIALISE APPS ==========
const authApp = firebase.initializeApp(firebaseAuthConfig); // default app
const dataApp = firebase.initializeApp(firebaseDataConfig, "dataApp"); // secondary app

// ======== CONNECT SERVICES ==========
window.auth = authApp.auth();       // Auth uses unrestricted key
window.db = dataApp.firestore();   // Firestore uses restricted key

// ======== AUTH STATE HANDLING ==========
window.AUTH_READY = false;
window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Auth persistence set to LOCAL");
  })
  .catch(error => {
    console.error("Error setting persistence:", error);
  });

window.auth.onAuthStateChanged(user => {
  if (user) {
    window.CURRENT_UID = user.uid;
  } else {
    window.CURRENT_UID = null;
  }
  window.AUTH_READY = true;
  document.dispatchEvent(new Event("UserAuthenticated"));
});

