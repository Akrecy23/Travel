document.addEventListener("BookingsRendered", e => {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }

  const { tabName, tripId } = e.detail;
  const modalContent = document.getElementById("modalContent");

  modalContent.querySelectorAll(".booking-card").forEach(card => {
    const editBtn = card.querySelector(".edit-btn");
    if (!editBtn) return;
    editBtn.addEventListener("click", () => {
      const col = card.dataset.collection; // "Transport", "Stay", "Other Bookings"
      const docId = card.dataset.docId;

      if (col === "Transport") {
        const mode = card.dataset.mode || "Airplane";
        
        // Replace Airline, FlightNo, Date, BookingRef with inputs
        const departTimeEl = card.querySelector(".flight-point:first-child .flight-time");
        const departAirportEl = card.querySelector(".flight-point:first-child .flight-airport");
        const arriveTimeEl = card.querySelector(".flight-point:last-child .flight-time");
        const arriveAirportEl = card.querySelector(".flight-point:last-child .flight-airport");
        const titleEl = card.querySelector(".card-title"); // shows FromCountry → ToCountry
        const statusEl = card.querySelector(".badge"); 
        const modeEl = card.querySelector(".flight-plane");
        const depDateEl = card.querySelector(".info-item:nth-child(1) .info-value");
        const retDateEl = card.querySelector(".info-item:nth-child(2) .info-value");

        const originalDepartTime = departTimeEl.textContent;
        const originalDepartAirport = departAirportEl.textContent;
        const originalArriveTime = arriveTimeEl.textContent;
        const originalArriveAirport = arriveAirportEl.textContent;
        const [originalFromCountry, originalToCountry] = titleEl.textContent.split("→").map(s => s.trim());
        const originalStatus = statusEl.textContent.trim();
        const originalMode = mode;
        const originalDepDate = depDateEl.textContent;
        const originalRetDate = retDateEl.textContent;
        
        departTimeEl.innerHTML = `<input type="time" class="edit-depart-time" value="${toTimeInputValue(originalDepartTime)}">`;
        departAirportEl.innerHTML = `<input type="text" class="edit-depart-airport" value="${originalDepartAirport}">`;
        arriveTimeEl.innerHTML = `<input type="time" class="edit-arrive-time" value="${toTimeInputValue(originalArriveTime)}">`;
        arriveAirportEl.innerHTML = `<input type="text" class="edit-arrive-airport" value="${originalArriveAirport}">`;
        titleEl.innerHTML = `
          <input type="text" class="edit-from-country" value="${originalFromCountry}">
          →
          <input type="text" class="edit-to-country" value="${originalToCountry}">
        `;
        statusEl.innerHTML = `
          <select class="edit-status">
            <option value="Outbound" ${originalStatus === "Outbound" ? "selected" : ""}>Outbound</option>
            <option value="Return" ${originalStatus === "Return" ? "selected" : ""}>Return</option>
          </select>
          `;
        modeEl.innerHTML = `
          <select class="edit-mode">
            <option value="Airplane" ${originalMode === "Airplane" ? "selected" : ""}>Airplane</option>
            <option value="Ferry" ${originalMode === "Ferry" ? "selected" : ""}>Ferry</option>
            <option value="Other" ${originalMode === "Other" ? "selected" : ""}>Other</option>
          </select>
        `;
        depDateEl.innerHTML = `<input type="date" class="edit-depart-date" value="${toDateInputValue(originalDepDate)}">`;
        retDateEl.innerHTML = `<input type="date" class="edit-return-date" value="${toDateInputValue(originalRetDate)}">`;

        // Collect restore targets and originals dynamically
        const restoreEls = [
          depDateEl, retDateEl,
          departTimeEl, departAirportEl,
          arriveTimeEl, arriveAirportEl,
          statusEl, modeEl
        ];
        const restoreVals = [
          originalDepDate, originalRetDate,
          originalDepartTime, originalDepartAirport,
          originalArriveTime, originalArriveAirport,
          originalStatus, getModeDisplay(originalMode)
        ];
        
        if (mode === "Airplane"){
          const fromTermEl = card.querySelector(".info-item:nth-child(3) .info-value");
          const toTermEl = card.querySelector(".info-item:nth-child(4) .info-value");
          const airlineEl = card.querySelector(".info-item:nth-child(5) .info-value");
          const flightNoEl = card.querySelector(".info-item:nth-child(6) .info-value");
          const bookingRefEl = card.querySelector(".info-item:nth-child(7) .info-value");

          const originalFromTerm = fromTermEl.textContent;
          const originalToTerm = toTermEl.textContent;
          const originalAirline = airlineEl.textContent;
          const originalFlightNo = flightNoEl.textContent;
          const originalBookingRef = bookingRefEl.textContent;

          fromTermEl.innerHTML = `<input type="text" class="edit-from-terminal" value="${originalFromTerm}">`;
          toTermEl.innerHTML = `<input type="text" class="edit-to-terminal" value="${originalToTerm}">`;
          airlineEl.innerHTML = `<input type="text" class="edit-airline" value="${originalAirline}">`;
          flightNoEl.innerHTML = `<input type="text" class="edit-flight-no" value="${originalFlightNo}">`;
          bookingRefEl.innerHTML = `<input type="text" class="edit-booking-ref" value="${originalBookingRef}">`;

          restoreEls.push(fromTermEl, toTermEl, airlineEl, flightNoEl, bookingRefEl);
          restoreVals.push(originalFromTerm, originalToTerm, originalAirline, originalFlightNo, originalBookingRef);
        } else if (mode === "Ferry"){
          const servOpEl = card.querySelector(".info-item:nth-child(3) .info-value");
          const bookingRefEl = card.querySelector(".info-item:nth-child(4) .info-value");

          const originalServOp = servOpEl.textContent;
          const originalBookingRef = bookingRefEl.textContent;

          servOpEl.innerHTML = `<input type="text" class="edit-serv-op" value="${originalServOp}">`;
          bookingRefEl.innerHTML = `<input type="text" class="edit-booking-ref" value="${originalBookingRef}">`;

          restoreEls.push(servOpEl, bookingRefEl);
          restoreVals.push(originalServOp, originalBookingRef);
        } else {
          const bookingRefEl = card.querySelector(".info-item:nth-child(3) .info-value");
          const originalBookingRef = bookingRefEl.textContent;
          bookingRefEl.innerHTML = `<input type="text" class="edit-booking-ref" value="${originalBookingRef}">`;
          restoreEls.push(bookingRefEl);
          restoreVals.push(originalBookingRef);
        }

        // Add ✔ ✖ buttons
        addEditActions(card, async () => {
          const updateData = {
            BookingRef: card.querySelector(".edit-booking-ref")?.value.trim() || "",
            DepDate: card.querySelector(".edit-depart-date")?.value.trim() || "",
            ReturnDate: card.querySelector(".edit-return-date")?.value.trim() || "",
            DepartureTime: formatTimeInput(card.querySelector(".edit-depart-time")?.value.trim() || ""),
            ArrivalTime: formatTimeInput(card.querySelector(".edit-arrive-time")?.value.trim() || ""),
            FromCountry: card.querySelector(".edit-from-country")?.value.trim() || "",
            ToCountry: card.querySelector(".edit-to-country")?.value.trim() || "",
            FromPickUp: card.querySelector(".edit-depart-airport")?.value.trim() || "",
            ToDropOff: card.querySelector(".edit-arrive-airport")?.value.trim() || "",
            Type: card.querySelector(".edit-status")?.value || "",
            Mode: card.querySelector(".edit-mode")?.value || ""
          };
          if (mode === "Airplane"){
            updateData.FromTerminal = card.querySelector(".edit-from-terminal")?.value.trim() || "";
            updateData.ToTerminal   = card.querySelector(".edit-to-terminal")?.value.trim() || "";
            updateData.Airline      = card.querySelector(".edit-airline")?.value.trim() || "";
            updateData.FlightNo     = card.querySelector(".edit-flight-no")?.value.trim() || "";
          } else if (mode === "Ferry") {
            updateData.ServOp       = card.querySelector(".edit-serv-op")?.value.trim() || "";
          }
          
          await window.db.collection("Trips").doc(tripId)
            .collection(col).doc(docId)
            .update(updateData);

          renderTab("Transport", tripId);
        },restoreEls,
          restoreVals,
        () => {
          titleEl.innerHTML = `${originalFromCountry} → ${originalToCountry}`;
        }, col);
      } else if (col === "Stay") {
          const typeEl = card.querySelector(".badge-stay");
          const nameEl = card.querySelector(".card-title");
          const inDateEl = card.querySelector(".stay-checkin .stay-date");
          const inTimeEl = card.querySelector(".stay-checkin .stay-time");
          const outDateEl = card.querySelector(".stay-checkout .stay-date");
          const outTimeEl = card.querySelector(".stay-checkout .stay-time");
          const addressEl = card.querySelector(".info-item.full-width .info-value");
          const roomEl = card.querySelector(".info-item:nth-child(2) .info-value");
          const bedEl = card.querySelector(".info-item:nth-child(3) .info-value");
          const refEl = card.querySelector(".info-item.full-width:last-child .info-value");

          // Store originals
          const originalType = typeEl.textContent.replace("🏨", "").trim();
          const originalName = nameEl.textContent;
          const originalInDate = inDateEl.textContent;
          const originalInTime = inTimeEl.textContent;
          const originalOutDate = outDateEl.textContent;
          const originalOutTime = outTimeEl.textContent;
          const originalAddress = addressEl.textContent;
          const originalRoom = roomEl.textContent;
          const originalBed = bedEl.textContent;
          const originalRef = refEl.textContent;

          // Replace with inputs
          typeEl.innerHTML = `
            🏨 <select class="edit-type">
            <option value="Hotel" ${originalType === "Hotel" ? "selected" : ""}>Hotel</option>
            <option value="Hostel" ${originalType === "Hostel" ? "selected" : ""}>Hostel</option>
            <option value="Airbnb" ${originalType === "Airbnb" ? "selected" : ""}>Airbnb</option>
            </select>
          `;
          nameEl.innerHTML = `<input type="text" class="edit-name" value="${originalName}">`;
          inDateEl.innerHTML = `<input type="date" class="edit-inDate" value="${toDateInputValue(originalInDate)}">`;
          inTimeEl.innerHTML = `<input type="time" class="edit-inTime" value="${toTimeInputValue(originalInTime)}">`;
          outDateEl.innerHTML = `<input type="date" class="edit-outDate" value="${toDateInputValue(originalOutDate)}">`;
          outTimeEl.innerHTML = `<input type="time" class="edit-outTime" value="${toTimeInputValue(originalOutTime)}">`;
          addressEl.innerHTML = `<input type="text" class="edit-address" value="${originalAddress}">`;
          roomEl.innerHTML = `<input type="text" class="edit-room" value="${originalRoom}">`;
          bedEl.innerHTML = `<input type="number" class="edit-bed" value="${originalBed}">`;
          refEl.innerHTML = `<input type="text" class="edit-ref" value="${originalRef}">`;

          // Add ✔ ✖ buttons
          addEditActions(card, async () => {
            await window.db
            .collection("Trips").doc(tripId)
            .collection(col).doc(docId)
            .update({
                Type: card.querySelector(".edit-type").value,
                Name: card.querySelector(".edit-name").value.trim(),
                inDate: formatDate(card.querySelector(".edit-inDate").value),
                inTime: formatTimeInput(card.querySelector(".edit-inTime").value.trim()),
                outDate: formatDate(card.querySelector(".edit-outDate").value),
                outTime: formatTimeInput(card.querySelector(".edit-outTime").value.trim()),
                Address: card.querySelector(".edit-address").value.trim(),
                RoomNo: card.querySelector(".edit-room").value.trim(),
                BedNo: card.querySelector(".edit-bed").value,
                BookingRef: card.querySelector(".edit-ref").value.trim()
              });
            renderTab("Stay", tripId);
          }, [
              typeEl, nameEl, inDateEl, inTimeEl, outDateEl, outTimeEl,
              addressEl, roomEl, bedEl, refEl
          ],[
              originalType, originalName, originalInDate, originalInTime,
              originalOutDate, originalOutTime, originalAddress,
              originalRoom, originalBed, originalRef
          ],
            null,
            col
          );
        } else {
          const typeEl = card.querySelector(".badge-other");
          const nameEl = card.querySelector(".card-title");
          const dateEl = card.querySelector(".info-item:nth-child(1) .info-value");
          const timeEl = card.querySelector(".info-item:nth-child(2) .info-value");
          const refEl = card.querySelector(".info-item:nth-child(3) .info-value");
          const notesEl = card.querySelector(".info-item:nth-child(4) .info-value");
          // Store originals
          const originalType = typeEl.textContent.trim();
          const originalName = nameEl.textContent;
          const originalDate = dateEl.textContent;
          const originalTime = timeEl.textContent;
          const originalRef = refEl.textContent;
          const originalNotes = notesEl.textContent;
          // Replace with inputs
          typeEl.innerHTML = `
            <select class="edit-type">
              <option value="Aquarium" ${originalType.includes("Aquarium") ? "selected" : ""}>Aquarium</option>
              <option value="Exhibition" ${originalType.includes("Exhibition") ? "selected" : ""}>Exhibition</option>
              <option value="ThemePark" ${originalType.includes("ThemeParks") ? "selected" : ""}>ThemeParks</option>
              <option value="Zoo" ${originalType.includes("Zoo") ? "selected" : ""}>Zoo</option>
              <option value="Activities" ${originalType.includes("Activities") ? "selected" : ""}>Activities</option>
              <option value="Food" ${originalType.includes("Food") ? "selected" : ""}>Food</option>
              <option value="Transport" ${originalType.includes("Transport") ? "selected" : ""}>Transport</option>
              <option value="Others" ${originalType.includes("Others") ? "selected" : ""}>Others</option>
            </select>
          `;
          nameEl.innerHTML = `<input type="text" class="edit-name" value="${originalName}">`;
          dateEl.innerHTML = `<input type="date" class="edit-date" value="${toDateInputValue(originalDate)}">`;
          timeEl.innerHTML = `<input type="text" class="edit-time-others" value="${originalTime}">`;
          refEl.innerHTML = `<input type="text" class="edit-ref" value="${originalRef}">`;
          notesEl.innerHTML = `<input type="text" class="edit-notes" value="${originalNotes}">`;
          // Add ✔ ✖ buttons
          addEditActions(card, async () => {
            await window.db
            .collection("Trips").doc(tripId)
            .collection(col).doc(docId)
            .update({
                Type: card.querySelector(".edit-type").value,
                Name: card.querySelector(".edit-name").value.trim(),
                Date: formatDate(card.querySelector(".edit-date").value),
                Time: card.querySelector(".edit-time-others").value.trim(),
                BookingRef: card.querySelector(".edit-ref").value.trim(),
                Remarks: card.querySelector(".edit-notes").value.trim()
              });
            renderTab("Others", tripId);
            },[
              typeEl, nameEl, dateEl, timeEl, refEl, notesEl
            ],[
              originalType, originalName, originalDate, originalTime, originalRef, originalNotes
            ],
            null,
            col
          );
        }  
    });
  });
})

// Adds ✔ / ✖ actions to a card and wires cancel/save
function addEditActions(card, onSave, elements, originals, specialRestore, col) {
  // Prevent duplicate bars
  if (card.querySelector(".edit-actions")) return;

  // Mark editing state (optional)
  card.classList.add("editing");

  // Hide original footer buttons during editing
  const actionsContainer = card.querySelector(".card-actions");
  if (actionsContainer) actionsContainer.style.display = "none";

  // Add ✔ ✖ action bar
  const editActions = document.createElement("div");
  editActions.className = "edit-actions";
  editActions.innerHTML = `
    <button class="tick-btn">✔</button>
    <button class="cancel-btn">✖</button>
  `;
  actionsContainer.insertAdjacentElement("afterend", editActions);

  // Cancel → restore original card by re-rendering the tab
  editActions.querySelector(".cancel-btn").addEventListener("click", () => {
    elements.forEach((el, i) => {
      el.textContent = originals[i];
    });

    // Handle any special cases (like title with arrow, or badge with emoji)
    if (typeof specialRestore === "function") {
      specialRestore();
    }

    editActions.remove();
    if (actionsContainer) actionsContainer.style.display = "flex";
    card.classList.remove("editing");
  });

  // Tick: call the provided async onSave handler
  editActions.querySelector(".tick-btn").addEventListener("click", async () => {
    // Only run time validation for Others
    if (col === "Other Bookings") {
      const timeInput = card.querySelector(".edit-time-others");
      if (timeInput) {
        const isValid = validateOtherBookingTime(timeInput, originals[3]);
        if (!isValid) {
          return; // stop save if invalid
        }
      }
    }

    try {
      await onSave();
      // ✅ Only remove if save succeeded
      editActions.remove();
      if (actionsContainer) actionsContainer.style.display = "flex";
      card.classList.remove("editing");
    } catch (err) {
      console.error(err);
      // keep editing state so user can fix
    }
  });
}





