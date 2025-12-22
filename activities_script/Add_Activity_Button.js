// THIS FILE CONTAINS CODE FOR ADDING NEW ACTIVITY

document.addEventListener("ActivityCardsLoaded", () => {
  const modal = document.getElementById("add-activity-modal");
  if (!modal) return;

  // ========= CREATE FORM =========
  modal.innerHTML = `
    <div class="modal-content">
        <span class="close-btn" id="close-activity-modal">&times;</span>
        <h3>Add New Activity</h3>
        <form id="activityForm" class="activity-grid">
          <!-- General -->
          <div id="step1">
            <!-- Country -->
            <div class="form-group">
                <label>Country</label>
                <input type="text" name="country" value="" readonly />
            </div>
            <!-- City -->
            <div class="form-group">
                <label>City</label>
                <select name="city" id="citySelect" required></select>
            </div>
            <!-- Activity Type -->
            <div class="form-group">
                <label>Activity Type</label>
                <select name="activityType" id="activityTypeSelect" required></select>
            </div>
            <!-- Next Button -->
            <div class="form-group">
                <button type="button" id="nextBtn" class="next-btn">Next ➡️</button>
            </div>
          </div>
          <!-- Activity Details (Hidden initially) -->
          <div id="step2" class="hidden">
            <!-- Activity Name -->
            <div class="form-group">
                <label>Activity Name</label>
                <input type="text" name="activityName" placeholder="Enter activity name" required />
            </div>
            <!-- Price -->
            <div class="form-group">
                <label>Price</label>
                <input type="text" name="price" placeholder="Enter price" />
            </div>
            <!-- Opening Time -->
            <div class="form-group">
                <label>Opening Time</label>
                <input type="time" name="openingTime" required />
            </div>
            <!-- Closing Time -->
            <div class="form-group">
                <label>Closing Time</label>
                <input type="time" name="closingTime" required />
            </div>
            <!-- Duration -->
            <div class="form-group">
                <label>Estimated Duration</label>
                <input type="text" name="duration" placeholder="Enter duration" />
            </div>
            <!-- Address -->
            <div class="form-group">
                <label>Address</label>
                <input type="text" name="address" placeholder="Enter address" required />
            </div>
            <!-- Image URL -->
            <div class="form-group">
                <label>Image URL</label>
                <input type="text" name="imageURL" placeholder="Enter image's URL" />
            </div>
            <!-- Indoor or Outdoor -->
            <div class="form-group">
              <label>Indoor/Outdoor</label>
              <div>
                <label>
                  <input type="radio" name="inOutDoor" value="Indoor" required />
                  Indoor
                </label>
                <label style="margin-left: 12px;">
                  <input type="radio" name="inOutDoor" value="Outdoor" required />
                  Outdoor
                </label>
              </div>
            </div>
            <!-- Remarks -->
            <div class="form-group full-width">
                <label>Remarks</label>
                <textarea name="remarks" rows="2" placeholder="E.g. Must Try: (item)"></textarea>
            </div>
            <!-- Back -->
            <div class="form-group">
                <button type="button" id="backBtn" class="back-btn">Back</button>
            </div>
            <!-- Submit -->
            <div class="form-group">
                <button type="submit" class="submit-btn">Save Activity</button>
            </div>
          </div>
        </form>
    </div>
  `;
  // ✅ Toggle steps when Next is clicked
  const nextBtn = modal.querySelector("#nextBtn");
  const backBtn = modal.querySelector("#backBtn");

  // define step1 and step2
  const step1 = modal.querySelector("#step1");
  const step2 = modal.querySelector("#step2");

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      step1.classList.add("hidden");
      step2.classList.remove("hidden");
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      step2.classList.add("hidden");
      step1.classList.remove("hidden");

    });
  }
  document.dispatchEvent(new Event("ActivityFormReady"));
});

document.addEventListener("ActivityFormReady", async () => {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  
  console.log("form ready");
  const addBtn = document.querySelector(".add-activity-global-btn");
  const modal = document.getElementById("add-activity-modal");
  const closeModal = document.getElementById("close-activity-modal");
  const form = document.getElementById("activityForm");
  const citySelect = document.getElementById("citySelect");
  const typeSelect = document.getElementById("activityTypeSelect");

  if (!addBtn || !modal || !closeModal || !form) return;

  const selectedCountry = window.displayCountry || localStorage.getItem("selectedCountry");
  const cityArray = selectedCountry + "Cities";
  const selectedCity = addBtn.dataset.city;

  if (citySelect) {
    try {
      const docSnap = await window.db
        .collection("User").doc(currentUserId)
        .collection("Suggested Activities").doc("Array_City")
        .get();

      const data = docSnap.data();
      const cities = data[cityArray];   // e.g. "JapanCities"

      if (!Array.isArray(cities)) {
        console.warn(`No array found for ${cityArray}`);
        return;
      }

      // Populate dropdown
      cities.forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
      });

      // Add "Add New"
      const addNewOpt = document.createElement("option");
      addNewOpt.value = "add_new";
      addNewOpt.textContent = "➕ Add City to " + selectedCountry;
      citySelect.appendChild(addNewOpt);

      // Default selection
      citySelect.value = selectedCity;

      // Handle "Add New"
      citySelect.addEventListener("change", () => {
        if (citySelect.value === "add_new") {
          const newCity = prompt("Enter a new city:");

          if (newCity) {
            // Capitalize each word
            const capitalized = newCity
              .trim()
              .split(/\s+/)
              .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(" ");

            // Remove previously added custom options
            [...citySelect.options].forEach(opt => {
              if (
                opt.value !== "add_new" &&
                !cities.includes(opt.value)   // compare with original array
              ) {
                citySelect.removeChild(opt);
              }
            });

            // Add new option
            const opt = document.createElement("option");
            opt.value = capitalized;
            opt.textContent = capitalized;

            citySelect.insertBefore(opt, addNewOpt);
            citySelect.value = capitalized;

          } else {
            citySelect.value = selectedCity;
          }
        }
      });

    } catch (err) {
      console.error("Error loading cities:", err);
    }
  }


  // Populate activity type dropdown
  if (typeSelect) {
    try {
      const typesSnap = await window.db.collection("ActivityType").get();
      typesSnap.forEach(typeDoc => {
        const opt = document.createElement("option");
        opt.value = typeDoc.id;
        opt.textContent = typeDoc.id;
        typeSelect.appendChild(opt);
      });
      const addNewOpt = document.createElement("option");
      addNewOpt.value = "add_new";
      addNewOpt.textContent = "➕ Add Activity Type";
      typeSelect.appendChild(addNewOpt);

      if (typeSelect.options.length > 0) {
        typeSelect.value = typeSelect.options[0].value;
      }
      typeSelect.addEventListener("change", () => {
        if (typeSelect.value === "add_new") {
          const newType = prompt("Enter a new activity type (one word only):");
          if (newType) {
            // enforce one word & capitalize first letter
            const formatted = newType.trim().split(/\s+/)[0];
            const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();

            // remove any previously added custom option (not from Firestore)
            [...typeSelect.options].forEach(opt => {
              if (opt.value !== "add_new" && !typesSnap.docs.some(doc => doc.id === opt.value)) {
                typeSelect.removeChild(opt);
              }
            });

            // create new option dynamically
            const opt = document.createElement("option");
            opt.value = capitalized;
            opt.textContent = capitalized;

            // insert before "Add New"
            typeSelect.insertBefore(opt, addNewOpt);
            typeSelect.value = capitalized;
          } else {
            // reset if cancelled
            typeSelect.value = typeSelect.options[0].value;
          }
        }
      });

    } catch (err) {
      console.error("Error loading activity types:", err);
    }
  }

  // Show modal
  addBtn.addEventListener("click", () => {
    const countryName = window.displayCountry || localStorage.getItem("selectedCountry");   // get country from button
    form.country.value = countryName;          // set into form field
    // Reset city dropdown to header city
    if (citySelect) {
      const defaultCity = addBtn.dataset.city;  // from your IntersectionObserver
      citySelect.value = defaultCity;
    }
    // Reset steps each time modal opens
    const step1 = modal.querySelector("#step1");
    const step2 = modal.querySelector("#step2");
    step1.classList.remove("hidden");
    step2.classList.add("hidden");
    modal.style.display = "flex";
  });
  closeModal.addEventListener("click", () => { modal.style.display = "none"; });
  window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

  // Handle form submission
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const selectedCountry = form.country.value;
    const selectedCity = citySelect.value;
    const typeValue = typeSelect.value;
    // Collect All fields
    const nameValue = form.activityName.value.trim();
    const openingTime = form.openingTime ? form.openingTime.value : "";
    const closingTime = form.closingTime ? form.closingTime.value : "";
    const priceValue = form.price ? form.price.value.trim() : "";
    const addressValue = form.address ? form.address.value.trim() : "";
    const remarksValue = form.remarks ? form.remarks.value.trim() : "";
    const durationValue = form.duration ? form.duration.value.trim() : "";
    const inOutDoor = form.inOutDoor ? form.inOutDoor.value.trim() : "";
    const imageURL = form.imageURL ? form.imageURL.value.trim() : "";

    if (!nameValue || !openingTime || !closingTime || !addressValue) {
      alert("Please fill in all required fields.");
      return;
    }

    const coords = await geocodeAddress(addressValue);
    if (!coords){
      return;
    }

    try {
      // ========= SAVE TO SUGGESTED ACTIVITY =============
      const activityRef = window.db
        .collection("User").doc(currentUserId)
        .collection("Suggested Activities")
        .doc();

      await activityRef.set({
        ActivityDuration: durationValue,
        AddTo: [],
        Address: addressValue,
        City: selectedCity,
        CloseTime: closingTime,
        Country: selectedCountry,
        EstCost: priceValue,
        InOut_Door: inOutDoor,
        In_Itinerary: false,
        Name: nameValue,
        OpenTime: openingTime,
        Remarks: remarksValue,
        Revisit: false,
        Saved: false,
        Type: typeValue,
        YearAdded: new Date().getFullYear(),
        imageURL: imageURL,
        latitude: coords.lat,
        longitude: coords.lng
      });
      // ================ SAVE TO ARRAY_CITY (if new city)=============
      const cityArray = selectedCountry + "Cities"
      const cityRef = window.db
        .collection("User").doc(currentUserId)
        .collection("Suggested Activities").doc("Array_City");
      await cityRef.update({
        [cityArray]: firebase.firestore.FieldValue.arrayUnion(selectedCity)
      });

      // ================ SAVE TO ACTIVITYTYPE (if new type)=============
      const typeRef = window.db.collection("ActivityType").doc(typeValue);
      await typeRef.set({}, { merge: true });

      alert("Activity saved successfully!");
      form.reset();
      modal.style.display = "none";
      document.dispatchEvent(new Event("filtersApplied")); // refresh cards
    } catch (err) {
      console.error("Error saving activity:", err);
      alert("Failed to save activity. Please try again.");
    }
  });
});