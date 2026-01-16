// =========== CREATE FILTER SECTION WHEN DROPDOWN IS READY =============
document.addEventListener("dropdownReady", () => {
  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;
  // Inject Shopee-style modal content
  filterModal.innerHTML = `
    <div class="filter-panel">
      <div class="filter-body">
        <!-- Left column: category labels -->
        <div class="filter-left">
          <div class="filter-category" data-target="city">City</div>
          <div class="manual-divider"></div>
          <div class="filter-category" data-target="year">Year</div>
          <!-- Add more categories here -->
          <!-- Conditionally add Activity Type -->
          ${window.location.pathname.endsWith("activities.html") ? `
            <div class="manual-divider"></div>
            <div class="filter-category" data-target="type">Activity Type</div>
            <div class="manual-divider"></div>
            <div class="filter-category" data-target="status">Status</div>
          ` : `
            <div class="manual-divider"></div>
            <div class="filter-category" data-target="type">Food Type</div>
            <div class="manual-divider"></div>
            <div class="filter-category" data-target="status">Status</div>
          `}
        </div>
        <!-- Right column: options grouped by category -->
        <div class="filter-right">
          <div class="filter-section" data-target="city">
            <div class="filter-header">City</div>
            <div class="filter-options"></div>
            <div class="show-more">Show more</div>
          </div>
          <div class="manual-divider"></div>
            <div class="filter-section" data-target="year">
              <div class="filter-header">Year</div>
              <div class="filter-options"></div>
              <div class="show-more">Show more</div>
            </div>
          ${window.location.pathname.endsWith("activities.html") ? `
            <div class="manual-divider"></div>
            <div class="filter-section" data-target="type">
              <div class="filter-header">Activity Type</div>
              <div class="filter-options"></div>
              <div class="show-more">Show more</div>
            </div>
            <div class="manual-divider"></div>
            <div class="filter-section" data-target="status">
              <div class="filter-header">Status</div>
              <div class="filter-options"></div>
            </div>
          ` : `
            <div class="manual-divider"></div>
            <div class="filter-section" data-target="type">
              <div class="filter-header">Food Type</div>
              <div class="filter-options"></div>
              <div class="show-more">Show more</div>
            </div>
            <div class="manual-divider"></div>
            <div class="filter-section" data-target="status">
              <div class="filter-header">Status</div>
              <div class="filter-options"></div>
            </div>
          `}
        </div>
      </div>
      <!-- Bottom actions -->
      <div class="modal-actions">
        <button id="resetFilters" class="modal-btn reset">Reset</button>
        <button id="applyFilters" class="modal-btn apply">Apply</button>
      </div>
    </div>
  `;
  // Show modal on filter icon click
  const filterBtn = document.getElementById("filterToggle");
  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      console.log("click");
      filterModal.classList.toggle("visible");
      if (filterModal.classList.contains("visible")) {
        console.log("active");
        filterBtn.classList.add("active");
        initialiseFilters();   // ✅ refresh pills on open
      } else {
        console.log("inactive");
        filterBtn.classList.remove("active");
      }
    });
  }
  
  // Left category click → scroll + highlight
  document.querySelectorAll(".filter-category").forEach(cat => {
    cat.addEventListener("click", () => {
      const scrollContainer = document.querySelector(".filter-body");
      const targetSection = document.querySelector(
        `.filter-section[data-target="${cat.dataset.target}"]`
      );
  
      if (targetSection && scrollContainer) {
        const targetTop = targetSection.offsetTop;
        const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
  
        // Try to put the section at the very top,
        // but clamp to maxScroll so you never scroll past the end
        const scrollTop = Math.min(targetTop, maxScroll);
  
        scrollContainer.scrollTo({
          top: scrollTop,
          behavior: "smooth"
        });
  
        targetSection.classList.add("highlight");
        setTimeout(() => targetSection.classList.remove("highlight"), 1500);
      }
    });
  });
});

// =========== CREATE FILTER SECTION WHEN COUNTRY IS CHANGED =============
document.addEventListener("countryChanged", (e) => {
    // Reset country variable
    localStorage.setItem("selectedCountry", e.detail.country);
    window.displayCountry = e.detail.country;
    // Reset filters
    window.selectedCities = "all";
    window.selectedYears = "all";
    window.selectedTypes = "all";
    window.selectedStatuses = "all";
    initialiseFilters();
});

// ========= POPULATE FILTER OPTIONS & ATTACH LISTENERS ==========
function initialiseFilters() {
  const currentUserId = window.CURRENT_UID;
  window.displayCountry = localStorage.getItem("selectedCountry");
  if (!window.db) {
    console.error("Firestore not initialized");
    return;
  }
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }

  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;
  const filterBtn = document.getElementById("filterToggle");

  const filterOptionsBlocks = filterModal.querySelectorAll(".filter-options");
  const cityOptions = filterOptionsBlocks[0];
  const yearOptions = filterOptionsBlocks[1];
  const typeOptions = filterOptionsBlocks[2];
  const statusOptions = filterOptionsBlocks[3];

  // Clear both sections
  cityOptions.innerHTML = "";
  yearOptions.innerHTML = "";
  typeOptions.innerHTML = "";
  statusOptions.innerHTML = "";

  // Get the city array to check
  const cityArray = window.displayCountry + "Cities";
  // Populate City
  window.db.collection("User").doc(currentUserId)
    .collection("Suggested Activities").doc("Array_City")
    .get().then(cityDoc => {
      const data = cityDoc.data();
      const cities = data[cityArray];  // ✅ dynamic field access

      if (!Array.isArray(cities)) {
        console.warn(`No array found for ${cityArray}`);
        return;
      }

      // ✅ Populate the City filter
      cities.forEach(city => {
        const btn = document.createElement("button");
        btn.className = "filter-pill";
        btn.textContent = city;
        if (Array.isArray(window.selectedCities) && window.selectedCities.includes(city)) {
          btn.classList.add("active");
        }
        // Attach listener for button being clicked
        btn.addEventListener("click", () => {
          // Remove highlight if user click to "clear"
          if (btn.classList.contains("active")) {
            btn.classList.remove("active");
            return;
          }
          // Add highlight if user click to "select"
          // cityOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
          btn.classList.add("active");
        });
        cityOptions.appendChild(btn);
      });
      setupShowMore(cityOptions.closest(".filter-section"));
    })
    .catch(err => console.error("Error loading city array:", err));

  // Populate Year
  window.db.collection("User").doc(currentUserId)
    .collection("Suggested Activities").doc("Array_Year")
    .get().then(yearDoc => {
      const data = yearDoc.data();
      const years = data["YearList"];
      years.forEach(year => {
        const btn = document.createElement("button");
        btn.className = "filter-pill";
        btn.textContent = year;

        const yearNum = Number(year);
        if (Array.isArray(window.selectedYears) && window.selectedYears.includes(yearNum)) {
          btn.classList.add("active");
        }
        // Attach listener for button being clicked
        btn.addEventListener("click", () => {
          // Remove highlight if user click to "clear"
          if (btn.classList.contains("active")) {
            btn.classList.remove("active");
            return;
          }
          // Add highlight if user click to "select"
          // yearOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
          btn.classList.add("active");
          window.selectedYear = year;
        });

        yearOptions.appendChild(btn);
      });
      setupShowMore(yearOptions.closest(".filter-section"));
    })
    .catch(err => console.error("Error loading year array:", err));

  // Populate Type (Activity or Food)
  const activityTypes = [
    "Workshop", "Shopping", "Hiking", "Museum", "Exhibition",
    "Concert", "Sports", "Beach", "Cultural", "Relaxation", "Others"
  ];
  const foodTypes = [
    "Chinese", "Japanese", "Italian", "Indian", "Mexican",
    "Korean", "Thai", "Vegetarian", "Seafood", "Desserts",
    "NightMarket", "Others"
  ];
  
  // Decide which list to use based on page
  const typeList = window.location.pathname.endsWith("food.html")
  ? foodTypes
  : activityTypes;

  // Clear existing
  typeOptions.innerHTML = "";

  // Build pills
  typeList.forEach(typeName => {
    const btn = document.createElement("button");
    btn.className = "filter-pill";
    btn.textContent = typeName;
  
    if (Array.isArray(window.selectedTypes) && window.selectedTypes.includes(typeName)) {
      btn.classList.add("active");
    }
    
    // Attach listener for button being clicked
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        return;
      }
  
      // typeOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
    });
    typeOptions.appendChild(btn);
  });

  // Enable show more
  setupShowMore(typeOptions.closest(".filter-section"));

  // Populate Status filter (hardcoded)
  const statuses = window.location.pathname.endsWith("food.html")
    ? ["All", "Saved", "Eat Again"]
    : ["All", "Saved", "Revisit"];
  const statusMap = window.location.pathname.endsWith("food.html")
    ? {
        "All": "all",
        "Saved": "Saved",
        "Eat Again": "eatAgain"
      }
    : {
        "All": "all",
        "Saved": "Saved",
        "Revisit": "Revisit"
      };

  statuses.forEach(status => {
    const btn = document.createElement("button");
    btn.className = "filter-pill";
    btn.textContent = status;
    if (Array.isArray(window.selectedStatuses) && window.selectedStatuses.includes(statusMap[status])) {
      btn.classList.add("active");
    }
    // Attach listener for button being clicked
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        return;
      }
      statusOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
    });
    statusOptions.appendChild(btn);
  });

  // Attach Reset & Apply once
  const resetBtn = filterModal.querySelector("#resetFilters");
  const applyBtn = filterModal.querySelector("#applyFilters");
  let resetPending = false;

  resetBtn.onclick = () => {
    resetPending = true
    // Clear all highlights
    cityOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    yearOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    typeOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    statusOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  };

  applyBtn.onclick = () => {
    if (resetPending) {
    // ✅ User confirmed reset
    window.selectedCities   = ["all"];
    window.selectedYears    = ["all"];
    window.selectedTypes    = ["all"];
    window.selectedStatuses = ["all"];
    resetPending = false;
  } else {
      const activeCities   = [...cityOptions.querySelectorAll(".filter-pill.active")];
      const activeYears    = [...yearOptions.querySelectorAll(".filter-pill.active")];
      const activeTypes    = [...typeOptions.querySelectorAll(".filter-pill.active")];
      const activeStatuses = [...statusOptions.querySelectorAll(".filter-pill.active")];

      window.selectedCities   = activeCities.length   ? activeCities.map(btn => btn.textContent)   : ["all"];
      window.selectedYears    = activeYears.length    ? activeYears.map(btn => Number(btn.textContent))    : ["all"];
      window.selectedTypes    = activeTypes.length    ? activeTypes.map(btn => btn.textContent)    : ["all"];
      window.selectedStatuses = activeStatuses.length    ? activeStatuses.map(btn => statusMap[btn.textContent])    : ["all"];
    }
    document.dispatchEvent(new CustomEvent("filtersApplied", {}));
    // Close modal
    filterModal.classList.remove("visible");
  };

  // document.dispatchEvent(new CustomEvent("filtersReady", {}));
}

// ================= SHOW MORE / SHOW LESS HANDLER =================
const BATCH_SIZE = 4; // or any number you want

function setupShowMore(sectionElement) {
  let pills = [...sectionElement.querySelectorAll(".filter-pill")];
  const showMoreBtn = sectionElement.querySelector(".show-more");

  // Reorder pills: active first, then inactive
  const container = sectionElement.querySelector(".filter-options");
  pills
    .sort((a, b) => b.classList.contains("active") - a.classList.contains("active"))
    .forEach(pill => container.appendChild(pill)); // re-append in new order

  if (!showMoreBtn) return;
  if (pills.length <= BATCH_SIZE) {
    showMoreBtn.style.display = "none";
    return;
  }

  let visibleCount = BATCH_SIZE;

  // Pre-hide pills to prevent layout shift
  pills.forEach((pill, index) => {
    pill.style.visibility = index < visibleCount ? "visible" : "hidden";
  });

  requestAnimationFrame(() => {
    pills.forEach((pill, index) => {
      pill.style.visibility = "visible";
      pill.style.display = index < visibleCount ? "inline-flex" : "none";
    });
  });

  function updateView() {
    pills.forEach((pill, index) => {
      pill.style.display = index < visibleCount ? "inline-flex" : "none";
    });

    showMoreBtn.textContent =
      visibleCount >= pills.length ? "Show less" : "Show more";

    showMoreBtn.style.display =
      pills.length > BATCH_SIZE ? "block" : "none";
  }

  showMoreBtn.onclick = () => {
    visibleCount =
      visibleCount >= pills.length ? BATCH_SIZE : visibleCount + BATCH_SIZE;
    updateView();
  };
}



