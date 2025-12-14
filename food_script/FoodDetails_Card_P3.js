// CREATE THE CARDS USING HTML

// HELPER: BUILD CARD ELEMENT
function createFoodCard(data, foodType) {
  const card = document.createElement("div");
  card.className = "food-card";

  card.setAttribute("data-food-type", foodType);
  card.setAttribute("data-food-id", data.id);
  card.setAttribute("data-address", data.Address || "");

  // Initialise some variables / button state
  const heartClass = data.isLiked ? "active" : "";
  const saveLabel = data.isSaved ? "Saved" : "Save";

  card.innerHTML = `
    <div class="card-inner">
      <!-- Front face -->
      <div class="card-face card-front">
        <div class="food-header">
          <h3 class="food-name">${data.Name || "Untitled"}</h3>
          <button class="like-btn ${heartClass}" data-food-id="${data.id}">
            <svg class="heart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="food-cuisine">${foodType || "-"}</div>
        <div class="food-details">
          <div class="food-about">📝 ${data.About || "-"}</div>
          <div class="food-hours">🕒 ${data.OpenTime || "-"} – ${data.CloseTime || "-"}</div>
        </div>
        <div class="food-actions-row dual-buttons">
          <button class="save-btn ${data.isSaved ? 'active' : ''}" data-food-id="${data.id}">🔖 ${saveLabel}</button>
          <button class="see-more-btn">👁️ See More</button>
        </div>
        <div class="food-actions-row trip-row">
          <button class="trip-btn full-width" data-food-id="${data.id}"> ➕ Add to Trip </button>
          <button class="btn btn-icon" title="Directions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          </button>
        </div>
      </div>
      <div class="trip-expand hidden">
        <div class="trip-expand-header">
          <button class="trip-close-btn">✕</button>
        </div>
        <div class="added-info-row"></div>
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
      <!-- Back face -->
      <div class="card-face card-back">
        <h4 class="card-back-title">${data.Name || "Details"}</h4>
        <div class="card-back-row">
          <span class="label">$ Price:</span>
          <span class="value">${data.Price ?? "-"}</span>
        </div>
        <div class="card-back-row">
          <span class="label">Remarks:</span>
          <span class="value">${data.Remarks ?? "-"}</span>
        </div>
        <div class="card-back-actions">
          <button class="flip-back-btn">← Back</button>
        </div>
      </div>
    </div>
  `;
  return card;
}

  