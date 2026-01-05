// Function to open the Move Itinerary modal
function openMoveItineraryModal(tripId, currentDayId, activityId, days) {
  const moveModal = document.createElement("div");
  moveModal.className = "move-itinerary-modal";

  // Build dropdown options excluding current day
  const optionsHtml = days
    .filter(d => d.day !== currentDayId)
    .map(d => `<option value="${d.day}">${d.day}</option>`)
    .join("");

  moveModal.innerHTML = `
    <div class="form-box">
      <div class="form-header">
        <h3>Move Itinerary</h3>
        <button class="close-form">✕</button>
      </div>
      <form id="moveForm">
        <label>Move to Day:</label>
        <select name="targetDay" required>
          ${optionsHtml}
        </select>
        <div class="form-actions">
          <button type="submit">Move</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(moveModal);

  // Close button
  moveModal.querySelector(".close-form").addEventListener("click", () => {
    moveModal.remove();
  });

  // Handle form submission
  moveModal.querySelector("#moveForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const targetDayId = new FormData(e.target).get("targetDay");

    try {
      // References
      const currentDayRef = window.db.collection("Trips").doc(tripId)
        .collection("Itinerary").doc(currentDayId)
        .collection("Activities").doc(activityId);

      const targetDayRef = window.db.collection("Trips").doc(tripId)
        .collection("Itinerary").doc(targetDayId)
        .collection("Activities");

      // Get activity data
      const actSnap = await currentDayRef.get();
      if (!actSnap.exists) throw new Error("Activity not found");
      const actData = actSnap.data();

      // Remove from current day
      await currentDayRef.delete();

      // Re‑index current day’s remaining activities
      const currentActsSnap = await window.db.collection("Trips").doc(tripId)
        .collection("Itinerary").doc(currentDayId)
        .collection("Activities").orderBy("Order").get();

      let orderCounter = 1;
      const batch = window.db.batch();
      currentActsSnap.forEach(doc => {
        batch.update(doc.ref, { Order: orderCounter++ });
      });
      await batch.commit();

      // Add to target day with last order + 1
      const targetActsSnap = await targetDayRef.orderBy("Order").get();
      const newOrder = targetActsSnap.size + 1;
      await targetDayRef.doc(activityId).set({
        ...actData,
        Order: newOrder
      });

      // Update local arrays
      const currentDayObj = days.find(d => d.day === currentDayId);
      currentDayObj.activities = currentDayObj.activities.filter(a => a.id !== activityId);
      currentDayObj.activities.forEach((a, idx) => a.order = idx + 1);

      const targetDayObj = days.find(d => d.day === targetDayId);
      targetDayObj.activities.push({ ...actData, id: activityId, order: newOrder });

      // Refresh UI
      window.renderDay(days.findIndex(d => d.day === currentDayId));
      window.renderDay(days.findIndex(d => d.day === targetDayId));

    } catch (err) {
      console.error("Error moving activity:", err);
      alert("Failed to move activity. Please try again.");
    }

    moveModal.remove();
  });
}
