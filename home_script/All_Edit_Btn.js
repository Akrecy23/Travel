// FUNCTION FOR EDITING FRONT SIDE OF CARDS
async function enableCardEditing(yearId, country, groupId, tripId, card) {
  if (card.classList.contains("editing-front")) return;
  card.classList.add("editing-front");

  // Reference DOM nodes
  const tripIdEl = card.querySelector(".trip-name");
  const countryEl = card.querySelectorAll(".trip-details .trip-detail")[0];
  const dateRangeEl = card.querySelectorAll(".trip-details .trip-detail")[1];

  // Store originals
  const originalTripId = tripIdEl.textContent;
  const originalCountry = countryEl.textContent || "Enter country";
  const originalDateRange = dateRangeEl.textContent || "Enter date range";

  // Replace with inputs
  tripIdEl.innerHTML = `<input type="text" class="edit-trip-id" value="${originalTripId}">`;
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
    tripIdEl.textContent = originalTripId;
    countryEl.textContent = originalCountry || "No location available.";
    dateRangeEl.textContent = originalDateRange || "No date range available.";
    editActions.remove();
    if (actionsContainer) actionsContainer.style.display = "flex";
    card.classList.remove("editing-front");
  });

  // Tick → update Firestore
  editActions.querySelector(".front-tick-btn").addEventListener("click", async () => {
    const newTripId = card.querySelector(".edit-trip-id").value.trim();
    const newCountry = card.querySelector(".edit-trip-country").value.trim();
    const newDateRange = card.querySelector(".edit-trip-dateRange").value.trim();

    const currentUserId = window.CURRENT_UID;
    if (!currentUserId) {
      alert("You must be logged in to add a trip.");
      return;
    }

    try {
      const baseRef = window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(yearId);

      const oldTripRef = baseRef
        .collection("Country").doc(country)
        .collection("Group").doc(groupId)
        .collection("Trip").doc(tripId);

      // Case 1: Date range changed (update in place if only date changed)
      if (newDateRange !== originalDateRange &&
          newTripId === tripId &&
          newCountry === country) {
        const { tripStartDate, tripEndDate } = parseDateRange(newDateRange);
        await oldTripRef.update({ tripStartDate, tripEndDate });
      }

      // Case 2 + 3 unified: Trip name and/or Country changed
      if (newTripId !== tripId || newCountry !== country) {
        const newTripRef = baseRef
          .collection("Country").doc(newCountry)
          .collection("Group").doc(groupId)
          .collection("Trip").doc(newTripId);

        // Copy trip with updated fields
        await copyTrip(oldTripRef, newTripRef, newCountry, newTripId, newDateRange, baseRef, groupId);

        // Delete old trip fully (doc + subcollections)
        await deleteTripDoc(oldTripRef);

        // Update card attribute
        card.setAttribute("data-trip", newTripId);

        // Cleanup old country if empty
        if (newCountry !== country) {
          const oldCountryRef = baseRef.collection("Country").doc(country);
          const groupsSnap = await oldCountryRef.collection("Group").get();

          let hasTrips = false;
          for (const groupDoc of groupsSnap.docs) {
            const tripsSnap = await groupDoc.ref.collection("Trip").get();
            if (!tripsSnap.empty) {
              hasTrips = true;
              break;
            }
          }
          if (!hasTrips) await oldCountryRef.delete();
        }
      }
      
      const tripData = window.tripData || {};
      const allArrays = ["current", "upcoming", "past"];

      let updatedCard = null;
      let fromArray = null;
      let fromIndex = -1;

      // 1. Find this card object in tripData
      for (const arrName of allArrays) {
        const arr = tripData[arrName] || [];
        const idx = arr.findIndex(c =>
          c.year === yearId &&
          c.country === country &&
          c.group === groupId &&
          c.title === tripId
        );
        if (idx !== -1) {
          updatedCard = arr[idx];
          fromArray = arrName;
          fromIndex = idx;
          break;
        }
      }

      if (updatedCard) {
        // 2. Update core fields
        updatedCard.title = newTripId || updatedCard.title;
        updatedCard.location = newCountry || updatedCard.location;
        updatedCard.dateRange = newDateRange || updatedCard.dateRange;

        // If date was changed, update tripStartDate/tripEndDate in memory
        if (newDateRange !== originalDateRange) {
          const { tripStartDate, tripEndDate } = parseDateRange(newDateRange);
          updatedCard.tripStartDate = tripStartDate;
          updatedCard.tripEndDate = tripEndDate;
        }

        // 3. Recompute status & countdown using updated dates
        const { status, countdown } = getTripStatus(
          updatedCard.tripStartDate,
          updatedCard.tripEndDate
        );
        updatedCard.countdown = countdown;

        // ---- Update badge DOM (status + class) ----
        const badgeEl = card.querySelector(".trip-badge");
        if (badgeEl) {
          // Remove old classes
          badgeEl.classList.remove("current", "upcoming", "past");

          // Add new class
          badgeEl.classList.add(status);

          // Update text
          badgeEl.textContent = 
            status === "current" ? "Current" :
            status === "upcoming" ? "Upcoming" :
            "Past";
        }

        // 4. Move card to correct array if its status changed
        let toArray = fromArray;
        if (status === "current") toArray = "current";
        else if (status === "upcoming") toArray = "upcoming";
        else if (status === "past") toArray = "past";

        if (toArray !== fromArray) {
          // remove from old array
          tripData[fromArray].splice(fromIndex, 1);
          // add to new array
          if (!tripData[toArray]) tripData[toArray] = [];
          tripData[toArray].push(updatedCard);

          // update counts
          const stats = window.tripStats || {};
          if (fromArray === "current") stats.current = (stats.current || 1) - 1;
          if (fromArray === "upcoming") stats.upcoming = (stats.upcoming || 1) - 1;
          if (fromArray === "past") stats.past = (stats.past || 1) - 1;

          if (toArray === "current") stats.current = (stats.current || 0) + 1;
          if (toArray === "upcoming") stats.upcoming = (stats.upcoming || 0) + 1;
          if (toArray === "past") stats.past = (stats.past || 0) + 1;

          window.tripStats = stats;
        }
        // ✅ Rebuild layout so card moves visually
        document.dispatchEvent(new Event("CreateHomeBackLayout"));

        window.tripData = tripData;
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

// Copy a trip doc and all its known subcollections
async function copyTrip(oldTripRef, newTripRef, newCountry, newTripId, newDateRange, baseRef, groupId) {
  const snap = await oldTripRef.get();
  let data = {};
  if (snap.exists) {
    data = snap.data();
  }

  const countryRef = baseRef.collection("Country").doc(newCountry);
  const groupRef = countryRef.collection("Group").doc(groupId);

  await baseRef.set({}, { merge: true });     // Year doc
  await countryRef.set({}, { merge: true });  // Country doc
  await groupRef.set({}, { merge: true });    // Group doc

  // Ensure required fields are present so doc isn't slanted
  if (newDateRange) {
    const { tripStartDate, tripEndDate } = parseDateRange(newDateRange);
    data.tripStartDate = tripStartDate;
    data.tripEndDate = tripEndDate;
  }

  await newTripRef.set(data, { merge: true });

  // Copy known subcollections
  const subcollections = [
    "City",
    "Flight",
    "Itinerary",
    "Other Bookings",
    "Stay"
  ];
  for (const sub of subcollections) {
    const subSnap = await oldTripRef.collection(sub).get();
    for (const doc of subSnap.docs) {
      const newDocRef = newTripRef.collection(sub).doc(doc.id);
      await newDocRef.set(doc.data());

      // Special handling for Itinerary → copy nested Activities
      if (sub === "Itinerary") {
        const activitiesSnap = await doc.ref.collection("Activities").get();
        for (const act of activitiesSnap.docs) {
          await newDocRef.collection("Activities").doc(act.id).set(act.data());
        }
      }
    }
  }
}

// Delete a trip doc and all its subcollections
async function deleteTripDoc(tripRef) {
  const subcollections = [
    "City",
    "Flight",
    "Itinerary",
    "Other Bookings",
    "Stay"
  ];

  for (const sub of subcollections) {
    const subSnap = await tripRef.collection(sub).get();
    for (const doc of subSnap.docs) {
      // Special handling for Itinerary → delete nested Activities first
      if (sub === "Itinerary") {
        const activitiesSnap = await doc.ref.collection("Activities").get();
        for (const act of activitiesSnap.docs) {
          await doc.ref.collection("Activities").doc(act.id).delete();
        }
      }
      await tripRef.collection(sub).doc(doc.id).delete();
    }
  }

  await tripRef.delete();
}

