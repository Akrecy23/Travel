let currentTab = null;
let currentTripId = null;
let currentTripTitle = null;

// Listen for when the form is created and ready
document.addEventListener("FormReady", e => {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  const { tabName, tripId } = e.detail;
  
  const form = document.getElementById("newExpenseForm");
  if (!form) return;
  
  form.addEventListener("submit", async ev => {
    ev.preventDefault();

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    const cost = parseFloat(data.cost) || 0;

    // Firestore references
    const expenseDocRef = window.db
      .collection("Trips").doc(tripId)
      .collection("Expenses").doc(tabName);

    const spendingsColRef = expenseDocRef.collection("Spendings");

    // Build spending data
    const expenseData = {
        Amount: cost,
        BookedDate: data.dateTime || "",
        Details: data.details || "",
        Header: data.header || "",
        PaidBy: data.paidBy || "",
        Type: data.type || ""
    };

    // Add new spending (auto-doc id)
    await spendingsColRef.add(expenseData);

    // ✅ Update totalSum
    const expenseDoc = await expenseDocRef.get();
    const currentTotal = parseFloat(expenseDoc.data()?.totalSum) || 0;
    const newTotal = currentTotal + cost;

    await expenseDocRef.update({ totalSum: newTotal });

    console.log("Saved new expense:", tabName, expenseData);

    // Hide form
    form.parentElement.style.display = "none";

    // Refresh UI
    renderTab(tabName, tripId);
    });
})


function openNewExpenseForm(tabName, tripId, tripTitle) {
  currentTab = tabName;
  currentTripId = tripId;
  // Only update if tripTitle is provided
  if (tripTitle) {
    currentTripTitle = tripTitle;
  }

  const formContainer = document.getElementById("newExpenseFormContainer");
  if (!formContainer) return;

  // Base header (trip + tab)
  let html = `
    <form id="newExpenseForm">
      <div class="form-title-row">
        <h3>New Expense</h3>
        <button type="button" class="close-form-btn" title="Close">✕</button>
      </div>
      <div class="form-header">
        <div class="field-pair">
          <label>Trip:</label>
          <input type="text" value="${currentTripTitle}" readonly>
        </div>
        <div class="field-pair">
          <label>Expenses for:</label>
          <input type="text" value="${tabName}" readonly>
        </div>
      </div>
      <div class="form-fields">
  `;

  html += `
    <label>Header:<span class="asterisk">*</span></label><input type="text" name="header" required>
    <label>Payment Date/Time:</label><input type="text" name="dateTime">
    <label>Details:</label><input type="text" name="details">
    <label>Paid By:<span class="asterisk">*</span></label><input type="text" name="paidBy" required>
    <label>Cost:<span class="asterisk">*</span></label><input type="text" name="cost" required>
    <label>Expense Type:<span class="asterisk">*</span></label>
    <select name="type" required>
      <option value="Accommodation">Accommodation</option>
      <option value="Activity">Activity</option>
      <option value="Flight">Flight</option>
      <option value="Food">Food</option>
      <option value="Transport">Transport</option>
      <option value="Others">Others</option>
    </select>
    </div>
    <div class="form-actions">
      <button type="submit">Save Expense</button>
    </div>
  </form>
  `;

  formContainer.innerHTML = html;
  formContainer.style.display = "block";
  formContainer.querySelector(".close-form-btn").addEventListener("click", () => {
    closeFormOverlay(tripId);
  });
  document.dispatchEvent(new CustomEvent("FormReady", {
    detail: { tabName, tripId }
  }));
}

// CLOSE FORM
function closeFormOverlay(tripId) {
  const formContainer = document.getElementById("newExpenseFormContainer");
  formContainer.style.display = "none";

  if (currentTab) {
    // re-render the same tab
    renderTab(currentTab, tripId);

    // re-apply highlight
    document.querySelectorAll("#modalTabs button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.expense === currentTab);
    });
  }

}







