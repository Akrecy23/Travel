async function openBookingsModal(tripId) {
  const modal = document.getElementById("bookingsModal");

  // Fetch trip doc to get title
  const tripSnap = await window.db.collection("Trips").doc(tripId).get();
  const tripData = tripSnap.exists ? tripSnap.data() : {};
  const tripTitle = tripData.title || tripId; // fallback to ID if no title

  // Build modal inner HTML dynamically
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2 id="modalTitle">${tripTitle} – Bookings</h2>
        <button id="closeModal">✕</button>
      </div>
      <div id="modalTabs" class="modal-tabs"></div>
      <div id="modalContent" class="modal-body"></div>
      <!-- Overlay form container -->
      <div id="newBookingFormContainer" class="form-overlay" style="display:none;"></div>
    </div>
  `;
  modal.style.display = "flex";

  const modalTabs = document.getElementById("modalTabs");

  // Hardcoded tabs
  const tabs = ["Flights", "Stay", "Others"];
  // Render tabs + New button
  modalTabs.innerHTML = `
    <div class="tabs-left">
      ${tabs.map((t, i) =>
        `<button class="${i === 0 ? "active" : ""}" data-tab="${t}">${t}</button>`
      ).join("")}
    </div>
    <button id="newBookingBtn" class="new-btn">+ New</button>
  `;

  const newBtn = document.getElementById("newBookingBtn");
  if (!newBtn) return;
  newBtn.addEventListener("click", () => {
    // Find the active tab
    const activeTab = document.querySelector("#modalTabs button.active");
    const tabName = activeTab ? activeTab.dataset.tab : null;
    if (!tabName) return;
    console.log(`+ New clicked in tab: ${tabName}`);
    // Show or build the form here
    openNewBookingForm(tabName, tripId);
  });

  // Initial render
  renderTab("Flights", tripId);

  // Tab switching
  modalTabs.querySelectorAll(".tabs-left button").forEach(btn => {
    btn.addEventListener("click", () => {
      modalTabs.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTab(btn.dataset.tab, tripId);
    });
  });

  // Close modal
  function closeModal() {
    modal.style.display = "none";
  }
  document.getElementById("closeModal").onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };
}

// ============== ATTACH DELETE LISTENERS ==============
document.addEventListener("BookingsRendered", e => {
  const { tabName, tripId } = e.detail;
  const modalContent = document.getElementById("modalContent");

  modalContent.querySelectorAll(".booking-card").forEach(card => {
    const docId = card.dataset.docId;
    const col = card.dataset.collection;

    card.querySelector(".delete-btn").addEventListener("click", async () => {
      const confirmed = confirm(`Delete ${docId}?`);
      if (!confirmed) return;

      const ref = window.db
        .collection("Trips").doc(tripId)
        .collection(col).doc(docId);

      await ref.delete();
      card.remove();

      if (modalContent.querySelectorAll(".booking-card").length === 0) {
        renderTab(tabName, tripId);
      }
    });
  });
});
