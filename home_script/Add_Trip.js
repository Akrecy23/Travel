// When back layout is ready, build the form modal
document.addEventListener("HomeBackLayoutReady", () => {
  const modal = document.getElementById("add-trip-modal");
  if (!modal) return;

  // Inject form HTML
  modal.innerHTML = `
    <div class="modal-content">
        <span class="close-btn" id="close-trip-modal">&times;</span>
        <h3>Add New Trip</h3>
        <form id="tripForm" class="form-grid">

            <!-- Country -->
            <div class="form-group">
              <label>Country</label>
              <select name="country" id="countrySelect" required></select>
            </div>

            <!-- City -->
            <div class="form-group">
              <label>City</label>
              <input type="text" name="city" placeholder="Enter city" required />
            </div>

            <!-- Departure Date -->
            <div class="form-group">
              <label>Departure Date</label>
              <input type="date" name="departureDate" required />
            </div>

            <!-- Return Date -->
            <div class="form-group">
              <label>Return Date</label>
              <input type="date" name="returnDate" required />
            </div>

            <!-- Trip Name -->
            <div class="form-group">
              <label>Trip Name</label>
              <input type="text" name="tripName" placeholder="Enter trip name" required />
            </div>

            <!-- Group -->
            <div class="form-group">
              <label>Group</label>
              <select name="group" id="groupSelect" required></select>
            </div>

            <!-- Submit -->
            <div class="form-group full-width">
              <button type="submit" class="submit-btn">Save Trip</button>
            </div>
        </form>
    </div>
  `;

  // Signal form is ready
  document.dispatchEvent(new Event("NewTripFormReady"));
});

document.addEventListener("NewTripFormReady", () => {
  const modal = document.getElementById("add-trip-modal");
  const closeBtn = document.getElementById("close-trip-modal");
  const addTripBtn = document.querySelector(".new-trip-btn");
  const form = document.getElementById("tripForm");
  const countrySelect = document.getElementById("countrySelect");
  const groupSelect = document.getElementById("groupSelect");
  const departureInput = form.departureDate;

  if (!modal || !closeBtn || !addTripBtn || !form) return;

  // Get current user ID
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }

  // Show modal
  addTripBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // ===== Populate Country dropdown =====
  if (countrySelect) {
    // Add placeholder
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a country";
    placeholder.disabled = true;
    placeholder.selected = true;
    countrySelect.appendChild(placeholder);

    (async () => {
      try {
        const tripsSnap = await window.db.collection("Trips")
          .where("ownerUid", "==", currentUserId)
          .get();

        const countriesSet = new Set();
        tripsSnap.forEach(doc => {
          const data = doc.data();
          if (data.country) countriesSet.add(data.country);
        });

        countriesSet.forEach(name => {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          countrySelect.appendChild(opt);
        });
      } catch (err) {
        console.error("Error loading countries:", err);
      }

      const newCountryOpt = document.createElement("option");
      newCountryOpt.value = "__new__";
      newCountryOpt.textContent = "+ New country";
      countrySelect.appendChild(newCountryOpt);

      countrySelect.addEventListener("change", () => {
        if (countrySelect.value === "__new__") {
          const input = prompt("Enter new country name:");
          if (input) {
            const formatted = formatInputToOneWord(input);
            const opt = document.createElement("option");
            opt.value = formatted;
            opt.textContent = formatted;
            countrySelect.insertBefore(opt, newCountryOpt);
            countrySelect.value = formatted;
          } else {
            countrySelect.value = countrySelect.options[0].value;
          }
        }
      });
    })();
  }

  // ===== Populate Group dropdown when departure date selected =====
  departureInput.addEventListener("change", async () => {
    groupSelect.innerHTML = ""; // reset

    const hardcodedGroups = ["Polytechnic", "Secondary", "Family"];
    const groupsSet = new Set(); // will hold Firestore + hardcoded

    try {
      const tripsSnap = await window.db.collection("Trips")
        .where("ownerUid", "==", currentUserId)
        .get();

      tripsSnap.forEach(doc => {
        const data = doc.data();
        if (data.group) groupsSet.add(data.group);
      });
    } catch (err) {
      console.error("Error loading groups:", err);
    }

    hardcodedGroups.forEach(name => groupsSet.add(name));

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a group";
    placeholder.disabled = true;
    placeholder.selected = true;
    groupSelect.appendChild(placeholder);

    groupsSet.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      groupSelect.appendChild(opt);
    });

    const newGroupOpt = document.createElement("option");
    newGroupOpt.value = "__new__";
    newGroupOpt.textContent = "+ New group";
    groupSelect.appendChild(newGroupOpt);

    const newGroupHandler = () => {
      if (groupSelect.value === "__new__") {
        const input = prompt("Enter new group name:");
        if (input) {
          const normalizedInput = input.trim().toLowerCase();
          let matchedOption = null;
          for (let i = 0; i < groupSelect.options.length; i++) {
            const opt = groupSelect.options[i];
            if (opt.value !== "__new__" && opt.value.toLowerCase().includes(normalizedInput)) {
              matchedOption = opt;
              break;
            }
          }
          if (matchedOption) {
            groupSelect.value = matchedOption.value;
          } else {
            const opt = document.createElement("option");
            opt.value = input;
            opt.textContent = input;
            groupSelect.insertBefore(opt, newGroupOpt);
            groupSelect.value = input;
          }
        } else {
          groupSelect.value = "";
        }
      }
    };

    groupSelect.removeEventListener("change", newGroupHandler);
    groupSelect.addEventListener("change", newGroupHandler);
  });

  // ===== Handle form submission =====
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tripName = form.tripName.value.trim();
    const departureDate = form.departureDate.value;
    const returnDate = form.returnDate.value;
    const cityInput = form.city.value.trim();
    const country = countrySelect.value;
    const group = groupSelect.value;

    if (!tripName || !departureDate || !returnDate || !cityInput || !country || !group) {
      alert("Please fill in all fields.");
      return;
    }

    // Clean/reformat data
    const today = new Date();
    const depDateObj = new Date(departureDate);
    const retDateObj = new Date(returnDate);
    // Cehck if departure date is after today
    if (depDateObj <= today) {
        alert("Departure date must be after today.");
        form.departureDate.value = "";
        return;
    }
    // Validate date order
    if (retDateObj <= depDateObj) {
        alert("Return date must be after departure date.");
        // Clear Return Date Field
        form.returnDate.value="";
        return;
    }

    const year = depDateObj.getFullYear();

    // City split by commas
    const cities = cityInput.split(",").map(c => formatInputToOneWord(c.trim())).filter(Boolean);

    // Format dates: "Wednesday, dd mmm, yyyy"
    const formatDate = (dateObj) => {
      const options = { weekday: "long", year: "numeric", month: "short", day: "2-digit" };
      return dateObj.toLocaleDateString("en-US", options);
    };
    // Format dates: "mmm dd"
    const formatDate2 = date => {
      const options = { month: "short", day: "numeric" };
      return date.toLocaleDateString("en-US", options);
    };

    const formattedDeparture = formatDate(depDateObj);
    const formattedReturn = formatDate(retDateObj);

    // ===== Save to Firestore =====
    try {
      const currentUserId = window.CURRENT_UID;
      if (!currentUserId) {
        alert("You must be logged in to add a trip.");
        return;
      }

      // Check if trip with same name already exists for this user
      const existingSnap = await window.db.collection("Trips")
        .where("ownerUid", "==", currentUserId)
        .where("title", "==", tripName)
        .get();

      if (!existingSnap.empty) {
        alert("Trip name has already been taken. Please choose another name.");
        form.tripName.value = "";
        return;
      }

      // Create new trip doc
      const tripRef = window.db.collection("Trips").doc(); // auto-generated ID
      await tripRef.set({
        title: tripName,
        ownerUid: currentUserId,
        collaborators: [],
        country,
        group,
        cities,
        tripStartDate: formattedDeparture,
        tripEndDate: formattedReturn,
        year
      });

      // ===== Create Itinerary subcollection =====
      let currentDate = new Date(depDateObj);
      let dayCounter = 1;
      while (currentDate <= retDateObj) {
        const formattedDay = currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric"
        });
        await tripRef.collection("Itinerary").doc(`Day ${dayCounter}`).set({
          Date: formattedDay
        });
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        dayCounter++;
      }

      // ===== Create Expenses subcollection =====
      // 1. Add Pre-trip (always first)
      await tripRef.collection("Expenses").doc("Pre-Trip").set({}, { merge: true });

      // 2. Add Day 1, Day 2, ... matching Itinerary
      let expenseDate = new Date(depDateObj);
      let expenseCounter = 1;

      while (expenseDate <= retDateObj) {
        await tripRef.collection("Expenses").doc(`Day ${expenseCounter}`).set({
          totalSum: "0"
        });

        expenseDate.setDate(expenseDate.getDate() + 1);
        expenseCounter++;
      }

      // ===== Update Suggested Activities =====
      const userDocRef = window.db.collection("User").doc(currentUserId);
  
      // Country
      await userDocRef.collection("Suggested Activities").doc("Array_Country").set({
        CountryList: firebase.firestore.FieldValue.arrayUnion(country)
      }, { merge: true });
  
      // City
      const cityArray = country + "Cities";
      for (let cityName of cities) {
        await userDocRef.collection("Suggested Activities").doc("Array_City").set({
          [cityArray]: firebase.firestore.FieldValue.arrayUnion(cityName)
        }, { merge: true });
      }
  
      // Year
      await userDocRef.collection("Suggested Activities").doc("Array_Year").set({
        YearList: firebase.firestore.FieldValue.arrayUnion(year)
      }, { merge: true });
      
      alert("Trip saved successfully!");
      form.reset();
      modal.style.display = "none";

      const today = new Date();
      const departure = new Date(departureDate); // departureDate from form input
      const daysUntil = Math.ceil((departure - today) / (1000 * 60 * 60 * 24));

      window.tripData.upcoming.push({
        tripId: tripRef.id,
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
        title: tripName,
        location: country,
        dateRange: `${formatDate2(depDateObj)} - ${formatDate2(retDateObj)}, ${year}`,
        countdown: `${daysUntil} day${daysUntil > 1 ? "s" : ""} left`,
        year: String(year),
        group,
        country,
        tripStartDate: formattedDeparture,
        tripEndDate: formattedReturn
      });
      window.tripStats.upcoming += 1;

      // Refresh All Trips tab
      document.dispatchEvent(new Event("CreateHomeBackLayout"));
    } catch (err) {
      console.error("Error saving trip:", err);
      alert("Failed to save trip. Please try again.");
    }
  });
});

function formatInputToOneWord(input) {
  if (!input) return "";
  // Remove all spaces and lowercase everything
  const cleaned = input.replace(/\s+/g, "").toLowerCase();
  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

