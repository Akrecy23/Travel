async function openCollaboratorsModal(tripId) {
  const modal = document.getElementById("collaboratorsModal");
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2>Collaborators</h2>
        <button id="closeCollaborators">✕</button>
      </div>
      <div id="collaboratorsContent" class="modal-body">
        <p>Loading collaborators...</p>
      </div>
    </div>
  `;
  modal.style.display = "flex";

  const content = document.getElementById("collaboratorsContent");

  try {
    const tripDoc = await window.db.collection("Trips").doc(tripId).get();
    if (!tripDoc.exists) {
      content.innerHTML = "<p>Trip not found.</p>";
      return;
    }

    const tripData = tripDoc.data();
    const collaboratorsMap = tripData.collaborators || {};
    const collaboratorEntries = Object.entries(collaboratorsMap);
    const isOwner = tripData.ownerUid === window.CURRENT_UID;

    if (collaboratorEntries.length === 0) {
      content.innerHTML = "<p>No collaborators yet.</p>";
    } else {
      content.innerHTML = collaboratorEntries.map(([uid, c]) => `
        <div class="collaborator-card" data-uid="${uid}">
          <p>
            <strong>${c.nickname || c.displayName || c.email}</strong><br>
            <small>${c.email || ""}</small>
          </p>
          ${isOwner ? `<button class="remove-collaborator-btn">Remove</button>` : ""}
        </div>
      `).join("");

      // Attach remove listeners if owner
      if (isOwner) {
        content.querySelectorAll(".remove-collaborator-btn").forEach(btn => {
          btn.addEventListener("click", async () => {
            const card = btn.closest(".collaborator-card");
            const uid = card.dataset.uid;

            try {
              // Remove collaborator from map
              await window.db.collection("Trips").doc(tripId).update({
                [`collaborators.${uid}`]: window.firebase.firestore.FieldValue.delete()
              });

              card.remove();
              if (!content.querySelector(".collaborator-card")) {
                content.innerHTML = "<p>No collaborators left.</p>";
              }
            } catch (err) {
              console.error("Error removing collaborator:", err);
              alert("Failed to remove collaborator.");
            }
          });
        });
      }
    }

    // Add invitation form
    content.innerHTML += `
      <div class="collaborator-form">
        <input type="email" id="inviteEmail" placeholder="Enter collaborator's email">
        <button id="sendInviteBtn">Send Invitation</button>
      </div>
    `;

    document.getElementById("sendInviteBtn").onclick = async () => {
      const email = document.getElementById("inviteEmail").value.trim();
      if (!email) return alert("Enter an email.");
      await sendCollaboratorInvite(email, tripId);
    };

  } catch (err) {
    console.error("Error loading collaborators:", err);
    content.innerHTML = "<p>Something went wrong.</p>";
  }

  // Close modal
  document.getElementById("closeCollaborators").onclick = () => {
    modal.style.display = "none";
  };
  modal.onclick = e => {
    if (e.target === modal) modal.style.display = "none";
  };
}

// FUNCTION FOR ADDING COLLABORATORS DOCUMENT
async function addCollaborators(email, emailInput, card) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }
  await sendCollaboratorInvite(email, card.dataset.tripId);
  emailInput.value = "";
  card.querySelector(".collaborator-form").classList.add("hidden");
}

async function sendCollaboratorInvite(email, tripId) {
  try {
    const profilesRef = window.db.collection("Profiles");
    const snapshot = await profilesRef.where("email", "==", email).get();

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const toUid = docSnap.id;

      const fromUid = window.CURRENT_UID;
      const fromProfile = await window.db.collection("Profiles").doc(fromUid).get();
      let fromNickname = null;
      let fromEmail = null;
      if (fromProfile.exists) {
        fromNickname = fromProfile.data().nickname || fromProfile.data().displayName || "Unknown";
        fromEmail = fromProfile.data().email;
      }

      const invitationId = `${tripId}_${toUid}`;

      await window.db.collection("Invitations").doc(invitationId).set({
        tripId,
        fromUid,
        fromNickname,
        fromEmail,
        toUid,
        status: "pending",
      });

      alert(`Invitation has been sent to ${email} (UID: ${toUid}) for trip ${tripId}`);
    } else {
      alert(`The invited user (${email}) does not exist.`);
    }
  } catch (err) {
    console.error("Error checking profile:", err);
    alert("Something went wrong while sending the invitation.");
  }
}