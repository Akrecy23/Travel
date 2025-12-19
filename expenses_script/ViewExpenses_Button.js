// openExpensesModal.js
// HANDLES THE EXPENSES MODAL UI + TAB SWITCHING

async function openExpensesModal(currentUserId, yearId, countryId, groupId, tripId) {
  const modal = document.getElementById("expensesModal");

  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2 id="modalTitle">${tripId}</h2>
        <button id="closeModal">✕</button>
      </div>
      <div id="modalTabs" class="modal-tabs"></div>
      <div id="modalSummary" class="modal-summary"></div>
      <div id="modalContent" class="modal-body"></div>
      <!-- Overlay form container -->
      <div id="newExpenseFormContainer" class="form-overlay" style="display:none;"></div>
    </div>
  `;
  modal.style.display = "flex";

  const modalTabs = document.getElementById("modalTabs");

  // ===== Fetch Expenses docs =====
  const expensesSnap = await window.db
    .collection("User").doc(currentUserId)
    .collection("Year").doc(yearId)
    .collection("Country").doc(countryId)
    .collection("Group").doc(groupId)
    .collection("Trip").doc(tripId)
    .collection("Expenses")
    .get();

  // Sort docs so PreTrip comes first, then Day 1, Day 2, etc.
  const sortedExpenses = expensesSnap.docs.sort((a, b) => {
    if (a.id === "PreTrip") return -1;
    if (b.id === "PreTrip") return 1;
    const numA = parseInt(a.id.replace("Day", "")) || 0;
    const numB = parseInt(b.id.replace("Day", "")) || 0;
    return numA - numB;
  });

  // Build tabs
  modalTabs.innerHTML = sortedExpenses
    .map(
      (doc, i) => `
    <button class="${i === 0 ? "active" : ""}" data-expense="${doc.id}">
      ${doc.id}
    </button>
  `
    )
    .join("");

  // Store sortedExpenses globally so renderTab.js can use it
  window.sortedExpenses = sortedExpenses;

  // Initial render
  window.renderTab(sortedExpenses[0].id, currentUserId, yearId, countryId, groupId, tripId);

  // Tab switching
  modalTabs.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      modalTabs.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      window.selectedTab = btn.dataset.expense;

      window.renderTab(btn.dataset.expense, currentUserId, yearId, countryId, groupId, tripId);
    });
  });

  // Close modal
  function closeModal() {
    modal.style.display = "none";
  }
  document.getElementById("closeModal").onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}