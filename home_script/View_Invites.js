async function openInvitationsModal() {
  const modal = document.getElementById("invitationsModal");

  // Build modal shell
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2>Invitations</h2>
        <button id="closeInvitations">✕</button>
      </div>
      <div id="invitationsContent" class="modal-body">
        <p>Loading invitations...</p>
      </div>
    </div>
  `;
  modal.style.display = "flex";

  // Attach close button listener immediately after injection
  const closeBtn = modal.querySelector("#closeInvitations");
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Also allow clicking outside modal-box to close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  const content = document.getElementById("invitationsContent");

  try {
    // Query invitations for the current user
    const snapshot = await window.db.collection("Invitations")
      .where("toUid", "==", window.CURRENT_UID) // replace with your auth context
      .get();

    if (snapshot.empty) {
      content.innerHTML = "<p>No invitations found.</p>";
      return;
    }

    // Render each invitation
    content.innerHTML = snapshot.docs.map(doc => {
      const data = doc.data();
      const showActions = data.status === "pending";
      return `
        <div class="invitation-card" data-invitation-id="${doc.id}" data-trip-id="${data.tripId}">
          <p><strong>From:</strong> ${data.fromNickname || data.fromEmail || data.fromUid}</p>
          <p><strong>Trip ID:</strong> ${data.tripId}</p>
          <p><strong>Status:</strong> ${data.status}</p>
         ${showActions ? `
            <div class="invitation-actions">
              <button class="accept-btn">Accept</button>
              <button class="decline-btn">Decline</button>
            </div>
          ` : ""}
        </div>
      `;
    }).join("");

    // Attach listeners for accept
    content.querySelectorAll(".accept-btn").forEach(btn => {
      btn.addEventListener("click", async e => {
        const card = btn.closest(".invitation-card");
        const invitationId = card.dataset.invitationId;
        const tripId = card.dataset.tripId;
        btn.disabled = true;

        try {
            // Update invitation status
            await window.db.collection("Invitations").doc(invitationId).update({ status: "accepted" });

            // Accept invitation handler
            const profileDoc = await window.db.collection("Profiles").doc(window.CURRENT_UID).get();
            let collaboratorObj = {};
            if (profileDoc.exists) {
              const profileData = profileDoc.data();
              collaboratorObj.nickname = profileData.nickname || profileData.displayName || null;
              collaboratorObj.email = profileData.email || null;
            }

            // Add collaborator to trip as a map keyed by UID
            await window.db.collection("Trips").doc(tripId).update({
              [`collaborators.${window.CURRENT_UID}`]: collaboratorObj
              collaboratorIds: window.firebase.firestore.FieldValue.arrayUnion(window.CURRENT_UID)
            });

            // Delete invitation doc
            await window.db.collection("Invitations").doc(invitationId).delete();

            // Remove card from modal
            card.remove();
            if (!content.querySelector(".invitation-card")) {
                content.innerHTML = "<p>No invitations found.</p>";
            }
            } catch (err) {
              console.error("Error accepting invitation:", err);
              alert("Failed to accept invitation. Please try again.");
              btn.disabled = false;
            }
        });
        });

        // Attach listeners for decline
        content.querySelectorAll(".decline-btn").forEach(btn => {
        btn.addEventListener("click", async e => {
            const card = btn.closest(".invitation-card");
            const invitationId = card.dataset.invitationId;
            btn.disabled = true;

            try {
            // Update invitation status
            await window.db.collection("Invitations").doc(invitationId).update({ status: "declined" });

            // Delete invitation doc
            await window.db.collection("Invitations").doc(invitationId).delete();

            // Remove card from modal
            card.remove();
            if (!content.querySelector(".invitation-card")) {
                content.innerHTML = "<p>No invitations found.</p>";
            }
            } catch (err) {
              console.error("Error declining invitation:", err);
              alert("Failed to decline invitation. Please try again.");
              btn.disabled = false;
            }
        });
    });
  } catch (err) {
    console.error("Error loading invitations:", err);
    content.innerHTML = "<p>Something went wrong while loading invitations.</p>";
  }
}

