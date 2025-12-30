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
      // Show nickname modal
      const modal = document.getElementById("nicknameModal");
      const input = document.getElementById("nicknameInput");
      const saveBtn = document.getElementById("nicknameSaveBtn");
      const cancelBtn = document.getElementById("nicknameCancelBtn");

      // Pre-fill with Google display name
      input.value = user.displayName || "";
      modal.style.display = "flex";

      return new Promise((resolve, reject) => {
        saveBtn.onclick = async () => {
          const nickname = input.value.trim() || user.displayName || user.email;

          // Save user info in Firestore
          await window.db.collection("User").doc(uid).set({
            email: user.email,
            nickname: nickname,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

          // Also create a profile document (doc id = uid)
          await window.db.collection("Profiles").doc(uid).set({
            email: user.email,
            nickname: nickname,
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

          alert(
            `Account created successfully! Welcome, ${
              nickname || user.displayName || user.email
            }! 🎉`
          );

          // Save UID locally and Redirect to Home Page
          window.CURRENT_UID = uid;
          localStorage.setItem("CURRENT_UID", uid);
          window.location.href = "home.html";

          resolve();
        };

        cancelBtn.onclick = async () => {
          await window.auth.signOut();
          modal.style.display = "none";
          reject("User cancelled sign-up");
        };
      });
    } else {
      // If account already exists, ask user to sign in
      alert("This account already exists. Please sign in instead.");
      await window.auth.signOut();
      return;
    }
  } catch (error) {
    console.error("Google sign-up error:", error);
    alert(`Google sign-up failed: ${error.message}`);
  }
}
