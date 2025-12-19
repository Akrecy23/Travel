async function handleGoogleSignUp() {
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    const result = await window.auth.signInWithPopup(provider);
    const user = result.user;

    if (!user) {
      alert("Google sign-in failed. Please try again.");
      return;
    }

    // Check if this is a new user
    if (result.additionalUserInfo.isNewUser) {
      // Save user info in Firestore
      await window.db.collection('User').doc(user.uid).set({
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      alert(`Account created successfully! Welcome, ${user.displayName || user.email}! 🎉`);
      
      // Save UID locally and redirect
      window.CURRENT_UID = user.uid;
      localStorage.setItem("CURRENT_UID", user.uid);
      window.location.href = 'home.html';
    } else {
      alert("This account already exists. Please sign in instead.");
    }
  } catch (error) {
    console.error('Google sign-up error:', error);
    alert(`Google sign-up failed: ${error.message}`);
  }
}