// FUNCTION FOR ADDING COLLABORATORS DOCUMENT
async function addCollaborators(email, emailInput, card) {
  if (email) {
      // Call your function to handle sending
      sendCollaboratorInvite(email, card.dataset.trip);
      // Clear and hide form
      emailInput.value = "";
      card.querySelector(".collaborator-form").classList.add("hidden");
    } else {
      alert("Please enter a valid email.");
    }
}

async function sendCollaboratorInvite(email, tripId) {
  try {
    // Reference the Profiles collection
    const profilesRef = window.db.collection("Profiles");

    // Query by email field
    const snapshot = await profilesRef.where("email", "==", email).get();

    if (!snapshot.empty) {
      // Grab the UID from the doc ID (since doc ID = userId)
      const docSnap = snapshot.docs[0];
      const uid = docSnap.id;

      // User exists → send invitation
      alert(`Invitation has been sent to ${email} (UID: ${uid}) for trip ${tripId}`);

      // Example: create an invitation record
      // await window.db.collection("Invitations").add({
      //   tripId,
      //   uid,
      //   email,
      //   status: "pending",
      //   createdAt: firebase.firestore.FieldValue.serverTimestamp()
      // });
    } else {
      // User does not exist
      alert(`The invited user (${email}) does not exist.`);
    }
  } catch (err) {
    console.error("Error checking profile:", err);
    alert("Something went wrong while sending the invitation.");
  }
}
