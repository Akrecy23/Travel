// THIS SCRIPT ADJUSTS THE DAYS IN EXPENSES & ITINERARY SUBCOLLECTIONS 
// RUN WHEN USER EDITS BACK LAYOUT & DATE RANGE IS DIFFERENT

async function adjustTripDays(tripId, newStartDate, newEndDate) {
  // Navigate to edited Trip
  const tripRef = window.db.collection("Trips").doc(tripId);

  // Get number of days documents in Itinerary Subcollection (essentially original date range)
  const oldDaysSnap = await tripRef.collection("Itinerary").get();
  const oldDayCount = oldDaysSnap.size;

  // Get Date Range after user edits
  const newDayCount = Math.floor((newEndDate - newStartDate) / (1000*60*60*24)) + 1;

  // Check for changes in Date Range
  if (newDayCount > oldDayCount) {
    // ADDITION (extra day(s))
    for (let i = oldDayCount + 1; i <= newDayCount; i++) {
      const dayDate = new Date(newStartDate.getTime() + (i-1)*86400000); // need edit here

      // Expenses
      await tripRef.collection("Expenses").doc(`Day ${i}`).set({ totalSum: 0 }, { merge: true });

      // Itinerary
      await tripRef.collection("Itinerary").doc(`Day ${i}`).set({Date: formatDateString(dayDate)}, { merge: true }); // need edit here
    }
  } else if (newDayCount < oldDayCount) {
    // REMOVAL (reduced day(s))
    for (let i = oldDayCount; i > newDayCount; i--) {
      await tripRef.collection("Expenses").doc(`Day ${i}`).delete();
      await tripRef.collection("Itinerary").doc(`Day ${i}`).delete();
    }
  }

  // NEED EDIT HERE
  // UPDATE DATES for all days
  for (let i = 1; i <= newDayCount; i++) {
    const dayDate = new Date(newStartDate.getTime() + (i-1)*86400000);
    await tripRef.collection("Itinerary").doc(`Day ${i}`).set(
      { Date: formatDateString(dayDate) },
      { merge: true }
    );
  }
}
