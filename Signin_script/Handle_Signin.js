// THIS SCRIPT CONTAINS CODE ON HANDLING USER SIGN IN

// ======= HANDLE GOOGLE SIGN IN =========
async function handleGoogleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    // Authorise Gmail during Sign In
    const result = await window.auth.signInWithPopup(provider);
    const user = result.user;

    if (!user) {
      alert("Google sign-in failed. Please try again.");
      return;
    }

    // If this is a new user, ask user to go to sign-up page
    if (result.additionalUserInfo.isNewUser) {
      alert("No account found. Please sign up first.");
      // Delete the just-created Auth user
      await user.delete();   // removes the UID from Firebase Auth
      return;
    }
    // Get unique UID
    const uid = user.uid;

    // Fetch nickname from Firestore (User collection)
    const userDoc = await window.db.collection("User").doc(uid).get();
    let nickname = null;
    if (userDoc.exists) {
      nickname = userDoc.data().nickname;
    }

    // Fallback to gmail (display name) if nickname not found
    if (!nickname) {
      nickname = user.displayName || user.email;
    }

    // Save UID locally and Redirect to Home Page
    window.CURRENT_UID = user.uid;
    localStorage.setItem("CURRENT_UID", user.uid);
    alert(`Welcome back, ${nickname}!`);
    window.location.href = "home.html";
  } catch (error) {
    console.error('Google sign-up error:', error);
    alert(`Google sign-in failed: ${error.message}`);
  }

}




