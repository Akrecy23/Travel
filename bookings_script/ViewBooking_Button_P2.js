// THIS FILE BUILDS THE CARDS FOR EACH TAB

// ===== Render Tab Content =====
async function renderTab(tabName, tripId, tripTitle) {
  const modalContent = document.getElementById("modalContent");
  let collectionName;
  if (tabName === "Flights") {
    collectionName = "Flight";
  } else if (tabName === "Stay") {
    collectionName = "Stay";
  } else {
    collectionName = "Other Bookings";
  }

  const snap = await window.db
    .collection("Trips").doc(tripId)
    .collection(collectionName)
    .get();

  // Empty state if no bookings
  if (snap.empty){
    modalContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🟥</div>
        <p class="empty-text">No ${tabName.toLowerCase()} bookings yet</p>
        <button class="btn-add-booking">+ Add ${tabName}</button>
      </div>
    `;
    // attach listener to mimic "New" button
    const addBtn = modalContent.querySelector(".btn-add-booking");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        openNewBookingForm(tabName, tripId, tripTitle, false);
      });
    }
    return;
  }

  // Render cards based on tab type
  let cardsHTML = "";
  
  if (tabName === "Flights") {
    cardsHTML = snap.docs.map(doc => {
      const data = doc.data();
      const direction = data.Type || "Outbound";
      const badgeClass = direction === "Outbound" ? "badge-outbound" : "badge-return";

      const duration = calculateDuration(data.DepartureTime, data.ArrivalTime);

      return `
        <div class="booking-card flight-card" data-doc-id="${doc.id}" data-collection="${collectionName}">
          <div class="card-header">
            <div>
              <span class="badge ${badgeClass}">${direction}</span>
              <h4 class="card-title">${data.FromCountry || '-'} → ${data.ToCountry || '-'}</h4>
            </div>
            <div class="card-actions">
              <button class="icon-btn edit-btn" title="Edit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14
                          a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1
                          1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="icon-btn delete-btn" title="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6
                          m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="flight-timeline">
            <div class="flight-point">
              <div class="flight-time">${data.DepartureTime || '-'}</div>
              <div class="flight-airport">${data.FromAirport || '-'}</div>
            </div>
            <div class="flight-duration">
              <div class="flight-line"></div>
              <div class="flight-plane">✈️</div>
              <div class="duration-text">${duration || '-'}</div>
            </div>
            <div class="flight-point">
              <div class="flight-time">${data.ArrivalTime || '-'}</div>
              <div class="flight-airport">${data.ToAirport || '-'}</div>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Airline</span>
              <span class="info-value">${data.Airline || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Flight No</span>
              <span class="info-value">${data.FlightNo || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date</span>
              <span class="info-value">${data.Date || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Booking Ref</span>
              <span class="info-value">${data.BookingRef || '-'}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  } else if (tabName === "Stay") {
    cardsHTML = snap.docs.map(doc => {
      const data = doc.data();
      const stayType = data.Type || 'Hotel';
      const nights = calculateNights(data.inDate, data.outDate);

      return `
        <div class="booking-card stay-card" data-doc-id="${doc.id}" data-collection="${collectionName}">
          <div class="card-header">
            <div>
              <span class="badge badge-stay">🏨 ${stayType}</span>
              <h4 class="card-title">${data.Name || doc.id}</h4>
            </div>
            <div class="card-actions">
              <button class="icon-btn edit-btn" title="Edit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14
                          a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1
                          1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="icon-btn delete-btn" title="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6
                          m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="stay-dates">
            <div class="stay-checkin">
              <div class="stay-label">Check-in</div>
              <div class="stay-date">${data.inDate || '-'}</div>
              <div class="stay-time">${data.inTime || '3:00 PM'}</div>
            </div>
            <div class="stay-nights">
              <span class="nights-badge">${nights || '-'} nights</span>
            </div>
            <div class="stay-checkout">
              <div class="stay-label">Check-out</div>
              <div class="stay-date">${data.outDate || '-'}</div>
              <div class="stay-time">${data.outTime || '12:00 PM'}</div>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-item full-width">
              <span class="info-label">📍 Address</span>
              <span class="info-value">${data.Address || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">🛏️ Room No</span>
              <span class="info-value">${data.RoomNo || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">🛏️ Beds</span>
              <span class="info-value">${data.BedNo || '-'}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">📋 Booking Ref</span>
              <span class="info-value">${data.BookingRef || '-'}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  } else {
    // Others tab
    cardsHTML = snap.docs.map(doc => {
      const data = doc.data();
      const bookingType = data.Type || 'Ticket';
        const typeEmoji = getTypeEmoji(bookingType);
        
        return `
          <div class="booking-card other-card" data-doc-id="${doc.id}" data-collection="${collectionName}">
            <div class="card-header">
              <div>
                <span class="badge badge-other">${typeEmoji} ${bookingType}</span>
                <h4 class="card-title">${data.Name || doc.id}</h4>
              </div>
              <div class="card-actions">
                <button class="icon-btn edit-btn" title="Edit">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14
                            a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1
                            1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="icon-btn delete-btn" title="Delete">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6
                            m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">📅 Date</span>
                <span class="info-value">${data.Date || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🕐 Time</span>
                <span class="info-value">${data.Time || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📋 Booking Ref</span>
                <span class="info-value">${data.BookingRef || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📝 Notes</span>
                <span class="info-value">${data.Remarks || '-'}</span>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
    modalContent.innerHTML = `<div class="frames-grid">${cardsHTML}</div>`;

    // Dispatch a custom event once cards are ready
    document.dispatchEvent(new CustomEvent("BookingsRendered", {
    detail: { tabName, tripId }
    }));

}




