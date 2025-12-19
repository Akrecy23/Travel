
// =========== CREATE FILTER SECTION WHEN LAYOUT IS READY =============
document.addEventListener("HomeFrontLayoutReady", () => {
  console.log(window.displayYear);
  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;
  // Inject Shopee-style modal content
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
  // Show modal on filter icon click
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
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  console.log(window.displayYear);

  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;

  if (!window.db) {
    console.error("Firestore not initialized");
    return;
  }

  const filterOptionsBlocks = filterModal.querySelectorAll(".filter-options");
  const countryOptions = filterOptionsBlocks[0];
  const groupOptions = filterOptionsBlocks[1];

  // Clear both sections
  countryOptions.innerHTML = "";
  groupOptions.innerHTML = "";

  // Populate Country & Group
  window.db.collection("User").doc(currentUserId)
    .collection("Year").doc(window.displayYear)
    .collection("Country").get()
    .then(snapshot => {
      let firstCountryName = null;

      snapshot.forEach(countryDoc => {
        const countryName = countryDoc.id;
        if (!firstCountryName) firstCountryName = countryName;

        const btn = document.createElement("button");
        btn.className = "filter-pill";
        btn.textContent = countryName;
        countryOptions.appendChild(btn);

        btn.addEventListener("click", () => {
          if (btn.classList.contains("active")) {
            btn.classList.remove("active");
            return;
          }
          countryOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
          btn.classList.add("active");

          // only repopulate groups if groupOptions exists
          if (groupOptions) {
            // ✅ clear before repopulating
            groupOptions.innerHTML = "";
            window.db.collection("User").doc(currentUserId)
              .collection("Year").doc(window.displayYear)
              .collection("Country").doc(countryName)
              .collection("Group").get()
              .then(groupSnap => {
                groupSnap.forEach(groupDoc => {
                  const gbtn = document.createElement("button");
                  gbtn.className = "filter-pill";
                  gbtn.textContent = groupDoc.id;
                  gbtn.addEventListener("click", () => {
                    if (gbtn.classList.contains("active")) {
                      gbtn.classList.remove("active");
                      return;
                    }
                    groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
                    gbtn.classList.add("active");
                  });
                  groupOptions.appendChild(gbtn);
                });
              });
          }
        });
      });

      // ✅ Auto-load groups for first country
      if (firstCountryName && groupOptions) {
        groupOptions.innerHTML = ""; // clear before repopulating
        window.db.collection("User").doc(currentUserId)
          .collection("Year").doc(window.displayYear)
          .collection("Country").doc(firstCountryName)
          .collection("Group").get()
          .then(groupSnap => {
            groupSnap.forEach(groupDoc => {
              const gbtn = document.createElement("button");
              gbtn.className = "filter-pill";
              gbtn.textContent = groupDoc.id;
              gbtn.addEventListener("click", () => {
                if (gbtn.classList.contains("active")) {
                  gbtn.classList.remove("active");
                  return;
                }
                groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
                gbtn.classList.add("active");
              });
              groupOptions.appendChild(gbtn);
            });
          });
      }
    });

  // Attach Reset & Apply once
  const resetBtn = filterModal.querySelector("#resetFilters");
  const applyBtn = filterModal.querySelector("#applyFilters");

  resetBtn.onclick = () => {
    countryOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    // reload groups for first country
    if (groupOptions) {
      const firstCountryBtn = countryOptions.querySelector(".filter-pill");
      if (firstCountryBtn) {
        const firstCountryName = firstCountryBtn.textContent;
        groupOptions.innerHTML = "";
        window.db.collection("User").doc(currentUserId)
          .collection("Year").doc(window.displayYear)
          .collection("Country").doc(firstCountryName)
          .collection("Group").get()
          .then(groupSnap => {
            groupSnap.forEach(groupDoc => {
              const gbtn = document.createElement("button");
              gbtn.className = "filter-pill";
              gbtn.textContent = groupDoc.id;
              gbtn.addEventListener("click", () => {
                groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
                gbtn.classList.add("active");
              });
              groupOptions.appendChild(gbtn);
            });
          });
      }
    }
  };

  applyBtn.onclick = () => {
    const activeCountry = countryOptions.querySelector(".filter-pill.active");
    const activeGroup = groupOptions.querySelector(".filter-pill.active");
    window.selectedCountry = activeCountry ? activeCountry.textContent : "all";
    window.selectedGroup = activeGroup ? activeGroup.textContent : "all";
    
    document.dispatchEvent(new CustomEvent("filtersApplied", {}));
    // Close modal
    filterModal.classList.remove("visible");
  };

  document.dispatchEvent(new CustomEvent("filtersReady", {}));
}