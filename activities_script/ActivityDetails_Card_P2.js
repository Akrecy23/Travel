// THIS FILE IS PART 2 OF ACTIVITYDETAILS_CARD.JS
// CREATE THE CARDS USING HTML

// HELPER: BUILD CARD ELEMENT
function createActivityCard(data) {
  const card = document.createElement("div");
  card.className = "activity-card";
  card.dataset.country = data.Country;
  card.dataset.city = data.City;
  const typeClass = (data.Type || "").toLowerCase().replace(/\s+/g, "-");
  
  // Collect all statuses that apply
  const statuses = [];
  if (data.Saved) statuses.push("saved");
  if (data.Revisit) statuses.push("revisit");
  if (data.In_Itinerary) statuses.push("in-itinerary");
  // Store them in a data attribute (space-separated string)
  card.setAttribute("data-status", statuses.join(" ") || "unspecified");
  card.setAttribute("data-type", typeClass);
  card.setAttribute("data-activity-id", data.id);
  // Check if activity is already in revisit
  const isMarkedRevisit = !!data.Revisit; // ensure boolean
  // Decide class based on revisit state
  let classRevisit = "revisit-btn"; 
  if (isMarkedRevisit) {
    classRevisit += " not-revisit active"; // add extra classes if not in revisit
  }

  card.innerHTML = `
    <!-- Card Inner Container -->
    <div class="card-inner">
      <!-- Card Front -->
      <div class="card-face card-front">
        <!-- Image Section -->
        <div class="card-image">
          <img src="${data.imageURL || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'}" alt="${data.Title || 'Activity'}">

          <!-- Status Badges -->
          <div class="status-badges">
            ${data.Saved ? `<span class="badge badge-saved">Saved</span>` : ""}
            ${data.In_Itinerary ? `<span class="badge badge-itinerary">In Itinerary</span>` : ""}
            ${data.Revisit ? `
              <span class="badge badge-revisit">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                In Revisit
              </span>` : ""}
          </div>

          <!-- Save/Heart Button -->
          <button class="save-btn ${data.Saved ? 'active' : ''}" data-activity-id="${data.id || ''}">
            <svg class="heart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>

        <!-- Card Content -->
        <div class="card-content">
          <!-- Title Section -->
          <div class="card-header">
            <div class="title-type-group">
              <h3 class="activity-name">${data.Name || "Untitled"}</h3>
              <p class="activity-type ${typeClass}">${data.Type || "-"}</p>
            </div>
            <div class="card-actions">
              <button class="top-edit-btn" title="Edit details">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14
                          a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1
                          1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="top-delete-btn" title="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6
                          m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Details Section -->
          <div class="card-details">
            <!-- Opening Hours & Duration -->
            <div class="detail-item">
              <svg class="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div class="detail-text">
                <div class="detail-main">${data.OpenTime || "-"} – ${data.CloseTime || "-"}</div>
                <div class="detail-sub">Est. Duration: ${data.ActivityDuration || "-"}</div>
              </div>
            </div>

            <!-- Cost -->
            <div class="detail-item">
              <svg class="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <div class="detail-text">
                <div class="detail-main">${data.EstCost ? `SGD ${data.EstCost}` : "-"}</div>
              </div>
            </div>

            <!-- Indoor/Outdoor -->
            <div class="detail-item">
              ${data.InOut_Door && data.InOut_Door.toLowerCase() === "outdoor" ? `
                <!-- Outdoor icon -->
                <svg class="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ` : `
                <!-- Indoor icon -->
                <svg class="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              `}
              <div class="detail-text">
                <div class="detail-main">${data.InOut_Door || "-"}</div>
              </div>
            </div>
          </div>

          <!-- Remarks Section -->
          <div class="remarks-section">
            <div class="remarks-header">
              <p class="remarks-label">Remarks</p>
            </div>
            <p class="remarks-text ${!data.Remarks ? 'remarks-empty' : ''}">
              ${data.Remarks || "No remarks yet"}
            </p>
          </div>
          <div class="activity-actions-row dual-buttons">
            <!-- Mark as Revisit Button -->
            <button class="${classRevisit}" data-activity-id="${data.id}">
              ${isMarkedRevisit ? "Remove from Revisit" : "Add to Revisit"}
            </button>
            <!-- Go to Map Button -->
            <button class="map-btn" data-activity-id="${data.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              View on Map
            </button>
          </div>
          <button class="trip-btn" data-activity-id="${data.id}"> ➕ Add to Trip </button>
          <div class="trip-expand hidden">
            <div class="trip-expand-header">
              <button class="trip-close-btn">✕</button>
            </div>
            <div class="added-info-row"></div>
            <div class="year-select-row">
              <label>Select Year:</label>
              <select class="year-dropdown"></select>
            </div>
            <div class="trip-select-row">
              <label>Select Trip:</label>
              <select class="trip-dropdown"></select>
            </div>
            <div class="day-select-row">
              <!-- radio buttons will be injected here -->
            </div>
            <div class="trip-confirm-row">
              <button class="trip-confirm-btn">Confirm</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Card Back -->
      <div class="card-face card-back">
        <div class="back-header">
          <h3>${data.Name || "Untitled"}</h3>
          <p class="back-type">${data.Type || "-"}</p>
        </div>
        <div class="map-wrapper">
          <div class="map-container" id="map-${data.id}"></div>
        </div>
        <div class="address-row">
          <p class="address-label">
            <strong>Address: </strong>${data.Address}
          </p>
          <button class="addr-edit-btn" title="Edit address">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        <button class="back-btn">Back to Details</button>
      </div>
    </div>
  `;
  return card;

}


