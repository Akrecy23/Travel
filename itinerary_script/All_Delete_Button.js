// FUNCTION FOR DELETING INDIVIDUAL ITINERARY ACTIVITY
async function deleteActivity(currentUserId, yearId, countryId, groupId, tripId, day, activityId, entry){
  const input = prompt("Type 'confirm' to delete this activity:");
  if (input === "confirm") {
    try {
      const activitiesRef = window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(yearId)
        .collection("Country").doc(countryId)
        .collection("Group").doc(groupId)
        .collection("Trip").doc(tripId)
        .collection("Itinerary").doc(day)
        .collection("Activities")
      // Get the activity doc first
      const actSnap = await activitiesRef.doc(activityId).get();
      const actData = actSnap.data();
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
      // 🔑 Only if About/tag is "Food", update Suggested Food
      if (actData?.About === "Food") {
        const foodType = actData?.Tag; // stored when adding
        if (foodType) {
          const foodRef = window.db
            .collection("User").doc(currentUserId)
            .collection("Year").doc(yearId)
            .collection("Country").doc(countryId)
            .collection("Suggested Food").doc("Category")
            .collection(foodType)
            .doc(activityId); // assuming activityId == food doc id

          await foodRef.update({
            AddedTo: window.firebase.firestore.FieldValue.arrayRemove(tripId)
          });
          console.log(`Removed ${tripId} from AddedTo field in food doc`);
        }
      }
      // 🔑 If About/tag is "Activity", update Suggested Activities
      if (actData?.About === "Activity") {
        const activityType = actData?.Tag; // stored when adding
        if (activityType) {
          const activityRef = window.db
            .collection("User").doc(currentUserId)
            .collection("Year").doc(yearId)
            .collection("Country").doc(countryId)
            .collection("Suggested Activities").doc("Category")
            .collection(activityType)
            .doc(activityId); // assuming activityId == activity doc id

          await activityRef.update({
            AddedTo: window.firebase.firestore.FieldValue.arrayRemove(tripId)
          });
          console.log(`Removed ${tripId} from AddedTo field in activity doc`);
        }
      }
    } catch (err) {
      console.error("Error deleting activity:", err);
    }
  }
}

