// THIS FILE CONTAINS CODE FOR ADDING NEW FOOD

document.addEventListener("FoodCardsLoaded", () => {
  const selectedYear = window.displayYear;

  const modal = document.getElementById("add-food-modal");
  if (!modal) return;

  // ========= CREATE FORM =========
  modal.innerHTML = `
    <div class="modal-content">
        <span class="close-btn" id="close-food-modal">&times;</span>
        <h3>Add New Food</h3>
        <form id="foodForm" class="form-grid">
          <!-- General -->
          <div id="step1">
          <!-- Year -->
            <div class="form-group">
                <label>Year</label>
                <input type="text" name="year" value="${selectedYear}" readonly />
            </div>
            <!-- Country -->
            <div class="form-group">
                <label>Country</label>
                <input type="text" name="country" value="" readonly />
            </div>
            <!-- Food Type -->
            <div class="form-group">
                <label>Food Type</label>
                <select name="foodType" id="foodTypeSelect" required></select>
            </div>
            <!-- Next Button -->
            <div class="form-group">
                <button type="button" id="nextBtn" class="next-btn">Next ➡️</button>
            </div>
          </div>
          <!-- Food Details (Hidden initially) -->
          <div id="step2" class="hidden">
            <!-- Food Name -->
            <div class="form-group">
                <label>Food Name</label>
                <input type="text" name="foodName" placeholder="Enter food name" required />
            </div>
            <!-- About -->
            <div class="form-group">
                <label>About</label>
                <textarea name="foodAbout" rows="2" placeholder="Short description"></textarea>
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
            <!-- Price -->
            <div class="form-group">
                <label>Price</label>
                <input type="text" name="price" placeholder="Enter price" />
            </div>
            <!-- Address -->
            <div class="form-group">
                <label>Address</label>
                <input type="text" name="address" placeholder="Enter address" required />
            </div>
            <!-- Additional Remarks -->
            <div class="form-group full-width">
                <label>Additional Remarks</label>
                <textarea name="remarks" rows="2" placeholder="E.g. Must Try: (item)"></textarea>
            </div>
            <!-- Back -->
            <div class="form-group">
                <button type="button" id="backBtn" class="back-btn">Back</button>
            </div>
            <!-- Submit -->
            <div class="form-group">
                <button type="submit" class="submit-btn">Save Food</button>
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
  document.dispatchEvent(new Event("FoodFormReady"));
});

document.addEventListener("FoodFormReady", async () => {
  console.log("form ready");
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  const addBtn = document.querySelectorAll(".add-food-card");
  const modal = document.getElementById("add-food-modal");
  const closeModal = document.getElementById("close-food-modal");
  const form = document.getElementById("foodForm");
  const typeSelect = document.getElementById("foodTypeSelect");

  if (!addBtn || !modal || !closeModal || !form) return;

  // Populate food type dropdown
  if (typeSelect) {
    try {
      const typesSnap = await window.db.collection("FoodType").get();
      typesSnap.forEach(typeDoc => {
        const opt = document.createElement("option");
        opt.value = typeDoc.id;
        opt.textContent = typeDoc.id;
        typeSelect.appendChild(opt);
      });
      const addNewOpt = document.createElement("option");
      addNewOpt.value = "add_new";
      addNewOpt.textContent = "➕ Add Food Type";
      typeSelect.appendChild(addNewOpt);

      if (typeSelect.options.length > 0) {
        typeSelect.value = typeSelect.options[0].value;
      }
      typeSelect.addEventListener("change", () => {
        if (typeSelect.value === "add_new") {
          const newType = prompt("Enter a new food type (one word only):");
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
      console.error("Error loading food types:", err);
    }
  }

  // Show modal
  addBtn.forEach(btn => {
    btn.addEventListener("click", () => {
      const countryName = btn.dataset.country;   // get country from button
      form.country.value = countryName;          // set into form field
      // Reset steps each time modal opens
      const step1 = modal.querySelector("#step1");
      const step2 = modal.querySelector("#step2");
      step1.classList.remove("hidden");
      step2.classList.add("hidden");
      modal.style.display = "flex";
    });
  });
  closeModal.addEventListener("click", () => { modal.style.display = "none"; });
  window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

  // Handle form submission
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const selectedYear = window.displayYear;
    const selectedCountry = form.country.value;
    const typeValue = typeSelect.value;
    // Collect All fields
    const nameValue = form.foodName.value.trim();
    const  aboutValue = form.foodAbout ? form.foodAbout.value.trim() : "";
    const openingTime = form.openingTime ? form.openingTime.value : "";
    const closingTime = form.closingTime ? form.closingTime.value : "";
    const priceValue = form.price ? form.price.value.trim() : "";
    const addressValue = form.address ? form.address.value.trim() : "";
    const remarksValue = form.remarks ? form.remarks.value.trim() : "";

    if (!nameValue || !openingTime || !closingTime || !addressValue) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      // ========= SAVE TO SUGGESTED FOOD =============
      const foodRef = window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(selectedYear)
        .collection("Country").doc(selectedCountry)
        .collection("Suggested Food")
        .doc("Category")
        .collection(typeValue)
        .doc(nameValue);
      await foodRef.set({
        About: aboutValue,
        Address: addressValue,
        CloseTime: closingTime,
        Name: nameValue,
        OpenTime: openingTime,
        Price: priceValue,
        Remarks: remarksValue,
        Type: typeValue,
        isInTrip: false,
        isLiked: false,
        isSaved: false,
        AddTo: []
      });
      // ================ SAVE TO FOODTYPE =============
      const typeRef = window.db.collection("FoodType").doc(typeValue);
      await typeRef.set({}, { merge: true });

      alert("Food saved successfully!");
      form.reset();
      modal.style.display = "none";
      document.dispatchEvent(new Event("filtersApplied")); // refresh cards
    } catch (err) {
      console.error("Error saving food:", err);
      alert("Failed to save food. Please try again.");
    }
  });
});