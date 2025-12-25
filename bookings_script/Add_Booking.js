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

  form.addEventListener("submit", async ev => {
    ev.preventDefault();

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Map tabName to Firestore collection
    const collectionMap = {
      Flights: "Flight",
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

    if (tabName === "Flights") {
      bookingData = {
        Airline: data.airline || "",
        ArrivalTime: formatTimeInput(data.arriveTime) || "",
        BookingRef: data.bookingRef || "",
        Date: formatDate(data.flightDate) || "",
        DepartureTime: formatTimeInput(data.departTime) || "",
        FlightNo: data.flightNo || "",
        FromAirport: data.departAirport || "",
        FromCountry: data.departCountry || "",
        FromTerminal: data.departTerminal || "",
        ToAirport: data.arriveAirport || "",
        ToCountry: data.arriveCountry || "",
        ToTerminal: data.arriveTerminal || "",
        Type: data.flightType || "",
        Order: order
      };
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

function openNewBookingForm(tabName, tripId, editableTab = false) {
  currentTab = tabName;
  const formContainer = document.getElementById("newBookingFormContainer");
  if (!formContainer) return;

  // Base header (trip + tab)
  let html = `
    <form id="newBookingForm">
      <div class="form-header">
        <label>Trip:</label>
        <input type="text" value="${tripId}" ${editableTab ? "" : "readonly"}>
        <label>Tab:</label>
        <input type="text" value="${tabName}" readonly>
        <button type="button" class="close-form-btn" title="Close">✕</button>
      </div>
      <div class="form-fields">
  `;

  if (tabName === "Flights") {
    html += `
      <h3>Flight Details</h3>
      <!-- Part 1 -->
      <label>Type:</label>
      <label><input type="radio" name="flightType" value="Outbound"> Outbound</label>
      <label><input type="radio" name="flightType" value="Return"> Return</label>
      <label>Date:</label><input type="date" name="flightDate">

      <!-- Departure -->
      <h4>Departure</h4>
      <label>Country:</label><input type="text" name="departCountry">
      <label>Airport:</label><input type="text" name="departAirport">
      <label>Terminal:</label><input type="text" name="departTerminal">
      <label>Time:</label><input type="time" name="departTime">

      <!-- Arrival -->
      <h4>Arrival</h4>
      <label>Country:</label><input type="text" name="arriveCountry">
      <label>Airport:</label><input type="text" name="arriveAirport">
      <label>Terminal:</label><input type="text" name="arriveTerminal">
      <label>Time:</label><input type="time" name="arriveTime">

      <!-- Additional -->
      <h4>Additional Info</h4>
      <label>Airline:</label><input type="text" name="airline">
      <label>Booking Ref:</label><input type="text" name="bookingRef">
      <label>Flight No:</label><input type="text" name="flightNo">
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

