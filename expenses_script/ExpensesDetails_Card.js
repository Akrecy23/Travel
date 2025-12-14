// THIS FILE CONTAINS CODE FOR CREATING TRIPS CARDS
// INCLUDE FORMATTING OF FRONT SIDE OF CARD (Brief details)

// RUN FOLLOWING CODE WHEN THERE'S A SEARCH INPUT
document.addEventListener("SearchInputFilter", (e) => {
  const searchTerm = e.detail.searchInput;
  filterTrips(searchTerm, ".expenses-card", ".trip-id");
});

// RUN FOLLOWING CODE WHEN SELECTED LOCATION CHANGED
document.addEventListener("filtersReady", () => {
  const selectedYear = window.displayYear || new Date().getFullYear().toString();
  const selectedCountry = window.selectedCountry  || "all";
  const selectedGroup = window.selectedGroup || "all";
  if (typeof fetchTripsAndRenderTabs === "function") {
    fetchTripsAndRenderTabs(selectedYear, selectedCountry, selectedGroup);
  }
});

// RUN FOLLOWING CODE WHEN FILTERS APPLIED CHANGED
document.addEventListener("filtersApplied", (e) => {
  const selectedYear = window.displayYear || new Date().getFullYear().toString();
  const selectedCountry = window.selectedCountry  || "all";
  const selectedGroup = window.selectedGroup || "all";
  fetchTripsAndRenderTabs(selectedYear, selectedCountry, selectedGroup);
});

// DISPLAY TRIPS ACCORDING TO SELECTED YEAR, COUNTRY & GROUP
async function fetchTripsAndRenderTabs(yearId, countryFilter, groupFilter) {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  const expensesGrid = document.querySelector(".expenses-grid");
  expensesGrid.innerHTML = ""; // Clear old cards

  if (!yearId) {
    console.warn("No year selected for trips. Defaulting to current year.");
    yearId = new Date().getFullYear().toString();
  }

  // If countryFilter is "all", loop through all countries
  if (countryFilter === "all") {
    const countriesSnap = await window.db
      .collection("User").doc(currentUserId)
      .collection("Year").doc(yearId)
      .collection("Country")
      .get();

    for (const countryDoc of countriesSnap.docs) {
      await fetchGroupsForCountry(currentUserId, yearId, countryDoc.id, groupFilter);
    }
  } else {
    // Specific country
    await fetchGroupsForCountry(currentUserId, yearId, countryFilter, groupFilter);
  }
}

// Helper: fetch groups for a given country
async function fetchGroupsForCountry(currentUserId, yearId, countryId, groupFilter) {
  if (groupFilter === "all") {
    const groupsSnap = await window.db
      .collection("User").doc(currentUserId)
      .collection("Year").doc(yearId)
      .collection("Country").doc(countryId)
      .collection("Group")
      .get();

    for (const groupDoc of groupsSnap.docs) {
      await renderTripsForGroup(currentUserId, yearId, countryId, groupDoc.id);
    }
  } else {
    // Specific group
    await renderTripsForGroup(currentUserId, yearId, countryId, groupFilter);
  }
}

// GET TOTAL COUNT OF TRIPS & DISPLAY CORRESPONDING CARDS
// Helper: Render trips for a single group
async function renderTripsForGroup(currentUserId, yearId, countryId, groupId) {
  const expensesGrid = document.querySelector(".expenses-grid");
  // Navigate to "Trips" collection
  const tripsSnap = await window.db
    .collection("User").doc(currentUserId)
    .collection("Year").doc(yearId)
    .collection("Country").doc(countryId)
    .collection("Group").doc(groupId)
    .collection("Trip")
    .get();
  // Loop through each document to get trip's details
  for (const tripDoc of tripsSnap.docs) {
    const tripId = tripDoc.id;
    const tripData = tripDoc.data();
    // Get date range + status dynamically
    const { dateRange, status, duration } = await getTripDateInfo(
      tripData.tripStartDate,
      tripData.tripEndDate
    );
    // Build location string from City subcollection (doc IDs)
    const citySnap = await window.db
      .collection("User").doc(currentUserId)
      .collection("Year").doc(yearId)
      .collection("Country").doc(countryId)
      .collection("Group").doc(groupId)
      .collection("Trip").doc(tripId)
      .collection("City")
      .get();
    // Get location dynamically
    const locationString = citySnap.docs.map(doc => doc.id).join(", ");
    // Create a card for each trip
    const card = document.createElement("div");
    card.className = "expenses-card";
    card.innerHTML = `
      <div class="trip-header">
        <h3 class="trip-id">${tripId}</h3>
        <span class="trip-status">${status}</span>
      </div>

      <!-- Dates & Duration -->
      <div class="detail-item">
        <!-- Calendar icon -->
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <div class="detail-text">
          <div class="detail-main">${dateRange}</div>
        </div>
      </div>

      <div class="detail-item">
        <!-- Clock icon -->
        <svg class="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <div class="detail-text">
          <div class="detail-main">${duration}</div>
        </div>
      </div>

      <!-- Location -->
      <div class="detail-item">
        <svg class="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <div class="detail-text">
          <div class="detail-main">${locationString}</div>
        </div>
      </div>

      <!-- Description -->
      <div class="detail-item">
        <div class="detail-text">
          <div class="detail-main">${tripData.tripDescription || "No description available."}</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="trip-actions">
        <button class="view-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          View Expenses
        </button>
      </div>
    `;
    expensesGrid.appendChild(card);
    // ====== ADD EVENT LISTNER =========
    // Listen for "View Expenses" button being clicked
    card.querySelector(".view-btn").addEventListener("click", () => {
      // ============== SHOW EXPENSES MODAL ==========
      console.log(`Open modal for ${currentUserId} / ${yearId} / ${countryId} / ${groupId} / ${tripId}`); // DEBUG PURPOSES
      // Function to show Expenses Modal (ViewExpenses_Button.js)
      // Pass the trip id (so function know where to nav to in Firestore)
      openExpensesModal(currentUserId, yearId, countryId, groupId, tripId);
    });
  }
}

// RETRIEVE & FORMAT (CLEAN) DATE OF TRIP + STATUS
// E.G.: "Mar 12 – Mar 18, 2026" + "Upcoming / Current / Completed"
async function getTripDateInfo(tripStartDate, tripEndDate) {
  if (!tripStartDate || !tripEndDate) {
    return { dateRange: "Date range unavailable", status: "Upcoming", duration: "0 Days" };
  }

  // Parse the raw date strings into Date objects
  const firstDate = parseDate(tripStartDate);
  const lastDate = parseDate(tripEndDate);
  const today = new Date();

  // Format date range
  const options = { month: "short", day: "numeric" };
  const year = firstDate.getFullYear();
  const dateRange = `${firstDate.toLocaleDateString("en-US", options)} – ${lastDate.toLocaleDateString("en-US", options)}, ${year}`;

  // Determine status based on current date
  let status = "Upcoming";
  if (today < firstDate) {
    status = "Upcoming";
  } else if (today >= firstDate && today <= lastDate) {
    status = "Current";
  } else if (today > lastDate) {
    status = "Completed";
  }

  // Calculate duration in days
  const diffTime = Math.abs(lastDate - firstDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  const duration = `${diffDays} Days`;

  return { dateRange, status, duration };
}

// CONVERT STRING TO DATE (FOR DATE FIELDS)
function parseDate(dateStr) {
  // Remove weekday if present: "Thursday, Mar 12, 2026" → "Mar 12, 2026"
  const cleaned = dateStr.replace(/^[A-Za-z]+,\s*/, "");
  return new Date(cleaned);
}