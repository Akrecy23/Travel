// THIS FILE BUILDS THE CARDS FOR EACH TAB

// ===== Render Tab Content =====
async function renderTab(tabName, tripId, tripTitle) {
  const modalContent = document.getElementById("modalContent");
  let collectionName;
  if (tabName === "Transport") {
    collectionName = "Transport";
  } else if (tabName === "Stay") {
    collectionName = "Stay";
  } else {
    collectionName = "Other Bookings";
  }

  const snap = await window.db
    .collection("Trips").doc(tripId)
    .collection(collectionName)
    .orderBy("Order")
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
  
  if (tabName === "Transport") {
    cardsHTML = snap.docs.map(doc => {
      const data = doc.data();
      const direction = data.Type || "Outbound";
      const badgeClass = direction === "Outbound" ? "badge-outbound" : "badge-return";

      const duration = calculateDuration(data.DepDate, data.DepartureTime, data.ReturnDate, data.ArrivalTime);

      // Build info-grid based on Mode
      let infoGrid = `
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Dep Date</span>
            <span class="info-value">${data.DepDate ? formatSimpleDate(data.DepDate) : '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Return Date</span>
            <span class="info-value">${data.ReturnDate ? formatSimpleDate(data.ReturnDate) : '-'}</span>
          </div>
        </div>
      `;
    if (data.Mode === "Airplane"){
      infoGrid += `
        <div class="info-grid-2">
          <div class="info-item">
            <span class="info-label">From Terminal</span>
            <span class="info-value">${data.FromTerminal || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">To Terminal</span>
            <span class="info-value">${data.ToTerminal || '-'}</span>
          </div>
        </div>
        <div class="info-grid-3">
          <div class="info-item">
            <span class="info-label">Airline</span>
            <span class="info-value">${data.Airline || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Flight No</span>
            <span class="info-value">${data.FlightNo || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Booking Ref</span>
            <span class="info-value">${data.BookingRef || '-'}</span>
          </div>
        </div>
      `;
    } 
    else if (data.Mode === "Ferry") {
      infoGrid += `
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Service Operator</span>
            <span class="info-value">${data.ServOp || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Booking Ref</span>
            <span class="info-value">${data.BookingRef || '-'}</span>
          </div>
        </div>
      `;
    } else {
      // Others
      infoGrid += `
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Booking Ref</span>
            <span class="info-value">${data.BookingRef || '-'}</span>
          </div>
        </div>
      `;
    }

      return `
        <div class="card-wrapper">
          <span class="drag-handle" draggable="true" title="Drag">&#9776;</span>
          <div class="booking-card flight-card" data-doc-id="${doc.id}" data-collection="${collectionName}" data-mode="${data.Mode || 'Airplane'}" draggable="true">
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
                <div class="flight-airport">${data.FromPickUp || '-'}</div>
              </div>
              <div class="flight-duration">
                <div class="flight-line"></div>
                <div class="flight-plane">${getModeDisplay(data.Mode)}</div>
                <div class="duration-text">${duration || '-'}</div>
              </div>
              <div class="flight-point">
                <div class="flight-time">${data.ArrivalTime || '-'}</div>
                <div class="flight-airport">${data.ToDropOff || '-'}</div>
              </div>
            </div>
            
            <div class="info-grid">
              ${infoGrid}
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
      <div class="card-wrapper">
          <span class="drag-handle" draggable="true" title="Drag">&#9776;</span>
          <div class="booking-card stay-card" data-doc-id="${doc.id}" data-collection="${collectionName}" draggable="true">
            <div class="card-header">
              <div>
                <span class="badge ${getBadgeClass('Stay', stayType)}">🏨 ${stayType}</span>
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
            
            <div class="info-grid-3">
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
          <div class="card-wrapper">
            <span class="drag-handle" draggable="true" title="Drag">&#9776;</span>
            <div class="booking-card other-card" data-doc-id="${doc.id}" data-collection="${collectionName}" draggable="true">
              <div class="card-header">
                <div>
                  <span class="badge ${getBadgeClass('Others', bookingType)}">${typeEmoji} ${bookingType}</span>
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
          </div>
        `;
      }).join("");
    }
    modalContent.innerHTML = `<div class="frames-grid">${cardsHTML}</div>`;

    // After rendering cards
    const wrappers = modalContent.querySelectorAll(".card-wrapper");
    let draggedWrapper = null;
    wrappers.forEach(wrapper => {
      const handle = wrapper.querySelector(".drag-handle");
      const card = wrapper.querySelector(".booking-card");
    
      // Start dragging only from the handle
      handle.addEventListener("dragstart", e => {
        draggedWrapper = wrapper;
        e.dataTransfer.effectAllowed = "move";
      });
    
      // Allow dropping on wrapper
      wrapper.addEventListener("dragover", e => {
        e.preventDefault();
        const bounding = wrapper.getBoundingClientRect();
        const offset = e.clientY - bounding.top;
        if (offset > bounding.height / 2) {
          wrapper.style["border-bottom"] = "2px solid #ccc";
          wrapper.style["border-top"] = "";
        } else {
          wrapper.style["border-top"] = "2px solid #ccc";
          wrapper.style["border-bottom"] = "";
        }
      });
    
      wrapper.addEventListener("dragleave", () => {
        wrapper.style["border-bottom"] = "";
        wrapper.style["border-top"] = "";
      });
    
      wrapper.addEventListener("drop", async e => {
        e.preventDefault();
        wrapper.style["border-bottom"] = "";
        wrapper.style["border-top"] = "";
        if (draggedWrapper && draggedWrapper !== wrapper) {
          const bounding = wrapper.getBoundingClientRect();
          const offset = e.clientY - bounding.top;
          if (offset > bounding.height / 2) {
            wrapper.parentNode.insertBefore(draggedWrapper, wrapper.nextSibling);
          } else {
            wrapper.parentNode.insertBefore(draggedWrapper, wrapper);
          }
    
          // 🔑 Update Firestore order
          const newOrderIds = Array.from(modalContent.querySelectorAll(".booking-card"))
            .map(el => el.getAttribute("data-doc-id"));
    
          const col = card.dataset.collection;
          const updates = newOrderIds.map((id, index) => {
            const ref = window.db
              .collection("Trips").doc(tripId)
              .collection(col).doc(id);
            return ref.update({ Order: index + 1 });
          });
    
          await Promise.all(updates);
          console.log("Booking order updated in Firestore");
        }
      });
    });

    // Dispatch a custom event once cards are ready
    document.dispatchEvent(new CustomEvent("BookingsRendered", {
    detail: { tabName, tripId, tripTitle}
    }));
}

