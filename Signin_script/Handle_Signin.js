// Initialize Firebase Auth
const auth = firebase.auth();
//auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

async function handleGoogleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    const result = await window.auth.signInWithPopup(provider);
    const user = result.user;

    if (!user) {
      alert("Google sign-in failed. Please try again.");
      return;
    }

    // If this is a new user, block sign-in (they should go to sign-up page)
    if (result.additionalUserInfo.isNewUser) {
      alert("No account found. Please sign up first.");
      return;
    }

    window.CURRENT_UID = user.uid;
    localStorage.setItem("CURRENT_UID", user.uid);
    alert(`Welcome back, ${user.email}!`);
    window.location.href = "home.html";
  } catch (error) {
    console.error('Google sign-up error:', error);
    alert(`Google sign-up failed: ${error.message}`);
  }
}