// Function to open the Move Itinerary modal
function openMoveItineraryModal() {
  // Create overlay
  const moveModal = document.createElement("div");
  moveModal.className = "move-itinerary-modal";
  moveModal.innerHTML = `
    <div class="form-box">
      <div class="form-header">
        <h3>Move Itinerary</h3>
        <button class="close-form">✕</button>
      </div>
      <form id="moveForm">
        <label>Current Day</label>
        <input type="text" name="currentDay" placeholder="e.g. Day 1" required>

        <label>Target Day</label>
        <input type="text" name="targetDay" placeholder="e.g. Day 2" required>

        <label>Notes</label>
        <textarea name="notes" placeholder="Reason for moving"></textarea>

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
  moveModal.querySelector("#moveForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const payload = {
      currentDay: formData.get("currentDay"),
      targetDay: formData.get("targetDay"),
      notes: formData.get("notes"),
    };

    console.log("Move itinerary submitted:", payload);

    // TODO: Add Firestore update logic here to move the activity

    moveModal.remove(); // close after save
  });
}
