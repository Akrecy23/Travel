// THIS SCRIPT INITIALISES CONNECTION TO FIREBASE CONSOLE
// MUST RUN THIS FILE FIRST

// ======== CONFIG ==========
const firebaseConfig = {
  apiKey: "AIzaSyCyugbx_pPHi9pv3e9ljG2i6wziYnmTrvE",   // restricted key
  authDomain: "travel-328e8.firebaseapp.com",
  projectId: "travel-328e8",
  storageBucket: "travel-328e8.firebasestorage.app",
  messagingSenderId: "210082383366",
  appId: "1:210082383366:web:2628625b06780dec642587",
  measurementId: "G-9YWYBETLM3"
};

// ======== INITIALISE APP ==========
firebase.initializeApp(firebaseConfig);

// ======== CONNECT SERVICES ==========
window.auth = firebase.auth();        // Auth + Firestore share same app
window.db   = firebase.firestore();
window.storage = firebase.storage();

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

