// FUNCTION FOR EDITING OF BACK SIDE OF CARDS (ACTIVITY DETAILS)
async function enableSpendingEditing(tabName, cardEl, yearId, countryId, groupId, tripId, spendingId) {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  const headerEl = cardEl.querySelector(".card-header h4");
  const dateEl = cardEl.querySelector(".card-body div:nth-child(1)");
  const detailsEl = cardEl.querySelector(".card-body div:nth-child(2)");
  const paidByEl = cardEl.querySelector(".card-body div:nth-child(3)");
  const amountEl = cardEl.querySelector(".card-amount");
  const tagEl = cardEl.querySelector(".tag");

  // Store original values
  const original = {
    header: headerEl.textContent,
    date: dateEl.textContent.replace("Payment Date/Time: ", ""),
    details: detailsEl.textContent.replace("Details: ", ""),
    paidBy: paidByEl.textContent.replace("Paid by: ", ""),
    amount: amountEl.textContent.replace("SGD ", ""),
    type: tagEl ? tagEl.textContent : ""
  };

  // Convert to inputs
  headerEl.innerHTML = `<input type="text" class="edit-header" value="${original.header}">`;
  dateEl.innerHTML = `<strong>Payment Date/Time:</strong> <input type="text" class="edit-date" value="${original.date}">`;
  detailsEl.innerHTML = `<strong>Details:</strong> <input type="text" class="edit-details" value="${original.details}">`;
  paidByEl.innerHTML = `<strong>Paid by:</strong> <input type="text" class="edit-paidby" value="${original.paidBy}">`;
  amountEl.innerHTML = `SGD <input type="text" class="edit-amount" value="${original.amount}">`;

  if (tagEl) {
    tagEl.outerHTML = `<input type="text" class="edit-type" value="${original.type}">`;
  }

  // Hide original actions
  const actions = cardEl.querySelector(".card-actions");
  actions.style.display = "none";

  // Add ✔ ✖ action bar
  const editActions = document.createElement("div");
  editActions.className = "spending-edit-actions";
  editActions.innerHTML = `
    <button class="spending-save-btn">✔</button>
    <button class="spending-cancel-btn">✖</button>
  `;
  actions.insertAdjacentElement("afterend", editActions);

  // Cancel → restore original UI
  editActions.querySelector(".spending-cancel-btn").addEventListener("click", () => {
    headerEl.textContent = original.header;
    dateEl.innerHTML = `<strong>Payment Date/Time:</strong> ${original.date}`;
    detailsEl.innerHTML = `<strong>Details:</strong> ${original.details}`;
    paidByEl.innerHTML = `<strong>Paid by:</strong> ${original.paidBy}`;
    amountEl.textContent = `SGD ${original.amount}`;

    if (cardEl.querySelector(".edit-type")) {
      cardEl.querySelector(".edit-type").outerHTML =
        `<span class="tag ${original.type}">${original.type}</span>`;
    }

    editActions.remove();
    actions.style.display = "flex";
  });

  // Save → update Firestore
  editActions.querySelector(".spending-save-btn").addEventListener("click", async () => {
    const newData = {
      Header: cardEl.querySelector(".edit-header").value.trim(),
      BookedDate: cardEl.querySelector(".edit-date").value.trim(),
      Details: cardEl.querySelector(".edit-details").value.trim(),
      PaidBy: cardEl.querySelector(".edit-paidby").value.trim(),
      Amount: parseFloat(cardEl.querySelector(".edit-amount").value.trim()) || 0,
      Type: cardEl.querySelector(".edit-type")?.value.trim() || ""
    };

    try {
      await window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(yearId)
        .collection("Country").doc(countryId)
        .collection("Group").doc(groupId)
        .collection("Trip").doc(tripId)
        .collection("Expenses").doc(tabName)
        .collection("Spendings").doc(spendingId)
        .update(newData);

      const oldAmount = parseFloat(original.amount) || 0;
      const newAmount = parseFloat(newData.Amount) || 0;
      const diff = newAmount - oldAmount;

      const expenseDocRef = window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(yearId)
        .collection("Country").doc(countryId)
        .collection("Group").doc(groupId)
        .collection("Trip").doc(tripId)
        .collection("Expenses").doc(tabName);

      const expenseDoc = await expenseDocRef.get();
      const currentTotal = parseFloat(expenseDoc.data()?.totalSum) || 0;

      await expenseDocRef.update({
        totalSum: currentTotal + diff
      });

      // Refresh UI to see immediate changes
      renderTab(tabName, yearId, countryId, groupId, tripId)

      const typeInput = cardEl.querySelector(".edit-type");
      if (typeInput) {
        typeInput.outerHTML = `<span class="tag ${newData.Type}">${newData.Type}</span>`;
      }
    } catch (err) {
      console.error("Error updating spending:", err);
    } finally {
      editActions.remove();
      actions.style.display = "flex";
    }
  });
}
