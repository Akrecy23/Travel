// FUNCTION FOR DELETING INDIVIDUAL ITINERARY ACTIVITY
async function deleteActivity(tripId, dayId, activityId, entry){
  const confirmed = confirm(`Delete ${activityId}?`);
  if (!confirmed) return;
  try {
    const activitiesRef = window.db
      .collection("Trips").doc(tripId)
      .collection("Itinerary").doc(dayId)
      .collection("Activities");
    // Get the activity doc first
    const actSnap = await activitiesRef.doc(activityId).get();
    const actData = actSnap.data();
    if (!actData) {
      console.warn("No activity data found");
      return;
    }
    // Delete the activity
    await activitiesRef.doc(activityId).delete();
    console.log(`Activity ${activityId} deleted successfully`);
    // Remove from UI
    entry.remove();
    // Recalculate order for remaining activities
    const remainingSnap = await activitiesRef.orderBy("Order").get();
    let updates = [];
    remainingSnap.docs.forEach((doc, index) => {
      updates.push(doc.ref.update({ Order: index + 1 }));
    });
    await Promise.all(updates);

    if (actData.About === "Food" || actData.About === "Activity"){
      // Save into "Deleted Itinerary" Collection
      const deletedRef = window.db
        .collection("Trips").doc(tripId)
        .collection("Deleted Itinerary").doc(activityId);
      await deletedRef.set({
        ...actData,
        deletedBy: window.CURRENT_UID,
        deletedAt: new Date()
      });
    }
  } catch (err) {
    console.error("Error deleting activity:", err);
  }
}
