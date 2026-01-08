// THIS FILE CONTAINS CODE FOR CREATING TRIPS CARDS
// INCLUDE FORMATTING OF FRONT SIDE OF CARD (Brief details)

// ========== EVENT LISTENERS =================
// RUN FOLLOWING CODE WHEN THERE'S A SEARCH INPUT
document.addEventListener("SearchInputFilter", (e) => {
  const searchTerm = e.detail.searchInput;
  filterTrips(searchTerm, ".bookings-card", ".trip-id");
});

// RUN FOLLOWING CODE WHEN SELECTED LOCATION CHANGED
document.addEventListener("dropdownReady", () => {
  const selectedYear = window.displayYear || new Date().getFullYear().toString();
  const selectedCountries = window.selectedCountries  || "all";
  const selectedGroups = window.selectedGroups || "all";
  if (typeof fetchTripsAndRenderTabs === "function") {
    fetchTripsAndRenderTabs(selectedYear, selectedCountries, selectedGroups);
  }
});

// RUN FOLLOWING CODE WHEN YEAR CHANGED
document.addEventListener("yearChanged", () => {
  const selectedYear = window.displayYear || new Date().getFullYear().toString();
  const selectedCountries = window.selectedCountries  || "all";
  const selectedGroups = window.selectedGroups || "all";
  if (typeof fetchTripsAndRenderTabs === "function") {
    fetchTripsAndRenderTabs(selectedYear, selectedCountries, selectedGroups);
  }
});

// RUN FOLLOWING CODE WHEN FILTERS APPLIED CHANGED
document.addEventListener("filtersApplied", (e) => {
  const selectedYear = window.displayYear || new Date().getFullYear().toString();
  const selectedCountries = window.selectedCountries  || "all";
  const selectedGroups = window.selectedGroups || "all";
  fetchTripsAndRenderTabs(selectedYear, selectedCountries, selectedGroups);
});

// DISPLAY TRIPS ACCORDING TO SELECTED YEAR, COUNTRY & GROUP
async function fetchTripsAndRenderTabs(yearId, countryFilters, groupFilters) {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  const bookingsGrid = document.querySelector(".bookings-grid");
  bookingsGrid.innerHTML = ""; // Clear old cards

  if (!yearId) {
    console.warn("No year selected for trips. Defaulting to current year.");
    yearId = new Date().getFullYear().toString();
  }

  // Query trips owned or collaborated by user
  const ownedSnap = await window.db.collection("Trips")
    .where("ownerUid", "==", currentUserId)
    .where("year", "==", parseInt(yearId))
    .get();

  const collabSnap = await window.db.collection("Trips")
    .where("collaboratorIds", "array-contains", currentUserId)
    .where("year", "==", parseInt(yearId))
    .get();

  const allTrips = [...ownedSnap.docs, ...collabSnap.docs];

  for (const tripDoc of allTrips) {
    const tripData = tripDoc.data();

    // Apply filters
    if (!countryFilters.includes("all") && !countryFilters.includes(tripData.country)) continue;
    if (!groupFilters.includes("all") && !groupFilters.includes(tripData.group)) continue;

    const tripId = tripDoc.id;
    const { dateRange, status, duration } = await getTripDateInfo(
      tripData.tripStartDate,
      tripData.tripEndDate
    );

    const locationString = (tripData.cities || []).join(", ");

    // Create a card for each trip
    const card = document.createElement("div");
    card.className = "bookings-card";
    card.innerHTML = `
      <div class="trip-header">
        <h3 class="trip-id">${tripData.title}</h3>
        <span class="trip-status ${status.toLowerCase()">${status}</span>
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

      <!-- Actions -->
      <div class="trip-actions">
        <button class="view-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          View bookings
        </button>
      </div>
    `;
    bookingsGrid.appendChild(card);
    // ====== ADD EVENT LISTNER =========
    // Listen for "View bookings" button being clicked
    card.querySelector(".view-btn").addEventListener("click", () => {
      // ============== SHOW BOOKINGS MODAL ==========
      console.log(`Open modal for trip "${tripData.title}" (${tripId})`); // DEBUG
      // Function to show Bookings Modal (ViewBookings_Button.js)
      // Pass the trip id (so function know where to nav to in Firestore)
      openBookingsModal(tripId);
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
  const startY = firstDate.getFullYear();
  const endY = lastDate.getFullYear();
  let dateRange;
  if (startY === endY) {
    // Same year → show year once
    dateRange = `${firstDate.toLocaleDateString("en-US", options)} – ${lastDate.toLocaleDateString("en-US", options)}, ${startY}`;
  } else {
    // Different years → show both
    dateRange = `${firstDate.toLocaleDateString("en-US", options)}, ${startY} – ${lastDate.toLocaleDateString("en-US", options)}, ${endY}`;
  }

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










