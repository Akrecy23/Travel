// MUST RUN THIS FILE FIRST
// INITIALISE CONNECTION TO FIRESTORE DATABASE
const firebaseConfig = {
  apiKey: "AIzaSyCyugbx_pPHi9pv3e9ljG2i6wziYnmTrvE",
  authDomain: "travel-328e8.firebaseapp.com",
  projectId: "travel-328e8",
  storageBucket: "travel-328e8.firebasestorage.app",
  messagingSenderId: "210082383366",
  appId: "1:210082383366:web:2628625b06780dec642587",
  measurementId: "G-9YWYBETLM3"
};

// Initialize Firebase & set global
firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();

// ================= AUTH BOOTSTRAP =================
window.AUTH_READY = false;

window.auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (user) {
    window.CURRENT_UID = user.uid;
  } else {
    window.CURRENT_UID = null;
  }

  window.AUTH_READY = true;
  document.dispatchEvent(new Event("UserAuthenticated"));
});