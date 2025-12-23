// renderTab.js
// HANDLES RENDERING OF A SINGLE EXPENSE TAB

window.renderTab = async function (expenseId, tripId) {
  const modalSummary = document.getElementById("modalSummary");
  const modalContent = document.getElementById("modalContent");

  const expenseRef = window.db
    .collection("Trips").doc(tripId)
    .collection("Expenses").doc(expenseId);
  
  // Re-fetch all expenses to get fresh totals
  const freshExpensesSnap = await window.db
    .collection("Trips").doc(tripId)
    .collection("Expenses")
    .get();
  if (freshExpensesSnap.empty) {
    modalSummary.innerHTML = "<p>No expenses yet.</p>";
  }
  window.sortedExpenses = freshExpensesSnap.docs;
  // Compute trip total
  const tripTotal = freshExpensesSnap.docs.reduce((sum, doc) => {
    const data = doc.data();
    return sum + (parseFloat(data.totalSum) || 0);
  }, 0);

  const spendingsSnap = await expenseRef.collection("Spendings").get();

  const tabTotal = spendingsSnap.docs.reduce((sum, spDoc) => {
    const data = spDoc.data();
    return sum + (parseFloat(data.Amount) || 0);
  }, 0);

  modalSummary.innerHTML = `
    <div class="summary-row">
      <span><strong>${expenseId} Total:</strong> SGD ${tabTotal.toFixed(2)}</span>
      <span><strong>Trip Total:</strong> SGD ${tripTotal.toFixed(2)}</span>
    </div>
  `;

  let contentHtml = `
    <div class="expenses-header-row">
      <h3>${expenseId} – Expenses</h3>
      <button class="new-expense-btn">+ New</button>
    </div>
  `;

  if (spendingsSnap.empty) {
    contentHtml += `<p>No spendings recorded.</p>`;
  } else {
    contentHtml += `
      <div class="spendings-grid">
        ${spendingsSnap.docs
          .map((spDoc) => {
            const data = spDoc.data();
            return `
              <div class="spending-card" data-id="${spDoc.id}">
                <div class="card-top-row">
                  <span class="tag ${data.Type}">${data.Type ?? "-"}</span>
                  <div class="card-actions">
                    <button class="edit-btn" title="Edit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="delete-btn" title="Delete">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="card-header">
                  <h4>${data.Header || "Unnamed Item"}</h4>
                </div>
                <div class="card-body">
                  <div><strong>Payment Date/Time:</strong> ${data.BookedDate ?? "-"}</div>
                  <div><strong>Details:</strong> ${data.Details ?? "-"}</div>
                  <div><strong>Paid by:</strong> ${data.PaidBy ?? "-"}</div>
                </div>
                <div class="card-amount">SGD ${data.Amount ?? "-"}</div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  modalContent.innerHTML = contentHtml;

  // =========== ATTACH BUTTON LISTENERS ============
  const cards = modalContent.querySelectorAll(".spending-card");
  cards.forEach((card) => {
    const spendingId = card.dataset.id;
    // For clicking of edit button
    const editBtn = card.querySelector(".edit-btn");
    editBtn.addEventListener("click", () => {
      enableSpendingEditing(
        expenseId, // tab name
        card,
        tripId,
        spendingId
      );
    });
    // For clicking of delete button
    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async () => {
      const confirmed = confirm(`Delete ${spendingId}?`);
      if (!confirmed) return;

      const deletedAmount = parseFloat(
        card.querySelector(".card-amount").textContent.replace("SGD ", "")
      ) || 0;

      const ref = window.db
        .collection("Trips").doc(tripId)
        .collection("Expenses").doc(expenseId)
        .collection("Spendings").doc(spendingId);

      await ref.delete();

      // Update totalSum
      const expenseDocRef = window.db
        .collection("Trips").doc(tripId)
        .collection("Expenses").doc(expenseId);

      const expenseDoc = await expenseDocRef.get();
      const currentTotal = parseFloat(expenseDoc.data()?.totalSum) || 0;

      await expenseDocRef.update({
        totalSum: currentTotal - deletedAmount
      });

      card.remove();
      // ✅ Update tab total in UI
      const tabTotalEl = document.querySelector("#modalSummary span:first-child");
      const currentTabTotal = parseFloat(tabTotalEl.textContent.replace(/[^0-9.]/g, "")) || 0;
      tabTotalEl.innerHTML = `<strong>${expenseId} Total:</strong> SGD ${(currentTabTotal - deletedAmount).toFixed(2)}`;

      // ✅ Update trip total in UI
      const tripTotalEl = document.querySelector("#modalSummary span:last-child");
      const currentTripTotal = parseFloat(tripTotalEl.textContent.replace(/[^0-9.]/g, "")) || 0;
      tripTotalEl.innerHTML = `<strong>Trip Total:</strong> SGD ${(currentTripTotal - deletedAmount).toFixed(2)}`;

      if (modalContent.querySelectorAll(".spending-card").length === 0) {
        renderTab(expenseId, tripId);
      }
    });
  });

  // Attach "+ New" listener
  const newBtn = modalContent.querySelector(".new-expense-btn");
  newBtn.addEventListener("click", () => {
    openNewExpenseForm(expenseId, tripId);
  });

};
