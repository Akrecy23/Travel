// THIS SCRIPT CONTAINS CODE FOR FILTERING LOGIC 

// =========== CREATE FILTER SECTION WHEN LAYOUT IS READY =============
document.addEventListener("HomeFrontLayoutReady", () => {
  // Reference to dom elements
  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;
  // Inject filter modal content
  filterModal.innerHTML = `
    <div class="filter-panel">
      <div class="filter-body">
        <!-- Left column: category labels -->
        <div class="filter-left">
          <div class="filter-category">Country</div>
          <div class="manual-divider"></div>
          <div class="filter-category">Group</div>
          <!-- Add more categories here -->
        </div>
        <!-- Right column: options grouped by category -->
        <div class="filter-right">
          <div class="filter-section">
            <div class="filter-header">Country</div>
            <div class="filter-options"></div>
            <div class="show-more">Show more</div>
          </div>
          <div class="manual-divider"></div>
          <div class="filter-section">
            <div class="filter-header">Group</div>
            <div class="filter-options"></div>
            <div class="show-more">Show more</div>
          </div>
        </div>
      </div>
      <!-- Bottom actions -->
      <div class="modal-actions">
        <button id="resetFilters" class="modal-btn reset">Reset</button>
        <button id="applyFilters" class="modal-btn apply">Apply</button>
      </div>
    </div>
  `;
  // Show modal when user clicks on filter icon
  const filterBtn = document.getElementById("filterToggle");
    if (filterBtn) {
      filterBtn.addEventListener("click", () => {
      filterModal.classList.toggle("visible");
    });
  }
  // Close modal when clicking outside panel
  filterModal.addEventListener("click", (e) => {
    if (e.target === filterModal) {
      filterModal.classList.remove("visible");
    }
  });
  // Initialise filters
  initialiseFilters();
});

// =========== CREATE FILTER SECTION WHEN YEAR IS CHANGED =============
document.addEventListener("yearChanged", (e) => {
    // Reset year variable
    localStorage.setItem("selectedYear", e.detail.year);
    window.displayYear = e.detail.year;
    // Reset filters
    window.selectedCountry = "all";
    window.selectedGroup = "all";
    initialiseFilters();
});

// ========= POPULATE FILTER OPTIONS & ATTACH LISTENERS ==========
function initialiseFilters() {
  // ======= CHECK EVERYTHING IS READY & VALID ======
  // Check for authenticated user
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  // Check for dom elements
  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;
  // Check for firestore connection
  if (!window.db) {
    console.error("Firestore not initialized");
    return;
  }

  // Reference to dom elements
  const filterOptionsBlocks = filterModal.querySelectorAll(".filter-options");
  const countryOptions = filterOptionsBlocks[0];
  const groupOptions = filterOptionsBlocks[1];

  // Clear both sections of filters
  countryOptions.innerHTML = "";
  groupOptions.innerHTML = "";

  // ======= POPULATE COUNTRY & GROUP DATA FROM FIRESTORE ========
  // Navigate to Firestore "Trips"
  const tripsRef = window.db.collection("Trips");
  // Query Owned/Collaborated Trips
  const ownedQuery = tripsRef.where("year", "==", window.displayYear)
                             .where("ownerUid", "==", currentUserId);
  const collabQuery = tripsRef.where("year", "==", window.displayYear)
                              .where("collaborators", "array-contains", currentUserId);
  Promise.all([ownedQuery.get(), collabQuery.get()])
    .then(([ownedSnap, collabSnap]) => {
      const countries = new Set();
      const groups = new Set();
      // Merge results & get collections of unique countries + groups
      [ownedSnap, collabSnap].forEach(snap => {
        snap.forEach(doc => {
          const data = doc.data();
          if (data.country) countries.add(data.country);
          if (data.group) groups.add(data.group);
        });
      });

      // Populate country pills
      countries.forEach(countryName => {
        const btn = document.createElement("button");
        btn.className = "filter-pill";
        btn.textContent = countryName;
        // Attach listener to country options
        btn.addEventListener("click", () => {
          countryOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
          btn.classList.add("active");
        });
        countryOptions.appendChild(btn);
      });

      // Populate group pills
      groups.forEach(groupName => {
        const gbtn = document.createElement("button");
        gbtn.className = "filter-pill";
        gbtn.textContent = groupName;
        // Attach listener to group options
        gbtn.addEventListener("click", () => {
          groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
          gbtn.classList.add("active");
        });
        groupOptions.appendChild(gbtn);
      });
    });

  // Reference Reset & Apply dom elements
  const resetBtn = filterModal.querySelector("#resetFilters");
  const applyBtn = filterModal.querySelector("#applyFilters");

  // ========= ATTACH RESET LOGIC ========
  resetBtn.onclick = () => {
    // Clear all filters
    countryOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  };
  // ========= ATTACH APPLY LOGIC ========
  applyBtn.onclick = () => {
    // Store selected options
    const activeCountry = countryOptions.querySelector(".filter-pill.active");
    const activeGroup = groupOptions.querySelector(".filter-pill.active");
    window.selectedCountry = activeCountry ? activeCountry.textContent : "all";
    window.selectedGroup = activeGroup ? activeGroup.textContent : "all";
    // Fire event when filters has been applied
    document.dispatchEvent(new CustomEvent("filtersApplied", {}));
    filterModal.classList.remove("visible");
  };
  // Fire event when filters modal is ready
  document.dispatchEvent(new CustomEvent("filtersReady", {}));
}