// =========== CREATE HOME BACK CARDS LAYOUT ==========
document.addEventListener("CreateHomeBackLayout", () => {
  const heroCardContainer = document.querySelector(".hero-card-container");
  const viewAllLink = document.querySelector(".view-all-link");
  if (!heroCardContainer) return;

  // Safely read counts and trip arrays from globals
  const { current = 0, upcoming = 0, past = 0 } = window.tripStats || {};
  const { current: currentTrips = [], upcoming: upcomingTrips = [], past: pastTrips = [] } = window.tripData || {};

  // Helper to render trip cards (same markup as front layout)
  const renderCards = (trips, badgeLabel) => {
    if (!trips || trips.length === 0) return "";

    // For Past trips, show simplified markup
    if (badgeLabel.toLowerCase() === "past") {
      return trips.map(card => `
        <div class="trip-card" data-trip-id="${card.tripId}">
          <div class="trip-actions">
            <button class="delete-btn" title="Delete">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6
                        m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          <div class="trip-info">
            <h4 class="trip-name">${card.title}</h4>
          </div>
        </div>
      `).join("");
    }

    // For Current/Upcoming trips, show full markup
    return trips.map(card => {
      const { countdown } = getTripStatus(card.tripStartDate, card.tripEndDate);
      const citiesLabel = (card.cities && card.cities.length > 0)
        ? card.cities.join(", ")
        : "No cities";
      return `
        <div class="trip-card" data-trip-id="${card.tripId}">
          <div class="trip-image-container">
            <img src="${card.image}" alt="${card.title}" class="trip-image"
               onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80';">
            <span class="trip-badge ${badgeLabel.toLowerCase()}">${badgeLabel}</span>
            <div class="trip-actions">
              <button class="edit-btn" title="Edit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14
                          a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1
                          1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="delete-btn" title="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6
                          m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="trip-info">
            <!-- Flex container for title + collaborators button -->
            <div class="trip-header">
              <h4 class="trip-name">${card.title}</h4>
              <button class="view-collaborators-btn" data-trip-id="${card.tripId}">
                View Collaborators
              </button>
            </div>
            <div class="trip-details">
              <div class="trip-detail">${card.location}</div>
              <div class="trip-detail">${citiesLabel}</div>
              <div class="trip-detail">${card.dateRange}</div>
            </div>
            <div class="trip-countdown">${countdown}</div>
          </div>
        </div>
      `;
    }).join("");
  };
  // Build sections conditionally
  let sectionsHTML = "";

  if (current > 0) {
    sectionsHTML += `
      <section class="trips-section">
        <h3 class="section-title">Current</h3>
        <div class="trips-grid">
          ${renderCards(currentTrips, "Current")}
        </div>
      </section>
    `;
  }

  if (upcoming > 0) {
    sectionsHTML += `
      <section class="trips-section">
        <h3 class="section-title">Upcoming</h3>
        <div class="trips-grid">
          ${renderCards(upcomingTrips, "Upcoming")}
        </div>
      </section>
    `;
  }

  if (past > 0) {
    console.log("run");
    sectionsHTML += `
      <section class="trips-section">
        <h3 class="section-title">Past</h3>
        <div class="trips-grid">
          ${renderCards(pastTrips, "Past")}
        </div>
      </section>
    `;
  }

  // Inject layout
  heroCardContainer.innerHTML = `
    <main class="main-content">
      <!-- Page Header -->
      <div class="page-header">
        <h2 class="page-title">All Trips</h2>
        <div class="page-header-actions">
          <button class="new-trip-btn">+ New Trip</button>
          <button class="invitations-btn">Invitations</button>
        </div>
      </div>

      <!-- Trip Stats -->
      <div class="trip-stats-grid">
        <div class="stats-card">
          <p class="stats-label">Current Trips</p>
          <p class="stats-number">${current}</p>
        </div>
        <div class="stats-card">
          <p class="stats-label">Upcoming Trips</p>
          <p class="stats-number">${upcoming}</p>
        </div>
        <div class="stats-card">
          <p class="stats-label">Past Trips</p>
          <p class="stats-number">${past}</p>
        </div>
      </div>

      ${sectionsHTML}
    </main>
  `;

  // Hide or overwrite the "View all trips" link
  if (viewAllLink) {
    viewAllLink.innerHTML = "";
  }

  // ========= ATTACH LISTENERS ===============
  // For clicking on Edit Button
  heroCardContainer.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const card = btn.closest(".trip-card");
      const tripId = card.dataset.tripId;
      // Call your edit function (read‑only version)
      enableCardEditing(tripId, card);
    });
  });
  // For clicking on Delete Button
  heroCardContainer.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const card = btn.closest(".trip-card");
      const tripId = card.dataset.tripId;
      // Call your deleteTrip function (defined elsewhere)
      deleteTrip(tripId, card);
    });
  });
  // For clicking on View Collaborators Button
  heroCardContainer.querySelectorAll(".view-collaborators-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const tripId = btn.dataset.tripId;
      // Call your collaborators modal handler (defined in collaborators.js)
      openCollaboratorsModal(tripId);
    });
  });
  // For clicking on Invitations Button
  heroCardContainer.querySelectorAll(".invitations-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      // Call your invitations handler
      openInvitationsModal(); // define this function elsewhere
    });
  });

  // Dispatch event listener to signal layout ready
  document.dispatchEvent(new Event("HomeBackLayoutReady"));
});

