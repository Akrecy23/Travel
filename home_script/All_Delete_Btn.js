// FUNCTION FOR DELETING OR REMOVING ACCESS TO A TRIP
async function deleteTrip(tripId, card) {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to delete a trip.");
    return;
  }

  const confirmed = confirm(`Remove your access to trip "${tripId}"?`);
  if (!confirmed) return;

  try {
    const tripRef = window.db.collection("Trips").doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      alert("Trip not found.");
      return;
    }

    const tripData = tripSnap.data();

    if (tripData.ownerUid === currentUserId) {
      // Owner → delete entire trip doc + subcollections
      const subcollections = ["City", "Transport", "Itinerary", "Other Bookings", "Stay", "Expenses", "Deleted Itinerary"];
      for (const sub of subcollections) {
        const subSnap = await tripRef.collection(sub).get();
        for (const doc of subSnap.docs) {
          // Remove sub-collections inside Itinerary & Expenses
          if (sub === "Itinerary") {
            const activitiesSnap = await doc.ref.collection("Activities").get();
            for (const act of activitiesSnap.docs) {
              await doc.ref.collection("Activities").doc(act.id).delete();
            }
          }
          if (sub === "Expenses") {
            const activitiesSnap = await doc.ref.collection("Activities").get();
            for (const act of activitiesSnap.docs) {
              await doc.ref.collection("Activities").doc(act.id).delete();
            }
          }
          await tripRef.collection(sub).doc(doc.id).delete();
        }
      }
      console.log("ran here");
      // Remove any pending invitations
      const pendingSnap = await window.db.collection("Invitations")
        .where("tripId", "==", tripId)
        .get()
      if (!pendingSnap.empty) {
        console.log("there's invitation");
        const batch = window.db.batch(); // optional: batch for efficiency
        pendingSnap.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log("Pending invitations deleted.");
      } else {
        console.log("No pending invitations found.");
      }
      
      await tripRef.delete();
      console.log(`Trip ${tripId} deleted by owner`);
    } else {
      // Collaborator → remove their UID entry from collaborators map
      const updateData = {};
      updateData[`collaborators.${currentUserId}`] = window.firebase.firestore.FieldValue.delete();
      await tripRef.update(updateData);
      // Remove from collaboratorIds
      await tripRef.update({
        collaboratorIds: window.firebase.firestore.FieldValue.arrayRemove(currentUserId)
      });
    }
    console.log(`Access removed for user ${currentUserId} from trip ${tripId}`);

    // --- UI + memory cleanup ---
    const sectionTitle = card.closest(".trips-section")?.querySelector(".section-title")?.textContent?.toLowerCase();
    card.remove();

    ["current", "upcoming", "past"].forEach(section => {
      window.tripData[section] = window.tripData[section].filter(t => t.tripId !== tripId);
    });

    if (sectionTitle) {
      if (sectionTitle.includes("current") && window.tripStats.current > 0) window.tripStats.current--;
      if (sectionTitle.includes("upcoming") && window.tripStats.upcoming > 0) window.tripStats.upcoming--;
      if (sectionTitle.includes("past") && window.tripStats.past > 0) window.tripStats.past--;
    }

    document.dispatchEvent(new Event("CreateHomeBackLayout"));
  } catch (err) {
    console.error("Error deleting/removing trip:", err);
    alert("Failed to remove trip access. Please try again.");
  }
}


