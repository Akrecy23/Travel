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

    content.innerHTML = ""; // clear loading text

    if (collaboratorEntries.length === 0) {
      content.textContent = "<p>No collaborators yet.</p>";
    } else {
      collaboratorEntries.forEach(([uid, c]) => {
        const card = document.createElement("div");
        card.className = "collaborator-card";
        card.dataset.uid = uid;

        card.innerHTML = `
          <p>
            <strong>${c.nickname || c.displayName || c.email}</strong><br>
            <small>${c.email || ""}</small>
          </p>
          ${isOwner ? `<button class="remove-collaborator-btn">Remove</button>` : ""}
        `;

        content.appendChild(card);
      });
    }

    // Add invitation form
    const form = document.createElement("div");
    form.className = "collaborator-form";
    form.innerHTML = `
      <input type="email" id="inviteEmail" placeholder="Enter collaborator's email">
      <button id="sendInviteBtn">Send Invitation</button>
    `;
    content.appendChild(form);

    document.getElementById("sendInviteBtn").onclick = async () => {
      const email = document.getElementById("inviteEmail").value.trim();
      if (!email) return alert("Enter an email.");
      await sendCollaboratorInvite(email, tripId);
    };

    // Event delegation for remove buttons
    if (isOwner) {
      content.addEventListener("click", async (e) => {
        if (e.target.classList.contains("remove-collaborator-btn")) {
          const card = e.target.closest(".collaborator-card");
          const uid = card.dataset.uid;
          e.target.disabled = true;

          try {
            await window.db.collection("Trips").doc(tripId).update({
              [`collaborators.${uid}`]: window.firebase.firestore.FieldValue.delete(),
              collaboratorIds: window.firebase.firestore.FieldValue.arrayRemove(uid)
            });

            card.remove();
            if (!content.querySelector(".collaborator-card")) {
              content.textContent = "No collaborators left.";
            }
          } catch (err) {
            console.error("Error removing collaborator:", err);
            alert("Failed to remove collaborator.");
            e.target.disabled = false;
          }
        }
      });
    }
  } catch (err) {
    console.error("Error loading collaborators:", err);
    content.textContent  = "<p>Something went wrong.</p>";
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

      // First check if user is already a collaborator
      const tripDoc = await window.db.collection("Trips").doc(tripId).get();
      if (tripDoc.exists) {
        const tripData = tripDoc.data();
        const collaboratorIds = tripData.collaboratorIds || [];
        const collaboratorsMap = tripData.collaborators || {};

        if (collaboratorIds.includes(toUid) || collaboratorsMap[toUid]) {
          alert(`User ${email} is already a collaborator on this trip.`);
          return;
        }
      }

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
