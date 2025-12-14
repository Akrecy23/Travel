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
        const yearsSnap = await window.db
          .collection("User").doc(currentUserId)
          .collection("Year").get();

        const countriesSet = new Set();

        for (const yearDoc of yearsSnap.docs) {
          const yearId = yearDoc.id;
          const countrySnap = await window.db
            .collection("User").doc(currentUserId)
            .collection("Year").doc(yearId)
            .collection("Country").get();

          countrySnap.forEach(countryDoc => {
            countriesSet.add(countryDoc.id);
          });
        }

        // Populate dropdown
        countriesSet.forEach(name => {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          countrySelect.appendChild(opt);
        });
      } catch (err) {
        console.error("Error loading countries:", err);
      }
        // Add "+ New country" option
        const newCountryOpt = document.createElement("option");
        newCountryOpt.value = "__new__";
        newCountryOpt.textContent = "+ New country";
        countrySelect.appendChild(newCountryOpt);

        // Handle new country input
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
      const year = new Date(departureInput.value).getFullYear();
      const countriesSnap = await window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(String(year))
        .collection("Country").get();

      for (const countryDoc of countriesSnap.docs) {
        const groupSnap = await window.db
          .collection("User").doc(currentUserId)
          .collection("Year").doc(String(year))
          .collection("Country").doc(countryDoc.id)
          .collection("Group").get();

        groupSnap.forEach(groupDoc => {
          groupsSet.add(groupDoc.id);
        });
      }
    } catch (err) {
      console.error("Error loading groups:", err);
    }

    // ✅ Always add hardcoded groups
    hardcodedGroups.forEach(name => groupsSet.add(name));

    // ✅ Add placeholder so selecting "+ New group" always triggers change
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a group";
    placeholder.disabled = true;
    placeholder.selected = true;
    groupSelect.appendChild(placeholder);



      // Add Firestore groups
      groupsSet.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        groupSelect.appendChild(opt);
      });

      

      // Add "+ New group" option
      const newGroupOpt = document.createElement("option");
      newGroupOpt.value = "__new__";
      newGroupOpt.textContent = "+ New group";
      groupSelect.appendChild(newGroupOpt);

      // ✅ Ensure listener doesn't stack
  const newGroupHandler = () => {
    if (groupSelect.value === "__new__") {
      const input = prompt("Enter new group name:");
      if (input) {
        const normalizedInput = input.trim().toLowerCase();

        // Check if similar group already exists
        let matchedOption = null;
        for (let i = 0; i < groupSelect.options.length; i++) {
          const opt = groupSelect.options[i];
          if (opt.value !== "__new__" && opt.value.toLowerCase().includes(normalizedInput)) {
            matchedOption = opt;
            break;
          }
        }

        if (matchedOption) {
          // ✅ Use existing option
          groupSelect.value = matchedOption.value;
        } else {
          // ✅ Add new option before "+ New group"
          const opt = document.createElement("option");
          opt.value = input;
          opt.textContent = input;
          groupSelect.insertBefore(opt, newGroupOpt);
          groupSelect.value = input;
        }
      } else {
        // Reset to placeholder
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
    const cities = cityInput.split(",").map(c => c.trim()).filter(Boolean);

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
      const yearRef = window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(String(year));

      const countryRef = yearRef.collection("Country").doc(country);
      const groupRef = countryRef.collection("Group").doc(group);
      const tripRef = groupRef.collection("Trip").doc(tripName);

      // --- Ensure parent docs exist explicitly (normalize slanted docs) ---
      await yearRef.set({}, { merge: true });
      await countryRef.set({}, { merge: true });
      // ✅ Create SuggestedActivities & SuggestedFood at the COUNTRY level
      await countryRef.collection("Suggested Activities").doc("Category").set({}, { merge: true });
      await countryRef.collection("Suggested Food").doc("Category").set({}, { merge: true });

      await groupRef.set({}, { merge: true });

      // Check if trip already exists
      const tripDoc = await tripRef.get();
      if (tripDoc.exists) {
        alert("Trip name has already been taken. Please choose another name.");
        form.tripName.value = "";   // clear the trip name field
        return;
      }

      // Create Trip doc with start/end dates
      await tripRef.set({
        tripStartDate: formattedDeparture,
        tripEndDate: formattedReturn
      });

      // Split and normalize city names
      const cities = cityInput.split(",")
        .map(c => formatInputToOneWord(c.trim()))
        .filter(Boolean);

      // Create Cities subcollection
      for (let i = 0; i < cities.length; i++) {
        const cityName = cities[i];
        await tripRef.collection("City").doc(cityName).set({}, { merge: true });
      }

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

      alert("Trip saved successfully!");
      form.reset();
      modal.style.display = "none";

      const today = new Date();
      const departure = new Date(departureDate); // departureDate from form input
      const daysUntil = Math.ceil((departure - today) / (1000 * 60 * 60 * 24));

      window.tripData.upcoming.push({
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
        title: tripName,
        location: country,
        dateRange: `${formatDate2(depDateObj)} - ${formatDate2(retDateObj)}, ${year}`,
        countdown: `${daysUntil} day${daysUntil > 1 ? "s" : ""} left`,
        year: String(year),
        group: group,
        country: country,
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

    alert("Trip saved successfully!");
    form.reset();
    modal.style.display = "none";
  });
});

function formatInputToOneWord(input) {
  if (!input) return "";
  // Remove all spaces and lowercase everything
  const cleaned = input.replace(/\s+/g, "").toLowerCase();
  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
