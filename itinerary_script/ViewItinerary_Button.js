// THIS FILE CONTAINS CODE FOR MODAL OF ITINERARY CARD
// SHOWS IN-DEPTH DETAILS OF ITINERARY PER DAY

async function openItineraryModal(tripId) {
  const modal = document.getElementById("itineraryModal");

  // Fetch trip doc to get title
  const tripSnap = await window.db.collection("Trips").doc(tripId).get();
  const tripData = tripSnap.exists ? tripSnap.data() : {};
  const tripTitle = tripData.title || tripId;

  // Build modal inner HTML dynamically
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2 id="modalTitle">${tripTitle} – Itinerary</h2>
        <button id="closeModal">✕</button>
      </div>
      <div id="modalTabs" class="modal-tabs"></div>
      <div id="modalContent" class="modal-body"></div>
    </div>
  `;
  modal.style.display = "flex";

  const modalTabs = document.getElementById("modalTabs");
  const modalContent = document.getElementById("modalContent");

  // ===== Fetch Days from Firestore =====
  const daysSnap = await window.db
    .collection("Trips").doc(tripId)
    .collection("Itinerary")
    .get();

  // Sort days by number (Day1, Day2, ...)
  const sortedDays = daysSnap.docs.sort((a, b) => {
    const numA = parseInt(a.id.replace("Day", ""));
    const numB = parseInt(b.id.replace("Day", ""));
    return numA - numB;
  });

  // Build a local array of day objects (array="Day1, Day2, etc.")
  const days = [];
  for (const dayDoc of sortedDays) {
    const dayData = dayDoc.data();
    const activitiesSnap = await dayDoc.ref
      .collection("Activities")
      .orderBy("Order")
      .get();
    // Retrieve & Store activity details
    const activities = activitiesSnap.docs.map(actDoc => {
      const actData = actDoc.data();
      return {
        id: actDoc.id,
        order: actData.order ?? 9999,
        time: actData.Time || "",
        description: actData.Description || "",
        address: actData.Address || "",
        remarks: actData.Remarks || "",
        tags: actData.Tag || "",
        about: actData.About || ""
      };
    });
    days.push({
      day: dayDoc.id, // e.g. "Day 1"
      date: dayData.Date || "",
      activities
    });
  }
  // ===== Render Tabs =====
  modalTabs.innerHTML = days.map((d, i) => `
    <button class="${i === 0 ? "active" : ""}" data-day="${i}">${d.day}</button>
  `).join("");
  // ===== Render Day Content =====
  window.renderDay = function(dayIndex) {
    if (days.length === 0) {
      modalContent.innerHTML = "<p>No itinerary days found.</p>";
      return;
    }
    const day = days[dayIndex];
    modalContent.innerHTML = `
      <h3>${day.day}</h3>
      <p>${day.date}</p>
      <div class="timeline">
        ${day.activities.map(a => `
          <div class="timeline-entry" draggable="true" data-activity-id="${a.id}" data-day-id="${day.day}">
            <div class="drag-handle">
              <!-- 3 stacked lines icon -->
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" y1="7" x2="20" y2="7"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="17" x2="20" y2="17"></line>
              </svg>
            </div>
            <div class="time">${a.time}</div>
            <div class="dot"></div>
            <div class="box">
              <div class="box-header">
                <div class="box-title">
                  <h4>${a.description}</h4>
                </div>
                <div class="box-actions">
                  <button class="edit-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button class="delete-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <p>${a.remarks}</p>
              ${a.address ? `
                <div class="address-row">
                  <span class="address-link" data-address="${a.address}">${a.address}</span>
                </div>
              ` : ""}
              <div class="status-row">
                <div>${a.tags ? `<span class="tag Default ${a.tags}">${a.tags}</span>` : ""}</div>
                <span class="status-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-label="Bubbly right arrow outline">
                    <path d="M8 16h30
                             m0 0
                             c0 -6 4 -8 8 -6
                             l12 8
                             c2 1.5 2 6.5 0 8
                             l-12 8
                             c-4 2 -8 0 -8 -6
                             m0 0
                             h-30"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        `).join("")}
        <div class="timeline-add">
          <button class="add-itinerary-btn">+ Add Itinerary</button>
        </div>
      </div>
    `;
    // ====== ADD EVENT LISTNER =========
    // Batch-Assign (but targets individually)
    const entries = modalContent.querySelectorAll(".timeline-entry");
    entries.forEach((entry, i) => {
      const activity = day.activities[i];
      // For edit button
      entry.querySelector(".edit-btn").addEventListener("click", () => {
        console.log("Edit activity:", activity.id);
        enableActivityEditing(entry, tripId, day.day, activity.id, days);
      });
      // For delete button
      entry.querySelector(".delete-btn").addEventListener("click", async () => {
        deleteActivity(tripId, day.day, activity.id, entry, activity.description);
      });
      // For address click -> open maps
      const addrEl = entry.querySelector(".address-link");
      if (addrEl) {
        addrEl.addEventListener("click", () => {
          const address = addrEl.dataset.address || "";
          if (!address) {
            console.warn("No address available for directions");
            return;
          }
      
          const encodedAddress = encodeURIComponent(address);
          const ua = navigator.userAgent;
          let mapsUrl;
      
          // iOS
          if (/iPhone|iPad|iPod/i.test(ua)) {
            const googleMapsUrl = `comgooglemaps://?q=${encodedAddress}`;
            const appleMapsUrl = `http://maps.apple.com/?q=${encodedAddress}`;
      
            let opened = false;
            const handleVisibility = () => {
              opened = true;
              document.removeEventListener("visibilitychange", handleVisibility);
            };
            document.addEventListener("visibilitychange", handleVisibility);
      
            // Try Google Maps
            window.location.href = googleMapsUrl;
      
            // After 3s, if still visible → Google Maps not installed → open Apple Maps
            setTimeout(() => {
              if (!opened) {
                window.location.href = appleMapsUrl;
              }
            }, 3000);
      
            return;
          }
      
          // Android
          else if (/Android/i.test(ua)) {
            mapsUrl = `geo:0,0?q=${encodedAddress}`;
          }
      
          // Desktop
          else {
            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
          }
      
          window.location.href = mapsUrl;
        });
      }
      // For arrow click -> open Move Itinerary modal
      const arrowEl = entry.querySelector(".status-arrow");
      if (arrowEl) {
        arrowEl.addEventListener("click", () => {
          console.log("Move activity:", activity.id);
          openMoveItineraryModal(tripId, day.day, activity.id, days);
        });
      }
    });

    // For Drag & Drop button
    const timeline = modalContent.querySelector(".timeline");
    let draggedEntry = null;
    entries.forEach(entry => {
      entry.addEventListener("dragstart", e => {
        draggedEntry = entry;
        e.dataTransfer.effectAllowed = "move";
      });

      entry.addEventListener("dragover", e => {
        e.preventDefault();
        const bounding = entry.getBoundingClientRect();
        const offset = e.clientY - bounding.top;
        if (offset > bounding.height / 2) {
          entry.style["border-bottom"] = "2px solid #ccc";
          entry.style["border-top"] = "";
        } else {
          entry.style["border-top"] = "2px solid #ccc";
          entry.style["border-bottom"] = "";
        }
      });

      entry.addEventListener("dragleave", () => {
        entry.style["border-bottom"] = "";
        entry.style["border-top"] = "";
      });

      entry.addEventListener("drop", async e => {
        e.preventDefault();
        entry.style["border-bottom"] = "";
        entry.style["border-top"] = "";
        if (draggedEntry && draggedEntry !== entry) {
          const bounding = entry.getBoundingClientRect();
          const offset = e.clientY - bounding.top;
          if (offset > bounding.height / 2) {
            timeline.insertBefore(draggedEntry, entry.nextSibling);
          } else {
            timeline.insertBefore(draggedEntry, entry);
          }
          // 🔑 Update local array order to match DOM
          const newOrderIds = Array.from(timeline.querySelectorAll(".timeline-entry"))
            .map(el => el.getAttribute("data-activity-id"));
          day.activities = newOrderIds.map(id =>
            day.activities.find(act => act.id === id)
          );
          // 🔑 Persist immediately to Firestore
          const updates = newOrderIds.map((id, index) => {
            const activityRef = window.db
              .collection("Trips").doc(tripId)
              .collection("Itinerary").doc(day.day)
              .collection("Activities").doc(id);
            return activityRef.update({ Order: index + 1 });
          });
          await Promise.all(updates);
          console.log("Order updated immediately in Firestore");
        }
      });
    });
    // Auto-scroll when dragging near top/bottom of modalContent
    let scrollRAF;
    modalContent.addEventListener("dragover", e => {
      const rect = modalContent.getBoundingClientRect();
      const scrollZone = 50; // px from edge
      const speed = 8;       // scroll speed per frame
    
      if (scrollRAF) cancelAnimationFrame(scrollRAF);
    
      function step() {
        if (e.clientY < rect.top + scrollZone) {
          modalContent.scrollTop -= speed;
          scrollRAF = requestAnimationFrame(step);
        } else if (e.clientY > rect.bottom - scrollZone) {
          modalContent.scrollTop += speed;
          scrollRAF = requestAnimationFrame(step);
        }
      }
      step();
    });
    
    modalContent.addEventListener("drop", () => {
      if (scrollRAF) cancelAnimationFrame(scrollRAF);
    });
    modalContent.addEventListener("dragleave", () => {
      if (scrollRAF) cancelAnimationFrame(scrollRAF);
    });
    
    // Add itinerary button
    const addBtn = modalContent.querySelector(".add-itinerary-btn");
    addBtn.addEventListener("click", () => {
      addItinerary(
        tripId,
        day.day,
        day.activities.length,
        dayIndex,
        days,          // pass the array in
        window.renderDay      // pass the render callback
      );
    });
  }
  window.dayIndex = 0;
  window.renderDay(window.dayIndex);
  // Tab switching
  modalTabs.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      modalTabs.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      window.dayIndex = parseInt(btn.dataset.day);
      window.renderDay(window.dayIndex);
    });
  });

  function closeModal() {
    modal.style.display = "none";
  }
  document.getElementById("closeModal").onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };
}

