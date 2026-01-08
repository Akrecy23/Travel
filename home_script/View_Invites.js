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
    // --- 1. Invitations sent TO user ---
    const incomingSnap = await window.db.collection("Invitations")
      .where("toUid", "==", window.CURRENT_UID) // replace with your auth context
      .get();

    let incomingHTML = "";

    if (incomingSnap.empty) {
      incomingHTML = "<p>No incoming invitations.</p>";
    } else {
      // Render each invitation
      incomingHTML = incomingSnap.docs.map(doc => {
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
    }

    // --- Divider line ---
    const dividerHTML = `<hr style="border-top: 2px dashed #999; margin: 1em 0;"> 
                         <p style="text-align:center; font-weight:bold;">====== PENDING INVITES ======</p>`;

    // --- 2. Invitations I have SENT ---
    const outgoingSnap = await window.db.collection("Invitations")
      .where("fromUid", "==", window.CURRENT_UID)
      .get();

    let outgoingHTML = "";
    if (!outgoingSnap.empty) {
      outgoingHTML = outgoingSnap.docs.map(doc => {
        const data = doc.data();
        return `
          <div class="invitation-card" data-invitation-id="${doc.id}" data-trip-id="${data.tripId}">
            <p><strong>To:</strong> ${data.toUid}</p>
            <p><strong>Trip ID:</strong> ${data.tripId}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            ${data.status === "pending" ? `<button class="cancel-btn">Cancel</button>` : ""}
          </div>
        `;
      }).join("");
    } else {
      outgoingHTML = "<p>No outgoing invitations.</p>";
    }

    // --- Put it all together ---
    content.innerHTML = `
      <div id="incomingInvites">${incomingHTML}</div>
      ${dividerHTML}
      <div id="outgoingInvites">${outgoingHTML}</div>
    `;

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
              [`collaborators.${window.CURRENT_UID}`]: collaboratorObj,
              collaboratorIds: window.firebase.firestore.FieldValue.arrayUnion(window.CURRENT_UID)
            });

            // --- NEW LOGIC: read trip fields and update Suggested Activities / Food ---
            const tripDoc = await window.db.collection("Trips").doc(tripId).get();
            if (tripDoc.exists) {
              const tripData = tripDoc.data();
              const { cities = [], country, year } = tripData;
          
              const userSuggestedActivitiesRef = window.db
                .collection("Users")
                .doc(window.CURRENT_UID)
                .collection("Suggested Activities");
          
              const userSuggestedFoodRef = window.db
                .collection("Users")
                .doc(window.CURRENT_UID)
                .collection("Suggested Food");
          
              // 1. Array_City: add cities under `${country}Cities`
              await userSuggestedActivitiesRef.doc("Array_City").set({
                [`${country}Cities`]: window.firebase.firestore.FieldValue.arrayUnion(...cities)
              }, { merge: true });
          
              await userSuggestedFoodRef.doc("Array_City").set({
                [`${country}Cities`]: window.firebase.firestore.FieldValue.arrayUnion(...cities)
              }, { merge: true });
          
              // 2. Array_Country: add country to CountryList
              await userSuggestedActivitiesRef.doc("Array_Country").set({
                CountryList: window.firebase.firestore.FieldValue.arrayUnion(country)
              }, { merge: true });
          
              await userSuggestedFoodRef.doc("Array_Country").set({
                CountryList: window.firebase.firestore.FieldValue.arrayUnion(country)
              }, { merge: true });
          
              // 3. Array_Year: add year (NUMBER type) to YearList
              await userSuggestedActivitiesRef.doc("Array_Year").set({
                YearList: window.firebase.firestore.FieldValue.arrayUnion(Number(year))
              }, { merge: true });
          
              await userSuggestedFoodRef.doc("Array_Year").set({
                YearList: window.firebase.firestore.FieldValue.arrayUnion(Number(year))
              }, { merge: true });
            }

            // Delete invitation doc
            await window.db.collection("Invitations").doc(invitationId).delete();

            // Remove card from modal
            card.remove();
            if (!document.querySelector("#incomingInvites .invitation-card")) {
              document.getElementById("incomingInvites").innerHTML = "<p>No incoming invitations.</p>";
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
              if (!document.querySelector("#incomingInvites .invitation-card")) {
                document.getElementById("incomingInvites").innerHTML = "<p>No incoming invitations.</p>";
              }
            } catch (err) {
              console.error("Error declining invitation:", err);
              alert("Failed to decline invitation. Please try again.");
              btn.disabled = false;
            }
        });
      });

      // Attach listeners for cancel
      content.querySelectorAll(".cancel-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const card = btn.closest(".invitation-card");
          const invitationId = card.dataset.invitationId;
          btn.disabled = true;
      
          try {
            // Delete the invitation document
            await window.db.collection("Invitations").doc(invitationId).delete();
      
            // Remove card from modal
            card.remove();
      
            // If no outgoing cards left, show message
            if (!content.querySelector(".cancel-btn")) {
              document.getElementById("outgoingInvites").innerHTML = "<p>No outgoing invitations.</p>";
            }
          } catch (err) {
            console.error("Error canceling invitation:", err);
            alert("Failed to cancel invitation.");
            btn.disabled = false;
          }
        });
      });
  } catch (err) {
    console.error("Error loading invitations:", err);
    content.innerHTML = "<p>Something went wrong while loading invitations.</p>";
  }
}
