// FUNCTION FOR DELETING ENTIRE TRIP DOCUMENT
async function deleteTrip(yearId, country, groupId, tripId, card) {

  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  
  const input = prompt("Type 'confirm' to delete this trip:");
  if (input !== "confirm") {
    alert("Deletion cancelled.");
    return;
  }

  try {
    const baseRef = window.db
      .collection("User").doc(currentUserId)
      .collection("Year").doc(yearId);

    const tripRef = window.db
      .collection("User").doc(currentUserId)
      .collection("Year").doc(yearId)
      .collection("Country").doc(country)
      .collection("Group").doc(groupId)
      .collection("Trip").doc(tripId);

    // Delete nested subcollections first
    const subcollections = [
      "City",
      "Flight",
      "Itinerary",
      "Other Bookings",
      "Stay"
    ];

    for (const sub of subcollections) {
      const subSnap = await tripRef.collection(sub).get();
      for (const doc of subSnap.docs) {
        // Itinerary → delete nested Activities
        if (sub === "Itinerary") {
          const activitiesSnap = await doc.ref.collection("Activities").get();
          for (const act of activitiesSnap.docs) {
            await doc.ref.collection("Activities").doc(act.id).delete();
          }
        }

        // Delete the doc itself
        await tripRef.collection(sub).doc(doc.id).delete();
      }
    }

    // Finally delete the trip doc
    await tripRef.delete();
    console.log(`Trip ${tripId} deleted successfully`);

    // --- CLEANUP: delete parent Group if empty ---
    const groupRef = baseRef.collection("Country").doc(country).collection("Group").doc(groupId);
    const tripsSnap = await groupRef.collection("Trip").get();
    if (tripsSnap.empty) {
      await groupRef.delete();
      console.log(`Group ${groupId} deleted (no trips left)`);
    }

    // Determine section BEFORE removing card
    const sectionTitle = card.closest(".trips-section")?.querySelector(".section-title")?.textContent?.toLowerCase();
    // Remove from UI
    card.remove();
    // Remove from memory arrays
    ["current", "upcoming", "past"].forEach(section => {
      window.tripData[section] = window.tripData[section].filter(t => t.title !== tripId);
    });
    // Update stats safely
    if (sectionTitle) {
      if (sectionTitle.includes("current") && window.tripStats.current > 0) window.tripStats.current--;
      if (sectionTitle.includes("upcoming") && window.tripStats.upcoming > 0) window.tripStats.upcoming--;
      if (sectionTitle.includes("past") && window.tripStats.past > 0) window.tripStats.past--;
    }
    // Refresh back layout
    document.dispatchEvent(new Event("CreateHomeBackLayout"));
  } catch (err) {
    console.error("Error deleting trip:", err);
    alert("Failed to delete trip. Please try again.");
  }
}