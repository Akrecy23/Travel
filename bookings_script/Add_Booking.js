let currentTab = null;

// Listen for when the form is created and ready
document.addEventListener("FormReady", async e => {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }

  const { tabName, tripId } = e.detail;

  const form = document.getElementById("newBookingForm");
  if (!form) return;

  // Transport: build fields on mode change
  if (tabName === "Transport") {
    const modeRadios = form.querySelectorAll('input[name="travelType"]');
    modeRadios.forEach(r => {
      r.addEventListener("change", (ev) => {
        buildTransportForm(ev.target.value);
      });
    });
  }

  // Handle submit
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Map tabName to Firestore collection
    const collectionMap = {
      Transport: "Transport",
      Stay: "Stay",
      Others: "Other Bookings"
    };

    const collectionName = collectionMap[tabName];
    if (!collectionName) {
      console.error("Unknown tab:", tabName);
      return;
    }

    // Build Firestore reference to the correct collection
    const colRef = window.db
      .collection("Trips").doc(tripId)
      .collection(collectionName);

    // Count existing docs to determine Order
    const snapshot = await colRef.get();
    const order = snapshot.size + 1;

    let bookingData = {};

    if (tabName === "Transport") {
      const mode = data.travelType || "";
      if (!mode) {
        alert("Please select a travel mode and fill its details.");
        return;
      }

      bookingData = {
        BookingRef: data.bookingRef || "",
        DepDate: formatDate(data.depDate) || "",
        ReturnDate: formatDate(data.returnDate) || "",
        DepartureTime: formatTimeInput(data.departTime) || "",
        ArrivalTime: formatTimeInput(data.arriveTime) || "",
        FromCountry: data.departCountry || "",
        ToCountry: data.arriveCountry || "",
        Type: data.flightType || "",
        Order: order,
        Mode: mode
      };

      if (mode === "Airplane") {
        bookingData = {
          ...bookingData,
          Airline: data.airline || "",
          FlightNo: data.flightNo || "",
          FromPickUp: data.departAirport || "",
          FromTerminal: data.departTerminal || "",
          ToDropOff: data.arriveAirport || "",
          ToTerminal: data.arriveTerminal || ""
        };
      } else if (mode === "Ferry") {
        bookingData = {
          ...bookingData,
          FromPickUp: data.departHarbour || "",
          ToDropOff: data.arriveHarbour || "",
          ServOp: data.servOp || ""
        };
      } else if (mode === "Others") {
        bookingData = {
          ...bookingData,
          FromPickUp: data.departPickup || "",
          ToDropOff: data.arriveDropoff || ""
        };
      }
    } else if (tabName === "Stay") {
      bookingData = {
        Address: data.stayAddress || "",
        BedNo: data.bedNo || "",
        BookingRef: data.stayBookingRef || "",
        Name: data.stayName || "",
        RoomNo: data.roomNo || "",
        Type: data.stayType || "",
        inDate: formatDate(data.checkInDate) || "",
        inTime: formatTimeInput(data.checkInTime) || "",
        outDate: formatDate(data.checkOutDate) || "",
        outTime: formatTimeInput(data.checkOutTime) || "",
        Order: order
      };
    } else if (tabName === "Others") {
      const startTime = formatTimeInput(data.otherStartTime);
      const endTime   = formatTimeInput(data.otherEndTime);
      const combinedTime = startTime && endTime 
        ? `${startTime} - ${endTime}` 
        : startTime || endTime || "";
      bookingData = {
        BookingRef: data.otherBookingRef || "",
        Date: formatDate(data.otherDate) || "",
        Name: data.otherName || "",
        Remarks: data.otherRemarks || "",
        Time: combinedTime || "",
        Type: data.otherType || "",
        Order: order
      };
    }

    // Save with auto doc ID
    await colRef.add(bookingData);

    console.log("Saved new booking:", tabName, bookingData);

    // Hide form after save
    form.parentElement.style.display = "none";

    // Refresh tab content
    renderTab(tabName, tripId);
  });
});

function openNewBookingForm(tabName, tripId, tripTitle, editableTab = false) {
  currentTab = tabName;
  const formContainer = document.getElementById("newBookingFormContainer");
  if (!formContainer) return;

  // Base header (trip + tab)
  let html = `
    <form id="newBookingForm">
      <div class="form-header">
        <label>Trip:</label>
        <input type="text" value="${tripTitle}" readonly}>
        <label>Tab:</label>
        <select name="tabName" ${editableTab ? "" : "disabled"}>
          <option value="Transport" ${tabName === "Transport" ? "selected" : ""}>Transport</option>
          <option value="Stay" ${tabName === "Stay" ? "selected" : ""}>Stay</option>
          <option value="Others" ${tabName === "Others" ? "selected" : ""}>Others</option>
        </select>
        <button type="button" class="close-form-btn" title="Close">✕</button>
      </div>
      <div class="form-fields">
  `;

  if (tabName === "Transport") {
    html += `
      <h3>Transport Details</h3>
      <label>Travel Mode:<span class="asterisk">*</span></label>
      <label><input type="radio" name="travelType" value="Airplane" required> Airplane</label>
      <label><input type="radio" name="travelType" value="Ferry"> Ferry</label>
      <label><input type="radio" name="travelType" value="Others"> Others</label>
      <label>Type:<span class="asterisk">*</span></label>
      <label><input type="radio" name="flightType" value="Outbound" required> Outbound</label>
      <label><input type="radio" name="flightType" value="Return"> Return</label>
      <div id="transportFields"></div>
    `;
  } else if (tabName === "Stay") {
    html += `
      <h3>Stay Details</h3>
      <label>Type:<span class="asterisk">*</span></label>
      <select name="stayType" required>
        <option value="Hotel">Hotel</option>
        <option value="Hostel">Hostel</option>
        <option value="Airbnb">Airbnb</option>
      </select>
      <label>Name:<span class="asterisk">*</span></label><input type="text" name="stayName" required>
      <label>Address:<span class="asterisk">*</span></label><input type="text" name="stayAddress" required>
      <label>Check In Date:<span class="asterisk">*</span></label><input type="date" name="checkInDate" required>
      <label>Check In Time:<span class="asterisk">*</span></label><input type="time" name="checkInTime" required>
      <label>Check Out Date:<span class="asterisk">*</span></label><input type="date" name="checkOutDate" required>
      <label>Check Out Time:<span class="asterisk">*</span></label><input type="time" name="checkOutTime" required>
      <label>Room No:</label><input type="text" name="roomNo" placeholder="(Optional) Enter number of rooms">
      <label>Bed No:</label><input type="number" name="bedNo" placeholder="(Optional) Enter number of beds in total">
      <label>Booking Ref:</label><input type="text" name="stayBookingRef">
    `;
  } else if (tabName === "Others") {
    html += `
      <h3>Other Booking Details</h3>
      <label>Type:<span class="asterisk">*</span></label>
      <select name="otherType" required>
        <option value="Aquarium">Aquarium</option>
        <option value="Exhibition">Exhibition</option>
        <option value="ThemePark">ThemePark</option>
        <option value="Zoo">Zoo</option>
        <option value="Activities">Activities</option>
        <option value="Food">Food</option>
        <option value="Transport">Transport</option>
        <option value="Others">Others</option>
      </select>
      <label>Name:<span class="asterisk">*</span></label><input type="text" name="otherName" required>
      <label>Date:<span class="asterisk">*</span></label><input type="date" name="otherDate" required>
      <label>Start Time:</label><input type="time" name="otherStartTime">
      <label>End Time:</label><input type="time" name="otherEndTime">
      <label>Remarks:</label><textarea name="otherRemarks"></textarea>
      <label>Booking Ref:</label><input type="text" name="otherBookingRef">
    `;
  }

  html += `
      </div>
      <div class="form-actions">
        <button type="submit">Save Booking</button>
      </div>
    </form>
  `;

  formContainer.innerHTML = html;
  formContainer.style.display = "block";
  toggleStepInputs();
  formContainer.querySelector(".close-form-btn").addEventListener("click", () => {
    closeFormOverlay(tripId);
  });
  document.dispatchEvent(new CustomEvent("FormReady", {
    detail: { tabName, tripId }
  }));
}

// CLOSE FORM
function closeFormOverlay(tripId) {
  const formContainer = document.getElementById("newBookingFormContainer");
  formContainer.style.display = "none";

  if (currentTab) {
    // re-render the same tab
    renderTab(currentTab, tripId);

    // re-apply highlight
    document.querySelectorAll("#modalTabs button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === currentTab);
    });
  }
}

// DYNAMIC TRANSPORT FIELDS
function buildTransportForm(mode) {
  const container = document.getElementById("transportFields");
  let html = "";

  if (mode === "Airplane") {
    html = `
      <h4>Departure</h4>
      <label>Date:<span class="asterisk">*</span></label><input type="date" name="depDate" required>
      <label>Country:<span class="asterisk">*</span></label><input type="text" name="departCountry" required>
      <label>Airport:<span class="asterisk">*</span></label><input type="text" name="departAirport" required>
      <label>Terminal:<span class="asterisk">*</span></label><input type="text" name="departTerminal" required>
      <label>Time:<span class="asterisk">*</span></label><input type="time" name="departTime" required>

      <h4>Arrival</h4>
      <label>Date:<span class="asterisk">*</span></label><input type="date" name="returnDate" required>
      <label>Country:<span class="asterisk">*</span></label><input type="text" name="arriveCountry" required>
      <label>Airport:<span class="asterisk">*</span></label><input type="text" name="arriveAirport" required>
      <label>Terminal:<span class="asterisk">*</span></label><input type="text" name="arriveTerminal" required>
      <label>Time:<span class="asterisk">*</span></label><input type="time" name="arriveTime" required>

      <h4>Additional Info</h4>
      <label>Airline:<span class="asterisk">*</span></label><input type="text" name="airline" required>
      <label>Flight No:</label><input type="text" name="flightNo">
      <label>Booking Ref:</label><input type="text" name="bookingRef">
    `;
  } else if (mode === "Ferry") {
    html = `
      <h4>Departure</h4>
      <label>Date:<span class="asterisk">*</span></label><input type="date" name="depDate" required>
      <label>Country:<span class="asterisk">*</span></label><input type="text" name="departCountry" required>
      <label>Harbour:<span class="asterisk">*</span></label><input type="text" name="departHarbour" required>
      <label>Time:<span class="asterisk">*</span></label><input type="time" name="departTime" required>

      <h4>Arrival</h4>
      <label>Date:<span class="asterisk">*</span></label><input type="date" name="returnDate" required>
      <label>Country:<span class="asterisk">*</span></label><input type="text" name="arriveCountry" required>
      <label>Harbour:<span class="asterisk">*</span></label><input type="text" name="arriveHarbour" required>
      <label>Time:<span class="asterisk">*</span></label><input type="time" name="arriveTime" required>

      <h4>Additional Info</h4>
      <label>Service Operator:</label><input type="text" name="servOp">
      <label>Booking Ref:</label><input type="text" name="bookingRef">
    `;
  } else if (mode === "Others") {
    html = `
      <h4>Departure</h4>
      <label>Date:<span class="asterisk">*</span></label><input type="date" name="depDate" required>
      <label>Country:<span class="asterisk">*</span></label><input type="text" name="departCountry" required>
      <label>Pick-up Location:<span class="asterisk">*</span></label><input type="text" name="departPickup" required>
      <label>Time:</label><input type="time" name="departTime">

      <h4>Arrival</h4>
      <label>Date:<span class="asterisk">*</span></label><input type="date" name="returnDate" required>
      <label>Country:<span class="asterisk">*</span></label><input type="text" name="arriveCountry" required>
      <label>Drop-off Location:<span class="asterisk">*</span></label><input type="text" name="arriveDropoff" required>
      <label>Time:</label><input type="time" name="arriveTime">

      <h4>Additional Info</h4>
      <label>Booking Ref:</label><input type="text" name="bookingRef">
    `;
  }

  container.innerHTML = html;
}

function toggleStepInputs() { 
  document.querySelectorAll("#newBookingForm .step1, #newBookingForm .step2, #newBookingForm .step3, #newBookingForm .step4") 
    .forEach(step => { 
      const isHidden = step.classList.contains("hidden"); 
      step.querySelectorAll("input, textarea, select").forEach(el => { el.disabled = isHidden; }); 
    }); 
}



