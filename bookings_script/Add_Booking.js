let currentTab = null;

// Listen for when the form is created and ready
document.addEventListener("FormReady", e => {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }

  const { tabName, tripId } = e.detail;

  const form = document.getElementById("newBookingForm");
  if (!form) return;

  document.querySelector(".step1 .nextBtn").addEventListener("click", () => {
    const mode = document.querySelector('input[name="travelType"]:checked')?.value;
    if (!mode) { alert("Select a travel mode first."); return; }
    document.getElementById("step1").classList.add("hidden");
    document.getElementById("step2-" + mode.toLowerCase()).classList.remove("hidden");
  });
    
  document.querySelectorAll(".step2 .nextBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const mode = document.querySelector('input[name="travelType"]:checked').value;
      document.getElementById("step2-" + mode.toLowerCase()).classList.add("hidden");
      document.getElementById("step3-" + mode.toLowerCase()).classList.remove("hidden");
    });
  });
    
  document.querySelectorAll(".step3 .nextBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const mode = document.querySelector('input[name="travelType"]:checked').value;
      document.getElementById("step3-" + mode.toLowerCase()).classList.add("hidden");
      document.getElementById("step4-" + mode.toLowerCase()).classList.remove("hidden");
    });
  });
  // Back from step2 → step1
  document.querySelectorAll(".step2 .backBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = document.querySelector('input[name="travelType"]:checked').value;
      document.getElementById("step2-" + mode.toLowerCase()).classList.add("hidden");
      document.getElementById("step1").classList.remove("hidden");
    });
  });
    
  // Back from step3 → step2
  document.querySelectorAll(".step3 .backBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = document.querySelector('input[name="travelType"]:checked').value;
      document.getElementById("step3-" + mode.toLowerCase()).classList.add("hidden");
      document.getElementById("step2-" + mode.toLowerCase()).classList.remove("hidden");
    });
  });
  
  // Back from step4 → step3
  document.querySelectorAll(".step4 .backBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = document.querySelector('input[name="travelType"]:checked').value;
      document.getElementById("step4-" + mode.toLowerCase()).classList.add("hidden");
      document.getElementById("step3-" + mode.toLowerCase()).classList.remove("hidden");
    });
  });

  form.addEventListener("submit", async ev => {
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
      <div id="step1" class="step1">
        <h3>Transport Details</h3>
        <label>Travel Mode:</label>
        <label><input type="radio" name="travelType" value="Airplane"> Airplane</label>
        <label><input type="radio" name="travelType" value="Ferry"> Ferry</label>
        <label><input type="radio" name="travelType" value="Others"> Others</label>
        <br>
        <label>Type:</label>
        <label><input type="radio" name="flightType" value="Outbound"> Outbound</label>
        <label><input type="radio" name="flightType" value="Return"> Return</label>
        <br>
        <button type="button" class="backBtn">Back</button>
        <button type="button" class="nextBtn">Next</button>
      </div>

      <!-- DEPARTURE -->
      <div id="step2-airplane" class="step2 hidden">
        <h3>Departure (Airplane)</h3>
        <label>Date:</label><input type="date" name="depDate">
        <label>Country:</label><input type="text" name="departCountry">
        <label>Airport:</label><input type="text" name="departAirport">
        <label>Terminal:</label><input type="text" name="departTerminal">
        <label>Time:</label><input type="time" name="departTime">
        <button type="button" class="backBtn">Back</button>
        <button type="button" class="nextBtn">Next</button>
      </div>
      
      <div id="step2-ferry" class="step2 hidden">
        <h3>Departure (Ferry)</h3>
        <label>Date:</label><input type="date" name="depDate">
        <label>Country:</label><input type="text" name="departCountry">
        <label>Harbour:</label><input type="text" name="departHarbour">
        <label>Time:</label><input type="time" name="departTime">
        <button type="button" class="backBtn">Back</button>
        <button type="button" class="nextBtn">Next</button>
      </div>
      
      <div id="step2-others" class="step2 hidden">
        <h3>Departure (Others)</h3>
        <label>Date:</label><input type="date" name="depDate">
        <label>Country:</label><input type="text" name="departCountry">
        <label>Pick‑up Location:</label><input type="text" name="departPickup">
        <label>Time:</label><input type="time" name="departTime">
        <button type="button" class="backBtn">Back</button>
        <button type="button" class="nextBtn">Next</button>
      </div>

      <!-- ARRIVAL -->
      <div id="step3-airplane" class="step3 hidden">
        <h3>Arrival (Airplane)</h3>
        <label>Date:</label><input type="date" name="returnDate">
        <label>Country:</label><input type="text" name="arriveCountry">
        <label>Airport:</label><input type="text" name="arriveAirport">
        <label>Terminal:</label><input type="text" name="arriveTerminal">
        <label>Time:</label><input type="time" name="arriveTime">
        <button type="button" class="backBtn">Back</button>
        <button type="button" class="nextBtn">Next</button>
      </div>
      
      <div id="step3-ferry" class="step3 hidden">
        <h3>Arrival (Ferry)</h3>
        <label>Date:</label><input type="date" name="returnDate">
        <label>Country:</label><input type="text" name="arriveCountry">
        <label>Harbour:</label><input type="text" name="arriveHarbour">
        <label>Time:</label><input type="time" name="arriveTime">
        <button type="button" class="backBtn">Back</button>
        <button type="button" class="nextBtn">Next</button>
      </div>
      
      <div id="step3-others" class="step3 hidden">
        <h3>Arrival (Others)</h3>
        <label>Date:</label><input type="date" name="returnDate">
        <label>Country:</label><input type="text" name="arriveCountry">
        <label>Drop‑off Location:</label><input type="text" name="arriveDropoff">
        <label>Time:</label><input type="time" name="arriveTime">
        <button type="button" class="backBtn">Back</button>
        <button type="button" class="nextBtn">Next</button>
      </div>

      <!-- ADDITIONAL -->
      <div id="step4-airplane" class="step4 hidden">
        <h3>Additional Info (Airplane)</h3>
        <label>Airline:</label><input type="text" name="airline">
        <label>Flight No:</label><input type="text" name="flightNo">
        <label>Booking Ref:</label><input type="text" name="bookingRef">
        <button type="button" class="backBtn">Back</button>
      </div>
      
      <div id="step4-ferry" class="step4 hidden">
        <h3>Additional Info (Ferry)</h3>
        <label>Service Operator:</label><input type="text" name="servOp">
        <label>Booking Ref:</label><input type="text" name="bookingRef">
        <button type="button" class="backBtn">Back</button>  
      </div>
      
      <div id="step4-others" class="step4 hidden">
        <h3>Additional Info (Others)</h3>
        <label>Booking Ref:</label><input type="text" name="bookingRef">
        <button type="button" class="backBtn">Back</button>
      </div>
    `;
  } else if (tabName === "Stay") {
    html += `
      <h3>Stay Details</h3>
      <label>Type:</label><input type="text" name="stayType">
      <label>Name:</label><input type="text" name="stayName">
      <label>Address:</label><input type="text" name="stayAddress">
      <label>Check In Date:</label><input type="date" name="checkInDate">
      <label>Check In Time:</label><input type="time" name="checkInTime">
      <label>Check Out Date:</label><input type="date" name="checkOutDate">
      <label>Check Out Time:</label><input type="time" name="checkOutTime">
      <label>Room No:</label><input type="text" name="roomNo">
      <label>Bed No:</label><input type="number" name="bedNo">
      <label>Booking Ref:</label><input type="text" name="stayBookingRef">
    `;
  } else if (tabName === "Others") {
    html += `
      <h3>Other Booking Details</h3>
      <label>Type:</label><input type="text" name="otherType">
      <label>Name:</label><input type="text" name="otherName">
      <label>Date:</label><input type="date" name="otherDate">
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
