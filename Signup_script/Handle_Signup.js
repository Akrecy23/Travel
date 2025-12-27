// THIS SCRIPT CONTAINS CODE ON HANDLING USER SIGN UP

// ========= HANDLE GOOGLE SIGN IN ===========
async function handleGoogleSignUp() {
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    // Authorise Gmail during Sign Up
    const result = await window.auth.signInWithPopup(provider);
    const user = result.user;

    if (!user) {
      alert("Google sign-in failed. Please try again.");
      return;
    }
    
    // Firebase Auth generates uid for each unique gmail
    const uid = user.uid;

    // Check if this is a new user
    if (result.additionalUserInfo.isNewUser) {
      // Prompt for nickname
      const nickname = prompt("Choose a username or nickname:");
      // Save user info in Firestore
      await window.db.collection('User').doc(user.uid).set({
        email: user.email,
        nickname: nickname || user.displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      // Also create a profile document (doc id = uid)
      await window.db.collection("Profiles").doc(uid).set({
        email: user.email,
        nickname: nickname || user.displayName
      });

      // ===== Initialise Suggested Activities & Suggested Food =====
      const userDocRef = window.db.collection("User").doc(uid);

      const initCollections = async (collectionName) => {
        await userDocRef.collection(collectionName).doc("Array_Country").set(
          { CountryList: [] },
          { merge: true }
        );
        await userDocRef.collection(collectionName).doc("Array_City").set(
          {},
          { merge: true }
        );
        await userDocRef.collection(collectionName).doc("Array_Year").set(
          { YearList: [] },
          { merge: true }
        );
      };

      await Promise.all([
        initCollections("Suggested Activities"),
        initCollections("Suggested Food"),
      ]);
      alert(`Account created successfully! Welcome, ${nickname || user.displayName || user.email}! 🎉`);
      
      // Save UID locally and Redirect to Home Page
      window.CURRENT_UID = user.uid;
      localStorage.setItem("CURRENT_UID", user.uid);
      window.location.href = 'home.html';
    } else {
      // If account already exists, ask user to sign in
      alert("This account already exists. Please sign in instead.");
      await auth.signOut();
      return;
    }
  } catch (error) {
    console.error('Google sign-up error:', error);
    alert(`Google sign-up failed: ${error.message}`);
  }

}


