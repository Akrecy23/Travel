
let currentTab = null;

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


function openNewExpenseForm(tabName, tripId) {
  currentTab = tabName;
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
        <label>Trip:</label>
        <input type="text" value="${tripId}" readonly>
        <label>Expenses for:</label>
        <input type="text" value="${tabName}" readonly>
      </div>
      <div class="form-fields">
  `;

  html += `
    <label>Header:</label><input type="text" name="header">
    <label>Payment Date/Time:</label><input type="text" name="dateTime">
    <label>Details:</label><input type="text" name="details">
    <label>Paid By:</label><input type="text" name="paidBy">
    <label>Cost:</label><input type="text" name="cost">
    <label>Expense Type:</label><input type="text" name="type">
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