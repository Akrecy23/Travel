// FUNCTION FOR EDITING FRONT SIDE OF CARDS
async function enableCardEditing(tripId, card) {
  if (card.classList.contains("editing-front")) return;
  card.classList.add("editing-front");

  // Reference DOM nodes
  const tripTitleEl = card.querySelector(".trip-name");
  const countryEl = card.querySelectorAll(".trip-details .trip-detail")[0];
  const dateRangeEl = card.querySelectorAll(".trip-details .trip-detail")[1];

  // Store originals
  const originalTitle = tripTitleEl.textContent;
  const originalCountry = countryEl.textContent || "Enter country";
  const originalDateRange = dateRangeEl.textContent || "Enter date range";

  // Replace with inputs
  tripTitleEl.innerHTML = `<input type="text" class="edit-trip-title" value="${originalTitle}">`;
  countryEl.innerHTML = `<input type="text" class="edit-trip-country" value="${originalCountry}">`;
  dateRangeEl.innerHTML = `<input type="text" class="edit-trip-dateRange" value="${originalDateRange}">`;

  // Hide original footer buttons during editing
  const actionsContainer = card.querySelector(".trip-actions");
  if (actionsContainer) actionsContainer.style.display = "none";

  // Add ✔ ✖ action bar
  const editActions = document.createElement("div");
  editActions.className = "front-edit-actions";
  editActions.innerHTML = `
    <button class="front-tick-btn">✔</button>
    <button class="front-cancel-btn">✖</button>
  `;
  actionsContainer.insertAdjacentElement("afterend", editActions);

  // Cancel → restore
  editActions.querySelector(".front-cancel-btn").addEventListener("click", () => {
    tripTitleEl.textContent = originalTitle;
    countryEl.textContent = originalCountry || "No location available.";
    dateRangeEl.textContent = originalDateRange || "No date range available.";
    editActions.remove();
    if (actionsContainer) actionsContainer.style.display = "flex";
    card.classList.remove("editing-front");
  });

  // Tick → update Firestore
  editActions.querySelector(".front-tick-btn").addEventListener("click", async () => {
    const newTitle = card.querySelector(".edit-trip-title").value.trim();
    const newCountry = card.querySelector(".edit-trip-country").value.trim();
    const newDateRange = card.querySelector(".edit-trip-dateRange").value.trim();

    const currentUserId = window.CURRENT_UID;
    if (!currentUserId) {
      alert("You must be logged in to edit a trip.");
      return;
    }

    try {
      const tripRef = window.db.collection("Trips").doc(tripId);

      // Parse new date range if changed
      let tripStartDate, tripEndDate;
      if (newDateRange !== originalDateRange) {
        const parsed = parseDateRange(newDateRange);
        tripStartDate = parsed.tripStartDate;
        tripEndDate = parsed.tripEndDate;
      }

      // Update Firestore doc directly
      const updateData = {};
      if (newTitle && newTitle !== originalTitle) updateData.title = newTitle;
      if (newCountry && newCountry !== originalCountry) updateData.country = newCountry;
      if (tripStartDate && tripEndDate) {
        updateData.tripStartDate = tripStartDate;
        updateData.tripEndDate = tripEndDate;
      }

      if (Object.keys(updateData).length > 0) {
        await tripRef.update(updateData);
      }

      if (tripStartDate && tripEndDate) {
        await adjustTripDays(tripId, new Date(tripStartDate), new Date(tripEndDate));
      }

      // Update card object in memory
      const tripData = window.tripData || {};
      const allArrays = ["current", "upcoming", "past"];
      let updatedCard = null, fromArray = null, fromIndex = -1;

      for (const arrName of allArrays) {
        const arr = tripData[arrName] || [];
        const idx = arr.findIndex(c => c.tripId === tripId);
        if (idx !== -1) {
          updatedCard = arr[idx];
          fromArray = arrName;
          fromIndex = idx;
          break;
        }
      }

      if (updatedCard) {
        updatedCard.title = newTitle || updatedCard.title;
        updatedCard.location = newCountry || updatedCard.location;
        updatedCard.dateRange = newDateRange || updatedCard.dateRange;

        if (tripStartDate && tripEndDate) {
          updatedCard.tripStartDate = tripStartDate;
          updatedCard.tripEndDate = tripEndDate;
        }

        // Recompute status & countdown
        const { status, countdown } = getTripStatus(updatedCard.tripStartDate, updatedCard.tripEndDate);
        updatedCard.countdown = countdown;

        // Update badge DOM
        const badgeEl = card.querySelector(".trip-badge");
        if (badgeEl) {
          badgeEl.classList.remove("current", "upcoming", "past");
          badgeEl.classList.add(status);
          badgeEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }

        // Move card if status changed
        if (status !== fromArray) {
          tripData[fromArray].splice(fromIndex, 1);
          if (!tripData[status]) tripData[status] = [];
          tripData[status].push(updatedCard);

          const stats = window.tripStats || {};
          stats[fromArray] = (stats[fromArray] || 1) - 1;
          stats[status] = (stats[status] || 0) + 1;
          window.tripStats = stats;
        }

        window.tripData = tripData;
        document.dispatchEvent(new Event("CreateHomeBackLayout"));
      }

    } catch (err) {
      console.error("Error updating trip:", err);
    } finally {
      editActions.remove();
      if (actionsContainer) actionsContainer.style.display = "flex";
      card.classList.remove("editing-front");
    }
  });

}
